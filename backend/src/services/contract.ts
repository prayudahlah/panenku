import { db } from '../db';
import { contractRepo, userAddressRepo, sellerRepo } from '../repositories';
import * as notificationService from './notification';
import * as auditService from './audit';
import type { CreateContractInput, RespondContractInput } from '../dtos/contract';

const DAY_MAP: Record<string, string> = {
    senin: 'monday', selasa: 'tuesday', rabu: 'wednesday',
    kamis: 'thursday', jumat: 'friday', sabtu: 'saturday', minggu: 'sunday',
};

export async function create(userId: number, body: CreateContractInput) {
    const address = await userAddressRepo.findById(body.addressId);
    if (!address) return { error: 'Alamat tidak ditemukan', status: 404 };
    if (address.userId !== userId) return { error: 'Akses ditolak', status: 403 };

    const seller = await sellerRepo.findByUserId(body.sellerId);
    if (!seller) return { error: 'Penjual tidak ditemukan', status: 404 };
    if (seller.status !== 'active') return { error: 'Penjual tidak aktif', status: 403 };

    const start = new Date(body.startDate);
    const end = new Date(body.endDate);
    if (end <= start) return { error: 'Tanggal berakhir harus setelah tanggal mulai', status: 422, errorCode: 'ERR-PARTNER-01' };

    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 30) return { error: 'Kontrak minimal 1 bulan', status: 422, errorCode: 'ERR-PARTNER-01' };

    if (!body.products || body.products.length === 0) {
        return { error: 'Kontrak harus berisi minimal satu produk', status: 422, errorCode: 'ERR-PARTNER-02' };
    }

    if (!body.schedules || body.schedules.length === 0) {
        return { error: 'Jadwal pengiriman tidak boleh kosong', status: 422, errorCode: 'ERR-PARTNER-02' };
    }

    let totalAmount = 0;
    const productRows: { product: any; quantity: number; unitId: number; subtotal: number; description?: string }[] = [];
    for (const p of body.products) {
        const product = await contractRepo.findProductById(p.productId);
        if (!product) return { error: `Produk ID ${p.productId} tidak ditemukan`, status: 404 };
        if (product.sellerId !== body.sellerId) return { error: `Produk ID ${p.productId} bukan milik penjual ini`, status: 422 };

        const qty = Number(p.quantity);
        const stock = Number(product.stockQuantity);

        if (qty > stock) return { error: `Stok "${product.name}" tidak mencukupi untuk kontrak`, status: 422 };

        if (!p.unitId) return { error: `Satuan untuk "${product.name}" wajib dipilih`, status: 422 };
        const unit = await contractRepo.findUnitById(p.unitId);
        if (!unit) return { error: `Satuan untuk "${product.name}" tidak valid`, status: 422 };

        const subtotal = Number(product.pricePerUnit) * qty;
        totalAmount += subtotal;
        productRows.push({ product, quantity: qty, unitId: p.unitId, subtotal, description: p.description });
    }

    let contract;
    try {
        contract = await db.transaction(async (tx: any) => {
            const shipment = await contractRepo.createShipment(tx, {
                courierName: null,
                provinceId: address.provinceId,
                cityId: address.cityId,
                shippingAddress: address.address,
                shipmentStatusId: 1,
            });

            const totalShipping = body.frequency === 'daily' ? diffDays
                : body.frequency === 'weekly' ? Math.ceil(diffDays / 7)
                : body.frequency === 'monthly' ? Math.ceil(diffDays / 30)
                : body.schedules.length;

            const contract = await contractRepo.createContract(tx, {
                buyerId: userId,
                sellerId: body.sellerId,
                shipmentId: shipment.id,
                totalAmount: String(totalAmount),
                deliveryLocation: address.address,
                startDate: body.startDate,
                endDate: body.endDate,
                frequency: body.frequency,
                totalShipping,
                description: body.description ?? null,
                contractStatusId: 1,
            });

            const contractProductsData = productRows.map((pr) => ({
                contractId: contract.id,
                productId: pr.product.id,
                quantity: String(pr.quantity),
                unitId: pr.unitId,
                subtotal: String(pr.subtotal),
                totalQuantity: String(pr.quantity * totalShipping),
                description: pr.description ?? null,
            }));
            await contractRepo.createContractProducts(tx, contractProductsData);

            const schedulesData = body.schedules.map((s) => ({
                contractId: contract.id,
                deliveryDay: (s.deliveryDay ? DAY_MAP[s.deliveryDay.toLowerCase()] : null) ?? s.deliveryDay ?? null,
                deliveryDate: s.deliveryDate ?? null,
                deliveryTime: s.deliveryTime ?? null,
            }));
            await contractRepo.createContractSchedules(tx, schedulesData);

            return contract;
        });
    } catch (err) {
        console.error('[contract.create] transaction failed:', err);
        return { error: 'Gagal menyimpan kontrak. Periksa kembali data Anda.', status: 500 };
    }

    notificationService.create(
        body.sellerId,
        'Pengajuan Kemitraan',
        `Pembeli mengajukan kontrak kemitraan untuk produk Anda`,
        'contract',
        'contract',
        contract.id,
    );

    await auditService.log({
        userId,
        action: 'contract.created',
        entityType: 'contract',
        entityId: contract.id,
        newData: body,
    });

    return { data: { id: contract.id } };
}

