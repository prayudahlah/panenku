import { db } from '../db';
import { checkoutRepo } from '../repositories';
import type { CheckoutInput, CheckoutResponse, CheckoutItemDetail } from '../dtos/checkout';

type ServiceResult<T> = { data?: T; error?: string; status?: number; errorCode?: string };

const CHECKOUT_STATUS_AWAITING_PAYMENT = 4;
const PAYMENT_STATUS_UNPAID = 1;
const ORDER_ITEM_STATUS_PENDING = 1;
const SHIPMENT_STATUS_PENDING = 1;

function generateOrderNumber(checkoutId: number, sellerId: number): string {
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `INV-${checkoutId}-${sellerId}-${rand}`;
}

export async function checkout(userId: number, body: CheckoutInput): Promise<ServiceResult<CheckoutResponse>> {
    const items = await checkoutRepo.findCartWithDetails(userId);

    if (items.length === 0) {
        return { error: 'Keranjang belanja kosong', status: 422, errorCode: 'ERR-CHECKOUT-01' };
    }

    for (const item of items) {
        if (item.productDeletedAt) {
            return { error: `Produk ${item.productName} tidak tersedia`, status: 409, errorCode: 'ERR-CHECKOUT-02' };
        }
        if (item.sellerStatus !== 'active') {
            return { error: `Penjual ${item.productName} tidak aktif`, status: 422 };
        }

        const qty = Number(item.quantity);
        const stock = Number(item.stockQuantity);
        if (qty > stock) {
            return { error: `Stok ${item.productName} tidak mencukupi`, status: 409, errorCode: 'ERR-CHECKOUT-02' };
        }
    }

    const result = await db.transaction(async (tx: any) => {
        let totalAmount = 0;
        for (const item of items) {
            totalAmount += Number(item.quantity) * Number(item.pricePerUnit);
        }

        const checkoutRec = await checkoutRepo.createCheckout(tx, {
            buyerId: userId,
            totalAmount: String(totalAmount),
            shippingAddress: body.shippingAddress,
            checkoutStatusId: CHECKOUT_STATUS_AWAITING_PAYMENT,
        });

        const sellerGroups = new Map<number, typeof items>();
        for (const item of items) {
            const group = sellerGroups.get(item.sellerId) || [];
            group.push(item);
            sellerGroups.set(item.sellerId, group);
        }

        let orderCount = 0;
        for (const [sellerId, sellerItems] of sellerGroups) {
            const shipment = await checkoutRepo.createShipment(tx, {
                courierName: body.courierName || null,
                provinceId: body.provinceId,
                cityId: body.cityId,
                shippingAddress: body.shippingAddress,
                shipmentStatusId: SHIPMENT_STATUS_PENDING,
            });

            let sellerSubtotal = 0;
            for (const item of sellerItems) {
                sellerSubtotal += Number(item.quantity) * Number(item.pricePerUnit);
            }

            const orderNumber = generateOrderNumber(checkoutRec.id, sellerId);
            const orderRec = await checkoutRepo.createOrder(tx, {
                checkoutId: checkoutRec.id,
                shipmentId: shipment.id,
                orderNumber,
                sellerId,
                subtotal: String(sellerSubtotal),
            });

            for (const item of sellerItems) {
                const itemSubtotal = Number(item.quantity) * Number(item.pricePerUnit);
                await checkoutRepo.createOrderItem(tx, {
                    orderId: orderRec.id,
                    productId: item.productId,
                    orderItemStatusId: ORDER_ITEM_STATUS_PENDING,
                    quantity: String(item.quantity),
                    unitId: item.unitId,
                    pricePerUnit: String(item.pricePerUnit),
                    discount: '0',
                    subtotal: String(itemSubtotal),
                });
            }

            orderCount++;
        }

        const payment = await checkoutRepo.createPayment(tx, {
            paymentMethodId: body.paymentMethodId,
            amount: String(totalAmount),
            paymentStatusId: PAYMENT_STATUS_UNPAID,
        });

        await checkoutRepo.updateCheckoutPaymentId(tx, checkoutRec.id, payment.id);
        await checkoutRepo.clearCartItems(tx, userId);

        const itemDetails: CheckoutItemDetail[] = items.map((item) => ({
            productId: item.productId,
            productName: item.productName || 'Unknown',
            quantity: Number(item.quantity),
            unitName: item.unitName || '',
            pricePerUnit: String(item.pricePerUnit),
            subtotal: String(Number(item.quantity) * Number(item.pricePerUnit)),
        }));

        return { checkoutId: checkoutRec.id, totalAmount: String(totalAmount), orderCount, items: itemDetails };
    });

    return { data: result };
}

