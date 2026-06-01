import { db } from '../db';
import { cartRepo } from '../repositories';
import type { AddCartItemInput, CartItemResponse } from '../dtos/cart';

type ServiceResult<T> = { data?: T; error?: string; status?: number; errorCode?: string };

export async function addItem(userId: number, body: AddCartItemInput): Promise<ServiceResult<CartItemResponse>> {
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
}
