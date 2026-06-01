import { adminRepo } from '../repositories';
import { auditService } from '../services';

type ServiceResult<T> = { data?: T; error?: string; status?: number };

export async function listUsers(): Promise<ServiceResult<any[]>> {
    const data = await adminRepo.listUsers();
    return { data };
}

export async function updateUserStatus(userId: number, status: string, adminId?: number): Promise<ServiceResult<any>> {
    const user = await adminRepo.findById(userId);
    if (!user) return { error: 'User tidak ditemukan', status: 404 };
    if (['admin', 'super_admin'].includes(user.role)) return { error: 'Tidak dapat mengubah status admin', status: 403 };

    const oldStatus = user.status;

    const updated = await adminRepo.updateUserStatus(userId, status);

    auditService.log({
        userId: adminId,
        action: status === 'active' ? 'user.activated' : 'user.suspended',
        entityType: 'user',
        entityId: userId,
        oldData: { status: oldStatus },
        newData: { status },
    });

    return { data: updated };
}

export async function listSellers(): Promise<ServiceResult<any[]>> {
    const data = await adminRepo.listSellers();
    return { data };
}

export async function listProductsBySeller(sellerId: number): Promise<ServiceResult<any[]>> {
    const data = await adminRepo.listProductsBySeller(sellerId);
    return { data };
}

export async function takedownProduct(productId: number): Promise<ServiceResult<any>> {
    const updated = await adminRepo.takedownProduct(productId);
    return { data: updated };
}
