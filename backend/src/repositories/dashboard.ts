import { db } from '../db';
import { sql } from 'drizzle-orm';

type RawDashboardProcedureRow = {
    p_result?: string | null;
    p_data?: unknown;
    p_message?: string | null;
};

type DashboardProcedureResult = {
    result: string;
    data: any;
    message: string;
};

function getFirstRow(result: any): RawDashboardProcedureRow | null {
    if (Array.isArray(result)) return result[0] || null;
    if (Array.isArray(result?.rows)) return result.rows[0] || null;

    return null;
}

function parseJsonb(value: unknown) {
    if (!value) return {};

    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }

    return value;
}

function normalizeProcedureResult(result: any): DashboardProcedureResult {
    const row = getFirstRow(result);

    return {
        result: row?.p_result || 'ERR-DASH-01',
        data: parseJsonb(row?.p_data),
        message: row?.p_message || 'Gagal mengambil data dashboard',
    };
}

export async function getBuyerDashboard(userId: number) {
    const result = await db.execute(sql`
        CALL util.sp_get_buyer_dashboard(
            ${userId}::BIGINT,
            NULL::VARCHAR,
            NULL::JSONB,
            NULL::TEXT
        )
    `);

    return normalizeProcedureResult(result);
}

export async function getSellerDashboard(userId: number) {
    const result = await db.execute(sql`
        CALL util.sp_get_seller_dashboard(
            ${userId}::BIGINT,
            NULL::VARCHAR,
            NULL::JSONB,
            NULL::TEXT
        )
    `);

    return normalizeProcedureResult(result);
}

export async function getAdminDashboard(userId: number) {
    const result = await db.execute(sql`
        CALL util.sp_get_admin_dashboard(
            ${userId}::BIGINT,
            NULL::VARCHAR,
            NULL::JSONB,
            NULL::TEXT
        )
    `);

    return normalizeProcedureResult(result);
}