import { pgSchema, text, timestamp } from 'drizzle-orm/pg-core';

export const util = pgSchema('util');

export const sessions = util.table('sessions', {
  id: text('id').primaryKey(),
  data: text('data').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
