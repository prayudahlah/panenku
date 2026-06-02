import { dashboardService } from '../services';

export const dashboardController = (app: any) =>
    app
        .get('/buyer', async ({ session, set }: any) => {
            const userId = session.get('userId');

            if (!userId) {
                set.status = 401;
                return {
                    success: false,
                    message: 'Belum login',
                    errorCode: 'ERR-LOG-01',
                };
            }

            if (session.get('role') !== 'buyer') {
                set.status = 403;
                return {
                    success: false,
                    message: 'Hanya pembeli yang dapat mengakses dashboard pembeli',
                    errorCode: 'ERR-DASH-02',
                };
            }

            const result = await dashboardService.getBuyerDashboard(Number(userId));

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

        .get('/seller', async ({ session, set }: any) => {
            const userId = session.get('userId');

            if (!userId) {
                set.status = 401;
                return {
                    success: false,
                    message: 'Belum login',
                    errorCode: 'ERR-LOG-01',
                };
            }

            if (session.get('role') !== 'seller') {
                set.status = 403;
                return {
                    success: false,
                    message: 'Hanya penjual yang dapat mengakses dashboard penjual',
                    errorCode: 'ERR-DASH-02',
                };
            }

            const result = await dashboardService.getSellerDashboard(Number(userId));

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

            if (session.get('role') !== 'admin') {
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