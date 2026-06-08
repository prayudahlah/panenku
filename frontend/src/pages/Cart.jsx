import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cart as cartApi, products as productsApi, userAddresses, checkout as checkoutApi } from '../services/api';
import { formatNumber } from '../utils/format';
import { Trash2, Minus, Plus, Loader, Handshake, AlertTriangle, ShoppingBag, X, Check, CreditCard, ChevronRight } from 'lucide-react';
import productPlaceholder from '../assets/product_placeholder.webp';
import NegotiationModal from '../components/NegotiationModal';
import AddressPicker from '../components/AddressPicker';

export default function Cart() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // States for Negotiation Modal
    const [negoProduct, setNegoProduct] = useState(null);
    const [negoModalOpen, setNegoModalOpen] = useState(false);

    // States for Checkout Modal
    const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
    const [addressesList, setAddressesList] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(1); // default Transfer Bank
    const [courierName, setCourierName] = useState('Kurir Panenku');
    const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
    const [checkoutError, setCheckoutError] = useState('');
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);

    const paymentMethods = [
        { id: 1, name: 'Transfer Bank' },
        { id: 2, name: 'QRIS' },
        { id: 3, name: 'Virtual Account' },
        { id: 4, name: 'GoPay' },
        { id: 5, name: 'OVO' },
        { id: 6, name: 'Dana' },
        { id: 7, name: 'Debit Online' },
    ];

    const loadCart = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await cartApi.view();
            if (res.success) {
                const rawItems = res.data?.items || [];
                // Fetch product details in parallel to obtain location & isNegotiable info
                const detailedItems = await Promise.all(
                    rawItems.map(async (item) => {
                        try {
                            const prodRes = await productsApi.getById(item.productId);
                            if (prodRes.success) {
                                const p = prodRes.data;
                                return {
                                    ...item,
                                    isNegotiable: p.isNegotiable,
                                    farmName: p.farmName,
                                    address: p.address,
                                    cityName: p.cityName,
                                    provinceName: p.provinceName,
                                    stockQuantity: p.stockQuantity,
                                    minOrderQty: p.minOrderQty,
                                };
                            }
                        } catch (err) {
                            console.error(`Error loading product details for #${item.productId}:`, err);
                        }
                        return {
                            ...item,
                            isNegotiable: false,
                            farmName: '',
                            address: '',
                            cityName: '',
                            provinceName: '',
                            stockQuantity: 9999,
                            minOrderQty: 1,
                        };
                    })
                );
                setCartItems(detailedItems);
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

    // Load addresses for parent mapping when checkout modal is open
    useEffect(() => {
        if (checkoutModalOpen) {
            userAddresses.list().then((json) => {
                if (json.success) {
                    setAddressesList(json.data);
                    const def = json.data.find((a) => a.isDefault) || json.data[0];
                    if (def) setSelectedAddressId(def.id);
                }
            });
        }
    }, [checkoutModalOpen]);

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
                    ? { ...item, quantity: newQty, subtotal: newQty * Number(item.pricePerUnit) }
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

    const handleCheckoutSubmit = async (e) => {
        e.preventDefault();
        setCheckoutError('');
        
        if (!selectedAddressId) {
            setCheckoutError('Silakan pilih alamat pengiriman Anda.');
            return;
        }

        const addressObj = addressesList.find((a) => a.id === selectedAddressId);
        if (!addressObj) {
            setCheckoutError('Alamat yang dipilih tidak valid.');
            return;
        }

        setCheckoutSubmitting(true);
        try {
            const res = await checkoutApi.create({
                shippingAddress: addressObj.address,
                provinceId: addressObj.provinceId,
                cityId: addressObj.cityId,
                paymentMethodId: Number(selectedPaymentMethodId),
                courierName: courierName || undefined,
            });

            if (res.success) {
                setCheckoutSuccess(true);
                setTimeout(() => {
                    setCheckoutModalOpen(false);
                    setCheckoutSuccess(false);
                    navigate('/transactions');
                }, 2000);
            } else {
                setCheckoutError(res.message || 'Gagal memproses checkout.');
            }
        } catch {
            setCheckoutError('Terjadi kesalahan jaringan.');
        } finally {
            setCheckoutSubmitting(false);
        }
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
                                <div key={item.cartItemId} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative flex flex-col gap-4">
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
                                            className="w-20 h-20 rounded-xl object-cover border border-gray-100 shrink-0"
                                        />
                                        <div className="min-w-0 pr-8">
                                            <h3 className="text-lg font-bold text-gray-900 truncate">
                                                {item.productName}
                                            </h3>
                                            {item.farmName && (
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
                                            <p className="font-bold text-gray-800 mt-1">
                                                Rp {formatNumber(item.pricePerUnit)} <span className="text-xs text-gray-400 font-normal">/ {item.unitName}</span>
                                            </p>
                                        </div>

                                        <div>
                                            <span className="text-xs text-gray-400 uppercase font-semibold block tracking-wider">Kuantitas</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <button
                                                    onClick={() => handleQuantityChange(item.cartItemId, item.quantity, item.stockQuantity, item.minOrderQty, false)}
                                                    disabled={item.quantity <= Number(item.minOrderQty)}
                                                    className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="font-bold text-gray-800 text-center min-w-[24px]">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => handleQuantityChange(item.cartItemId, item.quantity, item.stockQuantity, item.minOrderQty, true)}
                                                    disabled={item.quantity >= Number(item.stockQuantity)}
                                                    className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <span className="text-xs text-gray-400 block mt-0.5">{item.unitName}</span>
                                        </div>

                                        <div>
                                            <span className="text-xs text-gray-400 uppercase font-semibold block tracking-wider">Dapat Nego?</span>
                                            <div className="mt-1">
                                                {item.isNegotiable ? (
                                                    <span className="inline-block bg-primary-green-100/50 text-primary-green px-2 py-0.5 rounded text-xs font-bold uppercase">
                                                        Yes
                                                    </span>
                                                ) : (
                                                    <span className="inline-block bg-red-50 text-red-600 px-2 py-0.5 rounded text-xs font-bold uppercase">
                                                        No
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <span className="text-xs text-gray-400 uppercase font-semibold block tracking-wider">Subtotal</span>
                                            <p className="font-bold text-primary-green mt-1 text-base">
                                                Rp {formatNumber(item.subtotal)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Nego Action */}
                                    {item.isNegotiable && (
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

                            <button
                                onClick={() => setCheckoutModalOpen(true)}
                                className="w-full py-4 bg-primary-green text-white rounded-xl font-bold hover:bg-primary-green/90 shadow-sm hover:shadow-lg transition flex items-center justify-center gap-2 group text-base"
                            >
                                Checkout Keranjang
                                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
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

            {/* Checkout Dialog Modal */}
            {checkoutModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50" onClick={() => !checkoutSubmitting && setCheckoutModalOpen(false)} />
                    <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full relative overflow-hidden z-10">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-primary-green flex items-center gap-2">
                                <CreditCard size={20} /> Checkout Pemesanan
                            </h2>
                            <button
                                onClick={() => !checkoutSubmitting && setCheckoutModalOpen(false)}
                                className="p-1 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-600"
                                disabled={checkoutSubmitting}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                            {checkoutError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                                    <AlertTriangle size={16} /> {checkoutError}
                                </div>
                            )}

                            {checkoutSuccess && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2 justify-center font-bold animate-pulse">
                                    <Check size={18} /> Checkout Berhasil! Mengalihkan ke transaksi...
                                </div>
                            )}

                            {/* Address Picker Section */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block tracking-wider mb-2">Alamat Pengiriman</label>
                                <AddressPicker
                                    value={selectedAddressId}
                                    onChange={setSelectedAddressId}
                                    disabled={checkoutSubmitting}
                                />
                            </div>

                            {/* Courier Input */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block tracking-wider mb-1.5">Kurir Pengiriman</label>
                                <input
                                    type="text"
                                    value={courierName}
                                    onChange={(e) => setCourierName(e.target.value)}
                                    placeholder="Contoh: Kurir Panenku, JNT, GoSend"
                                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                                    disabled={checkoutSubmitting}
                                />
                            </div>

                            {/* Payment Methods Grid */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block tracking-wider mb-3">Metode Pembayaran</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {paymentMethods.map((pm) => {
                                        const selected = selectedPaymentMethodId === pm.id;
                                        return (
                                            <button
                                                type="button"
                                                key={pm.id}
                                                onClick={() => setSelectedPaymentMethodId(pm.id)}
                                                disabled={checkoutSubmitting}
                                                className={`border p-3 rounded-xl text-left text-sm transition font-medium flex justify-between items-center ${
                                                    selected
                                                        ? 'border-primary-green bg-green-50/50 text-primary-green'
                                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                            >
                                                {pm.name}
                                                {selected && <div className="w-2.5 h-2.5 bg-primary-green rounded-full" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Review summary inside modal */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-baseline">
                                <span className="text-sm text-gray-500 font-semibold">Total Tagihan</span>
                                <span className="text-xl font-bold text-primary-green">
                                    Rp {formatNumber(totalAmount)}
                                </span>
                            </div>

                            <button
                                type="submit"
                                disabled={checkoutSubmitting || checkoutSuccess}
                                className="w-full py-3.5 bg-primary-green text-white rounded-xl font-bold hover:bg-primary-green/90 shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {checkoutSubmitting && <Loader size={18} className="animate-spin" />}
                                {checkoutSubmitting ? 'Memproses Checkout...' : 'Bayar & Pesan Sekarang'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
