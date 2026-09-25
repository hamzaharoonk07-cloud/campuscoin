// End-to-end check of every SRS functional requirement against a running
// server (npm start first). Registers a throwaway student, exercises each
// feature, then removes the account through the admin API. Usage:
//   npm run test:e2e --prefix server
const BASE = `${process.env.API_URL || "http://localhost:5000"}/api`;
const results = [];
let token = null;
let adminToken = null;

for (let i = 0; i < 60; i++) {
  try { await fetch(BASE + '/health-check'); break; } catch { await new Promise((r) => setTimeout(r, 1000)); }
}

async function call(method, path, body, { auth = token, raw = false } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'content-type': 'application/json', ...(auth ? { authorization: `Bearer ${auth}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = text;
  if (!raw) { try { data = JSON.parse(text); } catch { /* keep text */ } }
  return { status: res.status, data, headers: res.headers };
}

async function check(area, name, fn) {
  try {
    const detail = await fn();
    results.push({ area, name, ok: true, detail: detail ?? '' });
  } catch (err) {
    results.push({ area, name, ok: false, detail: err.message });
  }
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
const month = new Date().toISOString().slice(0, 7);
const today = new Date().toISOString().slice(0, 10);
const email = `e2e.${Date.now()}@campuscoin.app`;
let ctx = {};

/* --- Authentication and profile ------------------------------------------ */
await check('Auth', 'Register a student with profile fields', async () => {
  const r = await call('POST', '/auth/register', { name: 'Test Student', email, password: 'Kharcha@123', academicYear: 'Year 1', monthlyAllowance: 20000, savingsGoal: 3000, currency: 'PKR' }, { auth: null });
  expect(r.status === 201 || r.status === 200, `status ${r.status} ${JSON.stringify(r.data)}`);
  token = r.data.token; ctx.userId = r.data.user?._id || r.data.user?.id;
  expect(token, 'no token');
});
await check('Auth', 'Duplicate email is refused', async () => {
  const r = await call('POST', '/auth/register', { name: 'x', email, password: 'Kharcha@123' }, { auth: null });
  expect(r.status >= 400, `status ${r.status}`);
});
await check('Auth', 'Log in', async () => {
  const r = await call('POST', '/auth/login', { email, password: 'Kharcha@123' }, { auth: null });
  expect(r.status === 200 && r.data.token, `status ${r.status}`); token = r.data.token;
});
await check('Auth', 'Wrong password is refused', async () => {
  const r = await call('POST', '/auth/login', { email, password: 'nope' }, { auth: null });
  expect(r.status === 401 || r.status === 400, `status ${r.status}`);
});
await check('Auth', 'Admin sign-in refuses a student', async () => {
  const r = await call('POST', '/auth/admin/login', { email, password: 'Kharcha@123' }, { auth: null });
  expect(r.status >= 400, `status ${r.status}`);
});
await check('Auth', 'Protected routes need a session', async () => {
  const r = await call('GET', '/transactions', undefined, { auth: null });
  expect(r.status === 401, `status ${r.status}`);
});
await check('Auth', 'Edit profile (name, year, allowance, goal)', async () => {
  const r = await call('PATCH', '/auth/me', { name: 'Test Student Two', academicYear: 'Year 2', monthlyAllowance: 25000, savingsGoal: 4000 });
  expect(r.status === 200 && r.data.user.name === 'Test Student Two' && r.data.user.savingsGoal === 4000, JSON.stringify(r.data).slice(0, 200));
});
await check('Auth', 'Theme and font size saved to the account', async () => {
  const r = await call('PATCH', '/auth/me', { preferences: { theme: 'dark', fontScale: 1.125 } });
  expect(r.data.user.preferences.theme === 'dark' && r.data.user.preferences.fontScale === 1.125, JSON.stringify(r.data.user?.preferences));
});
await check('Auth', 'Weak passwords are refused', async () => {
  for (const password of ['short1', 'abcdefghij', 'password123', `Test${Date.now() % 1000}9x`]) {
    const r = await call('POST', '/auth/register', { name: 'Test Student', email: `weak.${Date.now()}@campuscoin.app`, password }, { auth: null });
    expect(r.status === 400, `"${password}" was accepted (${r.status})`);
  }
});
await check('Auth', 'Change password ends other sessions', async () => {
  const old = token;
  const r = await call('POST', '/auth/change-password', { currentPassword: 'Kharcha@123', newPassword: 'Kharcha@456' });
  expect(r.status === 200 && r.data.token, `status ${r.status} ${JSON.stringify(r.data)}`);
  token = r.data.token;
  const stale = await call('GET', '/auth/me', undefined, { auth: old });
  expect(stale.status === 401, `the old session still works (${stale.status})`);
  const fresh = await call('GET', '/auth/me');
  expect(fresh.status === 200, 'the new session does not work');
  const again = await call('POST', '/auth/login', { email, password: 'Kharcha@456' }, { auth: null });
  expect(again.status === 200, 'new password does not work');
});
await check('Auth', 'Sign out everywhere', async () => {
  const old = token;
  const r = await call('POST', '/auth/logout-all', {});
  expect(r.status === 200 && r.data.token, `status ${r.status}`);
  token = r.data.token;
  const stale = await call('GET', '/auth/me', undefined, { auth: old });
  expect(stale.status === 401, `the old session still works (${stale.status})`);
});
await check('Auth', 'The shared demo password cannot be changed', async () => {
  const demo = await call('POST', '/auth/login', { email: 'student@campuscoin.app', password: 'Student@12345' }, { auth: null });
  expect(demo.status === 200, `demo login ${demo.status}`);
  const r = await call('POST', '/auth/change-password', { currentPassword: 'Student@12345', newPassword: 'Kharcha@999' }, { auth: demo.data.token });
  expect(r.status === 403, `status ${r.status}`);
});
await check('Auth', 'Password recovery by tokenised link', async () => {
  const r = await call('POST', '/auth/forgot-password', { email }, { auth: null });
  expect(r.status === 200, `status ${r.status}`);
  const link = r.data.devResetLink;
  expect(link, 'no reset link returned (SMTP not configured, so it should be)');
  const resetToken = new URL(link).searchParams.get('token');
  const reset = await call('POST', '/auth/reset-password', { token: resetToken, password: 'Kharcha@789' }, { auth: null });
  expect(reset.status === 200, `reset status ${reset.status} ${JSON.stringify(reset.data)}`);
  const login = await call('POST', '/auth/login', { email, password: 'Kharcha@789' }, { auth: null });
  expect(login.status === 200, 'cannot log in with reset password'); token = login.data.token;
  const reuse = await call('POST', '/auth/reset-password', { token: resetToken, password: 'Kharcha@000' }, { auth: null });
  expect(reuse.status >= 400, 'reset link worked twice');
});

/* --- Categories ------------------------------------------------------------ */
await check('Categories', 'Default income and expense categories exist', async () => {
  const r = await call('GET', '/categories');
  const list = r.data.categories;
  ctx.categories = list;
  const names = list.map((c) => c.name);
  for (const n of ['Allowance', 'Part-time Job', 'Scholarship', 'Gift', 'Food', 'Transport', 'Hostel/Rent', 'Academics', 'Subscriptions', 'Entertainment', 'Miscellaneous']) {
    expect(names.includes(n), `missing ${n}`);
  }
  return `${list.length} categories`;
});
await check('Categories', 'Create a personal category', async () => {
  const r = await call('POST', '/categories', { name: 'Gym', type: 'expense', icon: 'target', slot: 3 });
  expect(r.status === 201 || r.status === 200, `status ${r.status} ${JSON.stringify(r.data)}`);
  ctx.gym = r.data.category._id;
});
await check('Categories', 'Edit a personal category', async () => {
  const r = await call('PATCH', `/categories/${ctx.gym}`, { name: 'Gym and sport' });
  expect(r.status === 200 && r.data.category.name === 'Gym and sport', `status ${r.status} ${JSON.stringify(r.data)}`);
});
await check('Categories', 'Delete a personal category', async () => {
  const r = await call('DELETE', `/categories/${ctx.gym}`);
  expect(r.status === 200 || r.status === 204, `status ${r.status} ${JSON.stringify(r.data)}`);
});
await check('Categories', 'Default categories cannot be edited by a student', async () => {
  const food = ctx.categories.find((c) => c.name === 'Food');
  const r = await call('PATCH', `/categories/${food._id}`, { name: 'Hacked' });
  expect(r.status >= 400, `status ${r.status}`);
});

const cat = (name) => ctx.categories.find((c) => c.name === name)._id;

/* --- Income and expense logging ------------------------------------------ */
await check('Transactions', 'Quick-add income', async () => {
  const r = await call('POST', '/transactions', { type: 'income', amount: 25000, categoryId: cat('Allowance'), description: 'Monthly allowance', date: today });
  expect(r.status === 201 || r.status === 200, `status ${r.status} ${JSON.stringify(r.data)}`);
  ctx.income = r.data.transaction._id;
});
await check('Transactions', 'Quick-add expenses', async () => {
  for (const [desc, amount, c] of [['Canteen lunch', 450, 'Food'], ['Rickshaw to campus', 200, 'Transport'], ['Netflix', 1100, 'Subscriptions'], ['Biryani with friends', 900, 'Food']]) {
    const r = await call('POST', '/transactions', { type: 'expense', amount, categoryId: cat(c), description: desc, date: today });
    expect(r.status === 201 || r.status === 200, `${desc}: ${r.status} ${JSON.stringify(r.data)}`);
    if (desc === 'Canteen lunch') ctx.lunch = r.data.transaction._id;
  }
});
await check('Transactions', 'Invalid amount is refused', async () => {
  const r = await call('POST', '/transactions', { type: 'expense', amount: -5, categoryId: cat('Food'), description: 'bad', date: today });
  expect(r.status === 400, `status ${r.status}`);
});
await check('Transactions', 'Recurring entry (monthly subscription)', async () => {
  const r = await call('POST', '/transactions', { type: 'expense', amount: 300, categoryId: cat('Subscriptions'), description: 'Spotify', date: today, recurring: { enabled: true, frequency: 'monthly' } });
  expect(r.status === 201 || r.status === 200, `status ${r.status}`);
  expect(r.data.transaction.recurring?.enabled && r.data.transaction.recurring?.nextRun, 'recurring rule not saved');
});
await check('Transactions', 'Edit a transaction', async () => {
  const r = await call('PATCH', `/transactions/${ctx.lunch}`, { amount: 500, description: 'Canteen lunch and chai' });
  expect(r.status === 200 && r.data.transaction.amount === 500, `status ${r.status} ${JSON.stringify(r.data).slice(0, 200)}`);
});
await check('Transactions', 'Delete a transaction', async () => {
  const add = await call('POST', '/transactions', { type: 'expense', amount: 10, categoryId: cat('Miscellaneous'), description: 'to delete', date: today });
  const r = await call('DELETE', `/transactions/${add.data.transaction._id}`);
  expect(r.status === 200 || r.status === 204, `status ${r.status}`);
});
await check('Transactions', 'List, search and filter', async () => {
  const all = await call('GET', '/transactions');
  const found = await call('GET', '/transactions?q=biryani');
  const byCat = await call('GET', `/transactions?category=${cat('Food')}`);
  expect(all.status === 200 && all.data.total >= 6, `total ${all.data.total}`);
  expect(found.data.transactions?.length === 1, `search found ${found.data.transactions?.length}`);
  expect(byCat.data.transactions?.every((t) => (t.category?._id || t.category) === cat('Food')), 'category filter leaked');
  return `${all.data.total} transactions`;
});
await check('Transactions', 'Recently viewed/edited list', async () => {
  const r = await call('GET', '/transactions/recent');
  expect(r.status === 200, `status ${r.status}`);
});
await check('Anomalies', 'Unusually large expense is flagged', async () => {
  // Needs some history to be "unusual"; post a few normal food items first.
  for (let i = 0; i < 4; i++) await call('POST', '/transactions', { type: 'expense', amount: 400 + i * 20, categoryId: cat('Food'), description: `snack ${i}`, date: today });
  const r = await call('POST', '/transactions', { type: 'expense', amount: 40000, categoryId: cat('Food'), description: 'Wedding catering', date: today });
  expect((r.data.transaction.flags || []).includes('large'), `flags ${JSON.stringify(r.data.transaction.flags)}`);
});
await check('Anomalies', 'Duplicate transaction is flagged', async () => {
  await call('POST', '/transactions', { type: 'expense', amount: 777, categoryId: cat('Transport'), description: 'Bus pass', date: today });
  const r = await call('POST', '/transactions', { type: 'expense', amount: 777, categoryId: cat('Transport'), description: 'Bus pass', date: today });
  expect((r.data.transaction.flags || []).includes('duplicate'), `flags ${JSON.stringify(r.data.transaction.flags)}`);
});

/* --- AI categorisation ---------------------------------------------------- */
await check('AI assistant', 'Suggests a category as you type', async () => {
  const r = await call('GET', '/ai/suggest?q=' + encodeURIComponent('chai at campus cafe') + '&type=expense');
  expect(r.data.suggestion?.name === 'Food', JSON.stringify(r.data));
  return `${r.data.suggestion.name} ${Math.round(r.data.suggestion.confidence * 100)}%`;
});
await check('AI assistant', 'Learns from a correction', async () => {
  // File "zumba" (unknown word) under Entertainment twice, then ask again.
  for (let i = 0; i < 2; i++) await call('POST', '/transactions', { type: 'expense', amount: 500, categoryId: cat('Entertainment'), description: 'zumba class', date: today });
  const r = await call('GET', '/ai/suggest?q=zumba&type=expense');
  expect(r.data.suggestion?.name === 'Entertainment', JSON.stringify(r.data));
});
await check('AI assistant', 'Override is recorded (accuracy tracked)', async () => {
  const s = await call('GET', '/ai/suggest?q=canteen&type=expense');
  const r = await call('POST', '/transactions', { type: 'expense', amount: 120, categoryId: cat('Miscellaneous'), description: 'canteen', date: today, aiSuggestedCategory: s.data.suggestion.categoryId });
  expect(r.data.transaction.aiAccepted === false, `aiAccepted ${r.data.transaction.aiAccepted}`);
  const status = await call('GET', '/ai/status');
  expect(status.data.categorisation.accuracy?.total >= 1, JSON.stringify(status.data.categorisation.accuracy));
});
await check('Import', 'CSV preview with batch category suggestions', async () => {
  const csv = `date,description,amount,type\n${today},Foodpanda burger,650,expense\n${today},Uber to university,380,expense\n${today},Tutoring fee,5000,income\n`;
  const r = await call('POST', '/transactions/import/preview', { csv });
  expect(r.status === 200 && r.data.rows?.length === 3, `status ${r.status} ${JSON.stringify(r.data).slice(0, 300)}`);
  ctx.importRows = r.data.rows;
  const withSuggestion = r.data.rows.filter((row) => row.suggestion || row.categoryId || row.suggestedCategory);
  expect(withSuggestion.length >= 2, `only ${withSuggestion.length} rows got a suggestion: ${JSON.stringify(r.data.rows[0])}`);
});
await check('Import', 'CSV commit', async () => {
  const rows = ctx.importRows.map((row) => ({ ...row, categoryId: row.categoryId || row.suggestion?.categoryId || row.suggestedCategory?._id || cat(row.type === 'income' ? 'Other Income' : 'Miscellaneous') }));
  const r = await call('POST', '/transactions/import/commit', { rows });
  expect(r.status === 200 || r.status === 201, `status ${r.status} ${JSON.stringify(r.data).slice(0, 300)}`);
  return JSON.stringify(r.data).slice(0, 80);
});
await check('Import', 'CSV export', async () => {
  const r = await call('GET', `/transactions/export?month=${month}`, undefined, { raw: true });
  expect(r.status === 200 && String(r.data).split('\n').length > 5, `status ${r.status}`);
  expect((r.headers.get('content-disposition') || '').includes('.csv'), 'not a csv download');
});

/* --- Budgets and alerts --------------------------------------------------- */
await check('Budgets', 'Set a monthly budget per category', async () => {
  const r = await call('PUT', '/budgets', { categoryId: cat('Food'), month, limitAmount: 3000 });
  expect(r.status === 200 || r.status === 201, `status ${r.status} ${JSON.stringify(r.data)}`);
  const t = await call('PUT', '/budgets', { categoryId: cat('Transport'), month, limitAmount: 1500 });
  expect(t.status === 200 || t.status === 201, `transport ${t.status}`);
});
await check('Budgets', 'Real-time progress (spent vs cap)', async () => {
  const r = await call('GET', `/budgets?month=${month}`);
  const food = (r.data.budgets || []).find((b) => b.category.name === 'Food');
  expect(food && food.spent > 3000 && food.state === 'exceeded', JSON.stringify(food));
  return `Food ${food.pct}%`;
});
await check('Budgets', 'In-app notification when a category nears/exceeds budget', async () => {
  await call('POST', '/transactions', { type: 'expense', amount: 1300, categoryId: cat('Transport'), description: 'Train ticket', date: today });
  const r = await call('GET', '/notifications');
  const titles = r.data.notifications.map((n) => n.title).join(' | ');
  expect(/budget|Food|Transport/i.test(titles), titles || 'no notifications');
  expect(r.data.unread > 0, 'nothing unread');
  const read = await call('POST', '/notifications/read', {});
  expect(read.status === 200, 'mark read failed');
  return titles.slice(0, 120);
});
await check('Budgets', 'Copy budgets to next month', async () => {
  const r = await call('POST', '/budgets/copy-forward', { from: month });
  expect(r.status === 200 || r.status === 201, `status ${r.status} ${JSON.stringify(r.data)}`);
});

/* --- Dashboard and reports ------------------------------------------------ */
await check('Dashboard', 'Greeting data, balance, top category, budget vs actual, tips', async () => {
  const r = await call('GET', `/reports/dashboard?month=${month}`);
  const d = r.data;
  expect(d.totals && d.totals.income === 30000 && d.totals.expense > 0, JSON.stringify(d.totals));
  expect(Array.isArray(d.spending) && d.spending.length > 0, 'no category split');
  expect(Array.isArray(d.budgets) && d.budgets.length >= 2, 'no budgets');
  expect(Array.isArray(d.tips), 'no tips array');
  return `in ${d.totals.income} out ${d.totals.expense}, top ${d.spending[0].name}`;
});
await check('Reports', 'Category-wise monthly report', async () => {
  const r = await call('GET', `/reports/monthly?month=${month}`);
  expect(r.status === 200, `status ${r.status}`);
  const keys = Object.keys(r.data);
  return keys.join(',');
});
await check('Reports', 'Daily and weekly summaries', async () => {
  const r = await call('GET', `/reports/monthly?month=${month}`);
  const s = JSON.stringify(r.data);
  expect(/daily|days/i.test(s) && /week/i.test(s), 'no daily/weekly in monthly report');
});
await check('Reports', 'Income vs expense, last six months', async () => {
  const r = await call('GET', `/reports/trend?month=${month}&months=6`);
  const trend = r.data.trend || r.data;
  expect(Array.isArray(trend) && trend.length === 6, JSON.stringify(r.data).slice(0, 200));
});
await check('Reports', 'Filter by date range, category and income source', async () => {
  const from = `${month}-01`;
  const byCat = await call('GET', `/reports/filtered?from=${from}&to=${today}&category=${cat('Food')}`);
  const bySource = await call('GET', `/reports/filtered?from=${from}&to=${today}&type=income`);
  expect(byCat.status === 200 && bySource.status === 200, `${byCat.status} ${bySource.status}`);
  return JSON.stringify(bySource.data).slice(0, 120);
});
await check('Reports', 'Forecast needs 3 months (honest refusal for a new account)', async () => {
  const r = await call('GET', `/reports/forecast?month=${month}`);
  expect(r.status === 200 && r.data.forecast.available === false, JSON.stringify(r.data));
});
await check('Reports', 'Flagged transactions list', async () => {
  const r = await call('GET', '/reports/flagged');
  expect(r.status === 200, `status ${r.status}`);
  return JSON.stringify(r.data).slice(0, 100);
});

/* --- Insights, tips, sharing ---------------------------------------------- */
await check('Insights', 'Generate the monthly narrative insight', async () => {
  const r = await call('POST', `/insights/${month}/generate`, {});
  expect(r.status === 200 && (r.data.insight?.summaryText || '').length > 20, `status ${r.status} ${JSON.stringify(r.data).slice(0, 200)}`);
  return r.data.insight.summaryText.slice(0, 90) + '...';
});
await check('Insights', 'Insight history is stored', async () => {
  const r = await call('GET', '/insights');
  expect(r.status === 200 && (r.data.insights || r.data).length >= 1, JSON.stringify(r.data).slice(0, 200));
});
await check('Insights', 'Bookmark an insight', async () => {
  const r = await call('POST', `/insights/${month}/bookmark`, {});
  expect(r.status === 200, `status ${r.status} ${JSON.stringify(r.data)}`);
});
await check('Insights', 'Share the summary by email', async () => {
  const r = await call('POST', `/insights/${month}/share`, { email: 'friend@example.com' });
  expect(r.status === 200, `status ${r.status} ${JSON.stringify(r.data).slice(0, 200)}`);
  return (r.data.message || '').slice(0, 100);
});
await check('Tips', 'Tips generated from own history, ranked by impact', async () => {
  await call('POST', '/tips/refresh', { month });
  const r = await call('GET', '/tips');
  const tips = r.data.tips;
  expect(tips.length > 0, 'no tips');
  const impacts = tips.filter((t) => t.status === 'active').map((t) => t.impact);
  expect(impacts.every((v, i) => i === 0 || impacts[i - 1] >= v), `not ranked: ${impacts}`);
  ctx.tip = tips[0]._id;
  return `${tips.length} tips, top: ${tips[0].title}`;
});
await check('Tips', 'Pin and dismiss a tip', async () => {
  const pin = await call('PATCH', `/tips/${ctx.tip}`, { status: 'pinned' });
  expect(pin.data.tip?.status === 'pinned', JSON.stringify(pin.data));
  const dis = await call('PATCH', `/tips/${ctx.tip}`, { status: 'dismissed' });
  expect(dis.data.tip?.status === 'dismissed', JSON.stringify(dis.data));
});

/* --- Chat assistant ------------------------------------------------------- */
await check('Chat', 'Answers questions from own data', async () => {
  const out = [];
  for (const q of ['How am I doing this month?', 'how much on food?', 'Am I within budget?', 'can I afford 2000?']) {
    const r = await call('POST', '/ai/chat', { message: q });
    expect(r.status === 200 && r.data.reply, `${q}: ${r.status}`);
    out.push(r.data.reply.slice(0, 50));
  }
  return out.join(' / ');
});

/* --- Admin ---------------------------------------------------------------- */
await check('Admin', 'Separate admin login', async () => {
  const r = await call('POST', '/auth/admin/login', { email: 'admin@campuscoin.app', password: 'Admin@12345' }, { auth: null });
  expect(r.status === 200, `status ${r.status}`); adminToken = r.data.token;
});
await check('Admin', 'Students cannot reach admin routes', async () => {
  const r = await call('GET', '/admin/stats');
  expect(r.status === 403 || r.status === 401, `status ${r.status}`);
});
await check('Admin', 'Usage statistics (active users, transactions, top categories)', async () => {
  const r = await call('GET', '/admin/stats', undefined, { auth: adminToken });
  expect(r.status === 200, `status ${r.status}`);
  return Object.keys(r.data).join(',');
});
await check('Admin', 'View and search users', async () => {
  const r = await call('GET', '/admin/users?q=e2e', undefined, { auth: adminToken });
  const u = (r.data.users || []).find((x) => x.email === email);
  expect(u, 'test user not found'); ctx.adminUserId = u._id;
});
await check('Admin', 'Disable a user blocks login, enable restores it', async () => {
  const d = await call('PATCH', `/admin/users/${ctx.adminUserId}`, { disabled: true }, { auth: adminToken });
  expect(d.status === 200, `disable ${d.status}`);
  const blocked = await call('POST', '/auth/login', { email, password: 'Kharcha@789' }, { auth: null });
  expect(blocked.status >= 400, `disabled user could log in (${blocked.status})`);
  const stillWorks = await call('GET', '/transactions');
  expect(stillWorks.status === 401 || stillWorks.status === 403, `disabled user's existing session still works (${stillWorks.status})`);
  await call('PATCH', `/admin/users/${ctx.adminUserId}`, { disabled: false }, { auth: adminToken });
  const back = await call('POST', '/auth/login', { email, password: 'Kharcha@789' }, { auth: null });
  expect(back.status === 200, 'enable did not restore login'); token = back.data.token;
});
await check('Admin', 'Reset a user password', async () => {
  const r = await call('POST', `/admin/users/${ctx.adminUserId}/reset-password`, {}, { auth: adminToken });
  expect(r.status === 200 && r.data.temporaryPassword, `status ${r.status} ${JSON.stringify(r.data)}`);
  const stale = await call('GET', '/auth/me');
  expect(stale.status === 401, `the student's old session still works (${stale.status})`);
  const login = await call('POST', '/auth/login', { email, password: r.data.temporaryPassword }, { auth: null });
  expect(login.status === 200 && login.data.user.mustChangePassword, 'temporary password does not work or is not flagged');
  token = login.data.token;
  return 'temporary password issued; student asked to change it';
});
await check('Admin', 'Repeated wrong passwords lock the account', async () => {
  const lockEmail = `lock.${Date.now()}@campuscoin.app`;
  const reg = await call('POST', '/auth/register', { name: 'Lock Check', email: lockEmail, password: 'Kharcha@123' }, { auth: null });
  expect(reg.status === 201, `register ${reg.status}`);
  for (let i = 0; i < 5; i++) await call('POST', '/auth/login', { email: lockEmail, password: 'wrong-guess-1' }, { auth: null });
  const locked = await call('POST', '/auth/login', { email: lockEmail, password: 'Kharcha@123' }, { auth: null });
  expect(locked.status === 429, `the right password still got in after 5 wrong ones (${locked.status})`);
  await call('DELETE', `/admin/users/${reg.data.user._id}`, undefined, { auth: adminToken });
});
await check('Admin', 'Add, edit and remove a default category', async () => {
  const c = await call('POST', '/admin/categories', { name: 'Laundry E2E', type: 'expense', icon: 'tag', slot: 5, keywords: ['laundry'] }, { auth: adminToken });
  expect(c.status === 201 || c.status === 200, `create ${c.status} ${JSON.stringify(c.data)}`);
  const id = c.data.category._id;
  const e = await call('PATCH', `/admin/categories/${id}`, { name: 'Laundry E2E two' }, { auth: adminToken });
  expect(e.status === 200, `edit ${e.status}`);
  const d = await call('DELETE', `/admin/categories/${id}`, undefined, { auth: adminToken });
  expect(d.status === 200 || d.status === 204, `delete ${d.status}`);
});
await check('Admin', 'Announcements and tip templates', async () => {
  const a = await call('POST', '/admin/announcements', { title: 'E2E notice', body: 'Testing', kind: 'announcement' }, { auth: adminToken });
  expect(a.status === 201 || a.status === 200, `create ${a.status} ${JSON.stringify(a.data)}`);
  const id = (a.data.announcement || a.data.item)?._id;
  const seen = await call('GET', `/reports/dashboard?month=${month}`);
  expect((seen.data.announcements || []).some((x) => x.title === 'E2E notice'), 'student does not see the announcement');
  const t = await call('POST', '/admin/announcements', { title: 'E2E tip', body: 'Cook at home', kind: 'tip-template' }, { auth: adminToken });
  expect(t.status === 201 || t.status === 200, `tip template ${t.status}`);
  const tid = (t.data.announcement || t.data.item)?._id;
  for (const x of [id, tid]) if (x) await call('DELETE', `/admin/announcements/${x}`, undefined, { auth: adminToken });
});
await check('Admin', 'Remove a user account (clean-up)', async () => {
  const r = await call('DELETE', `/admin/users/${ctx.adminUserId}`, undefined, { auth: adminToken });
  expect(r.status === 200 || r.status === 204, `status ${r.status}`);
});

/* --- Report -------------------------------------------------------------- */
let area = '';
for (const r of results) {
  if (r.area !== area) { area = r.area; console.log(`\n${area}`); }
  console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `  -> ${r.detail}` : ''}`);
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
const failures = results.filter((r) => !r.ok).length;
process.exit(failures ? 1 : 0);
