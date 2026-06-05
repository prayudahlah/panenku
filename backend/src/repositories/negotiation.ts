import { db } from '../db';
import { eq, and, isNull, sql, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { products, negotiations, negotiationChats, units, users } from '../db/schema';

type DBLike = typeof db;

export async function findProductById(productId: number) {
    const result = await db
        .select({
            id: products.id,
            sellerId: products.sellerId,
            isNegotiable: products.isNegotiable,
            minOrderQty: products.minOrderQty,
            pricePerUnit: products.pricePerUnit,
            stockQuantity: products.stockQuantity,
        })
        .from(products)
        .where(and(eq(products.id, productId), isNull(products.deletedAt)))
        .limit(1);
    return result[0] || null;
}

export async function findPendingByProductAndBuyer(productId: number, buyerId: number, tx?: DBLike) {
    const conn = tx || db;
    const result = await conn
        .select({ id: negotiations.id })
        .from(negotiations)
        .where(
            and(
                eq(negotiations.productId, productId),
                eq(negotiations.buyerId, buyerId),
                eq(negotiations.status, 'ongoing')
            )
        )
        .limit(1);
    return result[0] || null;
}

export async function createNegotiation(tx: DBLike, data: {
    sellerId: number;
    buyerId: number;
    productId: number;
    agreedPriceOffer: string;
    agreedUnitId: number;
    agreedQuantityOffer: string;
    validUntil: Date;
}) {
    const result = await tx
        .insert(negotiations)
        .values(data)
        .returning({ id: negotiations.id });
    return result[0];
}

export async function findNegotiationById(id: number) {
    const result = await db
        .select({
            id: negotiations.id,
            sellerId: negotiations.sellerId,
            buyerId: negotiations.buyerId,
            productId: negotiations.productId,
            agreedPriceOffer: negotiations.agreedPriceOffer,
            agreedUnitId: negotiations.agreedUnitId,
            agreedQuantityOffer: negotiations.agreedQuantityOffer,
            validUntil: negotiations.validUntil,
            status: negotiations.status,
            pricePerUnit: products.pricePerUnit,
            stockQuantity: products.stockQuantity,
        })
        .from(negotiations)
        .leftJoin(products, eq(negotiations.productId, products.id))
        .where(eq(negotiations.id, id))
        .limit(1);
    return result[0] || null;
}

export async function findLatestChat(negotiationId: number) {
    const result = await db
        .select({
            turnOrder: negotiationChats.turnOrder,
            turnOwner: negotiationChats.turnOwner,
        })
        .from(negotiationChats)
        .where(eq(negotiationChats.negotiationId, negotiationId))
        .orderBy(sql`${negotiationChats.turnOrder} desc`)
        .limit(1);
    return result[0] || null;
}

export async function updateNegotiation(tx: DBLike, id: number, data: {
    status?: string;
    agreedPriceOffer?: string;
    agreedUnitId?: number;
    agreedQuantityOffer?: string;
}) {
    await tx.update(negotiations).set({ ...data, updatedAt: new Date() }).where(eq(negotiations.id, id));
}

export async function createChat(tx: DBLike, data: {
    negotiationId: number;
    turnOrder: number;
    turnOwner: string;
    offerPrice: string;
    unitId: number;
    quantityOffer: string;
    description?: string;
}) {
    await tx.insert(negotiationChats).values(data);
}

export async function findNegotiationsByUser(userId: number, role: 'buyer' | 'seller') {
    const filter = role === 'buyer'
        ? eq(negotiations.buyerId, userId)
        : eq(negotiations.sellerId, userId);

    const counterpartyJoin = role === 'buyer'
        ? eq(negotiations.sellerId, users.id)
        : eq(negotiations.buyerId, users.id);

    const result = await db
        .select({
            id: negotiations.id,
            status: negotiations.status,
            agreedPriceOffer: negotiations.agreedPriceOffer,
            agreedQuantityOffer: negotiations.agreedQuantityOffer,
            validUntil: negotiations.validUntil,
            createdAt: negotiations.createdAt,
            productId: products.id,
            productName: products.name,
            unitName: units.name,
            counterpartyName: users.fullName,
        })
        .from(negotiations)
        .leftJoin(products, eq(negotiations.productId, products.id))
        .leftJoin(units, eq(negotiations.agreedUnitId, units.id))
        .leftJoin(users, counterpartyJoin)
        .where(and(filter, isNull(products.deletedAt)))
        .orderBy(desc(negotiations.createdAt));
    return result;
}

export async function findNegotiationDetail(id: number) {
    const sellerUsers = alias(users, 'seller');
    const buyerUsers = alias(users, 'buyer');

    const nego = await db
        .select({
            id: negotiations.id,
            sellerId: negotiations.sellerId,
            buyerId: negotiations.buyerId,
            productId: products.id,
            productName: products.name,
            agreedPriceOffer: negotiations.agreedPriceOffer,
            agreedUnitId: negotiations.agreedUnitId,
            unitName: units.name,
            agreedQuantityOffer: negotiations.agreedQuantityOffer,
            validUntil: negotiations.validUntil,
            status: negotiations.status,
            createdAt: negotiations.createdAt,
            sellerName: sellerUsers.fullName,
            buyerName: buyerUsers.fullName,
        })
        .from(negotiations)
        .leftJoin(products, eq(negotiations.productId, products.id))
        .leftJoin(units, eq(negotiations.agreedUnitId, units.id))
        .leftJoin(sellerUsers, eq(negotiations.sellerId, sellerUsers.id))
        .leftJoin(buyerUsers, eq(negotiations.buyerId, buyerUsers.id))
        .where(eq(negotiations.id, id))
        .limit(1);

    if (!nego[0]) return null;

    const chats = await db
        .select({
            id: negotiationChats.id,
            turnOrder: negotiationChats.turnOrder,
            turnOwner: negotiationChats.turnOwner,
            offerPrice: negotiationChats.offerPrice,
            unitId: negotiationChats.unitId,
            unitName: units.name,
            quantityOffer: negotiationChats.quantityOffer,
            description: negotiationChats.description,
            createdAt: negotiationChats.createdAt,
        })
        .from(negotiationChats)
        .leftJoin(units, eq(negotiationChats.unitId, units.id))
        .where(eq(negotiationChats.negotiationId, id))
        .orderBy(negotiationChats.turnOrder);

    return { ...nego[0], chats };
}

export async function findUnitById(unitId: number) {
    const result = await db
        .select({ id: units.id, name: units.name })
        .from(units)
        .where(eq(units.id, unitId))
        .limit(1);
    return result[0] || null;
}

export async function findAllNegotiations() {
    const result = await db
        .select({
            id: negotiations.id,
            status: negotiations.status,
            agreedPriceOffer: negotiations.agreedPriceOffer,
            agreedQuantityOffer: negotiations.agreedQuantityOffer,
            validUntil: negotiations.validUntil,
            createdAt: negotiations.createdAt,
            productId: products.id,
            productName: products.name,
            unitName: units.name,
            sellerName: users.fullName,
        })
        .from(negotiations)
        .leftJoin(products, eq(negotiations.productId, products.id))
        .leftJoin(units, eq(negotiations.agreedUnitId, units.id))
        .leftJoin(users, eq(negotiations.sellerId, users.id))
        .where(isNull(products.deletedAt))
        .orderBy(desc(negotiations.createdAt));
    return result;
}
