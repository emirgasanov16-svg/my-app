const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'figma-smartbudget', 'preview', 'smartbudget.html');
const destination = path.join(root, 'docs', 'index.html');
const bytes = fs.readFileSync(source);
if (!bytes.includes(Buffer.from('<title>SmartBudget'))) throw new Error('SmartBudget preview not found.');
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, bytes);
fs.writeFileSync(path.join(root, 'docs', '.nojekyll'), '');
if (!fs.readFileSync(destination).equals(bytes)) throw new Error('Production copy differs from the preview.');
const hash = crypto.createHash('sha256').update(bytes).digest('hex');
console.log(`Built docs/index.html: ${bytes.length.toLocaleString()} bytes; identical to the clickable preview.`);
console.log(`SHA-256: ${hash}`);
