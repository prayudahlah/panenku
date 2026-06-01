import { pgSchema, text, timestamp, bigint, boolean } from 'drizzle-orm/pg-core';

export const util = pgSchema('util');

export const sessions = util.table('sessions', {
  id: text('id').primaryKey(),
  data: text('data').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const notifications = util.table('notifications', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  title: text('title').notNull(),
  message: text('message'),
  type: text('type').notNull(),
  referenceType: text('reference_type'),
  referenceId: bigint('reference_id', { mode: 'number' }),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});
