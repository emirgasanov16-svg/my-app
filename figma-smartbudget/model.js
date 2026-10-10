/* Shared demo model. Build embeds this in the dependency-free Figma plugin. */
const SmartBudgetModel = (() => {
  const DAYS_ELAPSED = 10;
  const DAYS_REMAINING = 21;
  const BASE_SPENT = 1124.70;
  const DEMO_EXPENSE = 48.90;
  const DAILY_SAVING = 22;
  const money = (value) => 'RM ' + value.toLocaleString('en-MY', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
  const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
  const key = (state) => `${Number(state.budgetRaised)}${Number(state.expenseAdded)}${Number(state.planApplied)}`;
  const states = [];
  for (const budgetRaised of [false, true]) {
    for (const expenseAdded of [false, true]) {
      for (const planApplied of [false, true]) states.push({ budgetRaised, expenseAdded, planApplied });
    }
  }
  const metrics = (state) => {
    const budget = state.budgetRaised ? 3200 : 3000;
    const spent = round(BASE_SPENT + (state.expenseAdded ? DEMO_EXPENSE : 0));
    const dailyAverage = round(spent / DAYS_ELAPSED);
    const currentForecast = round(spent / DAYS_ELAPSED * 31);
    const plannedSavings = DAILY_SAVING * DAYS_REMAINING;
    const withPlanForecast = round(currentForecast - plannedSavings);
    const forecast = state.planApplied ? withPlanForecast : currentForecast;
    return { budget, spent, remaining: round(budget - spent), dailyAverage,
      currentForecast, plannedSavings, withPlanForecast, forecast,
      forecastDifference: round(budget - forecast), daysRemaining: DAYS_REMAINING,
      safeDaily: round((budget - spent) / DAYS_REMAINING) };
  };
  const categories = (state) => [
    { name: 'Food & drinks', spent: round(318.90 + (state.expenseAdded ? DEMO_EXPENSE : 0)), limit: state.budgetRaised ? 900 : 850, icon: 'utensils', color: '#0F766E' },
    { name: 'Transport', spent: 146.40, limit: 350, icon: 'train', color: '#5375B5' },
    { name: 'Shopping', spent: 209.50, limit: state.budgetRaised ? 700 : 600, icon: 'bag', color: '#B47734' },
    { name: 'Bills', spent: 449.90, limit: state.budgetRaised ? 1250 : 1200, icon: 'receipt', color: '#8B6FA8' }
  ];
  return { states, key, metrics, categories, money, round, DEMO_EXPENSE, DAILY_SAVING };
})();
if (typeof module !== 'undefined') module.exports = SmartBudgetModel;
