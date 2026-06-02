import { db } from '../db';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { carts, cartItems, products, sellerProfiles, units, checkouts, orders, orderItems, payments, shipments } from '../db/schema';

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
