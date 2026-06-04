import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';

const LOCK_THRESHOLD = 5;
const LOCK_WINDOW_MS = 60 * 60 * 1000;
const LOCK_DURATION_MS = 15 * 60 * 1000;

const failedAttempts = new Map<string, { timestamps: number[] }>();

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

export async function isBlocked(email: string): Promise<boolean> {
    const record = failedAttempts.get(email);
    if (!record) return false;

    const now = Date.now();
    const recent = record.timestamps.filter(t => now - t < LOCK_WINDOW_MS);
    record.timestamps = recent;

    if (recent.length < LOCK_THRESHOLD) return false;

    const oldestInWindow = recent[0];
    const blockedUntil = oldestInWindow + LOCK_DURATION_MS;
    return now < blockedUntil;
}

export async function recordFailedAttempt(email: string, _userId: number | null, _ipAddress: string) {
    const now = Date.now();
    const record = failedAttempts.get(email);
    if (record) {
        record.timestamps.push(now);
    } else {
        failedAttempts.set(email, { timestamps: [now] });
    }
}

export async function clearFailedAttempts(email: string) {
    failedAttempts.delete(email);
}

export async function updatePassword(id: number, passwordHash: string) {
    const result = await db.update(users).set({ passwordHash }).where(eq(users.id, id)).returning();
    return result[0];
}
