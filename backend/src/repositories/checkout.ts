import { db } from '../db';
import { eq, and, isNull, inArray, sql } from 'drizzle-orm';
import { carts, cartItems, products, sellerProfiles, units, checkouts, orders, orderItems, payments, shipments, checkoutStatuses } from '../db/schema';

type DBLike = typeof db;

export async function findCartWithDetails(userId: number) {
    const result = await db
        .select({
            cartId: carts.id,
            cartItemId: cartItems.id,
            productId: cartItems.productId,
            quantity: cartItems.quantity,
            unitId: cartItems.unitId,
            unitName: units.name,
            productName: products.name,
            pricePerUnit: products.pricePerUnit,
            stockQuantity: products.stockQuantity,
            productDeletedAt: products.deletedAt,
            sellerId: products.sellerId,
            sellerStatus: sellerProfiles.status,
        })
        .from(carts)
        .innerJoin(cartItems, eq(carts.id, cartItems.cartId))
        .innerJoin(products, eq(cartItems.productId, products.id))
        .leftJoin(units, eq(cartItems.unitId, units.id))
        .leftJoin(sellerProfiles, eq(products.sellerId, sellerProfiles.userId))
        .where(and(eq(carts.userId, userId), isNull(products.deletedAt)));
    return result;
}

export async function createCheckout(tx: DBLike, data: {
    buyerId: number;
    totalAmount: string;
    shippingAddress: string;
    checkoutStatusId: number;
}) {
    const result = await tx
        .insert(checkouts)
        .values(data)
        .returning({ id: checkouts.id });
    return result[0];
}

export async function updateCheckoutPaymentId(tx: DBLike, checkoutId: number, paymentId: number) {
    await tx.update(checkouts).set({ paymentId }).where(eq(checkouts.id, checkoutId));
}

export async function createPayment(tx: DBLike, data: {
    paymentMethodId: number;
    amount: string;
    paymentStatusId: number;
}) {
    const result = await tx
        .insert(payments)
        .values(data)
        .returning({ id: payments.id });
    return result[0];
}

export async function createShipment(tx: DBLike, data: {
    courierName: string | null;
    provinceId: number;
    cityId: number;
    shippingAddress: string;
    shipmentStatusId: number;
}) {
    const result = await tx
        .insert(shipments)
        .values(data)
        .returning({ id: shipments.id });
    return result[0];
}

export async function createOrder(tx: DBLike, data: {
    checkoutId: number;
    shipmentId: number;
    orderNumber: string;
    sellerId: number;
    subtotal: string;
}) {
    const result = await tx
        .insert(orders)
        .values(data)
        .returning({ id: orders.id });
    return result[0];
}

export async function createOrderItem(tx: DBLike, data: {
    orderId: number;
    productId: number;
    orderItemStatusId: number;
    quantity: string;
    unitId: number;
    pricePerUnit: string;
    discount: string;
    subtotal: string;
}) {
    const result = await tx
        .insert(orderItems)
        .values(data)
        .returning({ id: orderItems.id });
    return result[0];
}

export async function clearCartItems(tx: DBLike, userId: number) {
    const userCart = await tx
        .select({ id: carts.id })
        .from(carts)
        .where(eq(carts.userId, userId))
        .limit(1);

    if (userCart[0]) {
        await tx.delete(cartItems).where(eq(cartItems.cartId, userCart[0].id));
    }
}

export async function findCheckoutById(id: number, tx?: DBLike) {
    const conn = tx || db;
    const result = await conn
        .select({
            id: checkouts.id,
            buyerId: checkouts.buyerId,
            totalAmount: checkouts.totalAmount,
            checkoutStatusId: checkouts.checkoutStatusId,
            paymentId: checkouts.paymentId,
            shippingAddress: checkouts.shippingAddress,
        })
        .from(checkouts)
        .where(eq(checkouts.id, id))
        .limit(1);
    return result[0] || null;
}

export async function updateCheckoutStatus(tx: DBLike, checkoutId: number, checkoutStatusId: number) {
    await tx.update(checkouts).set({ checkoutStatusId }).where(eq(checkouts.id, checkoutId));
}

export async function updatePaymentStatus(tx: DBLike, paymentId: number, paymentStatusId: number, paidAt?: Date) {
    const data: any = { paymentStatusId };
    if (paidAt) data.paidAt = paidAt;
    await tx.update(payments).set(data).where(eq(payments.id, paymentId));
}

