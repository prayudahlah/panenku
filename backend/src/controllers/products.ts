import { adminService, catalogService } from '../services';

export const productsController = (app: any) =>
    app
        .get('/', async ({ session, set, query }: any) => {
            if (query.sellerId) {
                if (session.get('role') !== 'admin') { set.status = 403; return { success: false, message: 'Akses ditolak' }; }
                const result = await adminService.listProductsBySeller(Number(query.sellerId));
                return { success: true, data: result.data };
            }

            const result = await catalogService.list({
                search: query.search,
                categoryId: query.categoryId ? Number(query.categoryId) : undefined,
                minPrice: query.minPrice ? Number(query.minPrice) : undefined,
                maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
                sortBy: query.sortBy,
                sortOrder: query.sortOrder,
                page: query.page ? Number(query.page) : 1,
                limit: query.limit ? Number(query.limit) : 12,
            });
            return { success: true, data: result.rows, meta: { total: result.total, page: result.page, limit: result.limit } };
        })

        .patch('/:id/takedown', async ({ session, params: { id }, set }: any) => {
            if (session.get('role') !== 'admin') { set.status = 403; return { success: false, message: 'Akses ditolak' }; }
            const result = await adminService.takedownProduct(Number(id));
            return { success: true, data: result.data };
        });
