import { db } from '../db';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { carts, cartItems, products, sellerProfiles, units } from '../db/schema';

type DBLike = typeof db;

export async function findCartByUserId(userId: number) {
    const result = await db
        .select({ id: carts.id })
        .from(carts)
        .where(eq(carts.userId, userId))
        .limit(1);
    return result[0] || null;
}

export async function createCart(userId: number, tx?: DBLike) {
    const conn = tx || db;
    const result = await conn
        .insert(carts)
        .values({ userId })
        .returning({ id: carts.id });
    return result[0];
}

export async function findCartItem(cartId: number, productId: number) {
    const result = await db
        .select({
            id: cartItems.id,
            quantity: cartItems.quantity,
        })
        .from(cartItems)
        .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)))
        .limit(1);
    return result[0] || null;
}

export async function createCartItem(
    cartId: number,
    data: { productId: number; quantity: string; unitId: number },
    tx?: DBLike
) {
    const conn = tx || db;
    const result = await conn
        .insert(cartItems)
        .values({ cartId, productId: data.productId, quantity: data.quantity, unitId: data.unitId })
        .returning({ id: cartItems.id });
    return result[0];
}

export async function updateCartItemQuantity(id: number, quantity: string, tx?: DBLike) {
    const conn = tx || db;
    await conn.update(cartItems).set({ quantity }).where(eq(cartItems.id, id));
}

export async function findProductWithSeller(productId: number) {
    const result = await db
        .select({
            id: products.id,
            name: products.name,
            sellerId: products.sellerId,
            stockQuantity: products.stockQuantity,
            pricePerUnit: products.pricePerUnit,
            isNegotiable: products.isNegotiable,
            deletedAt: products.deletedAt,
            sellerStatus: sellerProfiles.status,
        })
        .from(products)
        .leftJoin(sellerProfiles, eq(products.sellerId, sellerProfiles.userId))
        .where(eq(products.id, productId))
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
