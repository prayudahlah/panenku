import { CreateSellerProfileRequest } from '../dtos/seller';
import { sellerService, adminService, catalogService } from '../services';

export const sellerController = (app: any) =>
    app
        .post('/register', async ({ body, session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) {
                set.status = 401;
                return { success: false, code: 'ERR-LOG-01', message: 'Belum login' };
            }

            const result = await sellerService.register(userId, body);
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error, errorCode: result.errorCode };
            }

            session.set('role', 'seller');
            return { success: true, data: result.data };
        }, { body: CreateSellerProfileRequest })

        .get('/catalog', async ({ session, query, set }: any) => {
            const userId = session.get('userId');
            const role = session.get('role');

            if (!userId) {
                set.status = 401;
                return { success: false, code: 'ERR-LOG-01', message: 'User belum login' };
            }

            if (role !== 'seller') {
                set.status = 403;
                return { success: false, code: 'ERR-PROD-01', message: 'Akun bukan penjual' };
            }

            const profile = await sellerService.getProfile(Number(userId));
            if (profile.error) {
                set.status = profile.status || 404;
                return { success: false, code: 'ERR-PROD-01', message: profile.error };
            }

            if (profile.data.status !== 'active') {
                set.status = 403;
                return { success: false, code: 'ERR-PROD-02', message: 'Profil penjual tidak aktif' };
            }

            const result = await catalogService.listSellerCatalog({
                sellerId: Number(userId),
                sortBy: query.sort_by || query.sortBy,
                sortOrder: query.order || query.sortOrder,
                page: query.page ? Number(query.page) : 1,
                limit: query.limit ? Number(query.limit) : 10,
            });

            return {
                success: true,
                data: result.data,
                summary: result.summary,
                meta: result.meta,
            };
        })

        .get('/profiles/me', async ({ session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) {
                set.status = 401;
                return { success: false, code: 'ERR-LOG-01', message: 'Belum login' };
            }

            const result = await sellerService.getProfile(userId);
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error };
            }

            return { success: true, data: result.data };
        })

        .get('/', async ({ session, set }: any) => {
            if (!['admin', 'super_admin'].includes(session.get('role'))) {
                set.status = 403;
                return { success: false, message: 'Akses ditolak' };
            }

            const result = await adminService.listSellers();
            return { success: true, data: result.data };
        });
