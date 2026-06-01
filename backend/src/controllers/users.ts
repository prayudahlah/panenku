import { adminService } from '../services';

export const usersController = (app: any) =>
    app
        .get('/', async ({ session, set }: any) => {
            if (!['admin', 'super_admin'].includes(session.get('role'))) { set.status = 403; return { success: false, message: 'Akses ditolak' }; }
            const result = await adminService.listUsers();
            return { success: true, data: result.data };
        })

        .patch('/:id/status', async ({ session, params: { id }, body, set }: any) => {
            if (!['admin', 'super_admin'].includes(session.get('role'))) { set.status = 403; return { success: false, message: 'Akses ditolak' }; }
            const result = await adminService.updateUserStatus(Number(id), body.status, session.get('userId'));
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error };
            }
            return { success: true, data: result.data };
        });
