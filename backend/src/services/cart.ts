import { db } from '../db';
import { cartRepo } from '../repositories';
import type { AddCartItemInput, CartItemResponse, CartViewItem } from '../dtos/cart';
import { getTimeoutResult } from '../utils/withTimeout';

type ServiceResult<T> = { data?: T; error?: string; status?: number; errorCode?: string };

type CartViewResponse = {
    cartId: number | null;
    items: CartViewItem[];
    totalAmount: number;
    itemCount: number;
};

export async function addItem(userId: number, body: AddCartItemInput): Promise<ServiceResult<CartItemResponse>> {
    try {
        const product = await cartRepo.findProductWithSeller(body.productId);
        if (!product) return { error: 'Produk tidak ditemukan', status: 404, errorCode: 'ERR-CART-03' };
        if (product.deletedAt) return { error: 'Produk tidak tersedia untuk dibeli', status: 410, errorCode: 'ERR-CART-04' };
        if (product.sellerStatus !== 'active') return { error: 'Penjual tidak aktif', status: 403, errorCode: 'ERR-CART-01' };

        const stock = Number(product.stockQuantity);
        if (body.quantity > stock) return { error: 'Kuantitas melebihi stok yang tersedia', status: 422 };

        const unit = await cartRepo.findUnitById(body.unitId);
        if (!unit) return { error: 'Satuan tidak valid', status: 422 };

        const result = await db.transaction(async (tx: any) => {
            let cart = await cartRepo.findCartByUserId(userId);
            if (!cart) cart = await cartRepo.createCart(userId, tx);

            const existingItem = await cartRepo.findCartItem(cart.id, body.productId);
            if (existingItem) {
                const newQty = Number(existingItem.quantity) + body.quantity;
                if (newQty > stock) return { error: true as const, msg: 'Kuantitas melebihi stok yang tersedia', status: 422 };

                await cartRepo.updateCartItemQuantity(existingItem.id, String(newQty), tx);
                return {
                    error: false as const,
                    data: {
                        cartId: cart.id,
                        cartItemId: existingItem.id,
                        quantity: newQty,
                        productId: body.productId,
                        productName: product.name,
                        unitId: body.unitId,
                        unitName: unit.name,
                        pricePerUnit: product.pricePerUnit,
                    } as CartItemResponse,
                };
            }

            const newItem = await cartRepo.createCartItem(cart.id, { productId: body.productId, quantity: String(body.quantity), unitId: body.unitId }, tx);
            return {
                error: false as const,
                data: {
                    cartId: cart.id,
                    cartItemId: newItem.id,
                    quantity: body.quantity,
                    productId: body.productId,
                    productName: product.name,
                    unitId: body.unitId,
                    unitName: unit.name,
                    pricePerUnit: product.pricePerUnit,
                } as CartItemResponse,
            };
        });

        if (result.error) return { error: result.msg, status: result.status };
        return { data: result.data };
    } catch (err: any) {
        const timeout = getTimeoutResult(err, 'cart.addItem');
        if (timeout) return timeout;
        return { error: 'Gagal menambahkan item ke keranjang', status: 500, errorCode: 'ERR-CART-02' };
    }
}

export async function viewCart(userId: number): Promise<ServiceResult<CartViewResponse>> {
    try {
        const rows = await cartRepo.findCartWithItems(userId);

        if (rows.length === 0) {
            return { data: { cartId: null, items: [], totalAmount: 0, itemCount: 0 } };
        }

        const cartId = rows[0].cartId;
        let totalAmount = 0;

        const items: CartViewItem[] = rows.map((row) => {
            const isAvailable = !row.productDeletedAt;
            const unitPrice = isAvailable ? Number(row.negotiatedPrice || row.pricePerUnit) : 0;
            const qty = Number(row.quantity);
            const subtotal = qty * unitPrice;
            totalAmount += subtotal;

            return {
                cartItemId: row.cartItemId,
                productId: row.productId,
                productName: isAvailable ? row.productName! : 'Produk tidak tersedia',
                isAvailable,
                quantity: qty,
                unitId: row.unitId,
                unitName: row.unitName!,
                pricePerUnit: isAvailable ? String(row.negotiatedPrice || row.pricePerUnit!) : '0',
                subtotal,
                sellerId: Number(row.sellerId),
                farmName: row.farmName ?? '',
                address: row.address ?? '',
                cityName: row.cityName ?? '',
                provinceName: row.provinceName ?? '',
                stockQuantity: row.stockQuantity ?? '0',
                minOrderQty: row.minOrderQty ?? '1',
                isNegotiable: row.isNegotiable ?? false,
                negotiatedPrice: row.negotiatedPrice ?? undefined,
            };
        });

        return { data: { cartId, items, totalAmount, itemCount: items.length } };
    } catch (err: any) {
        const timeout = getTimeoutResult(err, 'cart.viewCart');
        if (timeout) return timeout;
        return { error: 'Gagal mengambil data keranjang', status: 500, errorCode: 'ERR-CART-02' };
    }
}

export async function updateItemQuantity(userId: number, itemId: number, quantity: number): Promise<ServiceResult<{ cartItemId: number; quantity: number }>> {
    try {
        const item = await cartRepo.findCartItemById(itemId);
        if (!item) return { error: 'Item keranjang tidak ditemukan', status: 404 };
        if (item.userId !== userId) return { error: 'Akses ditolak', status: 403 };
        if (item.productDeletedAt) return { error: 'Produk tidak tersedia', status: 410 };

        const stock = Number(item.productStock);
        if (quantity > stock) return { error: 'Kuantitas melebihi stok yang tersedia', status: 422 };

        await cartRepo.updateCartItemQuantity(itemId, String(quantity));
        return { data: { cartItemId: itemId, quantity } };
    } catch (err: any) {
        const timeout = getTimeoutResult(err, 'cart.updateItemQuantity');
        if (timeout) return timeout;
        return { error: 'Gagal memperbarui quantity', status: 500, errorCode: 'ERR-CART-02' };
    }
}

export async function removeItem(userId: number, itemId: number): Promise<ServiceResult<void>> {
    try {
        const item = await cartRepo.findCartItemById(itemId);
        if (!item) return { error: 'Item keranjang tidak ditemukan', status: 404 };
        if (item.userId !== userId) return { error: 'Akses ditolak', status: 403 };

        await cartRepo.deleteCartItem(itemId);
        return { data: undefined };
    } catch (err: any) {
        const timeout = getTimeoutResult(err, 'cart.removeItem');
        if (timeout) return timeout;
        return { error: 'Gagal menghapus item dari keranjang', status: 500, errorCode: 'ERR-CART-02' };
    }
}
