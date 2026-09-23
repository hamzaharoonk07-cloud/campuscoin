import 'dotenv/config';
import { connectDB, closeDB } from '../config/db.js';
import { seedIfEmpty } from './seed.js';

// `npm run seed` - fills an empty database with the default categories, the
// administrator and two demo students with six months of history.

await connectDB();
const { admin, demo, second } = await seedIfEmpty();

console.log('\nCampus Coin is seeded. Sign in with:\n');
console.log(`  Administrator  ${admin.email}   Admin@12345`);
console.log(`  Student        ${demo.email}  Student@12345`);
console.log(`  Student        ${second.email}     Student@12345\n`);

// Closing properly is what flushes the embedded database to disk.
await closeDB();
