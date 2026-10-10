# SmartBudget — clickable Figma prototype

A mobile budgeting prototype in teal and Malaysian ringgit, covering Expense Tracker, Budget Planner, Spending Dashboard, AI Saving Tips, and Smart Spending Forecast.

## Open it in Figma

1. Download and unzip `smartbudget-figma.zip` on your computer.
2. Open a **Figma Design file in the Figma desktop app**. Right-click the canvas and choose **Plugins → Development → Import plugin from manifest…**. Select `figma-smartbudget/manifest.json` from the extracted folder.
3. Run **Plugins → Development → SmartBudget — Clickable Mobile Prototype**. It creates a new page, selects the Home screen, and registers a starting flow. Click **Present** to try it.

The plugin is already built: no Node.js installation or build command is needed to import it. It uses native editable Figma text, rectangles, frames and vector graphics. It does not need network access or credentials and does not modify existing pages. Running it again creates another page.

You can also open `preview/smartbudget.html` in a browser for a clickable review copy, or view the PNG/SVG screen boards. The review copy uses the same generated screens and links as the Figma package, rendered by the local API simulation.

## Demo path

1. Start at **Home**: RM 3,000 budget, RM 1,124.70 spent, RM 1,875.30 remaining.
2. Open **Budget → Edit monthly budget → RM 3,200 → Save budget**.
3. Return **Home → Add expense → Save expense** to record RM 48.90 for lunch.
4. Return **Home**: spending is RM 1,173.60 and remaining money is RM 2,026.40.
5. Open **Tips → Apply saving plan → See spending forecast**.
6. Open **Compare scenarios**: the current pace predicts RM 3,638.16; reducing future spending by RM 22 per day predicts RM 3,176.16, RM 23.84 under budget.

The saved lunch can be opened and deleted. The saving plan can be paused. Budget choices, recorded expenses and the plan remain consistent while switching screens, and actions work in different orders. To reset in Figma, restart the prototype flow; in the browser review copy, click **Reset demo**.

## Screens and interactions

| Core feature | Screen | Interaction |
|---|---|---|
| Spending Dashboard | Home | Check the remaining balance and daily allowance; open the forecast |
| Expense Tracker | Expenses | Save a sample expense, view its details, delete it |
| Budget Planner | Budget | Select RM 3,000 or RM 3,200; category limits rebalance |
| AI Saving Tips | Tips | Apply or pause a lunch saving plan; read other suggestions |
| Smart Spending Forecast | Forecast | Compare the current pace with the saving plan |

Four bottom tabs provide Home, Expenses, Budget and Tips. The Forecast is reached from Home or Tips and has a back button. Extra frames implement dialogs and changed values: **40 main-screen variants plus 32 interaction frames**, not 72 separate product features. The canvas groups the eight consistent combinations of budget, expense and saving-plan choices into labeled rows.

## Demo model and limits

- October 2026 is a fixed example month, with 10 elapsed days and 21 remaining days.
- Forecast = spending so far ÷ 10 × 31. The saving plan subtracts RM 22 × 21 = RM 462 from future projected spending.
- Applying a plan does not reduce expenses already recorded or increase the current remaining balance.
- Category spending totals match the monthly spending; category limits match the selected budget.
- Budget amounts and the single new lunch expense are preset prototype choices. They are not free-text inputs, repeated transaction entry, or a production ledger.
- AI tips are simulated. There are no live AI calls, bank connections, accounts, payments or backend storage.

## Validation

The generated plugin passed syntax checking and JavaScript type checking against Figma's official Plugin API declarations. `node test.cjs` checks all eight data combinations, every prototype destination, reachability of all 72 frames, the full demo path, deletion and pause actions, and at least 44 × 44 clickable targets. The generated boards were visually reviewed.

Actual execution inside Figma has **not** been verified in this session: Figma tools were unavailable after the installation request. Importing and running the package is still required; no Figma file or published prototype link has been created.

## Edit or rebuild

Use Node.js 20 or newer. There are no npm dependencies.

```bash
cd /workspace/my-app/figma-smartbudget
node build.cjs
node --check code.js
node test.cjs
```

Edit `model.js` for demo calculations and `plugin.js` for Figma layouts and interactions, then rebuild `code.js` before running the plugin again. Existing repository documentation is unchanged.
