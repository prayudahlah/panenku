import { t } from 'elysia';

export const CreateAddressRequest = t.Object({
    label: t.String({ minLength: 1, maxLength: 50 }),
    provinceId: t.Number(),
    cityId: t.Number(),
    address: t.String({ minLength: 5, maxLength: 255 }),
    isDefault: t.Optional(t.Boolean()),
});

export type CreateAddressInput = {
    label: string;
    provinceId: number;
    cityId: number;
    address: string;
    isDefault?: boolean;
};

export const UpdateAddressRequest = t.Object({
    label: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
    provinceId: t.Optional(t.Number()),
    cityId: t.Optional(t.Number()),
    address: t.Optional(t.String({ minLength: 5, maxLength: 255 })),
    isDefault: t.Optional(t.Boolean()),
});

export type UpdateAddressInput = {
    label?: string;
    provinceId?: number;
    cityId?: number;
    address?: string;
    isDefault?: boolean;
};
