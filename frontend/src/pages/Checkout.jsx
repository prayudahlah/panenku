import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ShoppingBag, Truck, CreditCard,
    Wallet, QrCode, Building2, CheckCircle2, Loader, AlertTriangle, MapPin,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cart as cartApi, checkout as checkoutApi, references } from '../services/api';
import { formatNumber } from '../utils/format';
import productPlaceholder from '../assets/product_placeholder.webp';

// ── konstanta ──────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
    { id: 1, key: 'ewallet',     label: 'E-wallet',      sub: 'GoPay, OVO',       Icon: Wallet    },
    { id: 2, key: 'qris',        label: 'QRIS',          sub: 'Instant Payment',  Icon: QrCode    },
    { id: 3, key: 'credit_card', label: 'Kartu Kredit',  sub: 'Visa, Mastercard', Icon: CreditCard },
    { id: 4, key: 'bank',        label: 'Transfer Bank', sub: 'Virtual Account',  Icon: Building2 },
];

const SERVICE_FEE = 25000;

// ── sub-komponen ───────────────────────────────────────────────────────────────

function PaymentMethodCard({ method, selected, onSelect }) {
    const { Icon } = method;
    const active = selected === method.id;
    return (
        <button
            type="button"
            onClick={() => onSelect(method.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                active
                    ? 'border-green-400/60 bg-white/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
        >
            {/* icon box */}
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <Icon size={17} className="text-green-300" />
            </div>
            {/* label */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white leading-tight">{method.label}</p>
                <p className="text-xs text-green-300/60 mt-0.5">{method.sub}</p>
            </div>
            {/* radio */}
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                active ? 'border-green-400 bg-green-400' : 'border-white/30'
            }`}>
                {active && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
        </button>
    );
}

// ── halaman utama ──────────────────────────────────────────────────────────────

export default function Checkout() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [cartData, setCartData]       = useState(null);
    const [loading, setLoading]         = useState(true);
    const [submitting, setSubmitting]   = useState(false);
    const [error, setError]             = useState(null);

    const [shippingAddress, setShippingAddress] = useState('');
    const [provinceId, setProvinceId]           = useState('');
    const [cityId, setCityId]                   = useState('');
    const [provinces, setProvinces]             = useState([]);
    const [cities, setCities]                   = useState([]);
    const [loadingAddress, setLoadingAddress]   = useState(true);
    const [paymentMethodId, setPaymentMethodId] = useState(4);
    const [courierName, setCourierName]         = useState('');

    // ── fetch cart ────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!user) return;
        cartApi.view()
            .then((json) => {
                if (json.success) setCartData(json.data);
                else setError(json.message || 'Gagal memuat keranjang');
            })
            .catch(() => setError('Terjadi kesalahan jaringan'))
            .finally(() => setLoading(false));
    }, [user]);

    // ── fetch provinces & cities ──────────────────────────────────────────────

    useEffect(() => {
        if (!user) return;
        references.getProvinces().then((json) => {
            if (json.success) setProvinces(json.data || []);
        });
        references.getAllCities().then((json) => {
            if (json.success) setCities(json.data || []);
        }).finally(() => setLoadingAddress(false));
    }, [user]);

    const filteredCities = useMemo(
        () => (provinceId ? cities.filter((c) => c.provinceId === Number(provinceId)) : []),
        [provinceId, cities],
    );

    // ── grouped per seller ─────────────────────────────────────────────────────

    const groupedBySeller = useMemo(() => {
        if (!cartData?.items) return [];
        const map = new Map();
        for (const item of cartData.items) {
            if (!item.isAvailable) continue;
            const key = item.sellerId ?? 'unknown';
            if (!map.has(key)) {
                map.set(key, {
                    sellerId: key,
                    sellerName: item.sellerName || item.farmName || 'Penjual',
                    location: item.sellerLocation || '',
                    items: [],
                });
            }
            map.get(key).items.push(item);
        }
        return [...map.values()];
    }, [cartData]);

    // ── kalkulasi ──────────────────────────────────────────────────────────────

    const subtotal     = cartData?.totalAmount ?? 0;
    const shippingCost = 0;          // tidak ada ongkir otomatis; text field bebas
    const totalTagihan = subtotal + shippingCost + SERVICE_FEE;

    // ── submit ─────────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!shippingAddress.trim() || shippingAddress.trim().length < 5) { setError('Alamat pengiriman wajib diisi minimal 5 karakter'); return; }
        if (!provinceId) { setError('Pilih provinsi tujuan pengiriman'); return; }
        if (!cityId) { setError('Pilih kota tujuan pengiriman'); return; }
        if (!cartData?.items?.length) { setError('Keranjang belanja kosong'); return; }

        setError(null);
        setSubmitting(true);

        try {
            const json = await checkoutApi.create({
                shippingAddress: shippingAddress.trim(),
                courierName: courierName.trim() || null,
                paymentMethodId,
                provinceId: Number(provinceId),
                cityId: Number(cityId),
            });

            if (!json.success) {
                setError(json.message || 'Checkout gagal');
                setSubmitting(false);
                return;
            }

            navigate('/transactions', { state: { checkoutId: json.data?.checkoutId, fromCheckout: true } });
        } catch {
            setError('Terjadi kesalahan jaringan');
            setSubmitting(false);
        }
    };

    // ── guard states ───────────────────────────────────────────────────────────

    if (!user) {
        return (
            <div className="max-w-4xl mx-auto py-16 px-4 text-center text-gray-500">
                Silakan <a href="/login" className="text-primary-green underline font-medium">login</a> terlebih dahulu.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-10">
                <div className="animate-pulse space-y-5">
                    <div className="h-7 w-52 bg-gray-200 rounded" />
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
                        <div className="space-y-4">
                            <div className="h-28 bg-gray-200 rounded-2xl" />
                            <div className="h-72 bg-gray-200 rounded-2xl" />
                            <div className="h-24 bg-gray-200 rounded-2xl" />
                        </div>
                        <div className="h-[480px] bg-gray-200 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!cartData || cartData.itemCount === 0) {
        return (
            <div className="max-w-4xl mx-auto py-20 px-4 text-center">
                <ShoppingBag className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Keranjang belanja kosong.</p>
                <button onClick={() => navigate('/catalog')} className="text-primary-green underline font-medium text-sm">
                    Lihat katalog produk
                </button>
            </div>
        );
    }

    // ── render ─────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-neutral-stone">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* back + title */}
                <button
                    onClick={() => navigate('/cart')}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition mb-1"
                >
                    <ArrowLeft size={15} />
                    <span>Kembali</span>
                </button>

                <h1 className="text-xl font-bold text-primary-green mb-6">Checkout Pembayaran</h1>

                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-5">
                        <AlertTriangle size={15} className="shrink-0" />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

                    {/* ══ Kolom Kiri ══════════════════════════════════════════ */}
                    <div className="space-y-4">

                        {/* Alamat Pengiriman */}
                        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <MapPin size={15} className="text-primary-green" />
                                    <span className="font-semibold text-gray-800 text-sm">Alamat Pengiriman</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-600">Provinsi</label>
                                    <select
                                        value={provinceId}
                                        onChange={(e) => { setProvinceId(e.target.value); setCityId(''); }}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1"
                                    >
                                        <option value="">{loadingAddress ? 'Memuat...' : 'Pilih provinsi'}</option>
                                        {provinces.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-600">Kota</label>
                                    <select
                                        value={cityId}
                                        onChange={(e) => setCityId(e.target.value)}
                                        disabled={!provinceId}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1 disabled:bg-gray-100"
                                    >
                                        <option value="">Pilih kota</option>
                                        {filteredCities.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <textarea
                                value={shippingAddress}
                                onChange={(e) => setShippingAddress(e.target.value)}
                                placeholder="Jalan, gang, kode pos — alamat lengkap tujuan pengiriman"
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                            />
                            <p className="text-xs text-gray-400 mt-1.5">Alamat pengiriman minimal 5 karakter</p>
                        </section>

                        {/* Ringkasan Pesanan */}
                        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                {/* crown icon menggunakan emoji agar konsisten dengan mockup */}
                                <span className="text-base">👑</span>
                                <span className="font-semibold text-gray-800">Ringkasan Pesanan</span>
                            </div>

                            <div className="space-y-6">
                                {groupedBySeller.length > 0 ? (
                                    groupedBySeller.map((group, gi) => (
                                        <div key={group.sellerId}>
                                            {/* seller header */}
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <CheckCircle2 size={13} className="text-primary-green shrink-0" />
                                                <span className="text-sm font-semibold text-primary-green">{group.sellerName}</span>
                                            </div>
                                            {group.location && (
                                                <p className="text-xs text-gray-400 mb-3 pl-5">{group.location}</p>
                                            )}

                                            {/* items */}
                                            <div className="space-y-4 pl-1">
                                                {group.items.map((item) => (
                                                    <div key={item.cartItemId} className="flex items-center gap-3">
                                                        <img
                                                            src={productPlaceholder}
                                                            alt={item.productName}
                                                            className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-100"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-800 text-sm truncate">{item.productName}</p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="text-xs text-gray-400 mb-0.5">{item.quantity} {item.unitName}</p>
                                                            <p className="text-sm font-bold text-primary-green">
                                                                {item.quantity} x Rp {formatNumber(item.pricePerUnit)}/{item.unitName}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {gi < groupedBySeller.length - 1 && (
                                                <div className="mt-5 border-t border-dashed border-gray-100" />
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    /* fallback tanpa grouping */
                                    <div className="space-y-4">
                                        {cartData.items.filter((i) => i.isAvailable).map((item) => (
                                            <div key={item.cartItemId} className="flex items-center gap-3">
                                                <img
                                                    src={productPlaceholder}
                                                    alt={item.productName}
                                                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-100"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-800 text-sm truncate">{item.productName}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-xs text-gray-400 mb-0.5">{item.quantity} {item.unitName}</p>
                                                    <p className="text-sm font-bold text-primary-green">
                                                        {item.quantity} x Rp {formatNumber(item.pricePerUnit)}/{item.unitName}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Pilih Sistem Pengiriman — text field */}
                        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Truck size={15} className="text-primary-green" />
                                <span className="font-semibold text-gray-800">Pilih Sistem Pengiriman</span>
                            </div>
                            <input
                                type="text"
                                value={courierName}
                                onChange={(e) => setCourierName(e.target.value)}
                                placeholder="Contoh: JNE, TIKI, Kurir Lokal, Ambil Sendiri…"
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green placeholder:text-gray-400"
                            />
                            <p className="text-xs text-gray-400 mt-1.5">Opsional — isi nama jasa pengiriman yang disepakati dengan penjual</p>
                        </section>

                    </div>

                    {/* ══ Kolom Kanan — Panel Pembayaran ══════════════════════ */}
                    <div className="lg:sticky lg:top-24">
                        <div className="bg-[#1c3b18] rounded-2xl p-5 space-y-4">

                            {/* judul panel */}
                            <div className="flex items-center gap-2">
                                <CreditCard size={17} className="text-green-300" />
                                <span className="font-semibold text-white">Metode Pembayaran</span>
                            </div>

                            {/* metode */}
                            <div className="space-y-2">
                                {PAYMENT_METHODS.map((m) => (
                                    <PaymentMethodCard
                                        key={m.id}
                                        method={m}
                                        selected={paymentMethodId}
                                        onSelect={setPaymentMethodId}
                                    />
                                ))}
                            </div>

                            {/* divider */}
                            <div className="border-t border-white/10 pt-1" />

                            {/* rincian biaya */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-200/70">Total Produk</span>
                                    <span className="text-white font-medium">Rp {formatNumber(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-200/70">Biaya Pengiriman</span>
                                    <span className="text-white font-medium">Rp {formatNumber(shippingCost)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-200/70">Biaya Layanan</span>
                                    <span className="text-white font-medium">Rp {formatNumber(SERVICE_FEE)}</span>
                                </div>
                            </div>

                            {/* divider */}
                            <div className="border-t border-white/10" />

                            {/* total */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-green-200/70">Total Tagihan</span>
                                <span className="text-2xl font-bold text-[#7de87a]">
                                    Rp {formatNumber(totalTagihan)}
                                </span>
                            </div>

                            {/* CTA */}
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !shippingAddress.trim() || shippingAddress.trim().length < 5 || !provinceId || !cityId}
                                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm
                                    bg-[#7de87a] text-[#1c3b18] hover:brightness-110 active:scale-[0.98] transition-all
                                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
                            >
                                {submitting
                                    ? <Loader size={16} className="animate-spin" />
                                    : <CreditCard size={16} />
                                }
                                {submitting ? 'Memproses…' : 'Konfirmasi & Bayar Sekarang'}
                            </button>

                            {(!shippingAddress.trim() || shippingAddress.trim().length < 5 || !provinceId || !cityId) && (
                                <p className="text-xs text-center text-yellow-400/70">
                                    Isi provinsi, kota, dan alamat pengiriman untuk melanjutkan
                                </p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
