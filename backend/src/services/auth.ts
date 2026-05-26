import bcrypt from 'bcryptjs';
import { authRepo } from '../repositories';
import type { RegisterInput, LoginInput, UserResponse } from '../dtos/auth';

type ServiceResult<T> = { data?: T; error?: string; status?: number };

export async function register(input: RegisterInput): Promise<ServiceResult<UserResponse>> {
    const existing = await authRepo.findByEmail(input.email);
    if (existing) return { error: 'Email sudah terdaftar', status: 409 };

    const passwordHash = await bcrypt.hash(input.password, 10);
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

export async function login(input: LoginInput): Promise<ServiceResult<UserResponse>> {
    const user = await authRepo.findByEmail(input.email);
    if (!user) return { error: 'Email atau password salah', status: 401 };

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) return { error: 'Email atau password salah', status: 401 };

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
