const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const model = require('./model.js');

for (const state of model.states) {
  const m = model.metrics(state), categories = model.categories(state);
  assert.equal(model.round(categories.reduce((sum, item) => sum + item.spent, 0)), m.spent);
  assert.equal(categories.reduce((sum, item) => sum + item.limit, 0), m.budget);
  assert.equal(model.round(m.spent + m.remaining), m.budget);
  assert.equal(model.round(m.currentForecast - m.withPlanForecast), m.plannedSavings);
  assert.equal(m.remaining, model.metrics({ ...state, planApplied: !state.planApplied }).remaining);
}
assert.equal(model.metrics({ budgetRaised: true, expenseAdded: true, planApplied: true }).forecast, 3176.16);

let sequence = 0;
const nodes = new Map();
class Node {
  constructor(type) {
    this.id = String(++sequence); this.type = type; this.children = [];
    this.x = this.y = 0; this.width = this.height = 1; this.opacity = 1;
    this.reactions = []; nodes.set(this.id, this);
  }
  appendChild(node) {
    if (node.parent) node.parent.children = node.parent.children.filter(child => child !== node);
    node.parent = this; this.children.push(node);
  }
  resize(width, height) {
    assert.ok(Number.isFinite(width) && width > 0);
    assert.ok(Number.isFinite(height) && height > 0);
    this.width = width; this.height = height;
  }
  async setReactionsAsync(reactions) {
    for (const reaction of reactions) {
      assert.equal(reaction.trigger.type, 'ON_CLICK');
      for (const action of reaction.actions) {
        assert.equal(action.type, 'NODE'); assert.equal(action.navigation, 'NAVIGATE');
        assert.ok(nodes.has(action.destinationId), 'Missing destination');
        assert.equal(action.transition.type, 'DISSOLVE');
      }
    }
    this.reactions = reactions;
  }
}
let finish;
const completed = new Promise(resolve => { finish = resolve; });
const figma = {
  editorType: 'figma', root: new Node('DOCUMENT'),
  async loadFontAsync(font) { assert.equal(font.family, 'Inter'); },
  createPage() { const node = new Node('PAGE'); this.root.appendChild(node); return node; },
  async setCurrentPageAsync(page) { this.currentPage = page; },
  createFrame: () => new Node('FRAME'), createRectangle: () => new Node('RECTANGLE'),
  createText: () => new Node('TEXT'),
  createNodeFromSvg(source) {
    assert.match(source, /^<svg /); const node = new Node('SVG'); node.source = source; return node;
  },
  viewport: { scrollAndZoomIntoView(selection) { assert.equal(selection.length, 1); } },
  closePlugin(message) { finish(message); }
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'code.js'), 'utf8'), { figma, console }, { timeout: 10000 });

