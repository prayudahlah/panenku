import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cart as cartApi } from '../services/api';
import { formatNumber } from '../utils/format';
import { Trash2, Minus, Plus, Loader, Handshake, AlertTriangle, ShoppingBag, Lock } from 'lucide-react';
import productPlaceholder from '../assets/product_placeholder.webp';
import NegotiationModal from '../components/NegotiationModal';

export default function Cart() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // States for Negotiation Modal
    const [negoProduct, setNegoProduct] = useState(null);
    const [negoModalOpen, setNegoModalOpen] = useState(false);

    const loadCart = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await cartApi.view();
            if (res.success) {
                setCartItems(res.data?.items || []);
            } else {
                setError(res.message || 'Gagal memuat keranjang belanja');
            }
        } catch (err) {
            setError('Terjadi kesalahan jaringan');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadCart();
        }
    }, [user]);

    const handleQuantityChange = async (itemId, currentQty, stock, minOrder, increment) => {
        let newQty = increment ? currentQty + 1 : currentQty - 1;
        newQty = parseFloat(newQty.toFixed(2));

        if (newQty < Number(minOrder)) {
            newQty = Number(minOrder);
        }
        if (newQty > Number(stock)) {
            newQty = Number(stock);
        }
        if (newQty === currentQty) return;

        // Optimistically update UI
        setCartItems((prev) =>
            prev.map((item) =>
                item.cartItemId === itemId
                    ? { ...item, quantity: newQty, subtotal: newQty * Number(item.negotiatedPrice || item.pricePerUnit) }
                    : item
            )
        );

        try {
            const res = await cartApi.updateItem(itemId, { quantity: newQty });
            if (!res.success) {
                loadCart(); // Rollback on failure
                alert(res.message || 'Gagal memperbarui kuantitas');
            }
        } catch {
            loadCart();
            alert('Kesalahan jaringan saat memperbarui kuantitas');
        }
    };

    const handleRemoveItem = async (itemId) => {
        if (!confirm('Apakah Anda yakin ingin menghapus produk ini dari keranjang?')) return;
        
        // Optimistically remove from UI
        setCartItems((prev) => prev.filter((item) => item.cartItemId !== itemId));

        try {
            const res = await cartApi.removeItem(itemId);
            if (!res.success) {
                loadCart(); // Rollback on failure
                alert(res.message || 'Gagal menghapus produk');
            }
        } catch {
            loadCart();
            alert('Kesalahan jaringan saat menghapus produk');
        }
    };

    const handleOpenNego = (item) => {
        // Construct the product structure needed by NegotiationModal
        setNegoProduct({
            id: item.productId,
            name: item.productName,
            pricePerUnit: item.pricePerUnit,
            unitId: item.unitId,
            unitName: item.unitName,
            minOrderQty: item.minOrderQty,
        });
        setNegoModalOpen(true);
    };

    const handleNegoSuccess = () => {
        setNegoModalOpen(false);
        loadCart();
    };

    const totalAmount = cartItems.reduce((acc, item) => acc + (item.isAvailable ? Number(item.subtotal) : 0), 0);

    if (!user) {
        return (
            <div className="min-h-screen bg-neutral-stone flex items-center justify-center p-4">
                <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-md text-center max-w-md w-full">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Belum Masuk Akun</h2>
                    <p className="text-sm text-gray-500 mb-6">Silakan masuk ke akun Anda terlebih dahulu untuk melihat keranjang belanja Anda.</p>
                    <Link to="/login" className="block w-full py-3 bg-primary-green text-white rounded-xl font-semibold hover:opacity-90 transition shadow-sm">
                        Masuk Sekarang
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-stone">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-extrabold text-primary-green tracking-tight">Keranjang Anda</h1>
                    <p className="text-secondary-brown font-semibold mt-2">
                        Pastikan untuk mengecek produk anda, dan memilih metode pembayaran sesuai dengan kemauan anda.
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2 space-y-4">
                            {[1, 2].map((n) => (
                                <div key={n} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse space-y-4">
                                    <div className="flex gap-4">
                                        <div className="w-20 h-20 bg-gray-200 rounded-lg" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-200 rounded w-1/3" />
                                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                                        </div>
                                    </div>
                                    <div className="h-10 bg-gray-200 rounded" />
                                </div>
                            ))}
                        </div>
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse h-48" />
                    </div>
                ) : error ? (
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center max-w-lg mx-auto">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">{error}</p>
                        <button onClick={loadCart} className="mt-4 px-5 py-2 bg-primary-green text-white rounded-lg text-sm font-semibold hover:opacity-90 transition">
                            Coba Lagi
                        </button>
                    </div>
                ) : cartItems.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center max-w-lg mx-auto">
                        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Keranjang Belanja Kosong</h2>
                        <p className="text-sm text-gray-500 mb-6">Anda belum memiliki produk apa pun di dalam keranjang belanja.</p>
                        <Link to="/catalog" className="inline-block px-6 py-3 bg-primary-green text-white rounded-xl font-semibold hover:opacity-90 transition shadow-sm">
                            Mulai Belanja
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 items-start">
                        {/* Cart Items List */}
                        <div className="space-y-4">
                            {cartItems.map((item) => (
                                <div key={item.cartItemId} className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative flex flex-col gap-4 ${item.isAvailable ? '' : 'opacity-60'}`}>
                                    {!item.isAvailable && (
                                        <div className="absolute top-4 left-4 z-10">
                                            <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md">
                                                Produk Tidak Tersedia
                                            </span>
                                        </div>
                                    )}
                                    {/* Remove button */}
                                    <button
                                        onClick={() => handleRemoveItem(item.cartItemId)}
                                        className="text-gray-400 hover:text-red-500 absolute top-4 right-4 p-1 hover:bg-gray-50 rounded-lg transition"
                                        title="Hapus Produk"
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                    {/* Product Meta */}
                                    <div className="flex gap-4 items-start">
                                        <img
                                            src={productPlaceholder}
                                            alt={item.productName}
                                            className={`w-20 h-20 rounded-xl object-cover border border-gray-100 shrink-0 ${item.isAvailable ? '' : 'grayscale'}`}
                                        />
                                        <div className="min-w-0 pr-8">
                                            <h3 className={`text-lg font-bold truncate ${item.isAvailable ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                                                {item.productName}
                                            </h3>
                                            {item.isAvailable && item.farmName && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Asal : {item.cityName || item.provinceName || 'Indonesia'}, {item.address}, {item.farmName}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <hr className="border-gray-100" />

                                    {/* Grid Details */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-xs text-gray-400 uppercase font-semibold block tracking-wider">Harga</span>
                                            <p className={`font-bold mt-1 ${item.isAvailable ? 'text-gray-800' : 'text-gray-400'}`}>
                                                {item.isAvailable ? (
                                                    item.negotiatedPrice ? (
                                                        <span className="flex items-center gap-1">Rp {formatNumber(item.negotiatedPrice)} <Lock size={11} className="text-primary-green" /> <span className="text-xs text-primary-green font-semibold">(hasil nego)</span> <span className="text-xs text-gray-400 font-normal">/ {item.unitName}</span></span>
                                                    ) : (
                                                        <>Rp {formatNumber(item.pricePerUnit)} <span className="text-xs text-gray-400 font-normal">/ {item.unitName}</span></>
                                                    )
                                                ) : '—'}
                                            </p>
                                        </div>

                                        <div>
                                            <span className="text-xs text-gray-400 uppercase font-semibold block tracking-wider">Kuantitas</span>
                                            {item.negotiatedPrice ? (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="font-bold text-gray-800">{item.quantity}</span>
                                                    <span className="text-[10px] bg-primary-green/10 text-primary-green font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                        <Lock size={10} /> Terkunci
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <button
                                                        onClick={() => handleQuantityChange(item.cartItemId, item.quantity, item.stockQuantity, item.minOrderQty, false)}
                                                        disabled={!item.isAvailable || item.quantity <= Number(item.minOrderQty)}
                                                        className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="font-bold text-gray-800 text-center min-w-[24px]">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => handleQuantityChange(item.cartItemId, item.quantity, item.stockQuantity, item.minOrderQty, true)}
                                                        disabled={!item.isAvailable || item.quantity >= Number(item.stockQuantity)}
                                                        className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            )}
                                            <span className="text-xs text-gray-400 block mt-0.5">{item.unitName}</span>
                                        </div>

                                        <div>
                                            <span className="text-xs text-gray-400 uppercase font-semibold block tracking-wider">Status Nego</span>
                                            <div className="mt-1">
                                                {item.isAvailable ? (
                                                    item.negotiatedPrice ? (
                                                        <span className="inline-block bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-bold uppercase flex items-center gap-1">
                                                            <Lock size={10} /> Terkunci
                                                        </span>
                                                    ) : item.isNegotiable ? (
                                                        <span className="inline-block bg-primary-green-100/50 text-primary-green px-2 py-0.5 rounded text-xs font-bold uppercase">
                                                            Bisa nego
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block bg-red-50 text-red-600 px-2 py-0.5 rounded text-xs font-bold uppercase">
                                                            Fixed
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="inline-block bg-gray-100 text-gray-400 px-2 py-0.5 rounded text-xs font-bold uppercase">
                                                        —
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <span className="text-xs text-gray-400 uppercase font-semibold block tracking-wider">Subtotal</span>
                                            <p className={`font-bold mt-1 text-base ${item.isAvailable ? 'text-primary-green' : 'text-gray-400'}`}>
                                                {item.isAvailable ? `Rp ${formatNumber(item.subtotal)}` : '—'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Nego Action */}
                                    {item.isAvailable && item.isNegotiable && !item.negotiatedPrice && (
                                        <div className="flex justify-end pt-2">
                                            <button
                                                onClick={() => handleOpenNego(item)}
                                                className="bg-secondary-brown-100 text-secondary-brown-800 px-4 py-2 rounded-xl text-xs font-bold hover:bg-secondary-brown-100/80 transition flex items-center gap-1.5 shadow-sm"
                                            >
                                                <Handshake size={14} /> Negosiasi
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Summary Panel */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-6 space-y-6">
                            <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wider">Ringkasan Keranjang</h2>
                            
                            <div className="flex justify-between items-baseline py-4 border-t border-b border-gray-100">
                                <span className="font-semibold text-gray-600 text-sm">Total</span>
                                <span className="text-2xl font-extrabold text-primary-green">
                                    Rp {formatNumber(totalAmount)}
                                </span>
                            </div>

                            <Link
                                to="/checkout"
                                className="w-full py-4 bg-primary-green text-white rounded-xl font-bold hover:bg-primary-green/90 shadow-sm hover:shadow-lg transition flex items-center justify-center gap-2 group text-base"
                            >
                                Checkout Keranjang
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Negotiation Modal */}
            <NegotiationModal
                isOpen={negoModalOpen}
                onClose={() => setNegoModalOpen(false)}
                product={negoProduct}
                onSuccess={handleNegoSuccess}
            />

        </div>
    );
}
