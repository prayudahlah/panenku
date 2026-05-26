import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowLeft, Sprout, ShieldCheck, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const registerSchema = z.object({
    full_name: z.string().min(1, 'Nama lengkap wajib diisi'),
    email: z.email({ message: 'Email tidak valid' }),
    phone: z.string().min(10, 'Nomor telepon minimal 10 digit').max(15, 'Nomor telepon maksimal 15 digit'),
    password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
    confirm_password: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
}).refine((data) => data.password === data.confirm_password, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['confirm_password'],
});

const Register = () => {
    const { register: doRegister } = useAuth();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [apiError, setApiError] = useState('');

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(registerSchema)
    });

    const onSubmit = async (data) => {
        setApiError('');
        const json = await doRegister(data);
        if (json.success) navigate('/');
        else setApiError(json.message || 'Registrasi gagal');
    };

    const inputClass = (error) =>
        `w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-green transition ${error ? 'border-red-500' : 'border-gray-300'
        }`;

    return (
        <div className="min-h-screen bg-neutral-stone flex items-center justify-center relative">
            <Link
                to="/"
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
                        <div className='p-3 rounded-lg flex items-center justify-center'>
                            <Sprout size={20} />
                        </div>
                        <div>
                            <h3 className='text-white/90'>Langsung Dari Petani</h3>
                            <p className='text-white/80'>Rasakan kesegaran hasil panen langsung dari petani.</p>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-2 text-sm font-medium">
                        <div className='p-3 rounded-lg flex items-center justify-center'>
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h3 className='text-white/90'>Terpercaya & Transparan</h3>
                            <p className='text-white/80'>Sistem yang transparan dari panen hingga pengiriman.</p>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-2 text-sm font-medium">
                        <div className='p-3 rounded-lg flex items-center justify-center'>
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <h3 className='text-white/90'>Harga Terbaik</h3>
                            <p className='text-white/80'>Dapatkan harga pasar yang kompetitif dan adil.</p>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-3/5 bg-white p-8 flex items-center justify-center py-16">
                    <div className="w-full max-w-sm space-y-6">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold">Daftar</h2>
                            <p className="text-gray-500 text-sm">Buat akun baru untuk memulai</p>
                        </div>

                        {apiError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {apiError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input {...register('full_name')} type="text" placeholder="Nama lengkap" className={inputClass(errors.full_name)} />
                                </div>
                                {errors.full_name && <p className="text-red-500 text-xs">{errors.full_name.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input {...register('email')} type="email" placeholder="contoh@email.com" className={inputClass(errors.email)} />
                                </div>
                                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Nomor Telepon</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input {...register('phone')} type="tel" placeholder="08xxxxxxxxxx" className={inputClass(errors.phone)} />
                                </div>
                                {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Kata Sandi</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        {...register('password')}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Minimal 6 karakter"
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
                                {isSubmitting ? 'Memproses...' : 'Daftar'}
                            </button>
                        </form>

                        <p className="text-center text-sm text-gray-500">
                            Sudah punya akun?{' '}
                            <Link to="/login" className="text-primary-green font-medium hover:underline">
                                Masuk
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
