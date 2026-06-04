import { db } from '../db';
import { eq } from 'drizzle-orm';
import { negotiations } from '../db/schema';
import { negotiationRepo } from '../repositories';
import * as notificationService from './notification';
import * as auditService from './audit';
import type { CreateNegotiationInput, SellerRespondInput, BuyerRespondInput } from '../dtos/negotiation';

type ServiceResult<T> = { data?: T; error?: string; status?: number; errorCode?: string };

export async function initiate(userId: number, body: CreateNegotiationInput) {
    const product = await negotiationRepo.findProductById(body.productId);
    if (!product) return { error: 'Produk tidak ditemukan', status: 404 };
    if (!product.isNegotiable) return { error: 'Produk tidak dapat dinegosiasikan', status: 422 };

    const minQty = Number(product.minOrderQty) || 0;
    if (body.quantityOffer < minQty) return { error: 'Kuantitas di bawah minimum pembelian', status: 422, errorCode: 'ERR-NEGO-01' };

    const unit = await negotiationRepo.findUnitById(body.unitId);
    if (!unit) return { error: 'Satuan tidak valid', status: 422 };

    if (body.priceOffer >= Number(product.pricePerUnit)) {
        return { error: 'Harga penawaran tidak boleh melebihi harga produk', status: 422 };
    }

    const productStock = Number(product.stockQuantity);
    if (body.quantityOffer > productStock) {
        return { error: 'Kuantitas melebihi stok yang tersedia', status: 422 };
    }

    const validUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const result = await db.transaction(async (tx: any) => {
        const existing = await negotiationRepo.findPendingByProductAndBuyer(body.productId, userId, tx);
        if (existing) return null;

        const nego = await negotiationRepo.createNegotiation(tx, {
            sellerId: product.sellerId,
            buyerId: userId,
            productId: body.productId,
            agreedPriceOffer: String(body.priceOffer),
            agreedUnitId: body.unitId,
            agreedQuantityOffer: String(body.quantityOffer),
            validUntil,
        });

        await negotiationRepo.createChat(tx, {
            negotiationId: nego.id,
            turnOrder: 1,
            turnOwner: 'buyer',
            offerPrice: String(body.priceOffer),
            unitId: body.unitId,
            quantityOffer: String(body.quantityOffer),
            description: body.description,
        });

        return nego;
    });

    if (!result) return { error: 'Anda sudah memiliki negosiasi aktif untuk produk ini', status: 409 };

    notificationService.create(
        product.sellerId,
        'Penawaran baru',
        `Pembeli menawarkan Rp ${Number(body.priceOffer).toLocaleString('id-ID')} untuk produk Anda`,
        'negotiation',
        'negotiation',
        result.id,
    );

    await auditService.log({
        userId,
        action: 'negotiation.created',
        entityType: 'negotiation',
        entityId: result.id,
        newData: { priceOffer: body.priceOffer, quantityOffer: body.quantityOffer, unitId: body.unitId, productId: body.productId },
    });

    return { data: result };
}

