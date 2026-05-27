import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { references, seller } from '../services/api';
import MapPicker from '../components/MapPicker';
import { MapPin, AlertTriangle } from 'lucide-react';

export default function SellerSetup() {
    const { user, upgradeRole } = useAuth();
    const navigate = useNavigate();
    const [provinces, setProvinces] = useState([]);
    const [allCities, setAllCities] = useState([]);
    const [form, setForm] = useState({ farmName: '', address: '', provinceId: '', cityId: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('form');
    const [locationOk, setLocationOk] = useState(false);

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

    const stripPrefix = (name) => name.replace(/^(Kota|Kabupaten)\s+/i, '');

    const handleMapLocation = ({ address, provinceName, cityName }) => {
        setForm((f) => ({ ...f, address }));
        setLocationOk(false);

        const province = provinces.find(
            (p) =>
                provinceName.toLowerCase().includes(p.name.toLowerCase()) ||
                p.name.toLowerCase().includes(provinceName.toLowerCase())
        );

        if (!province) { return; }
        setForm((f) => ({ ...f, provinceId: String(province.id), cityId: '' }));

        const citiesInProvince = allCities.filter((c) => c.provinceId === province.id);
        const city = citiesInProvince.find((c) => {
            return stripPrefix(c.name).toLowerCase() === stripPrefix(cityName).toLowerCase();
        });

        if (!cityName || !city) { return; }
        setForm((f) => ({ ...f, cityId: String(city.id) }));
        setLocationOk(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.provinceId || !form.cityId) {
            setError(locationOk ? 'Klik peta untuk memilih lokasi toko' : 'Pilih provinsi & kota secara manual, atau klik peta untuk mendeteksi otomatis');
            return;
        }

        setLoading(true);

        try {
            const json = await seller.register({
                farmName: form.farmName,
                address: form.address,
                cityId: Number(form.cityId),
                provinceId: Number(form.provinceId),
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
                        <MapPicker onLocationSelect={handleMapLocation} height="280px" />
                        {locationOk && (
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <MapPin size={12} /> Lokasi terdeteksi
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">Provinsi</label>
                        <select
                            value={form.provinceId}
                            onChange={(e) => setForm((f) => ({ ...f, provinceId: e.target.value, cityId: '' }))}
                            disabled={locationOk}
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary-green ${locationOk ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300'}`}
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
                            disabled={locationOk || !form.provinceId}
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary-green ${locationOk ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300'}`}
                            required
                        >
                            <option value="">Pilih kota</option>
                            {filteredCities.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {!locationOk && form.provinceId !== '' && (
                            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                <AlertTriangle size={12} /> Lokasi tidak terdeteksi otomatis. Pilih provinsi & kota secara manual.
                            </p>
                        )}
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
