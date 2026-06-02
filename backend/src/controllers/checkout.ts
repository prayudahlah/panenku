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
        }, { body: CheckoutRequest });
