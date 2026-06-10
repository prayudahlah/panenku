import { db } from '../db';
import { eq, and, isNull, desc } from 'drizzle-orm';
import {
    contracts,
    contractProducts,
    contractSchedules,
    shipments,
    shipmentStatuses,
    products,
    users,
    sellerProfiles,
    units,
} from '../db/schema';

type DBLike = typeof db;

const contractWithJoins = {
    id: contracts.id,
    buyerId: contracts.buyerId,
    sellerId: contracts.sellerId,
    shipmentId: contracts.shipmentId,
    totalAmount: contracts.totalAmount,
    deliveryLocation: contracts.deliveryLocation,
    startDate: contracts.startDate,
    endDate: contracts.endDate,
    frequency: contracts.frequency,
    totalShipping: contracts.totalShipping,
    description: contracts.description,
    contractStatusId: contracts.contractStatusId,
    createdAt: contracts.createdAt,
};

export async function findContractById(id: number) {
    const row = await db
        .select({
            ...contractWithJoins,
            buyerName: users.fullName,
            sellerName: sellerProfiles.farmName,
            shipmentProvinceId: shipments.provinceId,
            shipmentCityId: shipments.cityId,
            shipmentAddress: shipments.shippingAddress,
        })
        .from(contracts)
        .leftJoin(users, eq(contracts.buyerId, users.id))
        .leftJoin(sellerProfiles, eq(contracts.sellerId, sellerProfiles.userId))
        .leftJoin(shipments, eq(contracts.shipmentId, shipments.id))
        .where(eq(contracts.id, id))
        .limit(1);

    if (!row[0]) return null;

    const prods = await db
        .select({
            id: contractProducts.id,
            productId: contractProducts.productId,
            productName: products.name,
            quantity: contractProducts.quantity,
            unitId: contractProducts.unitId,
            unitName: units.name,
            subtotal: contractProducts.subtotal,
            totalQuantity: contractProducts.totalQuantity,
            description: contractProducts.description || products.description,
        })
        .from(contractProducts)
        .leftJoin(products, eq(contractProducts.productId, products.id))
        .leftJoin(units, eq(contractProducts.unitId, units.id))
        .where(eq(contractProducts.contractId, id));

    const scheds = await db
        .select()
        .from(contractSchedules)
        .where(eq(contractSchedules.contractId, id))
        .orderBy(contractSchedules.deliveryDate);

    return { ...row[0], products: prods, schedules: scheds };
}

export async function createContract(tx: DBLike, data: {
    buyerId: number;
    sellerId: number;
    shipmentId: number;
    totalAmount: string;
    deliveryLocation: string;
    startDate: string;
    endDate: string;
    frequency: string;
    totalShipping: number;
    description: string | null;
    contractStatusId: number;
}) {
    const result = await tx.insert(contracts).values(data).returning({ id: contracts.id });
    return result[0];
}

export async function createContractProducts(tx: DBLike, data: Array<{
    contractId: number;
    productId: number;
    quantity: string;
    unitId: number;
    subtotal: string;
    totalQuantity?: string;
    description?: string | null;
}>) {
    if (data.length === 0) return;
    await tx.insert(contractProducts).values(data as any);
}

export async function createContractSchedules(tx: DBLike, data: Array<{
    contractId: number;
    deliveryDay?: string | null;
    deliveryDate?: string | null;
    deliveryTime?: string | null;
}>) {
    if (data.length === 0) return;
    await tx.insert(contractSchedules).values(data as any);
}

export async function createShipment(tx: DBLike, data: {
    courierName: string | null;
    provinceId: number;
    cityId: number;
    shippingAddress: string;
    shipmentStatusId: number;
}) {
    const result = await tx.insert(shipments).values(data).returning({ id: shipments.id });
    return result[0];
}

export async function updateContractStatus(tx: DBLike, id: number, contractStatusId: number) {
    await tx.update(contracts).set({ contractStatusId }).where(eq(contracts.id, id));
}

export async function findContractsByBuyer(buyerId: number) {
    return db
        .select({
            ...contractWithJoins,
            counterpartyName: sellerProfiles.farmName,
        })
        .from(contracts)
        .leftJoin(sellerProfiles, eq(contracts.sellerId, sellerProfiles.userId))
        .where(eq(contracts.buyerId, buyerId))
        .orderBy(desc(contracts.createdAt));
}

export async function findContractsBySeller(sellerId: number) {
    return db
        .select({
            ...contractWithJoins,
            counterpartyName: users.fullName,
        })
        .from(contracts)
        .leftJoin(users, eq(contracts.buyerId, users.id))
        .where(eq(contracts.sellerId, sellerId))
        .orderBy(desc(contracts.createdAt));
}

export async function findAllContracts() {
    return db
        .select({
            ...contractWithJoins,
            buyerName: users.fullName,
            sellerName: sellerProfiles.farmName,
        })
        .from(contracts)
        .leftJoin(users, eq(contracts.buyerId, users.id))
        .leftJoin(sellerProfiles, eq(contracts.sellerId, sellerProfiles.userId))
        .orderBy(desc(contracts.createdAt));
}

export async function findProductById(productId: number) {
    const result = await db
        .select({
            id: products.id,
            sellerId: products.sellerId,
            name: products.name,
            pricePerUnit: products.pricePerUnit,
            stockQuantity: products.stockQuantity,
            minOrderQty: products.minOrderQty,
        })
        .from(products)
        .where(and(eq(products.id, productId), isNull(products.deletedAt)))
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
