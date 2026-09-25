/**
 * Where links in emails point: the configured site, else this deployment's
 * production address on Vercel, else the local development client.
 */
export const siteUrl = () =>
  process.env.CLIENT_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:5173');
