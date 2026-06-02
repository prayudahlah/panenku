import { dashboardRepo } from '../repositories';

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
    } catch (error) {
        console.error('[dashboardService.getBuyerDashboard]', error);

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
    } catch (error) {
        console.error('[dashboardService.getSellerDashboard]', error);

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
    } catch (error) {
        console.error('[dashboardService.getAdminDashboard]', error);

        return {
            error: 'Gagal mengambil data dashboard admin',
            status: 500,
            errorCode: 'ERR-DASH-01',
        };
    }
}