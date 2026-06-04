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
        })

        .patch('/:id/role', async ({ session, params: { id }, body, set }: any) => {
            if (!['admin', 'super_admin'].includes(session.get('role'))) {
                set.status = 403;
                return { success: false, message: 'Akses ditolak' };
            }
            const result = await adminService.updateUserRole(Number(id), body.role, session.get('userId'));
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error };
            }
            return { success: true, data: result.data };
        })

        .delete('/:id', async ({ session, params: { id }, set }: any) => {
            if (session.get('role') !== 'super_admin') {
                set.status = 403;
                return { success: false, message: 'Hanya SuperAdmin yang dapat menghapus user' };
            }
            const result = await adminService.deleteUser(Number(id), session.get('userId'));
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error };
            }
            return { success: true, message: 'User berhasil dihapus' };
        });