export async function confirmOrderItemsByCheckout(tx: DBLike, checkoutId: number, statusId: number) {
        await tx
        .update(orderItems)
        .set({ orderItemStatusId: statusId })
        .where(
            inArray(
                orderItems.orderId,
                db.select({ id: orders.id }).from(orders).where(eq(orders.checkoutId, checkoutId))
            )
        );
}

export async function findSellerProfileByUserId(userId: number) {
    const result = await db
        .select({ id: sellerProfiles.id, userId: sellerProfiles.userId, status: sellerProfiles.status })
        .from(sellerProfiles)
        .where(eq(sellerProfiles.userId, userId))
        .limit(1);
    return result[0] || null;
}

export async function findOrderWithShipment(orderId: number) {
    const result = await db
        .select({
            orderId: orders.id,
            checkoutId: orders.checkoutId,
            sellerId: orders.sellerId,
            shipmentId: orders.shipmentId,
            orderNumber: orders.orderNumber,
            shipmentStatusId: shipments.shipmentStatusId,
            courierName: shipments.courierName,
            provinceId: shipments.provinceId,
            cityId: shipments.cityId,
            shippingAddress: shipments.shippingAddress,
            checkoutStatusId: checkouts.checkoutStatusId,
            buyerId: checkouts.buyerId,
        })
        .from(orders)
        .innerJoin(shipments, eq(orders.shipmentId, shipments.id))
        .innerJoin(checkouts, eq(orders.checkoutId, checkouts.id))
        .where(eq(orders.id, orderId))
        .limit(1);
    return result[0] || null;
}

export async function findSellersByCheckoutId(checkoutId: number) {
    return await db
        .select({ sellerId: orders.sellerId })
        .from(orders)
        .where(eq(orders.checkoutId, checkoutId));
}

export async function createShipmentPickedUp(tx: DBLike, data: {
    courierName: string | null;
    provinceId: number;
    cityId: number;
    shippingAddress: string;
    shipmentStatusId: number;
    shippedAt: Date;
}) {
    const result = await tx
        .insert(shipments)
        .values(data)
        .returning({ id: shipments.id });
    return result[0];
}

export async function updateOrderShipmentId(tx: DBLike, orderId: number, shipmentId: number) {
    await tx.update(orders).set({ shipmentId }).where(eq(orders.id, orderId));
}

export async function updateOrderItemsByOrderId(tx: DBLike, orderId: number, statusId: number) {
    await tx.update(orderItems).set({ orderItemStatusId: statusId }).where(eq(orderItems.orderId, orderId));
}

export async function deductProductStock(tx: DBLike, productId: number, quantity: number) {
    await tx
        .update(products)
        .set({ stockQuantity: sql`${products.stockQuantity} - ${quantity}` })
        .where(eq(products.id, productId));
}

export async function findOrderItemsByCheckout(tx: DBLike, checkoutId: number) {
    return await tx
        .select({ productId: orderItems.productId, quantity: orderItems.quantity })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(eq(orders.checkoutId, checkoutId));
}

export async function findOrderItemsByOrderId(tx: DBLike, orderId: number) {
    return await tx
        .select({
            productId: orderItems.productId,
            quantity: orderItems.quantity,
            pricePerUnit: orderItems.pricePerUnit,
            subtotal: orderItems.subtotal,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));
}

export async function updateCheckoutTotal(tx: DBLike, checkoutId: number, totalAmount: string) {
    await tx.update(checkouts).set({ totalAmount }).where(eq(checkouts.id, checkoutId));
}

export async function findPaymentByCheckoutId(checkoutId: number) {
    const result = await db
        .select({ paymentId: checkouts.paymentId })
        .from(checkouts)
        .where(eq(checkouts.id, checkoutId))
        .limit(1);
    return result[0] || null;
}

export async function findCheckoutStatus(checkoutStatusId: number) {
    const result = await db
        .select({ code: checkoutStatuses.code })
        .from(checkoutStatuses)
        .where(eq(checkoutStatuses.id, checkoutStatusId))
        .limit(1);
    return result[0] || null;
}

export async function findProductForCheckout(productId: number) {
    const result = await db
        .select({
            productId: products.id,
            productName: products.name,
            sellerId: products.sellerId,
            pricePerUnit: products.pricePerUnit,
            stockQuantity: products.stockQuantity,
            productDeletedAt: products.deletedAt,
            sellerStatus: sellerProfiles.status,
            unitId: products.unitId,
        })
        .from(products)
        .leftJoin(sellerProfiles, eq(products.sellerId, sellerProfiles.userId))
        .where(eq(products.id, productId))
        .limit(1);
    return result[0] || null;
}