export async function sellerRespond(userId: number, negotiationId: number, body: SellerRespondInput) {
    const nego = await negotiationRepo.findNegotiationById(negotiationId);
    if (!nego) return { error: 'Negosiasi tidak ditemukan', status: 404 };

    if (nego.sellerId !== userId) return { error: 'Hanya penjual pemilik produk yang dapat merespon', status: 403 };

    if (nego.status === 'canceled') return { error: 'Negosiasi telah dibatalkan oleh pembeli', status: 410, errorCode: 'ERR-NEGO-03' };

    if (nego.status === 'expired') return { error: 'Waktu negosiasi telah berakhir', status: 410, errorCode: 'ERR-NEGO-04' };
    if (new Date(nego.validUntil) < new Date()) {
        await negotiationRepo.updateNegotiation(db, negotiationId, { status: 'expired' });
        notificationService.create(nego.buyerId, 'Negosiasi Berakhir', 'Waktu negosiasi telah habis', 'negotiation', 'negotiation', negotiationId);
        notificationService.create(nego.sellerId, 'Negosiasi Berakhir', 'Waktu negosiasi telah habis', 'negotiation', 'negotiation', negotiationId);
        await auditService.log({ userId, action: 'negotiation.expired', entityType: 'negotiation', entityId: negotiationId });
        return { error: 'Waktu negosiasi telah berakhir', status: 410, errorCode: 'ERR-NEGO-04' };
    }

    if (nego.status !== 'ongoing') return { error: 'Negosiasi tidak dalam status aktif', status: 409 };

    const latestChat = await negotiationRepo.findLatestChat(negotiationId);
    if (!latestChat || latestChat.turnOwner !== 'buyer') {
        return { error: 'Menunggu respons dari pembeli', status: 403, errorCode: 'ERR-NEGO-02' };
    }

    if (body.action === 'counter') {
        if (body.priceOffer == null || body.unitId == null || body.quantityOffer == null) {
            return { error: 'Harga, satuan, dan kuantitas wajib diisi untuk tawaran balik', status: 422 };
        }

        const unit = await negotiationRepo.findUnitById(body.unitId);
        if (!unit) return { error: 'Satuan tidak valid', status: 422 };

        if (body.priceOffer >= Number(nego.pricePerUnit)) {
            return { error: 'Harga penawaran tidak boleh melebihi harga produk', status: 422 };
        }

        const productStock = Number(nego.stockQuantity);
        if (body.quantityOffer > productStock) {
            return { error: 'Kuantitas melebihi stok yang tersedia', status: 422 };
        }
    }

    const newTurnOrder = latestChat.turnOrder + 1;

    await db.transaction(async (tx: any) => {
        if (body.action === 'accept') {
            await negotiationRepo.updateNegotiation(tx, negotiationId, { status: 'accepted' });
        } else if (body.action === 'reject') {
            await negotiationRepo.updateNegotiation(tx, negotiationId, { status: 'rejected' });
        } else if (body.action === 'counter') {
            await negotiationRepo.updateNegotiation(tx, negotiationId, {
                agreedPriceOffer: String(body.priceOffer!),
                agreedUnitId: body.unitId!,
                agreedQuantityOffer: String(body.quantityOffer!),
            });
        }

        const offerPrice = body.action === 'counter' ? String(body.priceOffer!) : nego.agreedPriceOffer;
        const unitId = body.action === 'counter' ? body.unitId! : nego.agreedUnitId;
        const quantityOffer = body.action === 'counter' ? String(body.quantityOffer!) : nego.agreedQuantityOffer;

        await negotiationRepo.createChat(tx, {
            negotiationId,
            turnOrder: newTurnOrder,
            turnOwner: 'seller',
            offerPrice,
            unitId,
            quantityOffer,
            description: body.description,
        });
    });

    const resultStatus = body.action === 'accept' ? 'accepted' : body.action === 'reject' ? 'rejected' : 'ongoing';

    if (body.action === 'accept') {
        notificationService.create(nego.buyerId, 'Penawaran diterima', 'Penjual menyetujui penawaran Anda', 'negotiation', 'negotiation', negotiationId);
        await auditService.log({ userId, action: 'negotiation.accepted', entityType: 'negotiation', entityId: negotiationId, oldData: { status: 'ongoing' }, newData: { status: 'accepted' } });
    } else if (body.action === 'reject') {
        notificationService.create(nego.buyerId, 'Penawaran ditolak', 'Penjual menolak penawaran Anda', 'negotiation', 'negotiation', negotiationId);
        await auditService.log({ userId, action: 'negotiation.rejected', entityType: 'negotiation', entityId: negotiationId, oldData: { status: 'ongoing' }, newData: { status: 'rejected' } });
    } else if (body.action === 'counter') {
        notificationService.create(nego.buyerId, 'Tawaran balik', `Penjual menawarkan Rp ${Number(body.priceOffer).toLocaleString('id-ID')}`, 'negotiation', 'negotiation', negotiationId);
        await auditService.log({ userId, action: 'negotiation.countered', entityType: 'negotiation', entityId: negotiationId, oldData: { priceOffer: nego.agreedPriceOffer, quantityOffer: nego.agreedQuantityOffer }, newData: { priceOffer: body.priceOffer, quantityOffer: body.quantityOffer } });
    }

    return { data: { id: negotiationId, status: resultStatus, turnOrder: newTurnOrder } };
}

