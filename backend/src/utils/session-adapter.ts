import { eq } from 'drizzle-orm';
import type { SessionStoreAdapter } from 'elysia-better-session';
import { db } from '../db';
import { sessions } from '../db/schema';

export const upsertSessionAdapter: SessionStoreAdapter = {
    async get(id) {
        const rows = await db
            .select()
            .from(sessions)
            .where(eq(sessions.id, id))
            .limit(1);
        if (!rows[0]) return null;
        const expiresAt = new Date(rows[0].expiresAt).getTime();
        if (expiresAt <= Date.now()) {
            await db.delete(sessions).where(eq(sessions.id, id));
            return null;
        }
        return {
            data: JSON.parse(rows[0].data as string),
            expiresAt,
        };
    },
    async set(id, session) {
        await db
            .insert(sessions)
            .values({
                id,
                data: JSON.stringify(session.data),
                expiresAt: new Date(session.expiresAt),
            })
            .onConflictDoUpdate({
                target: sessions.id,
                set: {
                    data: JSON.stringify(session.data),
                    expiresAt: new Date(session.expiresAt),
                },
            });
    },
    async delete(id) {
        await db.delete(sessions).where(eq(sessions.id, id));
    },
};
