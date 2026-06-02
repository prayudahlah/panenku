import { dashboardService } from '../services';

export const dashboardController = (app: any) =>
    app
        .get('/buyer', async ({ session, set }: any) => {
            const userId = Number(session.get('userId'));
            if (!userId) { set.status = 401; return { success: false, message: 'Belum login' }; }
            if (session.get('role') !== 'buyer') { set.status = 403; return { success: false, message: 'Hanya pembeli yang dapat mengakses dashboard pembeli' }; }

            const result = await dashboardService.getBuyerDashboard(userId);
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error };
            }

            return { success: true, data: result.data };
        })

        .get('/seller', async ({ session, set }: any) => {
            const userId = Number(session.get('userId'));
            if (!userId) { set.status = 401; return { success: false, message: 'Belum login' }; }
            if (session.get('role') !== 'seller') { set.status = 403; return { success: false, message: 'Hanya penjual yang dapat mengakses dashboard penjual' }; }

            const result = await dashboardService.getSellerDashboard(userId);
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error };
            }

            return { success: true, data: result.data };
        })

        .get('/admin', async ({ session, set }: any) => {
            const userId = Number(session.get('userId'));
            if (!userId) { set.status = 401; return { success: false, message: 'Belum login' }; }
            if (session.get('role') !== 'admin') { set.status = 403; return { success: false, message: 'Hanya admin yang dapat mengakses dashboard admin' }; }

            const result = await dashboardService.getAdminDashboard(userId);
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error };
            }

            return { success: true, data: result.data };
        });