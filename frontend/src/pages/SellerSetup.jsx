import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../contexts/AuthContext';
import { references, seller } from '../services/api';
import LocationPicker from '../components/LocationPicker';
import { Upload, FileText } from 'lucide-react';

const sellerSchema = z.object({
    farmName: z.string().min(5, 'Nama toko minimal 5 karakter').max(100, 'Nama toko maksimal 100 karakter'),
    address: z.string().min(5, 'Alamat minimal 5 karakter'),
    provinceId: z.string().min(1, 'Pilih provinsi'),
    cityId: z.string().min(1, 'Pilih kota'),
    landCertificate: z.string().min(1, 'Sertifikat wajib diunggah'),
});

export default function SellerSetup() {
    const { upgradeRole } = useAuth();
    const navigate = useNavigate();
    const [provinces, setProvinces] = useState([]);
    const [allCities, setAllCities] = useState([]);
    const { register, handleSubmit: formSubmit, formState: { errors }, setValue, watch } = useForm({
        resolver: zodResolver(sellerSchema),
        defaultValues: { farmName: '', address: '', provinceId: '', cityId: '', landCertificate: '' },
    });
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('form');
    const [locationConfirmed, setLocationConfirmed] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState('');
    const fileInputRef = useRef(null);

    const provinceId = watch('provinceId');
    const cityId = watch('cityId');

    useEffect(() => {
        references.getProvinces().then((json) => {
            if (json.success) setProvinces(json.data);
        }).catch(() => setApiError('Gagal memuat data provinsi'));

        references.getAllCities().then((json) => {
            if (json.success) setAllCities(json.data);
        }).catch(() => setApiError('Gagal memuat data kota'));
    }, []);

    const filteredCities = provinceId
        ? allCities.filter((c) => c.provinceId === Number(provinceId))
        : [];

    const handleLocationConfirm = ({ provinceId: pId, cityId: cId, address }) => {
        if (pId) setValue('provinceId', String(pId), { shouldValidate: true });
        if (cId) setValue('cityId', String(cId), { shouldValidate: true });
        if (address) setValue('address', address, { shouldValidate: true });
        setLocationConfirmed(true);
    };

    const handleFileSelect = (files) => {
        const file = files?.[0];
        if (!file) return;
        setSelectedFileName(file.name);
        setValue('landCertificate', file.name, { shouldValidate: true });
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const handleFileChange = (e) => {
        handleFileSelect(e.target.files);
    };

    const onSubmit = async (data) => {
        setApiError('');
        setLoading(true);

        try {
            const json = await seller.register({
                farmName: data.farmName,
                address: data.address,
                cityId: Number(data.cityId),
                provinceId: Number(data.provinceId),
                landCertificate: data.landCertificate,
            });

            if (!json.success) {
                setApiError(json.message);
                setLoading(false);
                return;
            }

            upgradeRole(json.data);
            setStep('done');
        } catch {
            setApiError('Terjadi kesalahan, coba lagi');
            setLoading(false);
        }
    };

    const inputClass = (error) =>
        `w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed ${error ? 'border-red-500' : 'border-gray-300'}`;

    if (step === 'done') {
        return (
            <div className="min-h-screen bg-neutral-stone flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md text-center">
                    <div className="text-4xl mb-4">🎉</div>
                    <h2 className="text-xl font-bold mb-2">Selamat Bergabung!</h2>
                    <p className="text-gray-500 mb-6">Kamu sekarang sudah terdaftar sebagai penjual. Yuk atur toko kamu!</p>
                    <button
                        onClick={() => navigate('/shop')}
                        className="px-6 py-2.5 bg-primary-green text-white rounded-lg font-medium hover:opacity-90 transition"
                    >
                        Atur Toko
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-stone flex items-center justify-center p-4">
            <div className="bg-white p-8 my-6 rounded-md shadow-lg w-[50%] min-w-2xl">
                <h2 className="text-primary-green text-3xl font-bold mb-1 text-center">Daftar Jadi Petani Penjual</h2>
                <p className="text-gray-500 text-sm mb-6 text-center">Lengkapi data untuk mulai menjual hasil panen anda</p>
                <div className='w-full h-px mb-6 bg-gray-200' />

                {apiError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">{apiError}</div>
                )}

                <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Nama Toko</label>
                        <input
                            {...register('farmName')}
                            placeholder="Contoh: Tani Makmur"
                            className={inputClass(errors.farmName)}
                        />
                        {errors.farmName && <p className="text-red-500 text-xs mt-1">{errors.farmName.message}</p>}
                    </div>

                    <p className='text-gray-400 text-xs -mt-2'><i>Gunakan nama yang mudah dikenali pembeli.</i></p>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Lokasi Toko</label>
                        <LocationPicker
                            provinces={provinces}
                            cities={allCities}
                            onConfirm={handleLocationConfirm}
                            height="280px"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">Provinsi</label>
                        <select
                            value={provinceId}
                            onChange={(e) => {
                                setValue('provinceId', e.target.value, { shouldValidate: true });
                                setValue('cityId', '', { shouldValidate: true });
                            }}
                            disabled={!locationConfirmed}
                            className={inputClass(errors.provinceId)}
                        >
                            <option value="">Pilih provinsi</option>
                            {provinces.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        {errors.provinceId && <p className="text-red-500 text-xs mt-1">{errors.provinceId.message}</p>}
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">Kota / Kabupaten</label>
                        <select
                            value={cityId}
                            onChange={(e) => setValue('cityId', e.target.value, { shouldValidate: true })}
                            disabled={!locationConfirmed || !provinceId}
                            className={inputClass(errors.cityId)}
                        >
                            <option value="">Pilih kota</option>
                            {filteredCities.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {errors.cityId && <p className="text-red-500 text-xs mt-1">{errors.cityId.message}</p>}
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">Alamat Lengkap</label>
                        <textarea
                            {...register('address')}
                            placeholder="Desa, kecamatan, kode pos"
                            rows={3}
                            className={inputClass(errors.address)}
                        />
                        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                        <p className="text-xs text-gray-400 mt-1"><i>
                            Alamat sudah terisi otomatis dari peta. Tambahkan detail seperti nama jalan, gang, atau kode pos secara manual.
                        </i></p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">Sertifikat Kepemilikan Tanah</label>
                        <input
                            type="file"
                            accept=".pdf"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            className={`mt-1 border-2 border-dashed rounded-lg px-4 py-12 text-center cursor-pointer transition-colors ${dragOver ? 'border-primary-green bg-green-50' : errors.landCertificate ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'} ${selectedFileName ? 'bg-green-50' : 'bg-white'}`}
                        >
                            {selectedFileName ? (
                                <div className="flex flex-col items-center gap-1">
                                    <FileText className="w-6 h-6 text-primary-green" />
                                    <span className="text-sm font-medium text-gray-700">{selectedFileName}</span>
                                    <span className="text-xs text-gray-400">Klik atau seret untuk ganti file</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-1">
                                    <Upload className="w-6 h-6 text-gray-400" />
                                    <span className="text-sm text-gray-500">Seret file .pdf ke sini atau <span className="text-primary-green font-medium">klik untuk pilih</span></span>
                                </div>
                            )}
                        </div>
                        {errors.landCertificate && <p className="text-red-500 text-xs mt-1">{errors.landCertificate.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 mt-4 bg-primary-green text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
                    >
                        {loading ? 'Memproses...' : 'Daftar Sekarang'}
                    </button>
                </form>
            </div>
        </div>
    );
}
