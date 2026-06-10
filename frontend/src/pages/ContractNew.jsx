import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Loader, Handshake, Search, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { references, contracts, seller } from '../services/api';
import { formatCurrency } from '../utils/format';
import AddressPicker from '../components/AddressPicker';
import SchedulePicker, { frequencyLabels } from '../components/SchedulePicker';

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
    const [fetchError, setFetchError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [productSearch, setProductSearch] = useState({});
    const [showDropdown, setShowDropdown] = useState({});
    const productRefs = useRef({});
    const errorRef = useRef(null);

    useEffect(() => {
        if (!user) return;
        setFetchError('');
        Promise.all([
            seller.getProductsBySeller(sellerId),
            references.getUnits(),
        ]).then(([prodJson, unitJson]) => {
            if (prodJson.success) setSellerProducts(prodJson.data);
            else setFetchError('Gagal memuat produk penjual');
            if (unitJson.success) setUnits(unitJson.data);
            setFetching(false);
        }).catch(() => {
            setFetchError('Gagal memuat data. Silakan coba lagi.');
            setFetching(false);
        });
    }, [user, sellerId]);

    useEffect(() => {
        if (error && errorRef.current) {
            errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [error]);

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



    const handleProductSearch = (index, value) => {
        setProductSearch((prev) => ({ ...prev, [index]: value }));
        setShowDropdown((prev) => ({ ...prev, [index]: true }));
        if (!value.trim()) {
            updateProduct(index, 'productId', '');
        }
    };

    const handleProductSelect = (index, product) => {
        setProductSearch((prev) => ({ ...prev, [index]: product.name }));
        setShowDropdown((prev) => ({ ...prev, [index]: false }));
        updateProduct(index, 'productId', String(product.id));
    };

    const getFilteredProducts = (query) => {
        if (!query) return sellerProducts;
        return sellerProducts.filter((p) =>
            p.name.toLowerCase().includes(query.toLowerCase())
        );
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
        const count = form.schedules.length;
        if (count === 0) return '-';
        if (form.frequency === 'daily') return `Setiap hari, ${form.schedules[0]?.deliveryTime || '-'}`;
        if (form.frequency === 'weekly') {
            const days = form.schedules.filter((s) => s.deliveryDay).map((s) => s.deliveryDay);
            return days.length > 0 ? `${days.join(', ')}` : '-';
        }
        if (form.frequency === 'monthly') {
            const dates = form.schedules.filter((s) => s.deliveryDate).map((s) => `Tgl ${s.deliveryDate}`);
            return dates.length > 0 ? `${dates.join(', ')}` : '-';
        }
        if (form.frequency === 'custom') {
            const dates = form.schedules.filter((s) => s.deliveryDate).map((s) => s.deliveryDate);
            return dates.length > 0 ? `${dates.length} tanggal` : '-';
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
        if (form.products.some((p) => !p.unitId)) { setError('Pilih satuan untuk setiap produk'); return; }

        setLoading(true);

        try {
            const json = await contracts.create({
                sellerId,
                addressId: form.addressId,
                startDate: form.startDate,
                endDate: form.endDate,
                frequency: form.frequency,
                schedules: form.schedules.map((s) => {
                    let deliveryDate = s.deliveryDate || undefined;
                    if (form.frequency === 'monthly' && deliveryDate) {
                        const dayNum = Number(deliveryDate);
                        if (!Number.isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
                            const start = new Date(form.startDate);
                            const date = new Date(start.getFullYear(), start.getMonth(), dayNum);
                            if (date <= start) date.setMonth(date.getMonth() + 1);
                            deliveryDate = date.toISOString().slice(0, 10);
                        }
                    }
                    return {
                        deliveryDay: s.deliveryDay || undefined,
                        deliveryDate,
                        deliveryTime: s.deliveryTime || undefined,
                    };
                }),
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

            navigate('/dashboard');
        } catch {
            setError('Terjadi kesalahan, coba lagi');
            setLoading(false);
        }
    };

    if (!user) return <div className="p-8 text-center text-gray-500">Silakan login.</div>;
    if (!sellerId) return (
        <div className="max-w-4xl mx-auto py-16 px-4 text-center">
            <p className="text-gray-500">Penjual tidak valid. Silakan pilih produk terlebih dahulu.</p>
            <button onClick={() => navigate('/catalog')} className="mt-4 text-primary-green underline text-sm font-medium">Lihat katalog</button>
        </div>
    );
    if (fetching) return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
        </div>
    );

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

                <div ref={errorRef}>
                    {fetchError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4 flex items-center gap-2">
                            <AlertTriangle size={15} /> {fetchError}
                        </div>
                    )}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">{error}</div>
                    )}
                </div>

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
                                <SchedulePicker
                                    schedules={form.schedules}
                                    frequency={form.frequency}
                                    startDate={form.startDate}
                                    endDate={form.endDate}
                                    onSchedulesChange={(schedules) => setForm((f) => ({ ...f, schedules }))}
                                    onFrequencyChange={(frequency) => setForm((f) => ({ ...f, frequency }))}
                                />
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
                                            <div className="relative">
                                                <label className="text-xs font-medium text-gray-600">Produk</label>
                                                <div className="relative mt-1">
                                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                    <input
                                                        ref={(el) => { productRefs.current[i] = el; }}
                                                        value={productSearch[i] || ''}
                                                        onChange={(e) => handleProductSearch(i, e.target.value)}
                                                        onFocus={() => setShowDropdown((prev) => ({ ...prev, [i]: true }))}
                                                        onBlur={() => setTimeout(() => setShowDropdown((prev) => ({ ...prev, [i]: false })), 200)}
                                                        placeholder="Cari produk..."
                                                        className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                                                    />
                                                    {productSearch[i] && (
                                                        <button
                                                            type="button"
                                                            onClick={() => { handleProductSearch(i, ''); productRefs.current[i]?.focus(); }}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                {showDropdown[i] && (
                                                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                                                        {getFilteredProducts(productSearch[i] || '').length === 0 ? (
                                                            <p className="px-3 py-2 text-sm text-gray-400">Produk tidak ditemukan</p>
                                                        ) : getFilteredProducts(productSearch[i] || '').map((p) => {
                                                            const selected = Number(prod.productId) === p.id;
                                                            return (
                                                                <button
                                                                    key={p.id}
                                                                    type="button"
                                                                    onMouseDown={() => handleProductSelect(i, p)}
                                                                    className={`w-full text-left px-3 py-2.5 text-sm transition hover:bg-green-50 flex items-center justify-between ${selected ? 'bg-green-50 font-semibold text-primary-green' : 'text-gray-700'}`}
                                                                >
                                                                    {p.name}
                                                                    {selected && <span className="text-xs text-primary-green">✓</span>}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
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
                                            {totalEstimate > 0 ? formatCurrency(totalEstimate) : 'Rp 0'}
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
