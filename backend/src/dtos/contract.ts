import { t } from 'elysia';

const ScheduleItem = t.Object({
    deliveryDay: t.Optional(t.String()),
    deliveryDate: t.Optional(t.String()),
    deliveryTime: t.Optional(t.String()),
});

const ProductItem = t.Object({
    productId: t.Number(),
    quantity: t.Number({ minimum: 1 }),
    unitId: t.Number(),
    description: t.Optional(t.String({ maxLength: 1000 })),
});

export const CreateContractRequest = t.Object({
    sellerId: t.Number(),
    addressId: t.Number(),
    startDate: t.String(),
    endDate: t.String(),
    frequency: t.UnionEnum(['daily', 'weekly', 'monthly', 'custom']),
    schedules: t.Array(ScheduleItem),
    products: t.Array(ProductItem),
    description: t.Optional(t.String({ maxLength: 1000 })),
});

export type CreateContractInput = {
    sellerId: number;
    addressId: number;
    startDate: string;
    endDate: string;
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
    schedules: Array<{
        deliveryDay?: string;
        deliveryDate?: string;
        deliveryTime?: string;
    }>;
    products: Array<{
        productId: number;
        quantity: number;
        unitId: number;
        description?: string;
    }>;
    description?: string;
};

export const RespondContractRequest = t.Object({
    action: t.UnionEnum(['accepted', 'rejected']),
});

export type RespondContractInput = {
    action: 'accepted' | 'rejected';
};
