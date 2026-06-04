import { dashboardRepo } from '../repositories';
import { getTimeoutResult } from '../utils/withTimeout';

type DashboardProcedureResult = {
    result: string;
    data: any;
    message: string;
};

function getStatusFromProcedureResult(result: string) {
    if (result === 'ERR-LOG-01') return 401;
    if (result === 'ERR-DASH-02') return 403;
    if (result === 'ERR-TIMEOUT-01') return 504;
    if (result === 'ERR-DASH-01') return 500;

    return 400;
}

function handleProcedureResult(result: DashboardProcedureResult | null | undefined) {
    if (!result) {
        return {
            error: 'Gagal mengambil data dashboard',
            status: 500,
            errorCode: 'ERR-DASH-01',
        };
    }

    if (result.result === 'SUCCESS') {
        return {
            data: result.data,
        };
    }

    return {
        error: result.message || 'Gagal mengambil data dashboard',
        status: getStatusFromProcedureResult(result.result),
        errorCode: result.result || 'ERR-DASH-01',
    };
}

export async function getBuyerDashboard(userId: number) {
    try {
        const result = await dashboardRepo.getBuyerDashboard(userId);
        return handleProcedureResult(result);
    } catch (err: any) {
        const timeout = getTimeoutResult(err, 'dashboard.getBuyerDashboard');
        if (timeout) return timeout;
        console.error('[dashboardService.getBuyerDashboard]', err);

        return {
            error: 'Gagal mengambil data dashboard pembeli',
            status: 500,
            errorCode: 'ERR-DASH-01',
        };
    }
}

export async function getSellerDashboard(userId: number) {
    try {
        const result = await dashboardRepo.getSellerDashboard(userId);
        return handleProcedureResult(result);
    } catch (err: any) {
        const timeout = getTimeoutResult(err, 'dashboard.getSellerDashboard');
        if (timeout) return timeout;
        console.error('[dashboardService.getSellerDashboard]', err);

        return {
            error: 'Gagal mengambil data dashboard penjual',
            status: 500,
            errorCode: 'ERR-DASH-01',
        };
    }
}

export async function getAdminDashboard(userId: number) {
    try {
        const result = await dashboardRepo.getAdminDashboard(userId);
        return handleProcedureResult(result);
    } catch (err: any) {
        const timeout = getTimeoutResult(err, 'dashboard.getAdminDashboard');
        if (timeout) return timeout;
        console.error('[dashboardService.getAdminDashboard]', err);

        return {
            error: 'Gagal mengambil data dashboard admin',
            status: 500,
            errorCode: 'ERR-DASH-01',
        };
    }
}