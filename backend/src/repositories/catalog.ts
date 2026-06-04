import { db } from '../db';
import {
    products,
    productCategories,
    units,
    sellerProfiles,
    orderItems,
    orderItemStatuses,
    auditLogs,
} from '../db/schema';
import { and, eq, count, sql, desc, asc, isNull, ilike, inArray, ne, or, type SQL } from 'drizzle-orm';

type SortOrder = 'asc' | 'desc';
type ProductPayload = {
    sellerId: number;
    name: string;
    categoryId: number;
    description: string;
    unitId: number;
    minOrderQty: number;
    pricePerUnit: number;
    stockQuantity: number;
    isNegotiable?: boolean;
};

const BLOCKING_ORDER_STATUS_ERROR: Record<string, string> = {
    pending: 'ERR-DEL-03',
    processed: 'ERR-DEL-04',
    shipped: 'ERR-DEL-05',
};

const BLOCKING_ORDER_STATUS_MESSAGE: Record<string, string> = {
    pending: 'Produk tidak dapat dihapus karena masih ada pesanan yang menunggu pembayaran',
    processed: 'Produk tidak dapat dihapus karena masih ada pesanan yang sedang diproses',
    shipped: 'Produk tidak dapat dihapus karena masih ada pesanan yang sedang dikirim',
};

export async function findCategoryById(categoryId: number) {
    const result = await db
        .select({ id: productCategories.id })
        .from(productCategories)
        .where(eq(productCategories.id, categoryId))
        .limit(1);
    return result[0] || null;
}

export async function findUnitById(unitId: number) {
    const result = await db
        .select({ id: units.id, name: units.name })
        .from(units)
        .where(eq(units.id, unitId))
        .limit(1);
    return result[0] || null;
}

function getStockStatus(stockValue: unknown) {
    const stock = Number(stockValue ?? 0);
    if (stock <= 0) return 'habis';
    if (stock <= 20) return 'menipis';
    return 'tersedia';
}

function getSellerCatalogOrderBy(sortBy = 'createdAt', sortOrder: SortOrder = 'desc') {
    const direction = sortOrder === 'asc' ? asc : desc;

    if (sortBy === 'stock') return direction(products.stockQuantity);
    if (sortBy === 'price') return direction(products.pricePerUnit);
    if (sortBy === 'name') return direction(products.name);
    return desc(products.createdAt);
}

export async function list({
    search,
    categoryId,
    minPrice,
    maxPrice,
    isNegotiable,
    sortBy = 'createdAt',
    sortOrder,
    page = 1,
    limit = 12,
}: {
    search?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    isNegotiable?: boolean;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
}) {
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.max(Number(limit) || 12, 1);
    const conditions: (SQL<unknown> | undefined)[] = [
        isNull(products.deletedAt),
        sql`${products.stockQuantity} > 0`,
    ];

    if (search) {
        conditions.push(
            or(
                ilike(products.name, `%${search}%`),
                ilike(sql`COALESCE(${products.description}, '')`, `%${search}%`)
            )!
        );
    }
    if (categoryId) conditions.push(eq(products.categoryId, categoryId));
    if (minPrice !== undefined && minPrice > 0) conditions.push(sql`${products.pricePerUnit} >= ${minPrice}`);
    if (maxPrice !== undefined && maxPrice > 0) conditions.push(sql`${products.pricePerUnit} <= ${maxPrice}`);
    if (isNegotiable !== undefined) conditions.push(eq(products.isNegotiable, isNegotiable));

    const where = and(...conditions);

    const isAsc = sortOrder === 'asc';
    const orderBy = sortBy === 'price'
        ? (isAsc ? asc(products.pricePerUnit) : desc(products.pricePerUnit))
        : sortBy === 'name'
            ? (isAsc ? asc(products.name) : desc(products.name))
            : desc(products.createdAt);

    const offset = (safePage - 1) * safeLimit;

    const [total] = await db
        .select({ count: count() })
        .from(products)
        .innerJoin(productCategories, eq(products.categoryId, productCategories.id))
        .innerJoin(units, eq(products.unitId, units.id))
        .innerJoin(sellerProfiles, eq(products.sellerId, sellerProfiles.userId))
        .where(where);

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
        .limit(safeLimit)
        .offset(offset);

    return { rows, total: Number(total.count), page: safePage, limit: safeLimit };
}

