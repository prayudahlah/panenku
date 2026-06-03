import { authRepo, sellerRepo, catalogRepo } from '../repositories';
import type { CreateSellerProfileInput } from '../dtos/seller';

type ServiceResult<T> = {
    data?: T;
    error?: string;
    code?: string;
    status?: number;
};

const ERR = {
    CAT_01: 'ERR-CAT-01',
    CAT_02: 'ERR-CAT-02',
    CAT_03: 'ERR-CAT-03',
    TIMEOUT: 'ERR-TIMEOUT-01',
} as const;

export async function register(
    userId: number,
    input: CreateSellerProfileInput
): Promise<ServiceResult<any>> {
    const existing = await sellerRepo.findByUserId(userId);
    if (existing) return { error: 'Sudah memiliki toko', status: 409, code: 'ERR-SELL-01' };
    const user = await authRepo.findById(userId);
    if (!user) return { error: 'User tidak ditemukan', status: 404 };
    if (user.role !== 'buyer')
        return { error: 'Hanya buyer yang bisa daftar jadi penjual', status: 403 };
    await sellerRepo.create({
        userId,
        farmName: input.farmName,
        address: input.address,
        cityId: input.cityId,
        provinceId: input.provinceId,
        landCertificate: input.landCertificate ?? null,
    });
    const updated = await authRepo.updateRole(userId, 'seller');
    return {
        data: {
            id: updated.id,
            email: updated.email,
            fullName: updated.fullName,
            role: updated.role,
        },
    };
}

export async function getProfile(userId: number): Promise<ServiceResult<any>> {
    const profile = await sellerRepo.findByUserId(userId);
    if (!profile) return { error: 'Belum memiliki toko', status: 404 };
    return { data: profile };
}


/**
 * FSD-04.2: Melihat profil penjual publik
 */
export async function getPublicProfile(userId: number): Promise<ServiceResult<any>> {
    let profile;
    try {
        profile = await sellerRepo.getPublicProfileByUserId(userId);
    } catch (error) {
        console.error(error);
        return { error: 'Terjadi kesalahan pada server', code: ERR.CAT_02, status: 500 };
    }
    if (!profile) {
        return { error: 'Penjual tidak ditemukan', status: 404 };
    }
    if (profile.status === 'suspended') {
        return { error: 'Penjual ini ditangguhkan', code: ERR.CAT_03, status: 403 };
    }
    if (profile.status !== 'active') {
        return { error: 'Penjual ini tidak aktif', code: ERR.CAT_01, status: 403 };
    }
    let activeProductCount;
    try {
        activeProductCount = await sellerRepo.countActiveProductsByUserId(userId);
    } catch (error) {
        console.error(error);
        return { error: 'Terjadi kesalahan pada server', code: ERR.CAT_02, status: 500 };
    }
    return {
        data: {
            sellerId: profile.userId,
            farmName: profile.farmName,
            address: profile.address,
            sellerName: profile.userFullName,
            sellerEmail: profile.userEmail,
            sellerPhone: profile.userPhone,
            city: profile.cityName,
            province: profile.provinceName,
            activeProductCount,
            createdAt: profile.createdAt,
        },
    };
}

/**
 * FSD-04.3: Melihat katalog produk satu penjual (publik)
 */
export async function getCatalogBySellerPublic(
    userId: number,
    filters: {
        search?: string;
        categoryId?: number;
        minPrice?: number;
        maxPrice?: number;
        isNegotiable?: boolean;
        sortBy?: string;
        sortOrder?: string;
        page?: number;
        limit?: number;
    }
): Promise<ServiceResult<any>> {
    let profile;
    try {
        profile = await sellerRepo.getPublicProfileByUserId(userId);
    } catch (error) {
        console.error(error);
        return { error: 'Terjadi kesalahan pada server', code: ERR.CAT_02, status: 500 };
    }
    if (!profile) {
        return { error: 'Penjual tidak ditemukan', status: 404 };
    }
    if (profile.status === 'suspended') {
        return { error: 'Penjual ini ditangguhkan', code: ERR.CAT_03, status: 403 };
    }
    if (profile.status !== 'active') {
        return { error: 'Penjual ini tidak aktif', code: ERR.CAT_01, status: 403 };
    }
    let catalogData;
    try {
        catalogData = await catalogRepo.listBySeller({ sellerId: userId, ...filters });
    } catch (error) {
        console.error(error);
        return { error: 'Terjadi kesalahan pada server', code: ERR.CAT_02, status: 500 };
    }
    const message = catalogData.rows.length === 0 ? 'Penjual belum memiliki produk' : undefined;
    return {
        data: {
            rows: catalogData.rows,
            total: catalogData.total,
            page: catalogData.page,
            limit: catalogData.limit,
            message,
        },
    };
}
