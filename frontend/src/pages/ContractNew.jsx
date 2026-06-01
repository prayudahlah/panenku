import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Loader, Handshake } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { references, products, contracts } from '../services/api';
import AddressPicker from '../components/AddressPicker';

const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const frequencyLabels = {
    daily: 'Setiap Hari',
    weekly: 'Mingguan',
    monthly: 'Bulanan',
    custom: 'Kustom',
};

export default function ContractNew() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sellerId = Number(searchParams.get('sellerId'));
    const sellerName = searchParams.get('sellerName') || 'Penjual';

    const [sellerProducts, setSellerProducts] = useState([]);
    const [units, setUnits] = useState([]);
    const [form, setForm] = useState({
        addressId: null,
        startDate: '',
        endDate: '',
        frequency: 'weekly',
        schedules: [{ deliveryDay: 'Senin', deliveryDate: '', deliveryTime: '08:00' }],
        products: [{ productId: '', quantity: '', unitId: '', description: '' }],
        description: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [productSearch, setProductSearch] = useState({});

    useEffect(() => {
        if (!user) return;
        Promise.all([
            products.list({ sellerId }),
            references.getUnits(),
        ]).then(([prodJson, unitJson]) => {
            if (prodJson.success) setSellerProducts(prodJson.data);
            if (unitJson.success) setUnits(unitJson.data);
            setFetching(false);
        });
    }, [user, sellerId]);

    const updateProduct = (index, field, value) => {
        setForm((f) => {
            const products = [...f.products];
            products[index] = { ...products[index], [field]: value };
            return { ...f, products };
        });
    };

    const addProduct = () => {
        setForm((f) => ({
            ...f,
            products: [...f.products, { productId: '', quantity: '', unitId: '', description: '' }],
        }));
    };

    const removeProduct = (index) => {
        setForm((f) => ({
            ...f,
            products: f.products.filter((_, i) => i !== index),
        }));
    };

    const updateSchedule = (index, field, value) => {
        setForm((f) => {
            const schedules = [...f.schedules];
            schedules[index] = { ...schedules[index], [field]: value };
            return { ...f, schedules };
        });
    };

    const addScheduleDate = (date) => {
        setForm((f) => ({
            ...f,
            schedules: [...f.schedules, { deliveryDay: '', deliveryDate: date, deliveryTime: '' }],
        }));
    };

    const removeSchedule = (index) => {
        setForm((f) => ({
            ...f,
            schedules: f.schedules.filter((_, i) => i !== index),
        }));
    };

    const handleDayToggle = (day) => {
        const existing = form.schedules.find((s) => s.deliveryDay === day);
        if (existing) {
            setForm((f) => ({
                ...f,
                schedules: f.schedules.filter((s) => s.deliveryDay !== day),
            }));
        } else {
            setForm((f) => ({
                ...f,
                schedules: [...f.schedules, { deliveryDay: day, deliveryDate: '', deliveryTime: f.schedules[0]?.deliveryTime || '08:00' }],
            }));
        }
    };

    const [customDate, setCustomDate] = useState('');
    const [monthDay, setMonthDay] = useState('');
    const [monthTime, setMonthTime] = useState('08:00');

    const handleFrequencyChange = (freq) => {
        const defaults = {
            daily: [{ deliveryDay: '', deliveryDate: '', deliveryTime: '08:00' }],
            weekly: [{ deliveryDay: 'Senin', deliveryDate: '', deliveryTime: '08:00' }],
            monthly: [{ deliveryDay: '', deliveryDate: '15', deliveryTime: '08:00' }],
            custom: [],
        };
        setForm((f) => ({ ...f, frequency: freq, schedules: defaults[freq] }));
    };

    const totalEstimate = useMemo(() => {
        let total = 0;
        for (const p of form.products) {
            if (!p.productId || !p.quantity) continue;
            const prod = sellerProducts.find((sp) => sp.id === Number(p.productId));
            if (prod) total += Number(prod.pricePerUnit) * Number(p.quantity);
        }
        return total;
    }, [form.products, sellerProducts]);

    const scheduleSummary = useMemo(() => {
        if (!form.startDate || !form.endDate) return '-';
        if (form.frequency === 'daily') return `Setiap hari, ${form.schedules[0]?.deliveryTime || '-'}`;
        if (form.frequency === 'weekly') {
            const days = form.schedules.filter((s) => s.deliveryDay).map((s) => s.deliveryDay);
            if (days.length === 0) return '-';
            return `Setiap ${days.join(', ')} ${form.schedules[0]?.deliveryTime || ''}`.trim();
        }
        if (form.frequency === 'monthly') {
            const dates = form.schedules.filter((s) => s.deliveryDate).map((s) => `Tanggal ${s.deliveryDate}`);
            if (dates.length === 0) return '-';
            return `${dates.join(', ')} ${form.schedules[0]?.deliveryTime || ''}`.trim();
        }
        if (form.frequency === 'custom') {
            const dates = form.schedules.filter((s) => s.deliveryDate).map((s) => s.deliveryDate);
            if (dates.length === 0) return '-';
            return `${dates.length} tanggal: ${dates.join(', ')}`;
        }
        return '-';
    }, [form.frequency, form.schedules, form.startDate, form.endDate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.addressId) { setError('Pilih alamat pengiriman'); return; }
        if (!form.startDate || !form.endDate) { setError('Isi durasi kontrak'); return; }
        if (new Date(form.endDate) <= new Date(form.startDate)) { setError('Tanggal berakhir harus setelah tanggal mulai'); return; }
        if (!form.schedules || form.schedules.length === 0) { setError('Isi jadwal pengiriman'); return; }
        if (form.products.length === 0 || !form.products[0]?.productId) { setError('Tambahkan minimal satu produk'); return; }

        setLoading(true);

        try {
            const json = await contracts.create({
                sellerId,
                addressId: form.addressId,
                startDate: form.startDate,
                endDate: form.endDate,
                frequency: form.frequency,
                schedules: form.schedules.map((s) => ({
                    deliveryDay: s.deliveryDay || undefined,
                    deliveryDate: s.deliveryDate || undefined,
                    deliveryTime: s.deliveryTime || undefined,
                })),
                products: form.products
                    .filter((p) => p.productId)
                    .map((p) => ({
                        productId: Number(p.productId),
                        quantity: Number(p.quantity),
                        unitId: Number(p.unitId),
                        description: p.description || undefined,
                    })),
                description: form.description || undefined,
            });

            if (!json.success) {
                setError(json.message);
                setLoading(false);
                return;
            }

            navigate('/contracts');
        } catch {
            setError('Terjadi kesalahan, coba lagi');
            setLoading(false);
        }
    };

    if (!user) return <div className="p-8 text-center text-gray-500">Silakan login.</div>;
    if (fetching) return <div className="p-8 text-center text-gray-400">Memuat...</div>;

    return (
        <div className="min-h-screen bg-neutral-stone">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition mb-4"
                >
                    <ArrowLeft size={16} /> Kembali
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <Handshake size={28} className="text-primary-green" />
                    <div>
                        <h1 className="text-2xl font-bold">Ajukan Kemitraan</h1>
                        <p className="text-sm text-gray-500">Dengan {sellerName}</p>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">{error}</div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-start">
                        <div className="space-y-6">
                            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                                <h2 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">Alamat Pengiriman</h2>
                                <AddressPicker
                                    value={form.addressId}
                                    onChange={(id) => setForm((f) => ({ ...f, addressId: id }))}
                                />
                            </section>

                            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                                <h2 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">Durasi Kontrak</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">Mulai</label>
                                        <input
                                            type="date"
                                            value={form.startDate}
                                            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">Berakhir</label>
                                        <input
                                            type="date"
                                            value={form.endDate}
                                            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1"
                                            required
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                                <h2 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">Jadwal Pengiriman</h2>
                                <div className="mb-4">
                                    <label className="text-xs font-medium text-gray-600">Frekuensi</label>
                                    <select
                                        value={form.frequency}
                                        onChange={(e) => handleFrequencyChange(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1"
                                    >
                                        {Object.entries(frequencyLabels).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                </div>

                                {form.frequency === 'weekly' && (
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 mb-2 block">Hari Pengiriman</label>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {dayNames.map((day) => {
                                                const active = form.schedules.some((s) => s.deliveryDay === day);
                                                return (
                                                    <button
                                                        type="button"
                                                        key={day}
                                                        onClick={() => handleDayToggle(day)}
                                                        className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                                                            active
                                                                ? 'bg-primary-green text-white border-primary-green'
                                                                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                                                        }`}
                                                    >
                                                        {day}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-600">Waktu</label>
                                            <input
                                                type="time"
                                                value={form.schedules[0]?.deliveryTime || ''}
                                                onChange={(e) =>
                                                    form.schedules.forEach((_, i) => updateSchedule(i, 'deliveryTime', e.target.value))
                                                }
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1"
                                            />
                                        </div>
                                    </div>
                                )}

                                {form.frequency === 'daily' && (
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">Waktu Pengiriman</label>
                                        <input
                                            type="time"
                                            value={form.schedules[0]?.deliveryTime || ''}
                                            onChange={(e) => updateSchedule(0, 'deliveryTime', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1"
                                        />
                                    </div>
                                )}

                                {form.frequency === 'monthly' && (
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 mb-2 block">Tanggal Setiap Bulan</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                min="1"
                                                max="31"
                                                value={monthDay}
                                                onChange={(e) => setMonthDay(e.target.value)}
                                                placeholder="15"
                                                className="w-24 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                                            />
                                            <input
                                                type="time"
                                                value={monthTime}
                                                onChange={(e) => setMonthTime(e.target.value)}
                                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (monthDay && !form.schedules.some((s) => s.deliveryDate === monthDay)) {
                                                        setForm((f) => ({
                                                            ...f,
                                                            schedules: [...f.schedules, { deliveryDay: '', deliveryDate: monthDay, deliveryTime: monthTime || '08:00' }],
                                                        }));
                                                        setMonthDay('');
                                                        setMonthTime('08:00');
                                                    }
                                                }}
                                                disabled={!monthDay}
                                                className="px-3 py-2.5 text-sm bg-primary-green text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1"
                                            >
                                                <Plus size={16} /> Tambah
                                            </button>
                                        </div>
                                        {form.schedules.length > 0 && (
                                            <div className="mt-3 space-y-1.5">
                                                {form.schedules.map((s, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                                                        <span>{s.deliveryDate}</span>
                                                        <input
                                                            type="time"
                                                            value={s.deliveryTime || ''}
                                                            onChange={(e) => updateSchedule(i, 'deliveryTime', e.target.value)}
                                                            className="ml-auto border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary-green"
                                                        />
                                                        <button type="button" onClick={() => removeSchedule(i)} className="text-red-400 hover:text-red-600">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {form.frequency === 'custom' && (
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 mb-2 block">Pilih Tanggal</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="date"
                                                value={customDate}
                                                onChange={(e) => setCustomDate(e.target.value)}
                                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (customDate && !form.schedules.some((s) => s.deliveryDate === customDate)) {
                                                        addScheduleDate(customDate);
                                                        setCustomDate('');
                                                    }
                                                }}
                                                disabled={!customDate}
                                                className="px-3 py-2.5 text-sm bg-primary-green text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1"
                                            >
                                                <Plus size={16} /> Tambah
                                            </button>
                                        </div>
                                        {form.schedules.length > 0 && (
                                            <div className="mt-3 space-y-1.5">
                                                {form.schedules.map((s, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                                                        <span>{s.deliveryDate}</span>
                                                        <input
                                                            type="time"
                                                            value={s.deliveryTime || ''}
                                                            onChange={(e) => updateSchedule(i, 'deliveryTime', e.target.value)}
                                                            className="ml-auto border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary-green"
                                                        />
                                                        <button type="button" onClick={() => removeSchedule(i)} className="text-red-400 hover:text-red-600">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </section>

                            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                                <h2 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">Produk / Komoditas</h2>
                                <div className="space-y-4">
                                    {form.products.map((prod, i) => (
                                        <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-gray-500">Komoditas {i + 1}</span>
                                                {form.products.length > 1 && (
                                                    <button type="button" onClick={() => removeProduct(i)} className="text-red-400 hover:text-red-600">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-600">Produk</label>
                                                <select
                                                    value={prod.productId}
                                                    onChange={(e) => updateProduct(i, 'productId', e.target.value)}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1"
                                                >
                                                    <option value="">Pilih produk</option>
                                                    {sellerProducts.map((p) => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs font-medium text-gray-600">Jumlah per Pengiriman</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={prod.quantity}
                                                        onChange={(e) => updateProduct(i, 'quantity', e.target.value)}
                                                        placeholder="0"
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-600">Satuan</label>
                                                    <select
                                                        value={prod.unitId}
                                                        onChange={(e) => updateProduct(i, 'unitId', e.target.value)}
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1"
                                                    >
                                                        <option value="">Pilih satuan</option>
                                                        {units.map((u) => (
                                                            <option key={u.id} value={u.id}>{u.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-600">Catatan (opsional)</label>
                                                <input
                                                    value={prod.description}
                                                    onChange={(e) => updateProduct(i, 'description', e.target.value)}
                                                    placeholder="Kualitas, varietas, dll"
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addProduct}
                                        className="flex items-center gap-1.5 text-sm text-primary-green font-medium hover:opacity-80 transition"
                                    >
                                        <Plus size={16} /> Tambah Komoditas
                                    </button>
                                </div>
                            </section>

                            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                                <h2 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">Catatan Tambahan</h2>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                    placeholder="Informasi tambahan untuk penjual (opsional)"
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                                />
                            </section>

                            <div className="lg:hidden">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-primary-green text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading && <Loader size={18} className="animate-spin" />}
                                    {loading ? 'Memproses...' : 'Ajukan Kemitraan'}
                                </button>
                            </div>
                        </div>

                        <div className="lg:sticky lg:top-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
                                <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Ringkasan</h2>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <p className="text-gray-500">Penjual</p>
                                        <p className="font-medium">{sellerName}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Produk</p>
                                        <p className="font-medium">{form.products.filter((p) => p.productId).length} komoditas</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Durasi</p>
                                        <p className="font-medium">
                                            {form.startDate && form.endDate
                                                ? `${form.startDate} — ${form.endDate}`
                                                : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Jadwal</p>
                                        <p className="font-medium">{scheduleSummary}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Frekuensi</p>
                                        <p className="font-medium">{frequencyLabels[form.frequency]}</p>
                                    </div>
                                    <hr />
                                    <div>
                                        <p className="text-gray-500">Estimasi Total</p>
                                        <p className="text-lg font-bold text-primary-green">
                                            Rp {totalEstimate.toLocaleString('id-ID')}
                                        </p>
                                        <p className="text-xs text-gray-400">per pengiriman</p>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="hidden lg:flex w-full py-3 bg-primary-green text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 items-center justify-center gap-2"
                                >
                                    {loading && <Loader size={18} className="animate-spin" />}
                                    {loading ? 'Memproses...' : 'Ajukan Kemitraan'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
