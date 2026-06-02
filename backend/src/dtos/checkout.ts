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

export type CheckoutResponse = {
    checkoutId: number;
    totalAmount: string;
    orderCount: number;
};
