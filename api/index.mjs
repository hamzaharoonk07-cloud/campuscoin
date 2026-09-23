// Vercel serverless entry: every /api request is rewritten here (see vercel.json).
import app from '../server/src/app.js';
import { connectDB } from '../server/src/config/db.js';
import { seedIfEmpty } from '../server/src/seed/seed.js';

// Runs once per cold start; later requests on a warm function reuse the same promise.
let ready = null;
const prepare = () => {
  if (!ready) {
    ready = (async () => {
      await connectDB();
      await seedIfEmpty();
    })().catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
};

export default async function handler(req, res) {
  try {
    await prepare();
  } catch (err) {
    console.error('[startup]', err);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'The database is not reachable right now. Please try again shortly.' }));
    return undefined;
  }
  return app(req, res);
}
