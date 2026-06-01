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
