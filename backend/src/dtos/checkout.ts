import { t } from 'elysia';

export const CheckoutRequest = t.Object({
    shippingAddress: t.String({ minLength: 5, maxLength: 255 }),
    courierName: t.Optional(t.String({ maxLength: 50 })),
    paymentMethodId: t.Number(),
    provinceId: t.Number(),
    cityId: t.Number(),
});

export type CheckoutInput = {
    shippingAddress: string;
    courierName?: string;
    paymentMethodId: number;
    provinceId: number;
    cityId: number;
};

export type CheckoutItemDetail = {
    productId: number;
    productName: string;
    quantity: number;
    unitName: string;
    pricePerUnit: string;
    subtotal: string;
};

export type CheckoutResponse = {
    checkoutId: number;
    totalAmount: string;
    orderCount: number;
    items: CheckoutItemDetail[];
};

export const DirectCheckoutRequest = t.Object({
    productId: t.Number(),
    quantity: t.Number({ minimum: 1 }),
    unitId: t.Number(),
    shippingAddress: t.String({ minLength: 5, maxLength: 255 }),
    courierName: t.Optional(t.String({ maxLength: 50 })),
    paymentMethodId: t.Number(),
    provinceId: t.Number(),
    cityId: t.Number(),
});

export type DirectCheckoutInput = {
    productId: number;
    quantity: number;
    unitId: number;
    shippingAddress: string;
    courierName?: string;
    paymentMethodId: number;
    provinceId: number;
    cityId: number;
};
