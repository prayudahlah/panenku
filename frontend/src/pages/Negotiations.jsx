import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatNumber } from '../utils/format';
import { negotiations } from '../services/api';

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

export default function Negotiations() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        negotiations.list().then((json) => {
            if (json.success) setData(json.data);
            setLoading(false);
        });
    }, [user]);

    if (!user) return <div className="max-w-4xl mx-auto py-12 px-4 text-center text-gray-500">Silakan login.</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MessageCircle size={24} /> Negosiasi
            </h1>

            {loading ? (
                <p className="text-gray-400 text-center py-12">Memuat...</p>
            ) : data.length === 0 ? (
                <p className="text-gray-400 text-center py-12">Belum ada negosiasi.</p>
            ) : (
                <div className="space-y-3">
                    {data.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => navigate(`/negotiations/${item.id}`)}
                            className="w-full text-left bg-white rounded-xl border p-4 hover:shadow-md transition flex items-center gap-4"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{item.productName}</p>
                                <p className="text-sm text-gray-400 mt-0.5">dari {item.counterpartyName}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Rp {formatNumber(item.agreedPriceOffer)} &middot; {formatNumber(item.agreedQuantityOffer)} {item.unitName}
                                </p>
                            </div>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusBadge[item.status] || 'bg-gray-100 text-gray-600'}`}>
                                {statusLabel[item.status] || item.status}
                            </span>
                            <ArrowRight size={18} className="text-gray-300 shrink-0" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
