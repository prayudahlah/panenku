import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { references, seller } from '../services/api';
import LocationPicker from '../components/LocationPicker';

export default function SellerSetup() {
    const { user, upgradeRole } = useAuth();
    const navigate = useNavigate();
    const [provinces, setProvinces] = useState([]);
    const [allCities, setAllCities] = useState([]);
    const [form, setForm] = useState({ farmName: '', address: '', provinceId: '', cityId: '', landCertificate: 'CERT-1' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('form');

    useEffect(() => {
        references.getProvinces().then((json) => {
            if (json.success) setProvinces(json.data);
        }).catch(() => setError('Gagal memuat data provinsi'));

        references.getAllCities().then((json) => {
            if (json.success) setAllCities(json.data);
        }).catch(() => setError('Gagal memuat data kota'));
    }, []);

    const filteredCities = form.provinceId
        ? allCities.filter((c) => c.provinceId === Number(form.provinceId))
        : [];

    const handleLocationConfirm = ({ provinceId, cityId, address }) => {
        setForm((f) => ({
            ...f,
            provinceId: provinceId ? String(provinceId) : f.provinceId,
            cityId: cityId ? String(cityId) : f.cityId,
            address,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.provinceId || !form.cityId) {
            setError('Pilih provinsi & kota');
            return;
        }

        setLoading(true);

        try {
            const json = await seller.register({
                farmName: form.farmName,
                address: form.address,
                cityId: Number(form.cityId),
                provinceId: Number(form.provinceId),
                landCertificate: form.landCertificate,
            });

            if (!json.success) {
                setError(json.message);
                setLoading(false);
                return;
            }

            upgradeRole(json.data);
            setStep('done');
        } catch {
            setError('Terjadi kesalahan, coba lagi');
            setLoading(false);
        }
    };

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
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-lg w-full">
                <h2 className="text-2xl font-bold mb-1">Daftar Jadi Penjual</h2>
                <p className="text-gray-500 text-sm mb-6">Lengkapi data toko kamu</p>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Nama Toko</label>
                        <input
                            value={form.farmName}
                            onChange={(e) => setForm((f) => ({ ...f, farmName: e.target.value }))}
                            placeholder="Contoh: Tani Makmur"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1"
                            required
                        />
                    </div>

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
                            value={form.provinceId}
                            onChange={(e) => setForm((f) => ({ ...f, provinceId: e.target.value, cityId: '' }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary-green"
                            required
                        >
                            <option value="">Pilih provinsi</option>
                            {provinces.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">Kota / Kabupaten</label>
                        <select
                            value={form.cityId}
                            onChange={(e) => setForm((f) => ({ ...f, cityId: e.target.value }))}
                            disabled={!form.provinceId}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary-green disabled:bg-gray-100"
                            required
                        >
                            <option value="">Pilih kota</option>
                            {filteredCities.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">Alamat Lengkap</label>
                        <textarea
                            value={form.address}
                            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                            placeholder="Desa, kecamatan, kode pos"
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1"
                            required
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Alamat sudah terisi otomatis dari peta. Tambahkan detail seperti nama jalan, gang, atau kode pos secara manual.
                        </p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">Sertifikat Kepemilikan Tanah</label>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setForm((f) => ({ ...f, landCertificate: e.target.files[0]?.name || f.landCertificate }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary-green file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-primary-green file:text-white hover:file:opacity-90"
                        />
                        {form.landCertificate && (
                            <p className="text-xs text-gray-500 mt-1">Terpilih: {form.landCertificate}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-primary-green text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
                    >
                        {loading ? 'Memproses...' : 'Daftar Sekarang'}
                    </button>
                </form>
            </div>
        </div>
    );
}
