import { t } from 'elysia';

export const ProductRequest = t.Object({
    name: t.String(),
    categoryId: t.Number(),
    description: t.String(),
    unitId: t.Number(),
    minOrderQty: t.Number(),
    pricePerUnit: t.Number(),
    stockQuantity: t.Number(),
    isNegotiable: t.Optional(t.Boolean()),
});

export type ProductInput = {
    name: string;
    categoryId: number;
    description: string;
    unitId: number;
    minOrderQty: number;
    pricePerUnit: number;
    stockQuantity: number;
    isNegotiable?: boolean;
};