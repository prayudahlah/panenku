import { t } from 'elysia';

export const CreateSellerProfileRequest = t.Object({
    farmName: t.String({ minLength: 1 }),
    address: t.String({ minLength: 1 }),
    cityId: t.Number(),
    provinceId: t.Number(),
});

export type CreateSellerProfileInput = {
    farmName: string;
    address: string;
    cityId: number;
    provinceId: number;
};

export type SellerProfileResponse = {
    id: number;
    userId: number;
    farmName: string;
    address: string;
    cityId: number;
    provinceId: number;
};
