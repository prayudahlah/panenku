import { CreateContractRequest, RespondContractRequest } from '../dtos/contract';
import { contractService } from '../services';

export const contractController = (app: any) =>
    app
        .post('/', async ({ body, session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) { set.status = 401; return { success: false, message: 'Belum login', errorCode: 'ERR-LOG-01' }; }
            if (session.get('role') !== 'buyer') { set.status = 403; return { success: false, message: 'Hanya pembeli yang dapat mengajukan kontrak' }; }

            const result = await contractService.create(userId, body);
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error, ...(result.errorCode ? { errorCode: result.errorCode } : {}) };
            }

            set.status = 201;
            return { success: true, data: result.data };
        }, { body: CreateContractRequest })

        .get('/', async ({ session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) { set.status = 401; return { success: false, message: 'Belum login', errorCode: 'ERR-LOG-01' }; }

            const result = await contractService.list(userId, session.get('role'));
            return { success: true, data: result.data };
        })

        .get('/:id', async ({ params: { id }, session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) { set.status = 401; return { success: false, message: 'Belum login', errorCode: 'ERR-LOG-01' }; }

            const result = await contractService.getDetail(Number(id), userId, session.get('role'));
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error };
            }
            return { success: true, data: result.data };
        })

        .patch('/:id/respond', async ({ params: { id }, body, session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) { set.status = 401; return { success: false, message: 'Belum login', errorCode: 'ERR-LOG-01' }; }
            if (session.get('role') !== 'seller') { set.status = 403; return { success: false, message: 'Hanya penjual yang dapat merespon kontrak' }; }

            const result = await contractService.respond(userId, Number(id), body);
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error, ...(result.errorCode ? { errorCode: result.errorCode } : {}) };
            }

            return { success: true, data: result.data };
        }, { body: RespondContractRequest });
