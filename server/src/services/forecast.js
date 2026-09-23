import { trend } from './analytics.js';
import { startOfMonth } from '../utils/dates.js';
import { round2 } from '../utils/money.js';

// ---------------------------------------------------------------------------
// Next-month forecast
//
// A least-squares straight line through the last six months of spending. It is
// deliberately simple and deliberately honest: with fewer than three months of
// data it returns null rather than a confident-looking guess, and it reports how
// far the line sits from the actual points so the UI can say how rough it is.
// ---------------------------------------------------------------------------

function linearFit(values) {
  const n = values.length;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((acc, v) => acc + v, 0) / n;

  let numerator = 0;
  let denominator = 0;
  values.forEach((y, x) => {
    numerator += (x - meanX) * (y - meanY);
    denominator += (x - meanX) ** 2;
  });

  const slope = denominator === 0 ? 0 : numerator / denominator;
  return { slope, intercept: meanY - slope * meanX };
}

export async function forecastNextMonth(userId, month) {
  const start = startOfMonth(month);
  const history = await trend(userId, start, 6);
  const months = history.filter((row) => row.income > 0 || row.expense > 0);

  // Not enough history to project anything worth showing.
  if (months.length < 3) {
    return { available: false, reason: 'Campus Coin needs at least three months of history before it can project ahead.' };
  }

  const project = (key) => {
    const values = months.map((row) => row[key]);
    const { slope, intercept } = linearFit(values);
    const predicted = Math.max(0, intercept + slope * values.length);

    // Average distance between the fitted line and the real points - a plain
    // measure of how well a straight line actually describes this student.
    const error =
      values.reduce((acc, actual, x) => acc + Math.abs(actual - (intercept + slope * x)), 0) / values.length;

    return { predicted: round2(predicted), slopePerMonth: round2(slope), averageError: round2(error) };
  };

  const expense = project('expense');
  const income = project('income');
  const spread = expense.predicted ? expense.averageError / expense.predicted : 1;

  return {
    available: true,
    monthsUsed: months.length,
    expense: expense.predicted,
    income: income.predicted,
    balance: round2(income.predicted - expense.predicted),
    trendPerMonth: expense.slopePerMonth,
    // How much to trust it, stated plainly rather than as a fake percentage.
    reliability: spread < 0.15 ? 'steady' : spread < 0.35 ? 'rough' : 'very rough',
    margin: expense.averageError,
  };
}
