import bcrypt from 'bcryptjs';
import { authRepo } from '../repositories';
import { auditService } from '../services';
import type { RegisterInput, LoginInput, UserResponse } from '../dtos/auth';

type ServiceResult<T> = { data?: T; error?: string; status?: number; errorCode?: string };

export async function register(input: RegisterInput): Promise<ServiceResult<UserResponse>> {
    const existing = await authRepo.findByEmail(input.email);
    if (existing) return { error: 'Email sudah terdaftar', status: 409, errorCode: 'ERR-REG-01' };

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await authRepo.create({
        fullName: input.full_name,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: 'buyer',
        status: 'active',
    });

    return {
        data: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
        },
    };
}

export async function login(input: LoginInput, ipAddress?: string): Promise<ServiceResult<UserResponse>> {
    const isBlocked = await authRepo.isBlocked(input.email);
    if (isBlocked) {
        return { error: 'Terlalu banyak percobaan. Coba lagi setelah 15 menit.', status: 429, errorCode: 'ERR-LOG-02' };
    }

    const user = await authRepo.findByEmail(input.email);

    if (!user) {
        await authRepo.recordFailedAttempt(input.email, null, ipAddress || 'unknown');
        await auditService.log({
            action: 'login.failed',
            entityType: 'user',
            ipAddress: ipAddress || 'unknown',
        });
        return { error: 'Email atau password salah', status: 401, errorCode: 'ERR-LOG-01' };
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
        await authRepo.recordFailedAttempt(input.email, user.id, ipAddress || 'unknown');
        await auditService.log({
            userId: user.id,
            action: 'login.failed',
            entityType: 'user',
            entityId: user.id,
            ipAddress: ipAddress || 'unknown',
        });
        return { error: 'Email atau password salah', status: 401, errorCode: 'ERR-LOG-01' };
    }

    if (user.status === 'suspended') {
        return { error: 'Akun anda telah disuspend', status: 403, errorCode: 'ERR-LOG-03' };
    }
    if (user.status !== 'active') {
        return { error: 'Akun belum aktif', status: 403, errorCode: 'ERR-LOG-01' };
    }

    await authRepo.clearFailedAttempts(input.email);
    await auditService.log({
        userId: user.id,
        action: 'login.success',
        entityType: 'user',
        entityId: user.id,
        ipAddress: ipAddress || 'unknown',
    });

    return {
        data: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
        },
    };
}

export async function me(userId: number): Promise<ServiceResult<UserResponse>> {
    const user = await authRepo.findById(userId);
    if (!user) return { error: 'User tidak ditemukan', status: 404 };

    return {
        data: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
        },
    };
}
