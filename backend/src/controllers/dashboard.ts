import { dashboardService } from '../services';

export const dashboardController = (app: any) =>
    app
        .get('/buyer', async ({ session, set, query }: any) => {
            const sessionUserId = session.get('userId');

            if (!sessionUserId) {
                set.status = 401;
                return {
                    success: false,
                    message: 'Belum login',
                    errorCode: 'ERR-LOG-01',
                };
            }

            const role = session.get('role');
            if (!['buyer', 'admin', 'super_admin'].includes(role)) {
                set.status = 403;
                return {
                    success: false,
                    message: 'Hanya pembeli dan admin yang dapat mengakses dashboard pembeli',
                    errorCode: 'ERR-DASH-02',
                };
            }

            const targetUserId = ['admin', 'super_admin'].includes(role) && query.userId ? Number(query.userId) : Number(sessionUserId);
            const result = await dashboardService.getBuyerDashboard(targetUserId);

            if (result.error) {
                set.status = result.status || 400;
                return {
                    success: false,
                    message: result.error,
                    ...(result.errorCode ? { errorCode: result.errorCode } : {}),
                };
            }

            return {
                success: true,
                data: result.data,
            };
        })

        .get('/seller', async ({ session, set, query }: any) => {
            const sessionUserId = session.get('userId');

            if (!sessionUserId) {
                set.status = 401;
                return {
                    success: false,
                    message: 'Belum login',
                    errorCode: 'ERR-LOG-01',
                };
            }

            const role = session.get('role');
            if (!['seller', 'admin', 'super_admin'].includes(role)) {
                set.status = 403;
                return {
                    success: false,
                    message: 'Hanya penjual dan admin yang dapat mengakses dashboard penjual',
                    errorCode: 'ERR-DASH-02',
                };
            }

            const targetUserId = ['admin', 'super_admin'].includes(role) && query.userId ? Number(query.userId) : Number(sessionUserId);
            const result = await dashboardService.getSellerDashboard(targetUserId);

            if (result.error) {
                set.status = result.status || 400;
                return {
                    success: false,
                    message: result.error,
                    ...(result.errorCode ? { errorCode: result.errorCode } : {}),
                };
            }

            return {
                success: true,
                data: result.data,
            };
        })

        .get('/admin', async ({ session, set }: any) => {
            const userId = session.get('userId');

            if (!userId) {
                set.status = 401;
                return {
                    success: false,
                    message: 'Belum login',
                    errorCode: 'ERR-LOG-01',
                };
            }

            if (!['admin', 'super_admin'].includes(session.get('role'))) {
                set.status = 403;
                return {
                    success: false,
                    message: 'Hanya admin yang dapat mengakses dashboard admin',
                    errorCode: 'ERR-DASH-02',
                };
            }

            const result = await dashboardService.getAdminDashboard(Number(userId));

            if (result.error) {
                set.status = result.status || 400;
                return {
                    success: false,
                    message: result.error,
                    ...(result.errorCode ? { errorCode: result.errorCode } : {}),
                };
            }

            return {
                success: true,
                data: result.data,
            };
        });