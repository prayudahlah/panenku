import { auditRepo } from '../repositories';

export const log = async ({
    userId,
    action,
    entityType,
    entityId,
    oldData,
    newData,
    ipAddress,
}: {
    userId?: number;
    action: string;
    entityType?: string;
    entityId?: number;
    oldData?: any;
    newData?: any;
    ipAddress?: string;
}) => {
    await auditRepo.create({ userId, action, entityType, entityId, oldData, newData, ipAddress });
};

export const listLogs = async (filters: {
    action?: string;
    entityType?: string;
    userId?: number;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}) => {
    return auditRepo.list(filters);
};
