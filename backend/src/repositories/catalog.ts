import { db } from '../db';
import { products, productCategories, units, sellerProfiles } from '../db/schema';
import { and, eq, count, sql, desc, asc, isNull, ilike } from 'drizzle-orm';

export async function list({
    search,
    categoryId,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 12,
}: {
    search?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
}) {
    const conditions = [isNull(products.deletedAt)];

    if (search) conditions.push(ilike(products.name, `%${search}%`));
    if (categoryId) conditions.push(eq(products.categoryId, categoryId));
    if (minPrice) conditions.push(sql`${products.pricePerUnit} >= ${minPrice}`);
    if (maxPrice) conditions.push(sql`${products.pricePerUnit} <= ${maxPrice}`);

    const where = and(...conditions);

    const orderBy = sortBy === 'price'
        ? (sortOrder === 'asc' ? asc(products.pricePerUnit) : desc(products.pricePerUnit))
        : sortBy === 'name'
            ? (sortOrder === 'asc' ? asc(products.name) : desc(products.name))
            : desc(products.createdAt);

    const offset = (page - 1) * limit;

    const [total] = await db.select({ count: count() }).from(products).where(where);

    const rows = await db
        .select({
            id: products.id,
            name: products.name,
            description: products.description,
            pricePerUnit: products.pricePerUnit,
            unitId: products.unitId,
            unitName: units.name,
            minOrderQty: products.minOrderQty,
            stockQuantity: products.stockQuantity,
            isNegotiable: products.isNegotiable,
            categoryId: products.categoryId,
            categoryName: productCategories.name,
            sellerId: products.sellerId,
            farmName: sellerProfiles.farmName,
            createdAt: products.createdAt,
        })
        .from(products)
        .innerJoin(productCategories, eq(products.categoryId, productCategories.id))
        .innerJoin(units, eq(products.unitId, units.id))
        .innerJoin(sellerProfiles, eq(products.sellerId, sellerProfiles.userId))
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

    return { rows, total: Number(total.count), page, limit };
}
