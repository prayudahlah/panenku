import { db } from '../db';
import { checkoutRepo } from '../repositories';
import type { CheckoutInput, CheckoutResponse } from '../dtos/checkout';

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

        return { checkoutId: checkoutRec.id, totalAmount: String(totalAmount), orderCount };
    });

    return { data: result };
}
