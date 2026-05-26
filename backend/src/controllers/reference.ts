import { referenceRepo } from '../repositories';

export const referenceController = (app: any) =>
    app
        .get('/provinces', async () => {
            const data = await referenceRepo.getAllProvinces();
            return { success: true, data };
        })
        .get('/product-categories', async () => {
            const data = await referenceRepo.getAllProductCategories();
            return { success: true, data };
        })
        .get('/cities/:provinceId', async ({ params: { provinceId }, set }: any) => {
            const id = Number(provinceId);
            if (isNaN(id)) { set.status = 400; return { success: false, message: 'ID provinsi tidak valid' }; }
            const data = await referenceRepo.getCitiesByProvince(id);
            return { success: true, data };
        });
