import { useState, useEffect } from 'react';
import { userAddresses, references } from '../services/api';
import { Plus, ChevronDown, Loader, X, MapPin } from 'lucide-react';
import LocationPicker from './LocationPicker';

export default function AddressPicker({ value, onChange, disabled }) {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [provinces, setProvinces] = useState([]);
    const [allCities, setAllCities] = useState([]);
    const [form, setForm] = useState({ label: '', provinceId: '', cityId: '', address: '' });
    const [saving, setSaving] = useState(false);
    const [showMap, setShowMap] = useState(false);

    useEffect(() => {
        userAddresses.list().then((json) => {
            if (json.success) setAddresses(json.data);
            setLoading(false);
        });
        references.getProvinces().then((json) => {
            if (json.success) setProvinces(json.data);
        });
        references.getAllCities().then((json) => {
            if (json.success) setAllCities(json.data);
        });
    }, []);

    const filteredCities = form.provinceId
        ? allCities.filter((c) => c.provinceId === Number(form.provinceId))
        : [];

    const handleSave = async () => {
        if (!form.label || !form.provinceId || !form.cityId || !form.address) return;
        setSaving(true);
        const json = await userAddresses.create({
            label: form.label,
            provinceId: Number(form.provinceId),
            cityId: Number(form.cityId),
            address: form.address,
        });
        setSaving(false);
        if (!json.success) return;

        setAddresses((prev) => [...prev, json.data]);
        onChange(json.data.id);
        setShowForm(false);
        setForm({ label: '', provinceId: '', cityId: '', address: '' });
    };

    const handleMapConfirm = ({ provinceId, cityId, address }) => {
        setForm((f) => ({ ...f, provinceId: String(provinceId), cityId: String(cityId), address }));
        setShowMap(false);
    };

    const cityName = (cityId) => allCities.find((c) => c.id === cityId)?.name || `Kota #${cityId}`;

    const selected = addresses.find((a) => a.id === value);

    return (
        <div className="space-y-2">
            {!showForm && (
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <select
                            value={value || ''}
                            onChange={(e) => onChange(Number(e.target.value) || null)}
                            disabled={disabled || loading}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green appearance-none bg-white"
                        >
                            <option value="">{loading ? 'Memuat alamat...' : 'Pilih alamat tersimpan'}</option>
                            {addresses.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.label} — {cityName(a.cityId)}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-primary-green border border-primary-green rounded-lg hover:bg-green-50 transition whitespace-nowrap"
                    >
                        <Plus size={16} /> Baru
                    </button>
                </div>
            )}

            {showForm && (
                <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                    <div>
                        <label className="text-xs font-medium text-gray-600">Label Alamat</label>
                        <input
                            value={form.label}
                            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                            placeholder="Contoh: Rumah, Toko, Gudang"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-600">Provinsi</label>
                            <select
                                value={form.provinceId}
                                onChange={(e) => setForm((f) => ({ ...f, provinceId: e.target.value, cityId: '' }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1"
                            >
                                <option value="">Pilih provinsi</option>
                                {provinces.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600">Kota</label>
                            <select
                                value={form.cityId}
                                onChange={(e) => setForm((f) => ({ ...f, cityId: e.target.value }))}
                                disabled={!form.provinceId}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1 disabled:bg-gray-100"
                            >
                                <option value="">Pilih kota</option>
                                {filteredCities.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowMap(true)}
                        className="flex items-center gap-1.5 text-xs text-primary-green hover:text-green-700 transition"
                    >
                        <MapPin size={14} /> Pilih Lokasi di Peta
                    </button>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Alamat Lengkap</label>
                        <textarea
                            value={form.address}
                            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                            placeholder="Jalan, gang, kode pos"
                            rows={2}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1"
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || !form.label || !form.provinceId || !form.cityId || !form.address}
                            className="px-4 py-1.5 text-sm bg-primary-green text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1"
                        >
                            {saving && <Loader size={14} className="animate-spin" />}
                            Simpan
                        </button>
                    </div>
                </div>
            )}

            {value && selected && (
                <p className="text-xs text-gray-500">
                    {selected.label} — {selected.address}
                </p>
            )}

            {showMap && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 pb-0">
                            <h3 className="text-sm font-semibold text-gray-800">Pilih Lokasi</h3>
                            <button
                                type="button"
                                onClick={() => setShowMap(false)}
                                className="p-1 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-4">
                            <LocationPicker
                                provinces={provinces}
                                cities={allCities}
                                onConfirm={handleMapConfirm}
                                height="260px"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
