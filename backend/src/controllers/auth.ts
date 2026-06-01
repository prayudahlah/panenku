import { RegisterRequest, LoginRequest } from '../dtos/auth';
import { authService } from '../services';

export const authController = (app: any) =>
    app
        .post('/register', async ({ body, session, set }: any) => {
            const result = await authService.register(body);
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error, errorCode: result.errorCode };
            }

            session.set('userId', result.data!.id);
            session.set('email', result.data!.email);
            session.set('role', result.data!.role);

            set.status = 201;
            return { success: true, message: 'Registrasi berhasil', data: result.data };
        }, { body: RegisterRequest })

        .post('/login', async ({ body, session, set, request }: any) => {
            const ipAddress = request.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || request.headers?.['x-real-ip'] || 'unknown';
            const result = await authService.login(body, ipAddress);
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error, errorCode: result.errorCode };
            }

            session.set('userId', result.data!.id);
            session.set('email', result.data!.email);
            session.set('role', result.data!.role);

            return { success: true, message: 'Login berhasil', data: result.data };
        }, { body: LoginRequest })

        .post('/logout', async ({ session, set }: any) => {
            if (!session.get('userId')) {
                set.status = 401;
                return { success: false, message: 'Belum login', errorCode: 'ERR-LOGOUT-01' };
            }
            session.destroy();
            return { success: true, message: 'Logout berhasil' };
        })

        .get('/me', async ({ session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) {
                set.status = 401;
                return { success: false, message: 'Belum login' };
            }

            const result = await authService.me(userId);
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error };
            }

            return { success: true, data: result.data };
        });
