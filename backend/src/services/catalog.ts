import { catalogRepo, sellerRepo } from '../repositories';
import type { ProductInput } from '../dtos/products';

type ServiceResult<T> = { data?: T; error?: string; code?: string; status?: number };

type ProductPayload = {
    sellerId: number;
    name: string;
    categoryId: number;
    description: string;
    unitId: number;
    minOrderQty: number;
    pricePerUnit: number;
    stockQuantity: number;
    isNegotiable?: boolean;
};

function normalizeProductInput(sellerId: number, input: ProductInput): ProductPayload {
    return {
        sellerId,
        name: String(input.name ?? '').trim(),
        categoryId: Number(input.categoryId),
        description: String(input.description ?? '').trim(),
        unitId: Number(input.unitId),
        minOrderQty: Number(input.minOrderQty),
        pricePerUnit: Number(input.pricePerUnit),
        stockQuantity: Number(input.stockQuantity),
        isNegotiable: input.isNegotiable ?? false,
    };
}

async function validateActiveSeller(userId: number, wrongRoleCode = 'ERR-PROD-01', inactiveCode = 'ERR-PROD-02'): Promise<ServiceResult<any>> {
    const profile = await sellerRepo.findByUserId(userId);

    if (!profile) {
        return {
            status: 403,
            code: wrongRoleCode,
            error: 'Akun bukan penjual atau belum memiliki seller_profile',
        };
    }

    if (profile.status !== 'active') {
        return {
            status: 403,
            code: inactiveCode,
            error: 'Profil penjual tidak aktif',
        };
    }

    return { data: profile };
}

async function validateProductPayload(payload: ProductPayload, exceptProductId?: number): Promise<ServiceResult<ProductPayload>> {
    if (!payload.name || payload.name.length < 3) {
        return { status: 422, code: 'ERR-PROD-03', error: 'Nama produk minimal 3 karakter' };
    }

    if (!payload.categoryId) {
        return { status: 422, code: 'ERR-PROD-04', error: 'Kategori wajib dipilih' };
    }

    if (!payload.description) {
        return { status: 422, code: 'ERR-PROD-05', error: 'Deskripsi produk wajib diisi' };
    }

    if (payload.description.length < 10) {
        return { status: 422, code: 'ERR-PROD-06', error: 'Deskripsi produk minimal 10 karakter' };
    }

    if (payload.stockQuantity === undefined || payload.stockQuantity === null || Number.isNaN(payload.stockQuantity)) {
        return { status: 422, code: 'ERR-PROD-07', error: 'Total stok wajib diisi' };
    }

    if (payload.stockQuantity < 0) {
        return { status: 422, code: 'ERR-PROD-07', error: 'Total stok tidak boleh negatif' };
    }

    if (!payload.minOrderQty || payload.minOrderQty <= 0) {
        return { status: 422, code: 'ERR-PROD-08', error: 'Minimal pembelian harus lebih dari 0' };
    }

    if (payload.minOrderQty > payload.stockQuantity) {
        return { status: 422, code: 'ERR-PROD-09', error: 'Minimal pembelian tidak boleh melebihi total stok' };
    }

    if (!payload.pricePerUnit || payload.pricePerUnit <= 0) {
        return { status: 422, code: 'ERR-PROD-10', error: 'Harga jual harus lebih dari 0' };
    }

    if (!payload.unitId) {
        return { status: 422, code: 'ERR-PROD-11', error: 'Satuan produk wajib dipilih' };
    }

    const isDuplicate = await catalogRepo.isProductNameUsedBySeller({
        sellerId: payload.sellerId,
        name: payload.name,
        exceptProductId,
    });

    if (isDuplicate) {
        return { status: 409, code: 'ERR-PROD-12', error: 'Nama produk sudah digunakan oleh penjual yang sama' };
    }

    return { data: payload };
}

export const list = async (filters: {
    search?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    isNegotiable?: boolean;
    sortBy?: string;
    isAscending?: boolean;
    page?: number;
    limit?: number;
}) => {
    return catalogRepo.list(filters);
};

export const listSellerCatalog = async (filters: {
    sellerId: number;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
}) => {
    return catalogRepo.listSellerCatalog(filters);
};

export const createSellerProduct = async (sellerId: number, input: ProductInput): Promise<ServiceResult<any>> => {
    const sellerValidation = await validateActiveSeller(sellerId);
    if (sellerValidation.error) return sellerValidation;

    const payload = normalizeProductInput(sellerId, input);
    const validation = await validateProductPayload(payload);
    if (validation.error) return validation;

    const data = await catalogRepo.createSellerProduct(payload);
    return { data };
};

export const updateSellerProduct = async (sellerId: number, productId: number, input: ProductInput): Promise<ServiceResult<any>> => {
    const sellerValidation = await validateActiveSeller(sellerId);
    if (sellerValidation.error) return sellerValidation;

    const product = await catalogRepo.findSellerProductById(sellerId, productId);
    if (!product) {
        return { status: 404, error: 'Produk tidak ditemukan atau bukan milik penjual' };
    }

    const payload = normalizeProductInput(sellerId, input);
    const validation = await validateProductPayload(payload, productId);
    if (validation.error) return validation;

    const data = await catalogRepo.updateSellerProduct(productId, payload);
    return { data };
};

export const deleteSellerProduct = async ({
    actorId,
    actorRole,
    productId,
    ipAddress,
}: {
    actorId: number;
    actorRole?: string;
    productId: number;
    ipAddress?: string;
}): Promise<ServiceResult<any>> => {
    let product: any = null;
    let productSellerId: number;

    if (actorRole === 'admin') {
        product = await catalogRepo.findActiveProductById(productId);

        if (!product) {
            return { status: 404, error: 'Produk tidak ditemukan' };
        }

        productSellerId = product.sellerId;
    } else {
        const sellerValidation = await validateActiveSeller(actorId, 'ERR-DEL-01', 'ERR-DEL-02');
        if (sellerValidation.error) return sellerValidation;

        product = await catalogRepo.findSellerProductById(actorId, productId);

        if (!product) {
            return { status: 404, error: 'Produk tidak ditemukan atau bukan milik penjual' };
        }

        productSellerId = actorId;
    }

    const blockingStatus = await catalogRepo.findBlockingOrderStatus(productId);
    if (blockingStatus) {
        return {
            status: 409,
            code: blockingStatus.errorCode,
            error: blockingStatus.message,
        };
    }

    try {
        const data = await catalogRepo.softDeleteSellerProduct({
            productId,
            sellerId: productSellerId,
            actorId,
            ipAddress,
        });

        if (!data) return { status: 500, code: 'ERR-DEL-06', error: 'Gagal menghapus produk' };
        return { data };
    } catch (error) {
        return { status: 500, code: 'ERR-DEL-06', error: 'Terjadi kesalahan database saat soft delete' };
    }
};