function walk(node) { return [node, ...node.children.flatMap(walk)]; }
function textIn(frame, value) { return walk(frame).some(node => node.type === 'TEXT' && node.characters === value); }
function click(frame, name) {
  const target = walk(frame).find(node => node.name === name && node.reactions.length);
  assert.ok(target, `Missing clickable ${name} in ${frame.name}`);
  return nodes.get(target.reactions[0].actions[0].destinationId);
}
function escape(value) { return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;'); }
function color(paint) {
  if (!paint) return 'none'; const c = paint.color;
  return '#' + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}
function render(node) {
  const fill = color(node.fills?.[0]), stroke = color(node.strokes?.[0]);
  const opacity = node.opacity * (node.fills?.[0]?.opacity ?? 1);
  let body = '';
  if (node.type === 'RECTANGLE' || node.type === 'FRAME') {
    body += `<rect width="${node.width}" height="${node.height}" rx="${node.cornerRadius || 0}" fill="${fill}" stroke="${stroke}" stroke-width="${node.strokeWeight || 1}"/>`;
  }
  if (node.type === 'TEXT') {
    const fontSize = node.fontSize, lineHeight = node.lineHeight.value;
    const weight = { Regular: 400, Medium: 500, 'Semi Bold': 600, Bold: 700 }[node.fontName.style];
    const x = node.textAlignHorizontal === 'RIGHT' ? node.width : node.textAlignHorizontal === 'CENTER' ? node.width / 2 : 0;
    const anchor = node.textAlignHorizontal === 'RIGHT' ? 'end' : node.textAlignHorizontal === 'CENTER' ? 'middle' : 'start';
    body += `<text font-family="Inter, DejaVu Sans, sans-serif" font-size="${fontSize}" font-weight="${weight}" text-anchor="${anchor}" fill="${fill}">`;
    node.characters.split('\n').forEach((line, i) => { body += `<tspan x="${x}" y="${fontSize + i * lineHeight}">${escape(line)}</tspan>`; });
    body += '</text>';
  }
  if (node.type === 'SVG') {
    body += node.source.replace(/width="\d+"/, `width="${node.width}"`).replace(/height="\d+"/, `height="${node.height}"`);
  }
  body += node.children.map(render).join('');
  const destination = node.reactions[0]?.actions[0]?.destinationId;
  const action = destination ? ` data-target="${escape(destination)}" role="button" tabindex="0" aria-label="${escape(node.name)}"` : '';
  return `<g transform="translate(${node.x} ${node.y})" opacity="${opacity}"${action}>${body}</g>`;
}
function writePreview(selected, destination) {
  const width = selected.length * 425 + 48, height = 992;
  let body = `<rect width="${width}" height="${height}" fill="#EAF0EC"/><text x="32" y="43" font-family="Inter, DejaVu Sans, sans-serif" font-size="27" font-weight="700" fill="#0F766E">SmartBudget</text><text x="32" y="69" font-family="Inter, DejaVu Sans, sans-serif" font-size="13" fill="#6A7B78">Five connected features · Teal / MYR · Editable Figma prototype</text>`;
  selected.forEach((frame, i) => {
    const oldX = frame.x, oldY = frame.y; frame.x = 32 + i * 425; frame.y = 103;
    body += render(frame); frame.x = oldX; frame.y = oldY;
  });
  fs.writeFileSync(destination, `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`);
}

function writeClickablePreview(screens, destination) {
  const data = {};
  for (const frame of screens.values()) {
    const x = frame.x, y = frame.y; frame.x = frame.y = 0;
    data[frame.id] = { name: frame.name, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 393 852" width="393" height="852">${render(frame)}</svg>` };
    frame.x = x; frame.y = y;
  }
  const json = JSON.stringify(data).replaceAll('<', '\\u003c');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SmartBudget · Clickable prototype</title>
<style>*{box-sizing:border-box}body{margin:0;background:#EAF0EC;color:#172B29;font:14px system-ui,sans-serif}.toolbar{height:64px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 24px;border-bottom:1px solid #D4E1D9}.brand{font-size:20px;font-weight:700;color:#0F766E}.controls{display:flex;gap:8px}button,select{font:inherit;color:#0F766E;background:white;border:1px solid #C7DAD0;border-radius:8px;padding:10px;cursor:pointer}main{height:calc(100dvh - 64px);display:flex;align-items:center;justify-content:center;padding:8px}.phone{flex:none;border-radius:30px;overflow:hidden;box-shadow:0 12px 40px #172B2918}.phone svg{display:block;width:100%;height:100%}[data-target]{cursor:pointer}[data-target]:focus-visible{outline:2px solid #0F766E;outline-offset:3px}@media(max-width:480px){.toolbar{padding:8px 12px}.brand{font-size:17px}button,select{font-size:12px;padding:8px}}</style></head>
<body><header class="toolbar"><span class="brand">SmartBudget</span><div class="controls"><select id="screens" aria-label="Choose a screen"><option value="Dashboard">Home</option><option value="Expenses">Expenses</option><option value="Budget">Budget</option><option value="Tips">Saving tips</option><option value="Forecast">Forecast</option></select><button id="reset">Reset demo</button></div></header><main><div class="phone" id="phone" aria-label="SmartBudget mobile prototype"></div></main>
<script>const data=${json};const byName=Object.fromEntries(Object.entries(data).map(([id,frame])=>[frame.name,id]));const phone=document.getElementById('phone');const select=document.getElementById('screens');let current=byName['000/Dashboard'];
function show(id){if(!data[id])return;current=id;phone.innerHTML=data[id].svg;const view=data[id].name.split('/')[1];if(['Dashboard','Expenses','Budget','Tips','Forecast'].includes(view))select.value=view;else if(view.startsWith('Edit budget'))select.value='Budget';else if(view==='Compare forecast')select.value='Forecast';else select.value='Expenses';}
phone.addEventListener('click',e=>{const n=e.target.closest('[data-target]');if(n)show(n.dataset.target)});phone.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const n=e.target.closest('[data-target]');if(n){e.preventDefault();show(n.dataset.target)}}});select.addEventListener('change',()=>show(byName[data[current].name.split('/')[0]+'/'+select.value]));document.getElementById('reset').addEventListener('click',()=>show(byName['000/Dashboard']));function resize(){const scale=Math.min((innerWidth-16)/393,(innerHeight-80)/852,1);phone.style.width=393*scale+'px';phone.style.height=852*scale+'px'}addEventListener('resize',resize);show(current);resize();</script></body></html>`;
  fs.writeFileSync(destination, html);
}

(async () => {
  let timer;
  const message = await Promise.race([completed, new Promise((_, reject) => {
    timer = setTimeout(() => reject(Error('Plugin did not finish')), 10000);
  })]);
  clearTimeout(timer);
  assert.match(message, /^SmartBudget created:/, message);
  const page = figma.currentPage;
  const screens = new Map(page.children.filter(node => node.type === 'FRAME').map(node => [node.name, node]));
  assert.equal(screens.size, 72);
  assert.equal(page.flowStartingPoints[0].nodeId, screens.get('000/Dashboard').id);
  for (const state of model.states) {
    for (const view of ['Dashboard', 'Expenses', 'Budget', 'Tips', 'Forecast']) {
      const frame = screens.get(model.key(state) + '/' + view);
      assert.ok(frame); assert.equal(frame.width, 393); assert.equal(frame.height, 852);
      assert.ok(walk(frame).some(node => node.reactions.length), 'Unwired screen');
    }
    assert.ok(textIn(screens.get(model.key(state) + '/Dashboard'), model.money(model.metrics(state).remaining)));
    assert.ok(textIn(screens.get(model.key(state) + '/Forecast'), model.money(model.metrics(state).forecast)));
  }
  const seen = new Set(), queue = [screens.get('000/Dashboard')];
  while (queue.length) {
    const frame = queue.shift(); if (seen.has(frame.id)) continue; seen.add(frame.id);
    for (const node of walk(frame)) for (const reaction of node.reactions) {
      for (const action of reaction.actions) queue.push(nodes.get(action.destinationId));
    }
  }
  assert.equal(seen.size, screens.size, 'Every frame should be reachable');
  let current = screens.get('000/Dashboard');
  for (const action of ['Tab Budget', 'Edit monthly budget button', 'Choose 3200', 'Save budget button',
    'Tab Home', 'Add expense button', 'Save expense button']) current = click(current, action);
  assert.equal(current.name, '110/Expenses'); assert.ok(textIn(current, 'RM 1,173.60'));
  current = click(current, 'Lunch at Kopi House expense');
  current = click(current, 'Done button');
  current = click(current, 'Tab Home'); assert.ok(textIn(current, 'RM 2,026.40'));
  current = click(current, 'Tab Tips'); current = click(current, 'Apply saving plan button');
  current = click(current, 'See spending forecast'); assert.equal(current.name, '111/Forecast');
  assert.ok(textIn(current, 'RM 3,176.16')); assert.ok(textIn(current, 'RM 23.84 under your budget'));
  current = click(current, 'Compare scenarios button');
  assert.ok(textIn(current, 'RM 3,638.16')); assert.ok(textIn(current, 'RM 3,176.16'));
  current = click(current, 'Keep saving plan button');
  current = click(current, 'Tab Expenses'); current = click(current, 'Lunch at Kopi House expense');
  current = click(current, 'Delete expense button'); assert.equal(current.name, '101/Expenses');
  current = click(current, 'Tab Tips'); current = click(current, 'Pause saving plan button');
  assert.equal(current.name, '100/Tips');
  const linked = [...nodes.values()].filter(node => node.reactions.length);
  for (const node of linked) assert.ok(node.width >= 44 && node.height >= 44, `Small tap target: ${node.name}`);
  const out = path.join(__dirname, 'preview'); fs.mkdirSync(out, { recursive: true });
  writePreview(['Dashboard', 'Expenses', 'Budget', 'Tips', 'Forecast'].map(view => screens.get('110/' + view)), path.join(out, 'smartbudget-screens.svg'));
  writePreview(['Budget', 'Add expense', 'Tips', 'Forecast'].map((view, i) => screens.get(['100/', '100/', '111/', '111/'][i] + view)), path.join(out, 'smartbudget-demo-flow.svg'));
  writeClickablePreview(screens, path.join(out, 'smartbudget.html'));
  console.log(`PASS: 8 consistent data states, 72 reachable frames, ${linked.length} valid connections, full demo path, deletion and pause actions, 44px tap targets.`);
  console.log('SVG boards and a clickable HTML review copy written to preview/. Rendering uses a local Figma API simulation; real Figma execution is still required.');
})().catch(error => { console.error(error); process.exitCode = 1; });
