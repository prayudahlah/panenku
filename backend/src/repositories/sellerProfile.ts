import { eq, count, isNull, sql, and } from 'drizzle-orm';
import { db } from '../db';
import { sellerProfiles, users, cities, provinces, products } from '../db/schema';

export async function findByUserId(userId: number) {
    const result = await db.select().from(sellerProfiles).where(eq(sellerProfiles.userId, userId)).limit(1);
    return result[0] || null;
}

export async function create(data: typeof sellerProfiles.$inferInsert) {
    const result = await db.insert(sellerProfiles).values(data).returning();
    return result[0];
}


/**
 * FSD-04.2: Mengambil profil penjual untuk publik.
 * Menggunakan LEFT JOIN untuk city dan province agar tidak error jika data referensi tidak ada.
 */
export async function getPublicProfileByUserId(userId: number) {
    try {
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
            .leftJoin(cities, eq(sellerProfiles.cityId, cities.id))
            .leftJoin(provinces, eq(sellerProfiles.provinceId, provinces.id))
            .where(eq(sellerProfiles.userId, userId))
            .limit(1);
        return result[0] || null;
    } catch (error) {
        console.error('[getPublicProfileByUserId] DB error:', error);
        throw error;
    }
}

/**
 * BR-22: Menghitung jumlah produk aktif penjual (deleted_at IS NULL AND stok > 0)
 */
export async function countActiveProductsByUserId(userId: number) {
    try {
        const result = await db
            .select({ total: count() })
            .from(products)
            .where(
                and(
                    eq(products.sellerId, userId),
                    isNull(products.deletedAt),
                    sql`${products.stockQuantity} > 0`
                )
            );
        return Number(result[0]?.total || 0);
    } catch (error) {
        console.error('[countActiveProductsByUserId] DB error:', error);
        throw error;
    }
}
