import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatNumber, formatDateTime } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { negotiations } from '../services/api';
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
            fetchData();
        } else {
            alert(json.message || 'Gagal');
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

            <div className="bg-white rounded-xl border p-6 mb-6">
                <div className="flex items-start justify-between mb-2">
                    <h1 className="text-2xl font-bold">{nego.productName}</h1>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusBadge[nego.status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabel[nego.status] || nego.status}
                    </span>
                </div>
                <p className="text-sm text-gray-500">
                    Negosiasi Rp {formatNumber(nego.agreedPriceOffer)} &middot; {formatNumber(nego.agreedQuantityOffer)} {nego.unitName}
                </p>
                {nego.sellerName && <p className="text-sm text-gray-400 mt-1">Penjual: {nego.sellerName}</p>}
            </div>

            <div className="bg-white rounded-xl border p-6 mb-6">
                <h2 className="font-bold mb-4">Riwayat Negosiasi</h2>
                {nego.chats.length === 0 ? (
                    <p className="text-gray-400 text-sm">Belum ada percakapan.</p>
                ) : (
                    <div className="space-y-4">
                        {nego.chats.map((chat) => {
                            const isBuyerMsg = chat.turnOwner === 'buyer';
                            return (
                                <div key={chat.id} className={`flex ${isBuyerMsg ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-[70%] rounded-xl p-4 ${isBuyerMsg ? 'bg-green-50 border border-green-200' : 'bg-secondary-brown-100 border border-secondary-brown-200'}`}>
                                        <p className="text-sm font-medium mb-1">
                                            {isBuyerMsg ? 'Pembeli' : 'Penjual'} &middot; Tawaran #{chat.turnOrder}
                                        </p>
                                        <p className="text-base font-bold text-primary-green">
                                            Rp {formatNumber(chat.offerPrice)}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">{formatNumber(chat.quantityOffer)} {chat.unitName}</p>
                                        <p className="text-xs text-gray-400 mt-2">{formatDateTime(chat.createdAt)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {canSellerAct && (
                <div className="bg-white rounded-xl border p-6">
                    <h2 className="font-bold mb-4">Aksi Anda</h2>
                    <div className="flex gap-3">
                        <button onClick={() => doAction('accept')} disabled={acting} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50">
                            {acting ? 'Memproses...' : 'Terima'}
                        </button>
                        <button onClick={() => setShowCounter(true)} disabled={acting} className="flex-1 py-2 bg-primary-green text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50">
                            Tawar Balik
                        </button>
                        <button onClick={() => doAction('reject')} disabled={acting} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50">
                            {acting ? 'Memproses...' : 'Tolak'}
                        </button>
                    </div>
                </div>
            )}

            {canBuyerAct && (
                <div className="bg-white rounded-xl border p-6">
                    <h2 className="font-bold mb-4">Aksi Anda</h2>
                    <div className="flex gap-3">
                        <button onClick={() => doAction('accept')} disabled={acting} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50">
                            {acting ? 'Memproses...' : 'Setuju'}
                        </button>
                        <button onClick={() => setShowCounter(true)} disabled={acting} className="flex-1 py-2 bg-primary-green text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50">
                            Tawar Balik
                        </button>
                        <button onClick={() => doAction('cancel')} disabled={acting} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50">
                            {acting ? 'Memproses...' : 'Batalkan'}
                        </button>
                    </div>
                </div>
            )}

            {canBuyerCancel && !canBuyerAct && nego.status !== 'accepted' && (
                <div className="bg-white rounded-xl border p-6">
                    <button onClick={() => doAction('cancel')} disabled={acting} className="w-full py-2 bg-red-600 text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50">
                        {acting ? 'Memproses...' : 'Batalkan Negosiasi'}
                    </button>
                </div>
            )}

            {nego.status !== 'ongoing' && (
                <div className="bg-white rounded-xl border p-6 text-center">
                    <p className="text-gray-500">Negosiasi ini sudah {statusLabel[nego.status] || nego.status}.</p>
                </div>
            )}

            <Modal isOpen={showCounter} onClose={() => setShowCounter(false)} title="Tawar Balik">
                <form onSubmit={handleCounter} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Harga Tawar (Rp)</label>
                        <input type="number" value={counterPrice} onChange={(e) => setCounterPrice(e.target.value)} placeholder={String(Number(nego.agreedPriceOffer))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Kuantitas ({nego.unitName})</label>
                        <input type="number" value={counterQty} onChange={(e) => setCounterQty(e.target.value)} placeholder={String(Number(nego.agreedQuantityOffer))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Catatan (opsional)</label>
                        <textarea value={counterDesc} onChange={(e) => setCounterDesc(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green" />
                    </div>
                    <button type="submit" disabled={acting} className="w-full py-2 bg-primary-green text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50">
                        {acting ? 'Mengirim...' : 'Kirim Tawaran Balik'}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
