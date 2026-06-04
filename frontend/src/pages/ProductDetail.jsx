import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { formatNumber, formatDecimal } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { products as productsApi, negotiations, cart } from '../services/api';
import { Handshake, Store, MapPin, Minus, Plus, Loader, Check, AlertTriangle, X } from 'lucide-react';
import productPlaceholder from '../assets/product_placeholder.webp';

export default function ProductDetail() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [product, setProduct] = useState(location.state?.product || null);
    const [loading, setLoading] = useState(!product);
    const [error, setError] = useState(null);

    const [qty, setQty] = useState(1);
    const [actionMsg, setActionMsg] = useState(null);
    const [addingCart, setAddingCart] = useState(false);
    const [buying, setBuying] = useState(false);

    const [negoModal, setNegoModal] = useState(false);
    const [negoChats, setNegoChats] = useState([]);
    const [existingNego, setExistingNego] = useState(null);
    const [negoListLoading, setNegoListLoading] = useState(false);
    const [negoFormPrice, setNegoFormPrice] = useState('');
    const [negoFormQty, setNegoFormQty] = useState(1);
    const [negoFormDesc, setNegoFormDesc] = useState('');
    const [negoFormSubmitting, setNegoFormSubmitting] = useState(false);
    const [negoFormResult, setNegoFormResult] = useState(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(null);
        productsApi.getById(id)
            .then((json) => {
                if (json.success) {
                    setProduct(json.data);
                    setQty(Number(json.data.minOrderQty) || 1);
                } else {
                    setError(json.message || 'Produk tidak ditemukan');
                }
            })
            .catch(() => setError('Terjadi kesalahan jaringan'))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (product) {
            setQty(Number(product.minOrderQty) || 1);
        }
    }, [product?.id]);

    useEffect(() => {
        if (!negoModal || !user || !product) return;
        setNegoListLoading(true);
        setNegoFormResult(null);
        setNegoFormPrice('');
        setNegoFormDesc('');
        setNegoChats([]);
        setExistingNego(null);
        setNegoFormQty(Number(product.minOrderQty) || 1);

        negotiations.list().then((json) => {
            const list = json.success ? json.data || [] : [];
            const match = list.find((n) => n.productId === product.id && (n.status === 'ongoing' || n.status === 'pending'));
            if (match) {
                setExistingNego(match);
                setNegoFormQty(Number(match.agreedQuantityOffer) || Number(product.minOrderQty));
                setNegoFormPrice(String(match.agreedPriceOffer || ''));
                negotiations.getById(match.id).then((d) => {
                    if (d.success) setNegoChats(d.data.chats || []);
                });
            }
        }).finally(() => setNegoListLoading(false));
    }, [negoModal]);

    const isOwner = user && product && user.id === product.sellerId;
    const isBuyer = user?.role === 'buyer';
    const canAct = isBuyer && !isOwner;
    const canNego = canAct && product?.isNegotiable;

    const handleAddToCart = async () => {
        if (!canAct || !product) return;
        setActionMsg(null);
        setAddingCart(true);
        try {
            const json = await cart.addItem({
                productId: product.id,
                quantity: qty,
                unitId: product.unitId,
            });
            if (json.success) {
                setActionMsg({ type: 'success', text: `${qty} ${product.unitName} ditambahkan ke keranjang` });
            } else {
                setActionMsg({ type: 'error', text: json.message || 'Gagal menambahkan ke keranjang' });
            }
        } catch {
            setActionMsg({ type: 'error', text: 'Terjadi kesalahan jaringan' });
        }
        setAddingCart(false);
    };

    const handleBuyNow = async () => {
        if (!canAct || !product) return;
        setActionMsg(null);
        setBuying(true);
        try {
            const json = await cart.addItem({
                productId: product.id,
                quantity: qty,
                unitId: product.unitId,
            });
            if (json.success) {
                navigate('/cart');
            } else {
                setActionMsg({ type: 'error', text: json.message || 'Gagal memproses pembelian' });
            }
        } catch {
            setActionMsg({ type: 'error', text: 'Terjadi kesalahan jaringan' });
        }
        setBuying(false);
    };

    const handleNegoSubmit = async (e) => {
        e.preventDefault();
        setNegoFormResult(null);
        const priceVal = Number(negoFormPrice);
        const qtyVal = Number(negoFormQty);
        if (qtyVal < Number(product.minOrderQty)) {
            setNegoFormResult({ type: 'error', message: `Kuantitas minimal ${product.minOrderQty} ${product.unitName}` });
            return;
        }
        if (priceVal <= 0) {
            setNegoFormResult({ type: 'error', message: 'Harga tawar harus lebih dari 0' });
            return;
        }
        setNegoFormSubmitting(true);
        try {
            if (existingNego) {
                const json = await negotiations.buyerRespond(existingNego.id, {
                    action: 'counter',
                    priceOffer: priceVal,
                    unitId: product.unitId,
                    quantityOffer: qtyVal,
                    description: negoFormDesc || undefined,
                });
                if (json.success) {
                    setNegoFormResult({ type: 'success', message: 'Tawaran balik dikirim!' });
                    negotiations.getById(existingNego.id).then((d) => {
                        if (d.success) setNegoChats(d.data.chats || []);
                    });
                } else {
                    setNegoFormResult({ type: 'error', message: json.message || 'Gagal mengirim tawaran' });
                }
            } else {
                const json = await negotiations.initiate({
                    productId: product.id,
                    priceOffer: priceVal,
                    unitId: product.unitId,
                    quantityOffer: qtyVal,
                    description: negoFormDesc || undefined,
                });
                if (json.success) {
                    setNegoModal(false);
                } else {
                    setNegoFormResult({ type: 'error', message: json.message || 'Gagal mengajukan negosiasi' });
                }
            }
        } catch {
            setNegoFormResult({ type: 'error', message: 'Terjadi kesalahan jaringan' });
        }
        setNegoFormSubmitting(false);
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="animate-pulse grid grid-cols-1 lg:grid-cols-5 gap-8 mt-4">
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-gray-200 rounded-xl h-80" />
                        <div className="bg-gray-200 rounded-xl h-40" />
                    </div>
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-gray-200 rounded-xl h-64" />
                        <div className="bg-gray-200 rounded-xl h-24" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 text-center">
                <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">{error || 'Produk tidak ditemukan.'}</p>
                <Link to="/catalog" className="text-primary-green underline font-medium">Kembali ke katalog</Link>
            </div>
        );
    }

    const suggestedPrice = Math.floor(Number(product.pricePerUnit) * 0.8);

    return (
        <>
        <div className="max-w-6xl mx-auto px-4 py-8">
            <Link to="/catalog" className="text-sm text-gray-500 hover:text-primary-green inline-flex items-center gap-1">&larr; Kembali ke katalog</Link>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-4">
                {/* Kolom Kiri */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-md overflow-hidden">
                        <img
                            src={productPlaceholder}
                            alt={product.name}
                            className="w-full h-auto object-cover"
                        />
                    </div>

                    {product.description && (
                        <div className="bg-white rounded-xl">
                            <h3 className="font-semibold text-gray-900 mb-3">Deskripsi Produk</h3>
                            <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{product.description}</p>
                        </div>
                    )}

                    <div className='w-full h-px bg-gray-200' />

                    {/* Seller Profile Card */}
                    <div className="bg-white space-y-3">
                        <Link to={`/sellers/${product.sellerId}`} className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-green to-secondary-brown-400 flex items-center justify-center shrink-0">
                                <Store size={18} className="text-white" />
                            </div>
                            <p className="font-semibold text-gray-900 group-hover:text-primary-green transition truncate">{product.farmName}</p>
                        </Link>
                        {product.address && (
                            <p className="text-xs text-gray-400 flex items-start gap-1.5">
                                <MapPin size={13} className="shrink-0 mt-0.5" />
                                <span>{product.address}{product.cityName ? `, ${product.cityName}` : ''}{product.provinceName ? `, ${product.provinceName}` : ''}</span>
                            </p>
                        )}
                        <div className="flex items-center gap-3 text-xs">
                            <Link to={`/sellers/${product.sellerId}`} className="text-gray-400 hover:text-primary-green transition">
                                Lihat toko &rarr;
                            </Link>
                            {isBuyer && !isOwner && (
                                <span className="text-gray-300">|</span>
                            )}
                            {isBuyer && !isOwner && (
                                <Link
                                    to={`/contracts/new?sellerId=${product.sellerId}&sellerName=${encodeURIComponent(product.farmName)}`}
                                    className="text-gray-400 hover:text-primary-green transition flex items-center gap-1"
                                >
                                    <Handshake size={13} /> Ajukan kemitraan
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className='w-full h-px bg-gray-200' />
                </div>

                {/* Kolom Kanan */}
                <div className="lg:col-span-2">
                    <div className="sticky top-24 space-y-4">
                        {/* Card Info + Aksi */}
                        <div className="bg-white rounded-md border border-gray-200 p-6 space-y-5 shadow-sm">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
                                <span className="inline-block mt-1.5 text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">{product.categoryName}</span>
                                {product.isNegotiable && (
                                    <span className="inline-block ml-2 text-xs bg-secondary-brown-100 text-secondary-brown-800 px-2.5 py-0.5 rounded-full font-medium">Bisa nego</span>
                                )}
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-primary-green">Rp {formatNumber(product.pricePerUnit)}</span>
                                <span className="text-sm text-gray-400">/{product.unitName}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-400">Stok</span>
                                    <p className="font-semibold text-gray-800">{formatNumber(product.stockQuantity)} {product.unitName}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400">Min. Pembelian</span>
                                    <p className="font-semibold text-gray-800">{formatNumber(product.minOrderQty)} {product.unitName}</p>
                                </div>
                            </div>

                            {/* Quantity Selector */}
                            <div>
                                <label className="text-sm text-gray-500 mb-1.5 block">Jumlah</label>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setQty(Math.max(Number(product.minOrderQty), parseFloat((qty - 0.1).toFixed(2))))}
                                        disabled={qty <= Number(product.minOrderQty)}
                                        className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    ><Minus size={16} /></button>
                                    <input
                                        type="number"
                                        step="any"
                                        value={qty}
                                        onChange={(e) => setQty(Math.max(Number(product.minOrderQty), Number(e.target.value) || 0))}
                                        className="w-20 text-center border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        min={Number(product.minOrderQty)}
                                    />
                                    <button
                                        onClick={() => setQty(Math.min(Number(product.stockQuantity), parseFloat((qty + 0.1).toFixed(2))))}
                                        disabled={qty >= Number(product.stockQuantity)}
                                        className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    ><Plus size={16} /></button>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{formatDecimal(qty)} {product.unitName}</p>
                            </div>

                            <div className="flex items-center justify-between py-3 border-t border-gray-100">
                                <span className="text-sm text-gray-500">Subtotal</span>
                                <span className="text-lg font-bold text-gray-900">Rp {formatDecimal(qty * Number(product.pricePerUnit))}</span>
                            </div>

                            {/* Action Messages */}
                            {actionMsg && (
                                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${actionMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                                    {actionMsg.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
                                    {actionMsg.text}
                                </div>
                            )}

                            {/* Action Buttons */}
                            {user ? (
                                canAct ? (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={handleAddToCart}
                                                disabled={addingCart}
                                                className="py-2.5 bg-primary-green text-white rounded-lg font-medium hover:bg-primary-green/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:shadow-sm disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                                            >
                                                {addingCart ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                                                Keranjang
                                            </button>
                                            <button
                                                onClick={handleBuyNow}
                                                disabled={buying}
                                                className="py-2.5 border border-primary-green text-primary-green rounded-lg font-medium hover:bg-green-50 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:shadow-sm disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                                            >
                                                {buying ? <Loader size={16} className="animate-spin" /> : ''}
                                                Beli Sekarang
                                            </button>
                                        </div>

                                        {canNego && (
                                            <button
                                                onClick={() => setNegoModal(true)}
                                                className="w-full py-2.5 border border-secondary-brown-300 text-secondary-brown rounded-lg font-medium hover:bg-secondary-brown-50 shadow-sm hover:shadow-md transition flex items-center justify-center gap-2"
                                            >
                                                <Handshake size={16} />
                                                Ajukan Negosiasi
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                                        {isOwner ? 'Ini adalah produk Anda sendiri' : 'Anda tidak dapat membeli produk ini'}
                                    </div>
                                )
                            ) : (
                                <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                                    <Link to="/login" className="text-primary-green font-medium underline">Login</Link> untuk membeli atau nego produk ini
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>

        {negoModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setNegoModal(false)}>
                <div className="fixed inset-0 bg-black/50" />
                <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between p-6 border-b">
                        <h2 className="text-lg font-bold">Ajukan Negosiasi</h2>
                        <button onClick={() => setNegoModal(false)} className="text-gray-400 hover:text-gray-600 transition"><X size={20} /></button>
                    </div>

                    {negoListLoading ? (
                        <div className="flex items-center justify-center p-12"><Loader size={24} className="animate-spin text-primary-green" /></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                            {/* Kiri - Timeline */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Riwayat Negosiasi</h3>
                                {negoChats.length === 0 ? (
                                    <p className="text-sm text-gray-400">Belum ada riwayat negosiasi untuk produk ini.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {negoChats.map((chat) => (
                                            <div key={chat.id || chat.turnOrder} className="relative pl-6 pb-4 border-l-2 border-gray-200 last:border-transparent">
                                                <div className={`absolute left-[-5px] w-2.5 h-2.5 rounded-full mt-1 ${chat.turnOwner === 'buyer' ? 'bg-primary-green' : 'bg-secondary-brown-400'}`} />
                                                <p className="text-xs font-medium text-gray-500">{chat.turnOwner === 'buyer' ? 'Kamu' : 'Penjual'}</p>
                                                <p className="text-sm font-semibold text-gray-800">Rp {formatNumber(chat.offerPrice)}</p>
                                                <p className="text-xs text-gray-500">{formatDecimal(chat.quantityOffer)} {chat.unitName}</p>
                                                {chat.description && <p className="text-xs text-gray-400 mt-0.5 italic">{chat.description}</p>}
                                                <p className="text-xs text-gray-300 mt-0.5">{new Date(chat.createdAt).toLocaleString('id-ID')}</p>
                                            </div>
                                        ))}
                                        {existingNego?.status === 'ongoing' && (
                                            <div className="relative pl-6 pb-4">
                                                <div className="absolute left-[-5px] w-2.5 h-2.5 rounded-full bg-gray-300 animate-pulse" />
                                                <p className="text-xs font-medium text-gray-400">Menunggu respon...</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Kanan - Form */}
                            <div>
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                                    {existingNego ? 'Tanggapi Penawaran' : 'Ajukan Penawaran Baru'}
                                </h3>

                                {negoFormResult && (
                                    <div className={`p-3 rounded-lg text-sm mb-4 ${negoFormResult.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                                        {negoFormResult.message}
                                    </div>
                                )}

                                <form onSubmit={handleNegoSubmit} className="space-y-4">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500">Harga Tawar (Rp)</label>
                                        <input type="number" value={negoFormPrice} onChange={(e) => setNegoFormPrice(e.target.value)} placeholder={String(suggestedPrice)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1" required />
                                        <p className="text-xs text-gray-400 mt-1">Saran: Rp {formatNumber(suggestedPrice)}</p>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-gray-500">Kuantitas ({product.unitName})</label>
                                        <div className="flex items-center gap-3 mt-1">
                                            <button type="button" onClick={() => setNegoFormQty(Math.max(Number(product.minOrderQty), parseFloat((negoFormQty - 0.1).toFixed(2))))} disabled={negoFormQty <= Number(product.minOrderQty)} className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><Minus size={16} /></button>
                                            <input type="number" step="any" value={negoFormQty} onChange={(e) => setNegoFormQty(Math.max(Number(product.minOrderQty), Number(e.target.value) || 0))} className="w-20 text-center border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" min={Number(product.minOrderQty)} />
                                            <button type="button" onClick={() => setNegoFormQty(Math.min(Number(product.stockQuantity), parseFloat((negoFormQty + 0.1).toFixed(2))))} disabled={negoFormQty >= Number(product.stockQuantity)} className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><Plus size={16} /></button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-gray-500">Catatan (opsional)</label>
                                        <textarea value={negoFormDesc} onChange={(e) => setNegoFormDesc(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1" />
                                    </div>

                                    <div className="flex gap-3">
                                        {existingNego && (
                                            <button type="button" onClick={async () => {
                                                setNegoFormResult(null);
                                                setNegoFormSubmitting(true);
                                                try {
                                                    const json = await negotiations.buyerRespond(existingNego.id, { action: 'accept' });
                                                    if (json.success) {
                                                        setNegoFormResult({ type: 'success', message: 'Penawaran diterima!' });
                                                    } else {
                                                        setNegoFormResult({ type: 'error', message: json.message || 'Gagal menerima' });
                                                    }
                                                } catch {
                                                    setNegoFormResult({ type: 'error', message: 'Terjadi kesalahan jaringan' });
                                                }
                                                setNegoFormSubmitting(false);
                                            }} disabled={negoFormSubmitting} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 text-sm">
                                                Terima
                                            </button>
                                        )}
                                        <button type="submit" disabled={negoFormSubmitting} className={existingNego ? 'flex-1 py-2 bg-secondary-brown-600 text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 text-sm' : 'w-full py-2.5 bg-secondary-brown-600 text-white rounded-lg font-medium hover:opacity-90 shadow-sm transition disabled:opacity-50'}>
                                            {negoFormSubmitting && <Loader size={14} className="animate-spin inline mr-1" />}
                                            {existingNego ? 'Tawar Lagi' : 'Ajukan Negosiasi'}
                                        </button>
                                        {existingNego && (
                                            <button type="button" onClick={async () => {
                                                setNegoFormResult(null);
                                                setNegoFormSubmitting(true);
                                                try {
                                                    const json = await negotiations.buyerRespond(existingNego.id, { action: 'cancel' });
                                                    if (json.success) {
                                                        setNegoModal(false);
                                                    } else {
                                                        setNegoFormResult({ type: 'error', message: json.message || 'Gagal membatalkan' });
                                                    }
                                                } catch {
                                                    setNegoFormResult({ type: 'error', message: 'Terjadi kesalahan jaringan' });
                                                }
                                                setNegoFormSubmitting(false);
                                            }} disabled={negoFormSubmitting} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-50 text-sm">
                                                Batalkan
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
        </>
    );
}
