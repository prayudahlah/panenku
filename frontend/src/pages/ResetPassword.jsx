import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, Sprout, ShieldCheck, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { fetchApi } from '../services/api';

const resetSchema = z.object({
    password: z.string().min(8, 'Kata sandi minimal 8 karakter').regex(/[A-Z]/, 'Kata sandi harus mengandung huruf besar').regex(/\d/, 'Kata sandi harus mengandung angka'),
    confirm_password: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
}).refine((data) => data.password === data.confirm_password, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['confirm_password'],
});

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [apiError, setApiError] = useState('');

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(resetSchema),
    });

    const onSubmit = async (data) => {
        setApiError('');
        const json = await fetchApi('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, password: data.password, confirm_password: data.confirm_password }),
        });
        if (json.success) navigate('/login');
        else setApiError(json.message || 'Gagal mereset password');
    };

    const inputClass = (error) =>
        `w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-green transition ${error ? 'border-red-500' : 'border-gray-300'
        }`;

    if (!token) {
        return (
            <div className="min-h-screen bg-neutral-stone flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full mx-4 text-center">
                    <h2 className="text-xl font-bold mb-2">Token tidak ditemukan</h2>
                    <p className="text-gray-500 text-sm mb-4">Link reset password tidak valid.</p>
                    <Link to="/forgot-password" className="text-primary-green font-medium hover:underline">Minta link baru</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-stone flex items-center justify-center relative">
            <Link
                to="/login"
                className="fixed top-6 left-6 flex items-center gap-1 text-sm text-gray-600 hover:text-primary-green transition font-medium"
            >
                <ArrowLeft size={16} />
                Kembali
            </Link>

            <div className="flex w-full max-w-5xl mx-4 rounded-2xl shadow-xl overflow-hidden lg:min-h-[580px]">
                <div className="hidden lg:flex flex-col w-2/5 bg-gradient-to-br from-primary-green to-forest-green justify-center p-8 text-white py-16">
                    <div>
                        <h1 className="text-3xl font-bold mb-3">Panenku</h1>
                        <p className="text-base text-white/80">Platform tempat jual beli hasil panen langsung dari petani.</p>
                    </div>
                    <div className="mt-10 flex gap-2 text-sm font-medium">
                        <div className='p-3 rounded-lg flex items-center justify-center'><Sprout size={20} /></div>
                        <div><h3 className='text-white/90'>Langsung Dari Petani</h3><p className='text-white/80'>Rasakan kesegaran hasil panen langsung dari petani.</p></div>
                    </div>
                    <div className="mt-8 flex gap-2 text-sm font-medium">
                        <div className='p-3 rounded-lg flex items-center justify-center'><ShieldCheck size={20} /></div>
                        <div><h3 className='text-white/90'>Terpercaya & Transparan</h3><p className='text-white/80'>Sistem yang transparan dari panen hingga pengiriman.</p></div>
                    </div>
                    <div className="mt-8 flex gap-2 text-sm font-medium">
                        <div className='p-3 rounded-lg flex items-center justify-center'><TrendingUp size={20} /></div>
                        <div><h3 className='text-white/90'>Harga Terbaik</h3><p className='text-white/80'>Dapatkan harga pasar yang kompetitif dan adil.</p></div>
                    </div>
                </div>

                <div className="w-full lg:w-3/5 bg-white p-8 flex items-center justify-center py-16">
                    <div className="w-full max-w-sm space-y-6">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold">Reset Password</h2>
                            <p className="text-gray-500 text-sm">Masukkan kata sandi baru</p>
                        </div>

                        {apiError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {apiError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Kata Sandi Baru</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        {...register('password')}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Minimal 8 karakter, huruf besar & angka"
                                        className={`${inputClass(errors.password)} pr-10`}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Konfirmasi Kata Sandi</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        {...register('confirm_password')}
                                        type={showConfirm ? 'text' : 'password'}
                                        placeholder="Ulangi kata sandi"
                                        className={`${inputClass(errors.confirm_password)} pr-10`}
                                    />
                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.confirm_password && <p className="text-red-500 text-xs">{errors.confirm_password.message}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-2.5 bg-primary-green text-white rounded-lg font-medium hover:bg-primary-green-800 transition disabled:opacity-50"
                            >
                                {isSubmitting ? 'Memproses...' : 'Reset Password'}
                            </button>
                        </form>

                        <p className="text-center text-sm text-gray-500">
                            <Link to="/login" className="text-primary-green font-medium hover:underline">Kembali ke login</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
