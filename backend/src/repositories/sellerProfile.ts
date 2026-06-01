import { eq, count, isNull, sql } from 'drizzle-orm';
import { db } from '../db';
import { sellerProfiles, users, cities, provinces, products } from '../db/schema';

export async function findByUserId(userId: number) {
    const result = await db
        .select()
        .from(sellerProfiles)
        .where(eq(sellerProfiles.userId, userId))
        .limit(1);
    return result[0] || null;
}

export async function create(data: typeof sellerProfiles.$inferInsert) {
    const result = await db.insert(sellerProfiles).values(data).returning();
    return result[0];
}


export async function getPublicProfileByUserId(userId: number) {
    const result = await db
        .select({
            id: sellerProfiles.id,
            userId: sellerProfiles.userId,
            farmName: sellerProfiles.farmName,
            address: sellerProfiles.address,
           
            status: sellerProfiles.status,
           
            userFullName: users.fullName,
            userEmail: users.email,
            userPhone: users.phone,
            cityName: cities.name,
            provinceName: provinces.name,
            
            createdAt: sellerProfiles.createdAt,
        })
        .from(sellerProfiles)
        .innerJoin(users, eq(sellerProfiles.userId, users.id))
        .innerJoin(cities, eq(sellerProfiles.cityId, cities.id))
        .innerJoin(provinces, eq(sellerProfiles.provinceId, provinces.id))
        .where(eq(sellerProfiles.userId, userId))
        .limit(1);
    return result[0] || null;
}


export async function countActiveProductsByUserId(userId: number) {
    const result = await db
        .select({ total: count() })
        .from(products)
        .where(
            sql`${products.sellerId} = ${userId}
                AND ${products.deletedAt} IS NULL
                AND ${products.stockQuantity} > 0`
        );
    return Number(result[0]?.total || 0);
}