export async function listBySeller({
    sellerId,
    search,
    categoryId,
    minPrice,
    maxPrice,
    isNegotiable,
    sortBy = 'createdAt',
    sortOrder,
    page = 1,
    limit = 12,
}: {
    sellerId: number;
    search?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    isNegotiable?: boolean;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
}) {
    const conditions: (SQL<unknown> | undefined)[] = [
        isNull(products.deletedAt),
        sql`${products.stockQuantity} > 0`,
        eq(products.sellerId, sellerId),
    ];

    if (search) {
        conditions.push(
            or(
                ilike(products.name, `%${search}%`),
                ilike(sql`COALESCE(${products.description}, '')`, `%${search}%`)
            )!
        );
    }
    if (categoryId) conditions.push(eq(products.categoryId, categoryId));
    if (minPrice !== undefined && minPrice > 0) conditions.push(sql`${products.pricePerUnit} >= ${minPrice}`);
    if (maxPrice !== undefined && maxPrice > 0) conditions.push(sql`${products.pricePerUnit} <= ${maxPrice}`);
    if (isNegotiable !== undefined) conditions.push(eq(products.isNegotiable, isNegotiable));

    const where = and(...conditions);

    const isAsc = sortOrder === 'asc';
    const orderBy = sortBy === 'price'
        ? (isAsc ? asc(products.pricePerUnit) : desc(products.pricePerUnit))
        : sortBy === 'name'
            ? (isAsc ? asc(products.name) : desc(products.name))
            : desc(products.createdAt);

    const offset = (page - 1) * limit;

    const [total] = await db
        .select({ count: count() })
        .from(products)
        .innerJoin(productCategories, eq(products.categoryId, productCategories.id))
        .innerJoin(units, eq(products.unitId, units.id))
        .innerJoin(sellerProfiles, eq(products.sellerId, sellerProfiles.userId))
        .where(where);

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

export async function listSellerCatalog({
    sellerId,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
}: {
    sellerId: number;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
}) {
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.max(Number(limit) || 10, 1);
    const safeSortOrder: SortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
    const offset = (safePage - 1) * safeLimit;

    const where = and(eq(products.sellerId, sellerId), isNull(products.deletedAt));

    const [totalResult] = await db
        .select({ count: count() })
        .from(products)
        .where(where);

    const summaryRows = await db
        .select({ stock: products.stockQuantity })
        .from(products)
        .where(where);

    const summary = summaryRows.reduce(
        (acc, item) => {
            const status = getStockStatus(item.stock);
            acc[status] += 1;
            return acc;
        },
        { tersedia: 0, menipis: 0, habis: 0 } as Record<'tersedia' | 'menipis' | 'habis', number>
    );

    const rows = await db
        .select({
            id: products.id,
            productName: products.name,
            categoryId: products.categoryId,
            category: productCategories.name,
            pricePerUnit: products.pricePerUnit,
            stockQuantity: products.stockQuantity,
            unitId: products.unitId,
            unit: units.name,
            minOrderQty: products.minOrderQty,
            isNegotiable: products.isNegotiable,
            createdAt: products.createdAt,
        })
        .from(products)
        .innerJoin(productCategories, eq(products.categoryId, productCategories.id))
        .innerJoin(units, eq(products.unitId, units.id))
        .where(where)
        .orderBy(getSellerCatalogOrderBy(sortBy, safeSortOrder))
        .limit(safeLimit)
        .offset(offset);

    const data = rows.map((product) => ({
        ...product,
        status: getStockStatus(product.stockQuantity),
    }));

    return {
        data,
        summary,
        meta: {
            total: Number(totalResult.count),
            page: safePage,
            limit: safeLimit,
        },
    };
}

export async function findSellerProductById(sellerId: number, productId: number) {
    const result = await db
        .select()
        .from(products)
        .where(and(eq(products.id, productId), eq(products.sellerId, sellerId), isNull(products.deletedAt)))
        .limit(1);

    return result[0] || null;
}

export async function isProductNameUsedBySeller({
    sellerId,
    name,
    exceptProductId,
}: {
    sellerId: number;
    name: string;
    exceptProductId?: number;
}) {
    const conditions = [
        eq(products.sellerId, sellerId),
        isNull(products.deletedAt),
        sql`lower(${products.name}) = lower(${name})`,
    ];

    if (exceptProductId) conditions.push(ne(products.id, exceptProductId));

    const [result] = await db
        .select({ count: count() })
        .from(products)
        .where(and(...conditions));

    return Number(result.count) > 0;
}

export async function createSellerProduct(payload: ProductPayload) {
    const result = await db
        .insert(products)
        .values({
            sellerId: payload.sellerId,
            categoryId: payload.categoryId,
            name: payload.name.trim(),
            description: payload.description.trim(),
            unitId: payload.unitId,
            minOrderQty: String(payload.minOrderQty),
            pricePerUnit: String(payload.pricePerUnit),
            stockQuantity: String(payload.stockQuantity),
            isNegotiable: payload.isNegotiable ?? false,
        })
        .returning();

    return result[0];
}

export async function updateSellerProduct(productId: number, payload: ProductPayload) {
    const result = await db
        .update(products)
        .set({
            categoryId: payload.categoryId,
            name: payload.name.trim(),
            description: payload.description.trim(),
            unitId: payload.unitId,
            minOrderQty: String(payload.minOrderQty),
            pricePerUnit: String(payload.pricePerUnit),
            stockQuantity: String(payload.stockQuantity),
            isNegotiable: payload.isNegotiable ?? false,
        })
        .where(and(eq(products.id, productId), eq(products.sellerId, payload.sellerId), isNull(products.deletedAt)))
        .returning();

    return result[0] || null;
}

export async function findBlockingOrderStatus(productId: number) {
    const blockingStatuses = Object.keys(BLOCKING_ORDER_STATUS_ERROR);

    const result = await db
        .select({ code: orderItemStatuses.code })
        .from(orderItems)
        .innerJoin(orderItemStatuses, eq(orderItems.orderItemStatusId, orderItemStatuses.id))
        .where(and(eq(orderItems.productId, productId), inArray(orderItemStatuses.code, blockingStatuses)))
        .limit(1);

    const code = result[0]?.code;
    if (!code) return null;

    return {
        code,
        errorCode: BLOCKING_ORDER_STATUS_ERROR[code] || 'ERR-DEL-06',
        message: BLOCKING_ORDER_STATUS_MESSAGE[code] || 'Produk tidak dapat dihapus',
    };
}

export async function findActiveProductById(productId: number) {
    const result = await db
        .select()
        .from(products)
        .where(and(eq(products.id, productId), isNull(products.deletedAt)))
        .limit(1);

    return result[0] || null;
}

export async function softDeleteSellerProduct({
    productId,
    sellerId,
    actorId,
    ipAddress,
}: {
    productId: number;
    sellerId: number;
    actorId: number;
    ipAddress?: string;
}) {
    const oldData = await findSellerProductById(sellerId, productId);
    if (!oldData) return null;

    const result = await db
        .update(products)
        .set({ deletedAt: new Date() })
        .where(and(eq(products.id, productId), eq(products.sellerId, sellerId), isNull(products.deletedAt)))
        .returning();

    const deletedProduct = result[0] || null;

    if (deletedProduct) {
        await db.insert(auditLogs).values({
            userId: actorId,
            action: 'PRODUCT_SOFT_DELETE',
            entityType: 'product',
            entityId: productId,
            oldData,
            newData: deletedProduct,
            ipAddress,
        });
    }

    return deletedProduct;
}
