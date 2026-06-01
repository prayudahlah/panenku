import { ProductRequest } from '../dtos/products';
import { adminService, catalogService } from '../services';

function authError(set: any) {
    set.status = 401;
    return { success: false, code: 'ERR-LOG-01', message: 'User belum login' };
}

function serviceError(result: any, set: any) {
    set.status = result.status || 400;
    return {
        success: false,
        ...(result.code ? { code: result.code } : {}),
        message: result.error,
    };
}

export const productsController = (app: any) =>
    app
        .get('/', async ({ session, set, query }: any) => {
            if (query.sellerId) {
                const result = await adminService.listProductsBySeller(Number(query.sellerId));
                return { success: true, data: result.data };
            }

            const result = await catalogService.list({
                search: query.search,
                categoryId: query.categoryId ? Number(query.categoryId) : undefined,
                minPrice: query.minPrice ? Number(query.minPrice) : undefined,
                maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
                isNegotiable: query.isNegotiable ? query.isNegotiable === 'true' : undefined,
                sortBy: query.sortBy || query.sort_by,
                sortOrder: query.sortOrder || query.order,
                page: query.page ? Number(query.page) : 1,
                limit: query.limit ? Number(query.limit) : 12,
            });

            return {
                success: true,
                data: result.rows,
                meta: { total: result.total, page: result.page, limit: result.limit },
            };
        })

        .post('/', async ({ body, session, set }: any) => {
            const userId = session.get('userId');
            if (!userId) return authError(set);

            const result = await catalogService.createSellerProduct(Number(userId), body);
            if (result.error) return serviceError(result, set);

            set.status = 201;
            return { success: true, message: 'Produk berhasil ditambahkan', data: result.data };
        }, { body: ProductRequest })

        .patch('/:id', async ({ body, session, params: { id }, set }: any) => {
            const userId = session.get('userId');
            if (!userId) return authError(set);

            const result = await catalogService.updateSellerProduct(Number(userId), Number(id), body);
            if (result.error) return serviceError(result, set);

            return { success: true, message: 'Produk berhasil diperbarui', data: result.data };
        }, { body: ProductRequest })

        .patch('/:id/takedown', async ({ session, params: { id }, request, set }: any) => {
            const userId = session.get('userId');
            if (!userId) return authError(set);

            const result = await catalogService.deleteSellerProduct({
                actorId: Number(userId),
                actorRole: session.get('role'),
                productId: Number(id),
                ipAddress: request?.headers?.get('x-forwarded-for') || request?.headers?.get('x-real-ip') || undefined,
            });

            if (result.error) return serviceError(result, set);

            return { success: true, message: 'Produk berhasil dihapus dari katalog', data: result.data };
        });
