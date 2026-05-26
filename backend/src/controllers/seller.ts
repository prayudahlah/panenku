import { CreateSellerProfileRequest } from '../dtos/seller';
import { sellerService, adminService } from '../services';

export const sellerController = (app: any) =>
    app
        .post('/register', async ({ body, session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) { set.status = 401; return { success: false, message: 'Belum login' }; }

            const result = await sellerService.register(userId, body);
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error };
            }

            session.set('role', 'seller');
            return { success: true, data: result.data };
        }, { body: CreateSellerProfileRequest })

        .get('/profiles/me', async ({ session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) { set.status = 401; return { success: false, message: 'Belum login' }; }

            const result = await sellerService.getProfile(userId);
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error };
            }
            return { success: true, data: result.data };
        })

        .get('/', async ({ session, set }: any) => {
            if (session.get('role') !== 'admin') { set.status = 403; return { success: false, message: 'Akses ditolak' }; }
            const result = await adminService.listSellers();
            return { success: true, data: result.data };
        });
