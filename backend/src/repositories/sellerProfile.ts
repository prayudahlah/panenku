import { eq } from 'drizzle-orm';
import { db } from '../db';
import { sellerProfiles } from '../db/schema';

export async function findByUserId(userId: number) {
    const result = await db.select().from(sellerProfiles).where(eq(sellerProfiles.userId, userId)).limit(1);
    return result[0] || null;
}

export async function create(data: typeof sellerProfiles.$inferInsert) {
    const result = await db.insert(sellerProfiles).values(data).returning();
    return result[0];
}
