import { auditService } from '../services';

export const auditController = (app: any) =>
    app
        .get('/', async ({ session, set, query }: any) => {
            if (!['admin', 'super_admin'].includes(session.get('role'))) { set.status = 403; return { success: false, message: 'Akses ditolak' }; }

            const { rows, total, page, limit } = await auditService.listLogs({
                action: query.action,
                entityType: query.entityType,
                userId: query.userId ? Number(query.userId) : undefined,
                dateFrom: query.dateFrom,
                dateTo: query.dateTo,
                page: query.page ? Number(query.page) : 1,
                limit: query.limit ? Number(query.limit) : 50,
            });

            return { success: true, data: rows, meta: { total, page, limit } };
        });
