type ServiceResult<T> = { data?: T; error?: string; status?: number; errorCode?: string };

type TimeoutResult = { error: string; status: number; errorCode: string; data?: undefined };

function isTimeout(err: any): boolean {
    return (
        err?.code === 'ETIMEDOUT' ||
        err?.code === 'ECONNRESET' ||
        err?.code === 'ECONNREFUSED' ||
        err?.message?.toLowerCase().includes('timeout') ||
        err?.message?.toLowerCase().includes('timed out') ||
        err?.message?.toLowerCase().includes('connection lost')
    );
}

export function getTimeoutResult(err: any, context: string): TimeoutResult | null {
    if (isTimeout(err)) {
        console.error(`[${context}] Database timeout:`, err?.message);
        return {
            error: 'Waktu koneksi habis. Silakan coba lagi.',
            status: 503,
            errorCode: 'ERR-TIMEOUT-01',
        };
    }
    return null;
}

export async function withTimeout<T>(
    promise: Promise<T>,
    context: string,
): Promise<ServiceResult<T>> {
    try {
        const data = await promise;
        return { data };
    } catch (err: any) {
        const timeout = getTimeoutResult(err, context);
        if (timeout) return timeout;
        throw err;
    }
}
