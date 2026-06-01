import { db } from '../db';
import { eq, and, isNull } from 'drizzle-orm';
import { userAddresses } from '../db/schema';

type DBLike = typeof db;

export async function findByUserId(userId: number) {
    return db
        .select()
        .from(userAddresses)
        .where(and(eq(userAddresses.userId, userId), isNull(userAddresses.deletedAt)))
        .orderBy(userAddresses.isDefault);
}

export async function findById(id: number) {
    const result = await db
        .select()
        .from(userAddresses)
        .where(and(eq(userAddresses.id, id), isNull(userAddresses.deletedAt)))
        .limit(1);
    return result[0] || null;
}

export async function create(data: {
    userId: number;
    label: string;
    provinceId: number;
    cityId: number;
    address: string;
    isDefault: boolean;
}) {
    const result = await db.insert(userAddresses).values(data).returning();
    return result[0];
}

export async function update(id: number, data: {
    label?: string;
    provinceId?: number;
    cityId?: number;
    address?: string;
    isDefault?: boolean;
}) {
    const result = await db.update(userAddresses).set(data).where(eq(userAddresses.id, id)).returning();
    return result[0];
}

export async function softDelete(id: number) {
    await db.update(userAddresses).set({ deletedAt: new Date() }).where(eq(userAddresses.id, id));
}

export async function countByUserId(userId: number) {
    const result = await db
        .select({ count: userAddresses.id })
        .from(userAddresses)
        .where(and(eq(userAddresses.userId, userId), isNull(userAddresses.deletedAt)));
    return result.length;
}

export async function resetDefault(userId: number, tx?: DBLike) {
    const conn = tx || db;
    await conn.update(userAddresses).set({ isDefault: false }).where(eq(userAddresses.userId, userId));
}
