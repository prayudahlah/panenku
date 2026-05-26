import { authRepo, sellerRepo } from '../repositories';
import type { CreateSellerProfileInput } from '../dtos/seller';

type ServiceResult<T> = { data?: T; error?: string; status?: number };

export async function register(userId: number, input: CreateSellerProfileInput): Promise<ServiceResult<any>> {
    const existing = await sellerRepo.findByUserId(userId);
    if (existing) return { error: 'Sudah memiliki toko', status: 409 };

    const user = await authRepo.findById(userId);
    if (!user) return { error: 'User tidak ditemukan', status: 404 };
    if (user.role !== 'buyer') return { error: 'Hanya buyer yang bisa daftar jadi penjual', status: 403 };

    await sellerRepo.create({
        userId,
        farmName: input.farmName,
        address: input.address,
        cityId: input.cityId,
        provinceId: input.provinceId,
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
