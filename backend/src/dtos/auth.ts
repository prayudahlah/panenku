import { t } from 'elysia';

export const RegisterRequest = t.Object({
    full_name: t.String({ minLength: 4, maxLength: 100, pattern: '^[A-Za-z\\s]+$' }),
    email: t.String({ format: 'email' }),
    phone: t.String({ minLength: 10, maxLength: 13, pattern: '^(0|\\+62)?\\d{9,12}$' }),
    password: t.String({ minLength: 8, pattern: '^(?=.*[A-Z])(?=.*\\d).{8,}$' }),
    confirm_password: t.String({ minLength: 8 }),
});

export const LoginRequest = t.Object({
    email: t.String({ format: 'email' }),
    password: t.String({ minLength: 8 }),
});

export type RegisterInput = {
    full_name: string;
    email: string;
    phone: string;
    password: string;
    confirm_password: string;
};

export type LoginInput = {
    email: string;
    password: string;
};

export const ForgotPasswordRequest = t.Object({
    email: t.String({ format: 'email' }),
});

export const ResetPasswordRequest = t.Object({
    token: t.String(),
    password: t.String({ minLength: 8, pattern: '^(?=.*[A-Z])(?=.*\\d).{8,}$' }),
    confirm_password: t.String({ minLength: 8 }),
});

export type UserResponse = {
    id: number;
    email: string;
    fullName: string;
    role: string;
};
