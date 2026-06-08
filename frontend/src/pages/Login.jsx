import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldCheck, Sprout, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const loginSchema = z.object({
    email: z.email({ message: 'Email tidak valid' }),
    password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
});

function getDashboardPath(role) {
    const normalizedRole = String(role || '').toLowerCase();
    if (normalizedRole === 'admin' || normalizedRole === 'super_admin' || normalizedRole === 'superadmin') return '/admin';
    if (normalizedRole === 'seller') return '/shop/dashboard';
    return '/dashboard';
}

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [apiError, setApiError] = useState('');

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data) => {
        setApiError('');
        const json = await login(data);

        if (json.success) {
            navigate(getDashboardPath(json.data?.role), { replace: true });
            return;
        }

        setApiError(json.message || 'Login gagal');
    };

    const inputClass = (error) =>
        `w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-green ${error ? 'border-red-500' : 'border-gray-300'}`;

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-neutral-stone">
            <Link
                to="/"
                className="fixed left-6 top-6 flex items-center gap-1 text-sm font-medium text-gray-600 transition hover:text-primary-green"
            >
                <ArrowLeft size={16} />
                Kembali
            </Link>

            <div className="mx-4 flex w-full max-w-5xl overflow-hidden rounded-2xl shadow-xl lg:min-h-[580px]">
                <div className="hidden w-2/5 flex-col justify-center bg-gradient-to-br from-primary-green to-forest-green p-8 py-16 text-white lg:flex">
                    <div>
                        <h1 className="mb-3 text-3xl font-bold">Panenku</h1>
                        <p className="text-base text-white/80">Platform tempat jual beli hasil panen langsung dari petani.</p>
                    </div>

                    <div className="mt-10 flex gap-3 text-sm font-medium">
                        <div className="flex items-center justify-center rounded-lg p-3"><Sprout size={20} /></div>
                        <div>
                            <h3 className="text-white/90">Langsung Dari Petani</h3>
                            <p className="text-white/80">Rasakan kesegaran hasil panen langsung dari petani.</p>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3 text-sm font-medium">
                        <div className="flex items-center justify-center rounded-lg p-3"><ShieldCheck size={20} /></div>
                        <div>
                            <h3 className="text-white/90">Terpercaya & Transparan</h3>
                            <p className="text-white/80">Sistem yang transparan dari panen hingga pengiriman.</p>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3 text-sm font-medium">
                        <div className="flex items-center justify-center rounded-lg p-3"><TrendingUp size={20} /></div>
                        <div>
                            <h3 className="text-white/90">Harga Terbaik</h3>
                            <p className="text-white/80">Dapatkan harga pasar yang kompetitif dan adil.</p>
                        </div>
                    </div>
                </div>

                <div className="flex w-full items-center justify-center bg-white p-8 py-16 lg:w-3/5">
                    <div className="w-full max-w-sm space-y-6">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold">Masuk</h2>
                            <p className="text-sm text-gray-500">Masuk ke akun Anda untuk melanjutkan</p>
                        </div>

                        {apiError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                                {apiError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input {...register('email')} type="email" placeholder="contoh@email.com" className={inputClass(errors.email)} />
                                </div>
                                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Kata Sandi</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        {...register('password')}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Masukkan kata sandi"
                                        className={`${inputClass(errors.password)} pr-10`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((value) => !value)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full rounded-lg bg-primary-green py-2.5 font-medium text-white transition hover:bg-primary-green-800 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Memproses...' : 'Masuk'}
                            </button>
                        </form>

                        <Link to="/forgot-password" className="block text-center text-sm text-primary-green hover:underline">
                            Lupa password?
                        </Link>

                        <p className="text-center text-sm text-gray-500">
                            Belum punya akun?{' '}
                            <Link to="/register" className="font-medium text-primary-green hover:underline">
                                Daftar
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