export async function respond(userId: number, contractId: number, body: RespondContractInput) {
    const contract = await contractRepo.findContractById(contractId);
    if (!contract) return { error: 'Kontrak tidak ditemukan', status: 404, errorCode: 'ERR-PARTNER-03' };

    if (contract.sellerId !== userId) {
        return { error: 'Hanya penjual penerima kontrak yang dapat merespon', status: 403, errorCode: 'ERR-PARTNER-03' };
    }

    if (contract.contractStatusId === 4) return { error: 'Kontrak telah dibatalkan', status: 409, errorCode: 'ERR-PARTNER-03' };
    if (contract.contractStatusId !== 1) return { error: 'Kontrak sudah direspons sebelumnya', status: 409, errorCode: 'ERR-PARTNER-03' };

    const statusId = body.action === 'accepted' ? 2 : 6;

    await db.transaction(async (tx: any) => {
        await contractRepo.updateContractStatus(tx, contractId, statusId);
    });

    const notifTitle = body.action === 'accepted' ? 'Kemitraan Disetujui' : 'Kemitraan Ditolak';
    const notifMsg = body.action === 'accepted'
        ? 'Penjual menyetujui kontrak kemitraan Anda'
        : 'Penjual menolak kontrak kemitraan Anda';

    notificationService.create(contract.buyerId, notifTitle, notifMsg, 'contract', 'contract', contractId);

    await auditService.log({
        userId,
        action: `contract.${body.action}`,
        entityType: 'contract',
        entityId: contractId,
        oldData: { contractStatusId: 1 },
        newData: { contractStatusId: statusId },
    });

    return { data: { id: contractId, contractStatusId: statusId } };
}

export async function cancel(userId: number, contractId: number) {
    const contract = await contractRepo.findContractById(contractId);
    if (!contract) return { error: 'Kontrak tidak ditemukan', status: 404, errorCode: 'ERR-PARTNER-03' };
    if (contract.buyerId !== userId) return { error: 'Hanya pembeli yang dapat membatalkan kontrak', status: 403 };
    if (contract.contractStatusId !== 1) return { error: 'Hanya kontrak pending yang dapat dibatalkan', status: 409 };

    try {
        await db.transaction(async (tx: any) => {
            await contractRepo.updateContractStatus(tx, contractId, 4);
        });
    } catch (err) {
        console.error('[contract.cancel] transaction failed:', err);
        return { error: 'Gagal membatalkan kontrak', status: 500 };
    }

    notificationService.create(
        contract.sellerId,
        'Kontrak Dibatalkan',
        `Pembeli membatalkan kontrak kemitraan`,
        'contract',
        'contract',
        contractId,
    );

    await auditService.log({
        userId,
        action: 'contract.cancelled',
        entityType: 'contract',
        entityId: contractId,
        oldData: { contractStatusId: 1 },
        newData: { contractStatusId: 4 },
    });

    return { data: { id: contractId, contractStatusId: 4 } };
}

export async function list(userId: number, role: string) {
    if (role === 'admin') {
        const rows = await contractRepo.findAllContracts();
        return { data: rows };
    }
    if (role === 'buyer') {
        const rows = await contractRepo.findContractsByBuyer(userId);
        return { data: rows };
    }
    if (role === 'seller') {
        const rows = await contractRepo.findContractsBySeller(userId);
        return { data: rows };
    }
    return { data: [] };
}

export async function getDetail(contractId: number, userId: number, role: string) {
    const contract = await contractRepo.findContractById(contractId);
    if (!contract) return { error: 'Kontrak tidak ditemukan', status: 404 };

    if (role !== 'admin') {
        if (role === 'buyer' && contract.buyerId !== userId) return { error: 'Akses ditolak', status: 403 };
        if (role === 'seller' && contract.sellerId !== userId) return { error: 'Akses ditolak', status: 403 };
    }

    return { data: contract };
}
