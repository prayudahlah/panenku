import { pgSchema, bigint, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const audit = pgSchema('audit');

export const auditLogs = audit.table('audit_logs', {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    userId: bigint('user_id', { mode: 'number' }),
    action: varchar('action', { length: 50 }).notNull(),
    entityType: varchar('entity_type', { length: 50 }),
    entityId: bigint('entity_id', { mode: 'number' }),
    oldData: jsonb('old_data'),
    newData: jsonb('new_data'),
    ipAddress: varchar('ip_address', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow(),
});
