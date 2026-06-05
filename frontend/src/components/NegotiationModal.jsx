import { useState, useEffect } from 'react';
import { formatNumber, formatDecimal } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { negotiations } from '../services/api';
import { Loader, X } from 'lucide-react';
import productPlaceholder from '../assets/product_placeholder.webp';
import NegotiationTimeline from './NegotiationTimeline';
import NegotiationFormFields from './NegotiationFormFields';

export default function NegotiationModal({ isOpen, onClose, product, onSuccess }) {
    const { user } = useAuth();

    const [negoChats, setNegoChats] = useState([]);
    const [existingNego, setExistingNego] = useState(null);
    const [negoListLoading, setNegoListLoading] = useState(false);
    const [negoFormPrice, setNegoFormPrice] = useState('');
    const [negoFormQty, setNegoFormQty] = useState(1);
    const [negoFormDesc, setNegoFormDesc] = useState('');
    const [negoFormSubmitting, setNegoFormSubmitting] = useState(false);
    const [negoFormResult, setNegoFormResult] = useState(null);

    useEffect(() => {
        if (!isOpen || !user || !product) return;
        setNegoListLoading(true);
        setNegoFormResult(null);
        setNegoFormPrice('');
        setNegoFormDesc('');
        setNegoChats([]);
        setExistingNego(null);
        setNegoFormQty(Number(product.minOrderQty) || 1);

        negotiations.list().then((json) => {
            const list = json.success ? json.data || [] : [];
            const match = list.find((n) => n.productId === product.id);
            if (match) {
                negotiations.getById(match.id).then((d) => {
                    if (d.success) {
                        setExistingNego(d.data);
                        setNegoChats(d.data.chats || []);
                        setNegoFormQty(Number(d.data.agreedQuantityOffer) || Number(product.minOrderQty));
                        setNegoFormPrice(String(d.data.agreedPriceOffer || ''));
                    }
                });
            }
        }).finally(() => setNegoListLoading(false));
    }, [isOpen]);

    const suggestedPrice = Math.floor(Number(product?.pricePerUnit) * 0.8);

    const nego = existingNego;
    const isBuyer = nego && user?.id === nego.buyerId;
    const isSeller = nego && user?.id === nego.sellerId;
    const lastChat = negoChats[negoChats.length - 1];
    const lastTurn = lastChat?.turnOwner;
    const isOngoing = nego?.status === 'ongoing';
    const buyerTurn = lastTurn === 'buyer';
    const sellerTurn = lastTurn === 'seller';

    const handleInitiate = async (e) => {
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
            const json = await negotiations.initiate({
                productId: product.id,
                priceOffer: priceVal,
                unitId: product.unitId,
                quantityOffer: qtyVal,
                description: negoFormDesc || undefined,
            });
            if (json.success) {
                onSuccess?.();
            } else {
                setNegoFormResult({ type: 'error', message: json.message || 'Gagal mengajukan negosiasi' });
            }
        } catch {
            setNegoFormResult({ type: 'error', message: 'Terjadi kesalahan jaringan' });
        }
        setNegoFormSubmitting(false);
    };

    const handleBuyerRespond = async (action, extra = {}) => {
        if (!nego) return;
        setNegoFormResult(null);
        setNegoFormSubmitting(true);
        try {
            const json = await negotiations.buyerRespond(nego.id, { action, ...extra });
            if (json.success) {
                if (action === 'cancel') {
                    onClose();
                } else if (action === 'accept') {
                    setNegoFormResult({ type: 'success', message: 'Penawaran diterima! Silakan lanjutkan ke pembelian.' });
                    negotiations.getById(nego.id).then((d) => {
                        if (d.success) { setExistingNego(d.data); setNegoChats(d.data.chats || []); }
                    });
                } else {
                    setNegoFormResult({ type: 'success', message: 'Tawaran balik dikirim!' });
                    negotiations.getById(nego.id).then((d) => {
                        if (d.success) { setExistingNego(d.data); setNegoChats(d.data.chats || []); }
                    });
                }
            } else {
                setNegoFormResult({ type: 'error', message: json.message || 'Gagal' });
            }
        } catch {
            setNegoFormResult({ type: 'error', message: 'Terjadi kesalahan jaringan' });
        }
        setNegoFormSubmitting(false);
    };

    const handleSellerRespond = async (action, extra = {}) => {
        if (!nego) return;
        setNegoFormResult(null);
        setNegoFormSubmitting(true);
        try {
            const json = await negotiations.sellerRespond(nego.id, { action, ...extra });
            if (json.success) {
                if (action === 'reject') {
                    setNegoFormResult({ type: 'success', message: 'Penawaran ditolak.' });
                    negotiations.getById(nego.id).then((d) => {
                        if (d.success) { setExistingNego(d.data); setNegoChats(d.data.chats || []); }
                    });
                } else if (action === 'accept') {
                    setNegoFormResult({ type: 'success', message: 'Penawaran diterima!' });
                    negotiations.getById(nego.id).then((d) => {
                        if (d.success) { setExistingNego(d.data); setNegoChats(d.data.chats || []); }
                    });
                } else {
                    setNegoFormResult({ type: 'success', message: 'Tawaran balik dikirim!' });
                    negotiations.getById(nego.id).then((d) => {
                        if (d.success) { setExistingNego(d.data); setNegoChats(d.data.chats || []); }
                    });
                }
            } else {
                setNegoFormResult({ type: 'error', message: json.message || 'Gagal' });
            }
        } catch {
            setNegoFormResult({ type: 'error', message: 'Terjadi kesalahan jaringan' });
        }
        setNegoFormSubmitting(false);
    };

    const handleCounter = (e) => {
        e.preventDefault();
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
        if (isBuyer) {
            handleBuyerRespond('counter', {
                priceOffer: priceVal,
                unitId: product.unitId,
                quantityOffer: qtyVal,
                description: negoFormDesc || undefined,
            });
        } else {
            handleSellerRespond('counter', {
                priceOffer: priceVal,
                unitId: product.unitId,
                quantityOffer: qtyVal,
                description: negoFormDesc || undefined,
            });
        }
    };

    const handleResetNew = () => {
        setExistingNego(null);
        setNegoChats([]);
        setNegoFormPrice('');
        setNegoFormDesc('');
        setNegoFormQty(Number(product.minOrderQty) || 1);
        setNegoFormResult(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="fixed inset-0 bg-black/50" />
            <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 pb-2 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                    <h2 className="text-lg text-primary-green font-bold">Pengajuan Negosiasi</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><X size={20} /></button>
                </div>

                {negoListLoading ? (
                    <div className="flex items-center justify-center p-12"><Loader size={24} className="animate-spin text-primary-green" /></div>
                ) : (
                    <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-6">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 mb-6">
                            <img src={productPlaceholder} alt={product.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                            <div className="min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                                <p className="text-sm font-bold text-primary-green">Rp {formatNumber(product.pricePerUnit)} / {product.unitName}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                            <div className="md:border-r md:border-gray-200 md:pr-6 space-y-4">
                                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Riwayat Negosiasi</h3>
                                <NegotiationTimeline
                                    chats={negoChats}
                                    isOngoing={isOngoing}
                                    currentUserId={user?.id}
                                    buyerId={nego?.buyerId}
                                    sellerId={nego?.sellerId}
                                    buyerName={nego?.buyerName}
                                    sellerName={nego?.sellerName}
                                />
                            </div>

                            <div className="md:pl-6">
                                {!nego && (
                                    <>
                                        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4">Ajukan Penawaran Baru</h3>
                                        {negoFormResult && (
                                            <div className={`p-3 rounded-lg text-sm mb-4 ${negoFormResult.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                                                {negoFormResult.message}
                                            </div>
                                        )}
                                        <form onSubmit={handleInitiate} className="space-y-4">
                                            <NegotiationFormFields
                                                product={product}
                                                price={negoFormPrice}
                                                onPriceChange={setNegoFormPrice}
                                                qty={negoFormQty}
                                                onQtyChange={setNegoFormQty}
                                                desc={negoFormDesc}
                                                onDescChange={setNegoFormDesc}
                                                suggestedPrice={suggestedPrice}
                                            />
                                            <button type="submit" disabled={negoFormSubmitting} className="w-full py-2.5 bg-secondary-brown text-white rounded-lg font-medium hover:opacity-90 shadow-sm transition disabled:opacity-50">
                                                {negoFormSubmitting && <Loader size={14} className="animate-spin inline mr-1" />}
                                                Ajukan Negosiasi
                                            </button>
                                        </form>
                                    </>
                                )}

                                {isOngoing && isBuyer && sellerTurn && (
                                    <>
                                        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4">Tanggapi Penawaran</h3>
                                        {negoFormResult && (
                                            <div className={`p-3 rounded-lg text-sm mb-4 ${negoFormResult.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                                                {negoFormResult.message}
                                            </div>
                                        )}
                                        <form onSubmit={handleCounter} className="space-y-4">
                                            <NegotiationFormFields
                                                product={product}
                                                price={negoFormPrice}
                                                onPriceChange={setNegoFormPrice}
                                                qty={negoFormQty}
                                                onQtyChange={setNegoFormQty}
                                                desc={negoFormDesc}
                                                onDescChange={setNegoFormDesc}
                                                suggestedPrice={suggestedPrice}
                                            />
                                            <div className="flex gap-3">
                                                <button type="button" onClick={() => handleBuyerRespond('accept')} disabled={negoFormSubmitting} className="flex-1 py-2 bg-primary-green text-white rounded-lg font-medium hover:bg-primary-green/90 transition disabled:opacity-50 text-sm">Terima</button>
                                                <button type="submit" disabled={negoFormSubmitting} className="flex-1 py-2 bg-white border border-primary-green text-primary-green rounded-lg font-medium hover:bg-green-50 transition disabled:opacity-50 text-sm">
                                                    {negoFormSubmitting && <Loader size={14} className="animate-spin inline mr-1" />}
                                                    Tawar Lagi
                                                </button>
                                                <button type="button" onClick={() => handleBuyerRespond('cancel')} disabled={negoFormSubmitting} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-50 text-sm">Batalkan</button>
                                            </div>
                                        </form>
                                    </>
                                )}

                                {isOngoing && isBuyer && buyerTurn && (
                                    <>
                                        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4">Menunggu Respon Penjual</h3>
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 mb-4">
                                            Penjual sedang mempertimbangkan tawaran Anda.
                                        </div>
                                        <button type="button" onClick={() => handleBuyerRespond('cancel')} disabled={negoFormSubmitting} className="w-full py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-50 text-sm">
                                            Batalkan Negosiasi
                                        </button>
                                    </>
                                )}

                                {isOngoing && isSeller && buyerTurn && (
                                    <>
                                        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4">Tanggapi Penawaran</h3>
                                        {negoFormResult && (
                                            <div className={`p-3 rounded-lg text-sm mb-4 ${negoFormResult.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                                                {negoFormResult.message}
                                            </div>
                                        )}
                                        <form onSubmit={handleCounter} className="space-y-4">
                                            <NegotiationFormFields
                                                product={product}
                                                price={negoFormPrice}
                                                onPriceChange={setNegoFormPrice}
                                                qty={negoFormQty}
                                                onQtyChange={setNegoFormQty}
                                                desc={negoFormDesc}
                                                onDescChange={setNegoFormDesc}
                                                suggestedPrice={suggestedPrice}
                                            />
                                            <div className="flex gap-3">
                                                <button type="button" onClick={() => handleSellerRespond('accept')} disabled={negoFormSubmitting} className="flex-1 py-2 bg-primary-green text-white rounded-lg font-medium hover:bg-primary-green/90 transition disabled:opacity-50 text-sm">Terima</button>
                                                <button type="submit" disabled={negoFormSubmitting} className="flex-1 py-2 bg-white border border-primary-green text-primary-green rounded-lg font-medium hover:bg-green-50 transition disabled:opacity-50 text-sm">
                                                    {negoFormSubmitting && <Loader size={14} className="animate-spin inline mr-1" />}
                                                    Tawar Balik
                                                </button>
                                                <button type="button" onClick={() => handleSellerRespond('reject')} disabled={negoFormSubmitting} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-50 text-sm">Tolak</button>
                                            </div>
                                        </form>
                                    </>
                                )}

                                {isOngoing && isSeller && sellerTurn && (
                                    <>
                                        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4">Menunggu Respon Pembeli</h3>
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                                            Pembeli sedang mempertimbangkan tawaran Anda.
                                        </div>
                                    </>
                                )}

                                {nego?.status === 'accepted' && (
                                    <>
                                        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4">Disetujui</h3>
                                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 mb-4">
                                            <p className="font-semibold">Negosiasi disetujui!</p>
                                            <p className="mt-1">Rp {formatNumber(nego.agreedPriceOffer)} &times; {formatDecimal(nego.agreedQuantityOffer)} {nego.unitName}</p>
                                        </div>
                                    </>
                                )}

                                {nego?.status === 'rejected' && (
                                    <>
                                        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4">Ditolak</h3>
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
                                            Negosiasi ditolak oleh penjual.
                                        </div>
                                        {isBuyer && (
                                            <button onClick={handleResetNew} className="w-full py-2 bg-secondary-brown text-white rounded-lg font-medium hover:opacity-90 transition text-sm">
                                                Ajukan Negosiasi Baru
                                            </button>
                                        )}
                                    </>
                                )}

                                {nego?.status === 'canceled' && (
                                    <>
                                        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4">Dibatalkan</h3>
                                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 mb-4">
                                            Negosiasi ini telah dibatalkan.
                                        </div>
                                        {isBuyer && (
                                            <button onClick={handleResetNew} className="w-full py-2 bg-secondary-brown text-white rounded-lg font-medium hover:opacity-90 transition text-sm">
                                                Ajukan Negosiasi Baru
                                            </button>
                                        )}
                                    </>
                                )}

                                {nego?.status === 'expired' && (
                                    <>
                                        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4">Kadaluarsa</h3>
                                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 mb-4">
                                            Waktu negosiasi telah habis.
                                        </div>
                                        {isBuyer && (
                                            <button onClick={handleResetNew} className="w-full py-2 bg-secondary-brown text-white rounded-lg font-medium hover:opacity-90 transition text-sm">
                                                Ajukan Negosiasi Baru
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
