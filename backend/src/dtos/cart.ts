import { t } from 'elysia';

export const AddCartItemRequest = t.Object({
    productId: t.Number(),
    quantity: t.Number({ minimum: 1 }),
    unitId: t.Number(),
});

export type AddCartItemInput = {
    productId: number;
    quantity: number;
    unitId: number;
};

export const UpdateCartItemRequest = t.Object({
    quantity: t.Number({ minimum: 1 }),
});

export type UpdateCartItemInput = {
    quantity: number;
};

export type CartItemResponse = {
    cartId: number;
    cartItemId: number;
    quantity: number;
    productId: number;
    productName: string;
    unitId: number;
    unitName: string;
    pricePerUnit: string;
};

export type CartViewItem = {
    cartItemId: number;
    productId: number;
    productName: string;
    isAvailable: boolean;
    quantity: number;
    unitId: number;
    unitName: string;
    pricePerUnit: string;
    subtotal: number;
    sellerId: number;
    farmName: string;
    address: string;
    cityName: string;
    provinceName: string;
    stockQuantity: string;
    minOrderQty: string;
    isNegotiable: boolean;
    negotiatedPrice?: string;
    negotiatedQuantity?: string;
};
