import { CheckoutRequest } from '../dtos/checkout';
import { checkoutService } from '../services';

export const checkoutController = (app: any) =>
    app
        .post('/', async ({ body, session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) {
                set.status = 401;
                return { success: false, message: 'Belum login', errorCode: 'ERR-LOG-01' };
            }

            const result = await checkoutService.checkout(userId, body);
            if (result.error) {
                set.status = result.status || 400;
                return {
                    success: false,
                    message: result.error,
                    ...(result.errorCode ? { errorCode: result.errorCode } : {}),
                };
            }

            set.status = 201;
            return { success: true, message: 'Checkout berhasil', data: result.data };
        }, { body: CheckoutRequest })

        .put('/:id/pay', async ({ params: { id }, session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) {
                set.status = 401;
                return { success: false, message: 'Belum login', errorCode: 'ERR-LOG-01' };
            }

            const result = await checkoutService.pay(userId, Number(id));
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error };
            }

            return { success: true, message: 'Pembayaran berhasil dikonfirmasi', data: result.data };
        })

        .put('/:id/cancel', async ({ params: { id }, session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) {
                set.status = 401;
                return { success: false, message: 'Belum login', errorCode: 'ERR-LOG-01' };
            }

            const result = await checkoutService.cancel(userId, Number(id));
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error };
            }

            return { success: true, message: 'Pesanan dibatalkan', data: result.data };
        });
