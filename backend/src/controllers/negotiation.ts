import { CreateNegotiationRequest, SellerRespondRequest, BuyerRespondRequest } from '../dtos/negotiation';
import { negotiationService } from '../services';

export const negotiationController = (app: any) =>
    app
        .get('/', async ({ session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) { set.status = 401; return { success: false, message: 'Belum login' }; }

            const result = await negotiationService.list(userId, session.get('role'));
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error, ...(result.errorCode ? { errorCode: result.errorCode } : {}) };
            }
            return { success: true, data: result.data };
        })

        .get('/:id', async ({ params: { id }, session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) { set.status = 401; return { success: false, message: 'Belum login' }; }

            const result = await negotiationService.getDetail(Number(id), userId, session.get('role'));
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error, ...(result.errorCode ? { errorCode: result.errorCode } : {}) };
            }
            return { success: true, data: result.data };
        })

        .post('/', async ({ body, session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) { set.status = 401; return { success: false, message: 'Belum login' }; }
            if (session.get('role') !== 'buyer') { set.status = 403; return { success: false, message: 'Hanya pembeli yang dapat mengajukan negosiasi' }; }

            const result = await negotiationService.initiate(userId, body);
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error, ...(result.errorCode ? { errorCode: result.errorCode } : {}) };
            }
            return { success: true, data: result.data };
        }, { body: CreateNegotiationRequest })

        .patch('/:id/seller', async ({ params: { id }, body, session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) { set.status = 401; return { success: false, message: 'Belum login' }; }
            if (session.get('role') !== 'seller') { set.status = 403; return { success: false, message: 'Hanya penjual yang dapat merespon negosiasi' }; }

            const result = await negotiationService.sellerRespond(userId, Number(id), body);
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error, ...(result.errorCode ? { errorCode: result.errorCode } : {}) };
            }
            return { success: true, data: result.data };
        }, { body: SellerRespondRequest })

        .patch('/:id/buyer', async ({ params: { id }, body, session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) { set.status = 401; return { success: false, message: 'Belum login' }; }
            if (session.get('role') !== 'buyer') { set.status = 403; return { success: false, message: 'Hanya pembeli yang dapat merespon negosiasi' }; }

            const result = await negotiationService.buyerRespond(userId, Number(id), body);
            if (result.error) {
                set.status = result.status || 400;
                return { success: false, message: result.error, ...(result.errorCode ? { errorCode: result.errorCode } : {}) };
            }
            return { success: true, data: result.data };
        }, { body: BuyerRespondRequest });
