import { userAddressRepo } from '../repositories';
import type { CreateAddressInput, UpdateAddressInput } from '../dtos/userAddress';

export async function list(userId: number) {
    const rows = await userAddressRepo.findByUserId(userId);
    return { data: rows };
}

export async function create(userId: number, body: CreateAddressInput) {
    const count = await userAddressRepo.countByUserId(userId);
    if (count >= 10) return { error: 'Maksimal 10 alamat tersimpan', status: 422, errorCode: 'ERR-ADDR-01' };

    if (body.isDefault) {
        await userAddressRepo.resetDefault(userId);
    }

    const address = await userAddressRepo.create({
        userId,
        label: body.label,
        provinceId: body.provinceId,
        cityId: body.cityId,
        address: body.address,
        isDefault: body.isDefault ?? count === 0,
    });

    return { data: address };
}

export async function update(userId: number, id: number, body: UpdateAddressInput) {
    const existing = await userAddressRepo.findById(id);
    if (!existing) return { error: 'Alamat tidak ditemukan', status: 404 };
    if (existing.userId !== userId) return { error: 'Akses ditolak', status: 403 };

    if (body.isDefault) {
        await userAddressRepo.resetDefault(userId);
    }

    const updated = await userAddressRepo.update(id, body);
    return { data: updated };
}

export async function remove(userId: number, id: number) {
    const existing = await userAddressRepo.findById(id);
    if (!existing) return { error: 'Alamat tidak ditemukan', status: 404 };
    if (existing.userId !== userId) return { error: 'Akses ditolak', status: 403 };

    await userAddressRepo.softDelete(id);
    return { data: { id } };
}
