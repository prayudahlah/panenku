import { AddCartItemRequest, UpdateCartItemRequest } from '../dtos/cart';
import { cartService } from '../services';

export const cartController = (app: any) =>
    app
        .get('/', async ({ session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) {
                set.status = 401;
                return { success: false, message: 'Belum login', errorCode: 'ERR-LOG-01' };
            }

            const result = await cartService.viewCart(userId);
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error, errorCode: result.errorCode };
            }

            return { success: true, data: result.data };
        })

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
        }, { body: AddCartItemRequest })

        .put('/items/:id', async ({ params: { id }, body, session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) {
                set.status = 401;
                return { success: false, message: 'Belum login', errorCode: 'ERR-LOG-01' };
            }

            const result = await cartService.updateItemQuantity(userId, Number(id), body.quantity);
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error };
            }

            return { success: true, message: 'Quantity berhasil diperbarui', data: result.data };
        }, { body: UpdateCartItemRequest })

        .delete('/items/:id', async ({ params: { id }, session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) {
                set.status = 401;
                return { success: false, message: 'Belum login', errorCode: 'ERR-LOG-01' };
            }

            const result = await cartService.removeItem(userId, Number(id));
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error };
            }

            return { success: true, message: 'Item berhasil dihapus dari keranjang' };
        });
