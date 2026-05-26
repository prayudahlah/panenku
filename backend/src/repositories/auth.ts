import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';

export async function findByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
}

export async function findById(id: number) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
}

export async function create(data: typeof users.$inferInsert) {
    const result = await db.insert(users).values(data).returning();
    return result[0];
}

export async function updateRole(id: number, role: string) {
    const result = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return result[0];
}
