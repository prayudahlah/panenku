import { CheckoutRequest, DirectCheckoutRequest } from '../dtos/checkout';
import { checkoutService } from '../services';

export const checkoutController = (app: any) =>
    app
        .post('/direct', async ({ body, session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) {
                set.status = 401;
                return { success: false, message: 'Belum login', errorCode: 'ERR-LOG-01' };
            }

            const result = await checkoutService.directCheckout(userId, body);
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
        }, { body: DirectCheckoutRequest })

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
        })

        .put('/:id/orders/:orderId/ship', async ({ params: { id, orderId }, session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) {
                set.status = 401;
                return { success: false, message: 'Belum login', errorCode: 'ERR-LOG-01' };
            }

            const result = await checkoutService.confirmShipment(userId, Number(id), Number(orderId));
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error };
            }

            return { success: true, message: 'Pengiriman dikonfirmasi', data: result.data };
        })

        .get('/:id/status', async ({ params: { id }, session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) {
                set.status = 401;
                return { success: false, message: 'Belum login', errorCode: 'ERR-LOG-01' };
            }
            const result = await checkoutService.getStatus(userId, Number(id));
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error };
            }
            return { success: true, data: result.data };
        })

        .put('/:id/orders/:orderId/cancel', async ({ params: { id, orderId }, session, set }: any) => {            const userId = session.get('userId');
            if (!userId) {
                set.status = 401;
                return { success: false, message: 'Belum login', errorCode: 'ERR-LOG-01' };
            }
            if (session.get('role') !== 'seller') {
                set.status = 403;
                return { success: false, message: 'Hanya penjual yang dapat membatalkan pesanan' };
            }

            const result = await checkoutService.sellerCancelOrder(userId, Number(id), Number(orderId));
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error };
            }

            return { success: true, message: 'Pesanan dibatalkan', data: result.data };
        });
