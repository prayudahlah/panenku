import { db } from '../db';
import { checkoutRepo } from '../repositories';
import * as notificationService from './notification';
import type { CheckoutInput, CheckoutResponse, CheckoutItemDetail, DirectCheckoutInput, CheckoutListItem } from '../dtos/checkout';

type ServiceResult<T> = { data?: T; error?: string; status?: number; errorCode?: string };

const CHECKOUT_STATUS_AWAITING_PAYMENT = 4;
const PAYMENT_STATUS_UNPAID = 1;
const ORDER_ITEM_STATUS_PENDING = 1;
const SHIPMENT_STATUS_PENDING = 1;

type DirectItem = {
    productId: number;
    productName: string;
    sellerId: number;
    quantity: number;
    unitId: number;
    pricePerUnit: string;
    stockQuantity: string;
    productDeletedAt: Date | null;
    sellerStatus: string;
};

function generateOrderNumber(checkoutId: number, sellerId: number): string {
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `INV-${checkoutId}-${sellerId}-${rand}`;
}

export async function checkout(userId: number, body: CheckoutInput): Promise<ServiceResult<CheckoutResponse>> {
    if (!body.shippingAddress || body.shippingAddress.trim().length < 5) {
        return { error: 'Alamat pengiriman wajib diisi', status: 422, errorCode: 'ERR-CHECKOUT-03' };
    }

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

    const acceptedNegos = await checkoutRepo.findAcceptedNegotiationsByBuyer(userId);
    const negoMap = new Map(acceptedNegos.map(n => [`${n.productId}_${n.sellerId}`, n]));

    const result = await db.transaction(async (tx: any) => {
        let totalAmount = 0;
        for (const item of items) {
            const nego = negoMap.get(`${item.productId}_${item.sellerId}`);
            const effectivePrice = nego ? Number(nego.agreedPriceOffer) : Number(item.pricePerUnit);
            totalAmount += Number(item.quantity) * effectivePrice;
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
                const nego = negoMap.get(`${item.productId}_${item.sellerId}`);
                const effectivePrice = nego ? Number(nego.agreedPriceOffer) : Number(item.pricePerUnit);
                sellerSubtotal += Number(item.quantity) * effectivePrice;
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
                const nego = negoMap.get(`${item.productId}_${item.sellerId}`);
                const effectivePrice = nego ? Number(nego.agreedPriceOffer) : Number(item.pricePerUnit);
                const itemSubtotal = Number(item.quantity) * effectivePrice;
                await checkoutRepo.createOrderItem(tx, {
                    orderId: orderRec.id,
                    productId: item.productId,
                    orderItemStatusId: ORDER_ITEM_STATUS_PENDING,
                    quantity: String(item.quantity),
                    unitId: item.unitId,
                    pricePerUnit: String(effectivePrice),
                    discount: '0',
                    subtotal: String(itemSubtotal),
                    negotiationId: nego?.negotiationId || undefined,
                });
                await checkoutRepo.deductProductStock(tx, item.productId, Number(item.quantity));
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

        const itemDetails: CheckoutItemDetail[] = items.map((item) => {
            const nego = negoMap.get(`${item.productId}_${item.sellerId}`);
            const effectivePrice = nego ? Number(nego.agreedPriceOffer) : Number(item.pricePerUnit);
            return {
                productId: item.productId,
                productName: item.productName || 'Unknown',
                quantity: Number(item.quantity),
                unitName: item.unitName || '',
                pricePerUnit: String(effectivePrice),
                subtotal: String(Number(item.quantity) * effectivePrice),
            };
        });

        return { checkoutId: checkoutRec.id, totalAmount: String(totalAmount), orderCount, items: itemDetails };
    });

    const sellerIds = [...new Set(items.map(item => item.sellerId))];
    for (const sellerId of sellerIds) {
        const count = items.filter(item => item.sellerId === sellerId).length;
        notificationService.create(
            sellerId,
            'Pesanan Baru',
            `Pembeli memesan ${count} produk Anda`,
            'checkout',
            'checkout',
            result.checkoutId,
        );
    }

    // FSD-06.2: notifikasi ke pembeli sendiri sebagai trigger konfirmasi pembayaran
    notificationService.create(
        userId,
        'Pesanan Menunggu Pembayaran',
        `Pesanan #${result.checkoutId} telah dibuat. Total: Rp ${Number(result.totalAmount).toLocaleString('id-ID')}.`,
        'checkout_payment',
        'checkout',
        result.checkoutId,
    );

    return { data: result };
}

export async function directCheckout(userId: number, body: DirectCheckoutInput): Promise<ServiceResult<CheckoutResponse>> {
    if (!body.shippingAddress || body.shippingAddress.trim().length < 5) {
        return { error: 'Alamat pengiriman wajib diisi', status: 422, errorCode: 'ERR-CHECKOUT-03' };
    }

    const product = await checkoutRepo.findProductForCheckout(body.productId);
    if (!product) return { error: 'Produk tidak ditemukan', status: 404, errorCode: 'ERR-CHECKOUT-02' };
    if (product.productDeletedAt) return { error: `Produk ${product.productName} tidak tersedia`, status: 409, errorCode: 'ERR-CHECKOUT-02' };
    if (product.sellerStatus !== 'active') return { error: `Penjual tidak aktif`, status: 422 };

    const qty = body.quantity;
    const stock = Number(product.stockQuantity);
    if (qty > stock) return { error: `Stok ${product.productName} tidak mencukupi`, status: 409, errorCode: 'ERR-CHECKOUT-02' };

    const items: DirectItem[] = [{
        productId: product.productId,
        productName: product.productName!,
        sellerId: product.sellerId,
        quantity: qty,
        unitId: body.unitId,
        pricePerUnit: product.pricePerUnit,
        stockQuantity: product.stockQuantity,
        productDeletedAt: product.productDeletedAt,
        sellerStatus: product.sellerStatus,
    }];

    const acceptedNegos = await checkoutRepo.findAcceptedNegotiationsByBuyer(userId);
    const nego = acceptedNegos.find(n => n.productId === product.productId && n.sellerId === product.sellerId);
    const effectivePrice = nego ? Number(nego.agreedPriceOffer) : Number(product.pricePerUnit);
    const totalAmount = qty * effectivePrice;

    const result = await db.transaction(async (tx: any) => {
        const checkoutRec = await checkoutRepo.createCheckout(tx, {
            buyerId: userId,
            totalAmount: String(totalAmount),
            shippingAddress: body.shippingAddress,
            checkoutStatusId: CHECKOUT_STATUS_AWAITING_PAYMENT,
        });

        const shipment = await checkoutRepo.createShipment(tx, {
            courierName: body.courierName || null,
            provinceId: body.provinceId,
            cityId: body.cityId,
            shippingAddress: body.shippingAddress,
            shipmentStatusId: SHIPMENT_STATUS_PENDING,
        });

        const orderNumber = generateOrderNumber(checkoutRec.id, product.sellerId);
        const orderRec = await checkoutRepo.createOrder(tx, {
            checkoutId: checkoutRec.id,
            shipmentId: shipment.id,
            orderNumber,
            sellerId: product.sellerId,
            subtotal: String(totalAmount),
        });

        await checkoutRepo.createOrderItem(tx, {
            orderId: orderRec.id,
            productId: product.productId,
            orderItemStatusId: ORDER_ITEM_STATUS_PENDING,
            quantity: String(qty),
            unitId: body.unitId,
            pricePerUnit: String(effectivePrice),
            discount: '0',
            subtotal: String(totalAmount),
            negotiationId: nego?.negotiationId || undefined,
        });

        await checkoutRepo.deductProductStock(tx, product.productId, qty);

        const payment = await checkoutRepo.createPayment(tx, {
            paymentMethodId: body.paymentMethodId,
            amount: String(totalAmount),
            paymentStatusId: PAYMENT_STATUS_UNPAID,
        });

        await checkoutRepo.updateCheckoutPaymentId(tx, checkoutRec.id, payment.id);

        return { checkoutId: checkoutRec.id, totalAmount: String(totalAmount), orderCount: 1 };
    });

    notificationService.create(
        product.sellerId,
        'Pesanan Baru',
        `Pembeli memesan ${qty} ${product.productName}`,
        'checkout',
        'checkout',
        result.checkoutId,
    );

    // FSD-06.2: notifikasi ke pembeli sendiri
    notificationService.create(
        userId,
        'Pesanan Menunggu Pembayaran',
        `Pesanan #${result.checkoutId} telah dibuat. Total: Rp ${Number(result.totalAmount).toLocaleString('id-ID')}.`,
        'checkout_payment',
        'checkout',
        result.checkoutId,
    );

    return { data: { ...result, items: [] } };
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

    const sellers = await checkoutRepo.findSellersByCheckoutId(checkoutId);

    await db.transaction(async (tx: any) => {
        await checkoutRepo.updatePaymentStatus(tx, checkout.paymentId!, PAYMENT_STATUS_PAID, new Date());
        await checkoutRepo.updateCheckoutStatus(tx, checkoutId, CHECKOUT_STATUS_PAID);
        await checkoutRepo.confirmOrderItemsByCheckout(tx, checkoutId, ORDER_ITEM_STATUS_CONFIRMED);
    });

    for (const seller of sellers) {
        notificationService.create(
            seller.sellerId,
            'Pembayaran Dikonfirmasi',
            `Pembayaran untuk pesanan #${checkoutId} telah dikonfirmasi`,
            'checkout',
            'checkout',
            checkoutId,
        );
    }

    notificationService.create(
        checkout.buyerId,
        'Pembayaran Berhasil',
        `Pesanan #${checkoutId} berhasil dibayar`,
        'checkout_payment',
        'checkout',
        checkoutId,
    );

    return { data: { checkoutId, status: 'paid' } };
}

export async function cancel(userId: number, checkoutId: number): Promise<ServiceResult<{ checkoutId: number; status: string }>> {
    const checkout = await checkoutRepo.findCheckoutById(checkoutId);
    if (!checkout) return { error: 'Checkout tidak ditemukan', status: 404 };
    if (checkout.buyerId !== userId) return { error: 'Akses ditolak', status: 403 };
    if (checkout.checkoutStatusId !== CHECKOUT_STATUS_AWAITING_PAYMENT) return { error: 'Checkout tidak dalam status awaiting_payment', status: 422 };
    if (!checkout.paymentId) return { error: 'Pembayaran tidak ditemukan', status: 404 };

    const sellers = await checkoutRepo.findSellersByCheckoutId(checkoutId);

    await db.transaction(async (tx: any) => {
        await checkoutRepo.updatePaymentStatus(tx, checkout.paymentId!, PAYMENT_STATUS_CANCELLED);
        await checkoutRepo.updateCheckoutStatus(tx, checkoutId, CHECKOUT_STATUS_CANCELLED);
        await checkoutRepo.confirmOrderItemsByCheckout(tx, checkoutId, ORDER_ITEM_STATUS_CANCELLED);

        const items = await checkoutRepo.findOrderItemsByCheckout(tx, checkoutId);
        for (const item of items) {
            await checkoutRepo.deductProductStock(tx, item.productId, -Number(item.quantity));
        }
    });

    for (const seller of sellers) {
        notificationService.create(
            seller.sellerId,
            'Pesanan Dibatalkan',
            `Pesanan #${checkoutId} dibatalkan oleh pembeli`,
            'checkout',
            'checkout',
            checkoutId,
        );
    }

    return { data: { checkoutId, status: 'cancelled' } };
}

const SHIPMENT_STATUS_PICKED_UP = 2;
const ORDER_ITEM_STATUS_SHIPPED = 4;
const ORDER_ITEM_STATUS_CANCELLED = 5;
const PAYMENT_STATUS_REFUNDED = 9;

export async function confirmShipment(
    userId: number, checkoutId: number, orderId: number
): Promise<ServiceResult<{ orderId: number; shipmentId: number; status: string }>> {
    const order = await checkoutRepo.findOrderWithShipment(orderId);
    if (!order) return { error: 'Pesanan tidak ditemukan', status: 404 };
    if (order.checkoutId !== checkoutId) return { error: 'Pesanan tidak ditemukan', status: 404 };

    const sellerProfile = await checkoutRepo.findSellerProfileByUserId(userId);
    if (!sellerProfile) return { error: 'Akses ditolak', status: 403 };
    if (sellerProfile.userId !== order.sellerId) return { error: 'Akses ditolak', status: 403 };

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

    notificationService.create(
        order.buyerId,
        'Pesanan Dikirim',
        `Pesanan #${checkoutId} telah dikirim`,
        'checkout',
        'checkout',
        checkoutId,
    );

    return { data: result };
}

export async function getStatus(userId: number, checkoutId: number): Promise<ServiceResult<{ checkoutId: number; statusCode: string; isAwaitingPayment: boolean }>> {
    const checkout = await checkoutRepo.findCheckoutById(checkoutId);
    if (!checkout) return { error: 'Checkout tidak ditemukan', status: 404 };
    if (checkout.buyerId !== userId) return { error: 'Akses ditolak', status: 403 };

    const statusRow = await checkoutRepo.findCheckoutStatus(checkout.checkoutStatusId);
    const statusCode = statusRow?.code ?? '';
    return {
        data: {
            checkoutId,
            statusCode,
            isAwaitingPayment: statusCode === 'awaiting_payment',
        },
    };
}

export async function sellerCancelOrder(
    userId: number, checkoutId: number, orderId: number
): Promise<ServiceResult<{ orderId: number; status: string }>> {
    const order = await checkoutRepo.findOrderWithShipment(orderId);
    if (!order) return { error: 'Pesanan tidak ditemukan', status: 404 };
    if (order.checkoutId !== checkoutId) return { error: 'Pesanan tidak ditemukan', status: 404 };

    const sellerProfile = await checkoutRepo.findSellerProfileByUserId(userId);
    if (!sellerProfile) return { error: 'Akses ditolak', status: 403 };
    if (sellerProfile.userId !== order.sellerId) return { error: 'Akses ditolak', status: 403 };

    if (order.checkoutStatusId !== CHECKOUT_STATUS_PAID) return { error: 'Checkout belum dibayar', status: 422 };

    const paymentRecord = await checkoutRepo.findPaymentByCheckoutId(checkoutId);
    if (!paymentRecord || !paymentRecord.paymentId) return { error: 'Pembayaran tidak ditemukan', status: 404 };

    await db.transaction(async (tx: any) => {
        const items = await checkoutRepo.findOrderItemsByOrderId(tx, orderId);
        let cancelledSubtotal = 0;
        for (const item of items) {
            await checkoutRepo.deductProductStock(tx, item.productId, -Number(item.quantity));
            cancelledSubtotal += Number(item.subtotal);
        }
        await checkoutRepo.updateOrderItemsByOrderId(tx, orderId, ORDER_ITEM_STATUS_CANCELLED);
        await checkoutRepo.updatePaymentStatus(tx, paymentRecord.paymentId!, PAYMENT_STATUS_REFUNDED);

        const checkoutData = await checkoutRepo.findCheckoutById(checkoutId, tx);
        if (checkoutData) {
            const newTotal = Math.max(0, Number(checkoutData.totalAmount) - cancelledSubtotal);
            await checkoutRepo.updateCheckoutTotal(tx, checkoutId, String(newTotal));
        }
    });

    notificationService.create(
        order.buyerId,
        'Pesanan Dibatalkan Penjual',
        `Pesanan #${checkoutId} dibatalkan oleh penjual. Total tagihan disesuaikan.`,
        'checkout',
        'checkout',
        checkoutId,
    );

    return { data: { orderId, status: 'cancelled' } };
}

export async function listCheckouts(userId: number, role: string): Promise<ServiceResult<CheckoutListItem[]>> {
    if (role === 'seller') {
        const ordersList = await checkoutRepo.findCheckoutIdsBySeller(userId);
        if (ordersList.length === 0) return { data: [] };
        const checkoutIds = ordersList.map((o) => o.checkoutId);
        const checkoutsList = await checkoutRepo.findCheckoutsByIds(checkoutIds);
        const counts = await checkoutRepo.findCheckoutOrderCountsByCheckoutIds(checkoutIds);
        const countMap = new Map(counts.map((c) => [c.checkoutId, c]));
        const data: CheckoutListItem[] = checkoutsList.map((ch) => ({
            id: ch.id,
            totalAmount: ch.totalAmount,
            statusCode: ch.statusCode,
            createdAt: ch.createdAt,
            orderCount: countMap.get(ch.id)?.orderCount ?? 0,
            itemCount: countMap.get(ch.id)?.itemCount ?? 0,
        }));
        return { data };
    }

    const checkoutsList = await checkoutRepo.findCheckoutsByBuyer(userId);
    if (checkoutsList.length === 0) return { data: [] };
    const checkoutIds = checkoutsList.map((ch) => ch.id);
    const counts = await checkoutRepo.findCheckoutOrderCountsByCheckoutIds(checkoutIds);
    const countMap = new Map(counts.map((c) => [c.checkoutId, c]));
    const data: CheckoutListItem[] = checkoutsList.map((ch) => ({
        id: ch.id,
        totalAmount: ch.totalAmount,
        statusCode: ch.statusCode,
        createdAt: ch.createdAt,
        orderCount: countMap.get(ch.id)?.orderCount ?? 0,
        itemCount: countMap.get(ch.id)?.itemCount ?? 0,
    }));
    return { data };
}
