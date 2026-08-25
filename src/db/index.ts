import { drizzle } from 'drizzle-orm/libsql/web';
import { createClient } from '@libsql/client/web';
import * as schema from './schema';

// Cloudflare Workers uses the Web client. Prefer Turso's HTTPS endpoint so requests
// use fetch rather than a shared WebSocket connection during concurrent RSC queries.
const databaseUrl = (
  process.env.TURSO_DATABASE_URL || 'file:./local.db'
).replace(/^libsql:\/\//, 'https://');

// Turso credentials are required when this client runs on Cloudflare Workers.
const client = createClient({
  url: databaseUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Create the drizzle instance
export const db = drizzle(client, { schema });

// Export the client for direct access if needed
export { client };

// Export schema for use in other files
export * from './schema';
