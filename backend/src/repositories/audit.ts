import { db } from '../db';
import { auditLogs } from '../db/schema';
import { and, eq, count, sql, desc } from 'drizzle-orm';

export const create = async (data: {
    userId?: number;
    action: string;
    entityType?: string;
    entityId?: number;
    oldData?: any;
    newData?: any;
    ipAddress?: string;
}) => {
    await db.insert(auditLogs).values(data);
};

export const list = async ({
    action,
    entityType,
    userId,
    dateFrom,
    dateTo,
    page = 1,
    limit = 50,
}: {
    action?: string;
    entityType?: string;
    userId?: number;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}) => {
    const conditions = [];

    if (action) conditions.push(eq(auditLogs.action, action));
    if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
    if (userId) conditions.push(eq(auditLogs.userId, userId));
    if (dateFrom) conditions.push(sql`${auditLogs.createdAt} >= ${dateFrom}::timestamp`);
    if (dateTo) conditions.push(sql`${auditLogs.createdAt} <= ${dateTo}::timestamp`);

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (page - 1) * limit;

    const [total] = await db.select({ count: count() }).from(auditLogs).where(where);
    const rows = await db
        .select()
        .from(auditLogs)
        .where(where)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset);

    return { rows, total: Number(total.count), page, limit };
};
