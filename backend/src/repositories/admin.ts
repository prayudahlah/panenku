import { eq, isNull, count, sql } from 'drizzle-orm';
import { db } from '../db';
import { users, sellerProfiles, products } from '../db/schema';

export async function listUsers() {
    return db
        .select({
            id: users.id,
            fullName: users.fullName,
            email: users.email,
            phone: users.phone,
            role: users.role,
            status: users.status,
            createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(sql`${users.createdAt} desc`);
}

export async function updateUserStatus(userId: number, status: string) {
    const result = await db.update(users).set({ status }).where(eq(users.id, userId)).returning();
    return result[0];
}

export async function listSellers() {
    return db
        .select({
            id: users.id,
            fullName: users.fullName,
            farmName: sellerProfiles.farmName,
            cityId: sellerProfiles.cityId,
            provinceId: sellerProfiles.provinceId,
            productCount: sql<number>`(select count(*) from ${products} where ${products.sellerId} = ${users.id} and ${isNull(products.deletedAt)})`,
        })
        .from(users)
        .innerJoin(sellerProfiles, eq(sellerProfiles.userId, users.id))
        .where(eq(users.role, 'seller'))
        .orderBy(sql`${users.fullName} asc`);
}

export async function listProductsBySeller(sellerId: number) {
    return db
        .select({
            id: products.id,
            name: products.name,
            pricePerUnit: products.pricePerUnit,
            stockQuantity: products.stockQuantity,
            status: sql<string>`case when ${isNull(products.deletedAt)} then 'active' else 'taken_down' end`,
            createdAt: products.createdAt,
        })
        .from(products)
        .where(eq(products.sellerId, sellerId))
        .orderBy(sql`${products.createdAt} desc`);
}

export async function takedownProduct(productId: number) {
    const result = await db
        .update(products)
        .set({ deletedAt: new Date() })
        .where(eq(products.id, productId))
        .returning();
    return result[0];
}

export async function findById(id: number) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
}
