import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { authRepo } from '../repositories';
import { auditService } from '../services';
import { sendResetEmail } from './email';
import type { RegisterInput, LoginInput, UserResponse } from '../dtos/auth';

const resetTokens = new Map<string, { email: string; expires: Date }>();

// Hapus token expired setiap 1 jam
setInterval(() => {
    const now = new Date();
    for (const [token, record] of resetTokens) {
        if (record.expires < now) resetTokens.delete(token);
    }
}, 60 * 60 * 1000);

type ServiceResult<T> = { data?: T; error?: string; status?: number; errorCode?: string };

export async function register(input: RegisterInput): Promise<ServiceResult<UserResponse>> {
    if (input.password !== input.confirm_password) {
        return { error: 'Password dan konfirmasi password tidak cocok', status: 422 };
    }

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

export async function forgotPassword(input: { email: string }): Promise<ServiceResult<{ message: string }>> {
    const user = await authRepo.findByEmail(input.email);
    if (!user) {
        return { data: { message: 'Jika email terdaftar, link reset akan dikirim' } };
    }

    const token = crypto.randomBytes(32).toString('hex');
    resetTokens.set(token, { email: input.email, expires: new Date(Date.now() + 60 * 60 * 1000) });

    console.log(`[reset-password] Token for ${input.email}: ${token}`);

    try {
        await sendResetEmail(input.email, token);
    } catch (err) {
        console.error('[reset-password] Gagal kirim email:', err);
    }

    await auditService.log({
        userId: user.id,
        action: 'password.reset.requested',
        entityType: 'user',
        entityId: user.id,
    });

    return { data: { message: 'Jika email terdaftar, link reset akan dikirim' } };
}

export async function resetPassword(input: { token: string; password: string; confirm_password: string }): Promise<ServiceResult<{ message: string }>> {
    if (input.password !== input.confirm_password) {
        return { error: 'Password dan konfirmasi password tidak cocok', status: 422 };
    }

    const record = resetTokens.get(input.token);
    if (!record || record.expires < new Date()) {
        resetTokens.delete(input.token);
        return { error: 'Token tidak valid atau sudah kedaluwarsa', status: 400, errorCode: 'ERR-LOG-01' };
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await authRepo.findByEmail(record.email);
    if (!user) return { error: 'User tidak ditemukan', status: 404 };

    await authRepo.updatePassword(user.id, passwordHash);
    resetTokens.delete(input.token);

    await auditService.log({
        userId: user.id,
        action: 'password.reset.completed',
        entityType: 'user',
        entityId: user.id,
    });

    return { data: { message: 'Password berhasil diubah' } };
}
