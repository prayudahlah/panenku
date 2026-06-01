import { CreateAddressRequest, UpdateAddressRequest } from '../dtos/userAddress';
import { userAddressService } from '../services';

export const userAddressController = (app: any) =>
    app
        .get('/', async ({ session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) { set.status = 401; return { success: false, message: 'Belum login', errorCode: 'ERR-LOG-01' }; }

            const result = await userAddressService.list(userId);
            return { success: true, data: result.data };
        })

        .post('/', async ({ body, session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) { set.status = 401; return { success: false, message: 'Belum login', errorCode: 'ERR-LOG-01' }; }

            const result = await userAddressService.create(userId, body);
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error, ...(result.errorCode ? { errorCode: result.errorCode } : {}) };
            }

            set.status = 201;
            return { success: true, data: result.data };
        }, { body: CreateAddressRequest })

        .patch('/:id', async ({ params: { id }, body, session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) { set.status = 401; return { success: false, message: 'Belum login', errorCode: 'ERR-LOG-01' }; }

            const result = await userAddressService.update(userId, Number(id), body);
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error, ...(result.errorCode ? { errorCode: result.errorCode } : {}) };
            }

            return { success: true, data: result.data };
        }, { body: UpdateAddressRequest })

        .delete('/:id', async ({ params: { id }, session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) { set.status = 401; return { success: false, message: 'Belum login', errorCode: 'ERR-LOG-01' }; }

            const result = await userAddressService.remove(userId, Number(id));
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error, ...(result.errorCode ? { errorCode: result.errorCode } : {}) };
            }

            return { success: true, data: result.data };
        });