const CHECKOUT_STATUS_PAID = 5;
const CHECKOUT_STATUS_CANCELLED = 2;
const PAYMENT_STATUS_PAID = 2;
const PAYMENT_STATUS_CANCELLED = 8;
const ORDER_ITEM_STATUS_CONFIRMED = 2;

export async function pay(userId: number, checkoutId: number): Promise<ServiceResult<{ checkoutId: number; status: string }>> {
    const checkout = await checkoutRepo.findCheckoutById(checkoutId);
    if (!checkout) return { error: 'Checkout tidak ditemukan', status: 404 };
    if (checkout.buyerId !== userId) return { error: 'Akses ditolak', status: 403 };
    if (checkout.checkoutStatusId !== CHECKOUT_STATUS_AWAITING_PAYMENT) return { error: 'Checkout tidak dalam status awaiting_payment', status: 422 };
    if (!checkout.paymentId) return { error: 'Pembayaran tidak ditemukan', status: 404 };

    await db.transaction(async (tx: any) => {
        await checkoutRepo.updatePaymentStatus(tx, checkout.paymentId!, PAYMENT_STATUS_PAID, new Date());
        await checkoutRepo.updateCheckoutStatus(tx, checkoutId, CHECKOUT_STATUS_PAID);
        await checkoutRepo.confirmOrderItemsByCheckout(tx, checkoutId, ORDER_ITEM_STATUS_CONFIRMED);
    });

    return { data: { checkoutId, status: 'paid' } };
}

export async function cancel(userId: number, checkoutId: number): Promise<ServiceResult<{ checkoutId: number; status: string }>> {
    const checkout = await checkoutRepo.findCheckoutById(checkoutId);
    if (!checkout) return { error: 'Checkout tidak ditemukan', status: 404 };
    if (checkout.buyerId !== userId) return { error: 'Akses ditolak', status: 403 };
    if (checkout.checkoutStatusId !== CHECKOUT_STATUS_AWAITING_PAYMENT) return { error: 'Checkout tidak dalam status awaiting_payment', status: 422 };
    if (!checkout.paymentId) return { error: 'Pembayaran tidak ditemukan', status: 404 };

    await db.transaction(async (tx: any) => {
        await checkoutRepo.updatePaymentStatus(tx, checkout.paymentId!, PAYMENT_STATUS_CANCELLED);
        await checkoutRepo.updateCheckoutStatus(tx, checkoutId, CHECKOUT_STATUS_CANCELLED);
    });

    return { data: { checkoutId, status: 'cancelled' } };
}

const SHIPMENT_STATUS_PICKED_UP = 3;
const ORDER_ITEM_STATUS_SHIPPED = 5;

export async function confirmShipment(
    userId: number, checkoutId: number, orderId: number
): Promise<ServiceResult<{ orderId: number; shipmentId: number; status: string }>> {
    const order = await checkoutRepo.findOrderWithShipment(orderId);
    if (!order) return { error: 'Pesanan tidak ditemukan', status: 404 };
    if (order.checkoutId !== checkoutId) return { error: 'Pesanan tidak ditemukan', status: 404 };

    const sellerProfile = await checkoutRepo.findSellerProfileByUserId(userId);
    if (!sellerProfile) return { error: 'Akses ditolak', status: 403 };
    if (sellerProfile.id !== order.sellerId) return { error: 'Akses ditolak', status: 403 };

    if (order.checkoutStatusId !== CHECKOUT_STATUS_PAID) return { error: 'Checkout belum dibayar', status: 422 };

    const result = await db.transaction(async (tx: any) => {
        const newShipment = await checkoutRepo.createShipmentPickedUp(tx, {
            courierName: order.courierName,
            provinceId: order.provinceId,
            cityId: order.cityId,
            shippingAddress: order.shippingAddress,
            shipmentStatusId: SHIPMENT_STATUS_PICKED_UP,
            shippedAt: new Date(),
        });

        await checkoutRepo.updateOrderShipmentId(tx, orderId, newShipment.id);
        await checkoutRepo.updateOrderItemsByOrderId(tx, orderId, ORDER_ITEM_STATUS_SHIPPED);

        return { orderId, shipmentId: newShipment.id, status: 'shipped' };
    });

    return { data: result };
}
