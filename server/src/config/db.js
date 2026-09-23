import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// One connection per process. On Vercel a warm function reuses it across requests.
let connecting = null;
let shutdown = async () => mongoose.disconnect();

// Uses MONGO_URI when provided (local MongoDB or Atlas). Otherwise starts an
// embedded MongoDB that stores its data in server/data/db so it survives restarts.
export function connectDB() {
  if (!connecting) {
    connecting = open().catch((err) => {
      connecting = null;
      throw err;
    });
  }
  return connecting;
}

async function open() {
  // MONGODB_URI is the name the Vercel Marketplace MongoDB Atlas integration uses.
  let uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    if (process.env.VERCEL) {
      throw new Error('No database configured: set MONGO_URI or connect MongoDB Atlas (MONGODB_URI) in the Vercel project.');
    }
    // Held in a variable so the Vercel bundler does not pull the embedded database into the function.
    const embedded = 'mongodb-memory-server';
    const { MongoMemoryServer } = await import(embedded);
    const dbPath = path.resolve(__dirname, '..', '..', 'data', 'db');
    fs.mkdirSync(dbPath, { recursive: true });
    const mongod = await MongoMemoryServer.create({
      instance: { dbPath, storageEngine: 'wiredTiger', port: Number(process.env.EMBEDDED_DB_PORT || 27019) },
    });
    uri = mongod.getUri('campuscoin');
    console.log(`No MONGO_URI set - using embedded MongoDB (data in ${dbPath})`);

    // Stopping mongod cleanly is what makes it checkpoint to disk. A script that
    // calls process.exit() instead will silently lose its last writes.
    shutdown = async () => {
      await mongoose.disconnect();
      await mongod.stop();
    };
    const stop = async () => {
      await shutdown();
      process.exit(0);
    };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
  }

  // Integration-provided strings often have no database name, so always use "campuscoin".
  await mongoose.connect(uri, { dbName: 'campuscoin', serverSelectionTimeoutMS: 10000 });
  console.log('MongoDB connected');
}

/** Closes the connection, and the embedded database if this process started one. */
export const closeDB = () => shutdown();
