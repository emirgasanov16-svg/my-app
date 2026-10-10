# SmartBudget — my-app

SmartBudget is a clickable mobile budgeting prototype with Expense Tracker, Budget Planner, Spending Dashboard, AI Saving Tips, and Smart Spending Forecast. It uses teal and Malaysian ringgit. The published homepage is a byte-for-byte copy of the existing working preview; deployment does not redesign or change the application.

## Install and run

No npm packages, credentials, database, or backend are needed to run the application. Clone or download this repository, then either open `docs/index.html` directly in a browser or serve it locally:

```bash
git clone https://github.com/emirgasanov16-svg/my-app.git
cd my-app
python3 -m http.server 8000 --directory docs
```

Open `http://localhost:8000` in your browser. Alternatively, open `figma-smartbudget/preview/smartbudget.html` directly. Both contain the complete standalone application and work independently of ChatGPT. The responsive layout fits desktop and mobile browsers.

The app preserves the existing demo behavior: preset budget amounts, one sample lunch expense, simulated AI suggestions, and a daily-average forecast. Prototype choices reset on reload. This deployment does not add banking, free-text transaction entry, real AI, account storage, or a backend.

## Build and verify

Use Node.js 20 or newer. There are no npm dependencies.

```bash
node scripts/build-site.cjs
node --check figma-smartbudget/code.js
node figma-smartbudget/test.cjs
```

The production build copies the existing HTML to `docs/index.html` and verifies identical bytes. The model and Figma tests check all eight data combinations, 72 reachable frames, 548 prototype connections, and the demo interactions. Generated preview files are deterministic.

An optional real-browser check is provided in `scripts/smoke-test.py`. It requires Python Playwright and Chromium. With a local server running:

```bash
python3 -m pip install playwright
python3 -m playwright install chromium
python3 scripts/smoke-test.py --url http://localhost:8000/
```

The same check accepts a public application URL through `--url`, checks that the served bytes match the preview, and exercises desktop and mobile layouts, budget editing, expense addition/deletion, the saving plan, forecast comparisons, navigation, reset, and keyboard interaction.

## Publish with GitHub Pages

This self-contained static application is suited to GitHub Pages.

1. Open the repository's **Settings → Pages**.
2. Set the source to **Deploy from a branch**.
3. Select branch **main**, folder **/docs**, then save.
4. Wait for GitHub's Pages build/deployment to finish successfully.
5. Open the URL that GitHub reports and run the browser smoke test against it.

Expected address **after successful deployment**: `https://emirgasanov16-svg.github.io/my-app/`. This address is not evidence that deployment succeeded. GitHub Pages must be enabled and the actual response verified. The source repository must remain available, and hosting depends on GitHub's service and your account settings.

The repository is currently private. GitHub Pages for private repositories requires an eligible GitHub plan. The current GitHub integration can push project files but returned `403 Resource not accessible by integration` for the Pages API. Enabling Pages requires either a GitHub connection/token with Pages read/write permission or a repository administrator configuring Pages through Settings. Do not change repository visibility merely to bypass that requirement.

For Netlify or Vercel, import this repository as a static site: build command `node scripts/build-site.cjs`, publish/output directory `docs`, no framework preset, no environment variables. Use only one production host unless you intentionally need several.

Netlify can host the app publicly while the GitHub source stays private. Sign in to Netlify, import `emirgasanov16-svg/my-app`, grant access to that repository, select branch `main`, set the build command and publish directory above, and deploy. Confirm the deployment reports success, then verify the generated public URL. For automated deployment from this environment, Netlify deployment credentials would need to be entered securely through environment settings, never pasted into chat.

## Update the application

For changes to the native Figma project, edit `figma-smartbudget/model.js` (demo data/calculations) or `figma-smartbudget/plugin.js` (screens/interactions). Regenerate the plugin and browser preview, then build the site:

```bash
node figma-smartbudget/build.cjs
node figma-smartbudget/test.cjs
node scripts/build-site.cjs
git add figma-smartbudget docs
git commit -m "Update SmartBudget"
git push origin HEAD:main
```

If you edit the standalone preview HTML directly, run only `node scripts/build-site.cjs` before committing; running `test.cjs` regenerates that preview from the Figma source and would replace your direct HTML edits. Keep the original backup unchanged. Refresh the packaged Figma ZIP and optional PNG review boards if your changes affect them.

When Pages is configured for `main` and `/docs`, pushing an update triggers another Pages build. Verify the public application after the deployment finishes. Importing the Figma plugin creates a separate editable page; see `figma-smartbudget/README.md` for instructions.

## Restore the preserved version

The Git tag **smartbudget-original-v1** identifies the complete original prototype before deployment files and documentation were added. `backups/original/my-app-original.tar.gz` also preserves all 15 original files, including the exact working HTML, complete Figma sources, review images, and original Figma ZIP. `backups/original/SHA256SUMS.json` records every original file's SHA-256 checksum.

To restore the original application in the current checkout while retaining deployment documentation:

```bash
git restore --source=smartbudget-original-v1 -- figma-smartbudget smartbudget-figma.zip
node scripts/build-site.cjs
git add figma-smartbudget smartbudget-figma.zip docs
git commit -m "Restore original SmartBudget prototype"
git push origin HEAD:main
```

To examine the original independently, clone into a separate directory and check out the tag:

```bash
git clone https://github.com/emirgasanov16-svg/my-app.git my-app-original
cd my-app-original
git checkout smartbudget-original-v1
```

Then open `figma-smartbudget/preview/smartbudget.html` directly. To restore without Git, extract `backups/original/my-app-original.tar.gz` into an empty directory and open the same file. Always extract backups outside a directory containing uncommitted work.

## Included files

- `figma-smartbudget/`: complete editable source, generated Figma plugin, manifest, tests, browser application, SVG/PNG review boards, and Figma instructions.
- `smartbudget-figma.zip`: original ready-to-import Figma package.
- `docs/`: production HTML identical to the working preview, with `.nojekyll` for Pages.
- `scripts/`: production build and real-browser verification.
- `backups/original/`: verified original snapshot and checksums.
- `prototype-kit.md`: original prototype guidance, unchanged.
