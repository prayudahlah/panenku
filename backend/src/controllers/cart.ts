import { AddCartItemRequest } from '../dtos/cart';
import { cartService } from '../services';

export const cartController = (app: any) =>
    app
        .post('/items', async ({ body, session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) {
                set.status = 401;
                return { success: false, message: 'Belum login', errorCode: 'ERR-LOG-01' };
            }

            const result = await cartService.addItem(userId, body);
            if (result.error) {
                set.status = result.status || 400;
                return {
                    success: false,
                    message: result.error,
                    ...(result.errorCode ? { errorCode: result.errorCode } : {}),
                };
            }

            set.status = 201;
            return { success: true, message: 'Produk berhasil ditambahkan ke keranjang', data: result.data };
        }, { body: AddCartItemRequest });
