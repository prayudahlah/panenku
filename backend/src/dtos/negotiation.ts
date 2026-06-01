import { t } from 'elysia';

export const CreateNegotiationRequest = t.Object({
    productId: t.Number(),
    priceOffer: t.Number({ minimum: 1 }),
    unitId: t.Number(),
    quantityOffer: t.Number({ minimum: 1 }),
    description: t.Optional(t.String({ maxLength: 1000 })),
});

export type CreateNegotiationInput = {
    productId: number;
    priceOffer: number;
    unitId: number;
    quantityOffer: number;
    description?: string;
};

export const SellerRespondRequest = t.Object({
    action: t.UnionEnum(['accept', 'reject', 'counter']),
    priceOffer: t.Optional(t.Number({ minimum: 1 })),
    unitId: t.Optional(t.Number()),
    quantityOffer: t.Optional(t.Number({ minimum: 1 })),
    description: t.Optional(t.String({ maxLength: 1000 })),
});

export type SellerRespondInput = {
    action: 'accept' | 'reject' | 'counter';
    priceOffer?: number;
    unitId?: number;
    quantityOffer?: number;
    description?: string;
};

export const BuyerRespondRequest = t.Object({
    action: t.UnionEnum(['accept', 'cancel', 'counter']),
    priceOffer: t.Optional(t.Number({ minimum: 1 })),
    unitId: t.Optional(t.Number()),
    quantityOffer: t.Optional(t.Number({ minimum: 1 })),
    description: t.Optional(t.String({ maxLength: 1000 })),
});

export type BuyerRespondInput = {
    action: 'accept' | 'cancel' | 'counter';
    priceOffer?: number;
    unitId?: number;
    quantityOffer?: number;
    description?: string;
};

export type NegotiationResponse = {
    id: number;
    sellerId: number;
    buyerId: number;
    productId: number;
    agreedPriceOffer: string;
    agreedUnitId: number;
    agreedQuantityOffer: string;
    validUntil: Date;
    status: string;
    createdAt: Date | null;
};
