import { db } from '../db';
import { eq, and, desc, count } from 'drizzle-orm';
import { notifications } from '../db/schema';

export async function create(data: {
    userId: number;
    title: string;
    message?: string | null;
    type: string;
    referenceType?: string | null;
    referenceId?: number | null;
}) {
    const result = await db
        .insert(notifications)
        .values(data)
        .returning({ id: notifications.id, createdAt: notifications.createdAt });
    return result[0];
}

export async function list(userId: number, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [total] = await db
        .select({ total: count() })
        .from(notifications)
        .where(eq(notifications.userId, userId));

    const rows = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);

    return { rows, total: Number(total.total), page, limit };
}

export async function getUnreadCount(userId: number) {
    const [result] = await db
        .select({ count: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return Number(result.count);
}

export async function markAsRead(id: number, userId: number) {
    await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllAsRead(userId: number) {
    await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, userId));
}
