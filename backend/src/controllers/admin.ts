import { adminService } from '../services';

export const adminController = (app: any) =>
    app
        .get('/users', async ({ session, set }: any) => {
            if (session.get('role') !== 'admin') { set.status = 403; return { success: false, message: 'Akses ditolak' }; }
            const result = await adminService.listUsers();
            return { success: true, data: result.data };
        })

        .patch('/users/:id/status', async ({ session, params: { id }, body, set }: any) => {
            if (session.get('role') !== 'admin') { set.status = 403; return { success: false, message: 'Akses ditolak' }; }
            const result = await adminService.updateUserStatus(Number(id), body.status);
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error };
            }
            return { success: true, data: result.data };
        })

        .get('/sellers', async ({ session, set }: any) => {
            if (session.get('role') !== 'admin') { set.status = 403; return { success: false, message: 'Akses ditolak' }; }
            const result = await adminService.listSellers();
            return { success: true, data: result.data };
        })

        .get('/products', async ({ session, set, query }: any) => {
            if (session.get('role') !== 'admin') { set.status = 403; return { success: false, message: 'Akses ditolak' }; }
            const sellerId = Number(query.sellerId);
            if (!sellerId) { set.status = 400; return { success: false, message: 'sellerId diperlukan' }; }
            const result = await adminService.listProductsBySeller(sellerId);
            return { success: true, data: result.data };
        })

        .patch('/products/:id/takedown', async ({ session, params: { id }, set }: any) => {
            if (session.get('role') !== 'admin') { set.status = 403; return { success: false, message: 'Akses ditolak' }; }
            const result = await adminService.takedownProduct(Number(id));
            return { success: true, data: result.data };
        });
