import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { seedIfEmpty } from './seed/seed.js';
import { runRecurring } from './services/recurring.js';

// Local development entry point. On Vercel, api/index.mjs starts the app instead.

const PORT = Number(process.env.PORT || 5000);

await connectDB();
await seedIfEmpty();

// Writes any recurring entries that came due while the app was not running,
// then keeps checking once an hour. On Vercel this is a cron job instead.
await runRecurring();
setInterval(() => {
  runRecurring().catch((err) => console.error('[recurring]', err));
}, 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Campus Coin API listening on http://localhost:${PORT}`);
});
