import { adminService } from '../services';

export const productsController = (app: any) =>
    app
        .get('/', async ({ session, set, query }: any) => {
            if (session.get('role') !== 'admin') { set.status = 403; return { success: false, message: 'Akses ditolak' }; }
            const sellerId = Number(query.sellerId);
            if (!sellerId) { set.status = 400; return { success: false, message: 'sellerId diperlukan' }; }
            const result = await adminService.listProductsBySeller(sellerId);
            return { success: true, data: result.data };
        })

        .patch('/:id/takedown', async ({ session, params: { id }, set }: any) => {
            if (session.get('role') !== 'admin') { set.status = 403; return { success: false, message: 'Akses ditolak' }; }
            const result = await adminService.takedownProduct(Number(id));
            return { success: true, data: result.data };
        });