export async function buyerRespond(userId: number, negotiationId: number, body: BuyerRespondInput) {
    const nego = await negotiationRepo.findNegotiationById(negotiationId);
    if (!nego) return { error: 'Negosiasi tidak ditemukan', status: 404 };

    if (nego.buyerId !== userId) return { error: 'Hanya pembeli pengaju tawaran yang dapat merespon', status: 403 };

    if (nego.status === 'canceled') return { error: 'Negosiasi telah dibatalkan', status: 410, errorCode: 'ERR-NEGO-03' };

    if (nego.status === 'expired') return { error: 'Waktu negosiasi telah berakhir', status: 410, errorCode: 'ERR-NEGO-04' };
    if (new Date(nego.validUntil) < new Date()) {
        await negotiationRepo.updateNegotiation(db, negotiationId, { status: 'expired' });
        notificationService.create(nego.buyerId, 'Negosiasi Berakhir', 'Waktu negosiasi telah habis', 'negotiation', 'negotiation', negotiationId);
        notificationService.create(nego.sellerId, 'Negosiasi Berakhir', 'Waktu negosiasi telah habis', 'negotiation', 'negotiation', negotiationId);
        await auditService.log({ userId, action: 'negotiation.expired', entityType: 'negotiation', entityId: negotiationId });
        return { error: 'Waktu negosiasi telah berakhir', status: 410, errorCode: 'ERR-NEGO-04' };
    }

    if (nego.status !== 'ongoing') return { error: 'Negosiasi tidak dalam status aktif', status: 409 };

    if (body.action === 'cancel') {
        const latestChat = await negotiationRepo.findLatestChat(negotiationId);
        const newTurnOrder = (latestChat?.turnOrder ?? 0) + 1;

        await db.transaction(async (tx: any) => {
            await negotiationRepo.updateNegotiation(tx, negotiationId, { status: 'canceled' });
            await negotiationRepo.createChat(tx, {
                negotiationId,
                turnOrder: newTurnOrder,
                turnOwner: 'buyer',
                offerPrice: nego.agreedPriceOffer,
                unitId: nego.agreedUnitId,
                quantityOffer: nego.agreedQuantityOffer,
                description: body.description || 'Negosiasi dibatalkan',
            });
        });

        notificationService.create(nego.sellerId, 'Negosiasi dibatalkan', 'Pembeli membatalkan negosiasi', 'negotiation', 'negotiation', negotiationId);
        await auditService.log({ userId, action: 'negotiation.canceled', entityType: 'negotiation', entityId: negotiationId, oldData: { status: 'ongoing' }, newData: { status: 'canceled' } });
        return { data: { id: negotiationId, status: 'canceled' } };
    }

    if (body.action === 'counter') {
        if (body.priceOffer == null || body.unitId == null || body.quantityOffer == null) {
            return { error: 'Harga, satuan, dan kuantitas wajib diisi untuk tawaran balik', status: 422 };
        }

        const unit = await negotiationRepo.findUnitById(body.unitId);
        if (!unit) return { error: 'Satuan tidak valid', status: 422 };

        if (body.priceOffer >= Number(nego.pricePerUnit)) {
            return { error: 'Harga penawaran tidak boleh melebihi harga produk', status: 422 };
        }

        const productStock = Number(nego.stockQuantity);
        if (body.quantityOffer > productStock) {
            return { error: 'Kuantitas melebihi stok yang tersedia', status: 422 };
        }
    }

    const latestChat = await negotiationRepo.findLatestChat(negotiationId);
    if (!latestChat || latestChat.turnOwner !== 'seller') {
        return { error: 'Menunggu respons dari penjual', status: 403, errorCode: 'ERR-NEGO-05' };
    }

    const newTurnOrder = latestChat.turnOrder + 1;
    const isCounter = body.action === 'counter';

    await db.transaction(async (tx: any) => {
        if (isCounter) {
            await negotiationRepo.updateNegotiation(tx, negotiationId, {
                agreedPriceOffer: String(body.priceOffer!),
                agreedUnitId: body.unitId!,
                agreedQuantityOffer: String(body.quantityOffer!),
            });
        } else {
            await negotiationRepo.updateNegotiation(tx, negotiationId, { status: 'accepted' });
        }

        const offerPrice = isCounter ? String(body.priceOffer!) : nego.agreedPriceOffer;
        const unitId = isCounter ? body.unitId! : nego.agreedUnitId;
        const quantityOffer = isCounter ? String(body.quantityOffer!) : nego.agreedQuantityOffer;

        await negotiationRepo.createChat(tx, {
            negotiationId,
            turnOrder: newTurnOrder,
            turnOwner: 'buyer',
            offerPrice,
            unitId,
            quantityOffer,
            description: body.description,
        });
    });

    if (isCounter) {
        notificationService.create(nego.sellerId, 'Tawaran balik', `Pembeli menawarkan Rp ${Number(body.priceOffer).toLocaleString('id-ID')}`, 'negotiation', 'negotiation', negotiationId);
        await auditService.log({ userId, action: 'negotiation.countered', entityType: 'negotiation', entityId: negotiationId, oldData: { priceOffer: nego.agreedPriceOffer, quantityOffer: nego.agreedQuantityOffer }, newData: { priceOffer: body.priceOffer, quantityOffer: body.quantityOffer } });
    } else {
        notificationService.create(nego.sellerId, 'Negosiasi disetujui', 'Pembeli menyetujui penawaran Anda', 'negotiation', 'negotiation', negotiationId);
        await auditService.log({ userId, action: 'negotiation.accepted', entityType: 'negotiation', entityId: negotiationId, oldData: { status: 'ongoing' }, newData: { status: 'accepted' } });
    }

    const resultStatus = isCounter ? 'ongoing' : 'accepted';
    return { data: { id: negotiationId, status: resultStatus, turnOrder: newTurnOrder } };
}

export async function list(userId: number, role: string) {
    if (role === 'admin') {
        const rows = await negotiationRepo.findAllNegotiations();
        return { data: rows };
    }
    if (role !== 'buyer' && role !== 'seller') return { data: [] };
    const rows = await negotiationRepo.findNegotiationsByUser(userId, role);
    return { data: rows };
}

export async function getDetail(negotiationId: number, userId: number, role: string) {
    const nego = await negotiationRepo.findNegotiationDetail(negotiationId);
    if (!nego) return { error: 'Negosiasi tidak ditemukan', status: 404 };

    if (role !== 'admin') {
        if (role === 'buyer' && nego.buyerId !== userId) return { error: 'Akses ditolak', status: 403 };
        if (role === 'seller' && nego.sellerId !== userId) return { error: 'Akses ditolak', status: 403 };
    }

    return { data: nego };
}
