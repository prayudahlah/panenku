import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatNumber } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { negotiations } from '../services/api';
import NegotiationTimeline from '../components/NegotiationTimeline';
import Modal from '../components/Modal';

const statusBadge = {
    ongoing: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    canceled: 'bg-gray-100 text-gray-600',
    expired: 'bg-yellow-100 text-yellow-800',
};

const statusLabel = {
    ongoing: 'Berlangsung',
    accepted: 'Disetujui',
    rejected: 'Ditolak',
    canceled: 'Dibatalkan',
    expired: 'Kadaluarsa',
};

export default function NegotiationDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [nego, setNego] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [acting, setActing] = useState(false);
    const [formResult, setFormResult] = useState(null);

    const [showCounter, setShowCounter] = useState(false);
    const [counterPrice, setCounterPrice] = useState('');
    const [counterQty, setCounterQty] = useState('');
    const [counterDesc, setCounterDesc] = useState('');

    const fetchData = () => {
        if (!user) return;
        negotiations.getById(id).then((json) => {
            if (json.success) {
                setNego(json.data);
                setError(null);
            } else {
                setError(json.message || 'Gagal memuat data');
            }
            setLoading(false);
        });
    };

    useEffect(() => { fetchData(); }, [id, user]);

    const doAction = async (action, extra = {}) => {
        setActing(true);
        setFormResult(null);
        const role = user?.role;
        let json;
        if (role === 'seller') {
            json = await negotiations.sellerRespond(id, { action, ...extra });
        } else {
            json = await negotiations.buyerRespond(id, { action, ...extra });
        }
        setActing(false);
        if (json.success) {
            setShowCounter(false);
            if (action === 'cancel') {
                setFormResult({ type: 'success', message: 'Negosiasi dibatalkan.' });
            } else if (action === 'accept') {
                setFormResult({ type: 'success', message: 'Penawaran diterima!' });
            } else if (action === 'reject') {
                setFormResult({ type: 'success', message: 'Penawaran ditolak.' });
            } else {
                setFormResult({ type: 'success', message: 'Tawaran balik dikirim!' });
            }
            fetchData();
        } else {
            setFormResult({ type: 'error', message: json.message || 'Gagal' });
        }
    };

    const handleCounter = (e) => {
        e.preventDefault();
        doAction('counter', {
            priceOffer: Number(counterPrice),
            unitId: nego.agreedUnitId,
            quantityOffer: Number(counterQty),
            description: counterDesc || undefined,
        });
    };

    if (loading) return <div className="max-w-4xl mx-auto py-12 px-4 text-center text-gray-400">Memuat...</div>;
    if (error) return <div className="max-w-4xl mx-auto py-12 px-4 text-center text-red-500">{error}</div>;
    if (!nego) return null;

    const isSeller = user?.role === 'seller';
    const isBuyer = user?.role === 'buyer';
    const lastChat = nego.chats?.[nego.chats.length - 1];
    const sellerTurn = lastChat?.turnOwner === 'seller';
    const buyerTurn = lastChat?.turnOwner === 'buyer';
    const isOngoing = nego.status === 'ongoing';

    const canSellerAct = isSeller && isOngoing && buyerTurn;
    const canBuyerAct = isBuyer && isOngoing && sellerTurn;
    const canBuyerCancel = isBuyer && (isOngoing || nego.status === 'accepted');

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <button onClick={() => navigate('/negotiations')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-green mb-4">
                <ArrowLeft size={16} /> Kembali
            </button>

            <div className="flex items-start justify-between mt-4 mb-2">
                <h1 className="text-2xl font-bold">{nego.productName}</h1>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusBadge[nego.status] || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabel[nego.status] || nego.status}
                </span>
            </div>
            <p className="text-sm text-gray-500">
                Negosiasi Rp {formatNumber(nego.agreedPriceOffer)} &middot; {formatNumber(nego.agreedQuantityOffer)} {nego.unitName}
            </p>
            {nego.sellerName && <p className="text-sm text-gray-400 mt-1">Penjual: {nego.sellerName}</p>}

            <hr className="border-gray-200 my-6" />

            <h2 className="font-bold mb-4">Riwayat Negosiasi</h2>
            <div className="max-h-64 overflow-y-auto pl-2">
                <NegotiationTimeline
                    chats={nego.chats}
                    isOngoing={isOngoing}
                    currentUserId={user?.id}
                    buyerId={nego.buyerId}
                    sellerId={nego.sellerId}
                    buyerName={nego.buyerName}
                    sellerName={nego.sellerName}
                />
            </div>

            {formResult && (
                <div className={`mt-6 p-3 rounded-lg text-sm ${formResult.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                    {formResult.message}
                </div>
            )}

            {canSellerAct && (
                <>
                    <hr className="border-gray-200 my-6" />
                    <h2 className="font-bold mb-4">Aksi Anda</h2>
                    <div className="flex gap-3">
                        <button onClick={() => doAction('accept')} disabled={acting} className="flex-1 py-2 bg-primary-green text-white rounded-lg font-medium hover:bg-primary-green/90 transition disabled:opacity-50">
                            {acting ? 'Memproses...' : 'Terima'}
                        </button>
                        <button onClick={() => setShowCounter(true)} disabled={acting} className="flex-1 py-2 bg-white border border-primary-green text-primary-green rounded-lg font-medium hover:bg-green-50 transition disabled:opacity-50">
                            Tawar Balik
                        </button>
                        <button onClick={() => doAction('reject')} disabled={acting} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50">
                            {acting ? 'Memproses...' : 'Tolak'}
                        </button>
                    </div>
                </>
            )}

            {canBuyerAct && (
                <>
                    <hr className="border-gray-200 my-6" />
                    <h2 className="font-bold mb-4">Aksi Anda</h2>
                    <div className="flex gap-3">
                        <button onClick={() => doAction('accept')} disabled={acting} className="flex-1 py-2 bg-primary-green text-white rounded-lg font-medium hover:bg-primary-green/90 transition disabled:opacity-50">
                            {acting ? 'Memproses...' : 'Setuju'}
                        </button>
                        <button onClick={() => setShowCounter(true)} disabled={acting} className="flex-1 py-2 bg-white border border-primary-green text-primary-green rounded-lg font-medium hover:bg-green-50 transition disabled:opacity-50">
                            Tawar Lagi
                        </button>
                        <button onClick={() => doAction('cancel')} disabled={acting} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50">
                            {acting ? 'Memproses...' : 'Batalkan'}
                        </button>
                    </div>
                </>
            )}

            {canBuyerCancel && !canBuyerAct && nego.status !== 'accepted' && (
                <>
                    <hr className="border-gray-200 my-6" />
                    <h2 className="font-bold mb-4">Aksi Anda</h2>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 mb-4">
                        Menunggu respon penjual...
                    </div>
                    <button onClick={() => doAction('cancel')} disabled={acting} className="w-full py-2 bg-red-500 text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50">
                        {acting ? 'Memproses...' : 'Batalkan Negosiasi'}
                    </button>
                </>
            )}

            {nego.status !== 'ongoing' && (
                <>
                    <hr className="border-gray-200 my-6" />
                    <p className="text-gray-500 text-center">Negosiasi ini sudah {statusLabel[nego.status] || nego.status}.</p>
                </>
            )}

            <Modal isOpen={showCounter} onClose={() => setShowCounter(false)} title="Tawar Balik">
                <form onSubmit={handleCounter} className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-500">Harga Tawar per {nego.unitName} (Rp)</label>
                        <input type="number" value={counterPrice} onChange={(e) => setCounterPrice(e.target.value)} placeholder={String(Number(nego.agreedPriceOffer))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1" required />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500">Kuantitas ({nego.unitName})</label>
                        <input type="number" value={counterQty} onChange={(e) => setCounterQty(e.target.value)} placeholder={String(Number(nego.agreedQuantityOffer))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1" required />
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500">Subtotal</span>
                        <span className="text-sm font-bold text-gray-900">Rp {formatNumber((Number(counterPrice) || 0) * Number(counterQty))}</span>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500">Catatan (opsional)</label>
                        <textarea value={counterDesc} onChange={(e) => setCounterDesc(e.target.value)} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1" />
                    </div>
                    <button type="submit" disabled={acting} className="w-full py-2 bg-primary-green text-white rounded-lg font-medium hover:bg-primary-green/90 transition disabled:opacity-50">
                        {acting ? 'Mengirim...' : 'Kirim Tawaran Balik'}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
