import { t } from 'elysia';

export const CreateSellerProfileRequest = t.Object({
    farmName: t.String({ minLength: 5, maxLength: 100 }),
    address: t.String({ minLength: 5, maxLength: 255 }),
    cityId: t.Number(),
    provinceId: t.Number(),
    landCertificate: t.Optional(t.String({ maxLength: 100 })),
});

export type CreateSellerProfileInput = {
    farmName: string;
    address: string;
    cityId: number;
    provinceId: number;
    landCertificate?: string;
};

export type SellerProfileResponse = {
    id: number;
    userId: number;
    farmName: string;
    address: string;
    cityId: number;
    provinceId: number;
};
