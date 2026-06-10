import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contracts } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Loader, Check, X, MapPin, Calendar, Package, FileText, ArrowLeft } from 'lucide-react';

const STATUS_MAP = {
    1: { label: 'Menunggu', class: 'bg-amber-100 text-amber-700 border-amber-200' },
    2: { label: 'Aktif', class: 'bg-green-100 text-green-700 border-green-200' },
    3: { label: 'Selesai', class: 'bg-blue-100 text-blue-700 border-blue-200' },
    4: { label: 'Dibatalkan', class: 'bg-red-100 text-red-700 border-red-200' },
    5: { label: 'Kadaluarsa', class: 'bg-gray-100 text-gray-600 border-gray-200' },
    6: { label: 'Ditolak', class: 'bg-red-100 text-red-700 border-red-200' },
};

const FREQ_LABEL = {
    daily: 'Setiap hari',
    weekly: 'Mingguan',
    monthly: 'Bulanan',
    custom: 'Kustom',
};

export default function ContractDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [responding, setResponding] = useState(false);
    const [showConfirm, setShowConfirm] = useState(null);

    const fetchContract = () => {
        setLoading(true);
        contracts.getById(id).then((json) => {
            if (json.success) setContract(json.data);
            else setError(json.message);
        }).catch(() => setError('Gagal memuat detail kontrak'))
        .finally(() => setLoading(false));
    };

    useEffect(() => { fetchContract(); }, [id]);

    const handleRespond = async (action) => {
        setResponding(true);
        const json = action === 'cancelled'
            ? await contracts.cancel(id)
            : await contracts.respond(id, { action });
        setResponding(false);
        setShowConfirm(null);
        if (json.success) {
            fetchContract();
        } else {
            setError(json.message);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center justify-center py-20">
                    <Loader size={24} className="animate-spin text-gray-400" />
                </div>
            </div>
        );
    }

    if (error && !contract) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
            </div>
        );
    }

    if (!contract) return null;

    const isSeller = user?.role === 'seller';
    const isBuyer = user?.role === 'buyer';
    const canRespond = isSeller && contract.contractStatusId === 1;
    const canCancel = isBuyer && contract.contractStatusId === 1;

    const status = STATUS_MAP[contract.contractStatusId] || { label: 'Unknown', class: 'bg-gray-100 text-gray-600' };

    const formatTime = (t) => t ? t.slice(0, 5) : '-';
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition"
            >
                <ArrowLeft size={16} /> Kembali
            </button>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">{error}</div>
            )}

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Detail Kontrak #{contract.id}</h1>
                    <p className="text-sm text-gray-500 mt-1">Diajukan {formatDate(contract.createdAt)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${status.class}`}>
                    {status.label}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                            <FileText size={16} /> Informasi Kontrak
                        </h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-400">Pembeli</span>
                                <p className="font-medium text-gray-800">{contract.buyerName}</p>
                            </div>
                            <div>
                                <span className="text-gray-400">Penjual</span>
                                <p className="font-medium text-gray-800">{contract.sellerName}</p>
                            </div>
                            <div>
                                <span className="text-gray-400">Frekuensi</span>
                                <p className="font-medium text-gray-800">{FREQ_LABEL[contract.frequency] || contract.frequency}</p>
                            </div>
                            <div>
                                <span className="text-gray-400">Total Pengiriman</span>
                                <p className="font-medium text-gray-800">{contract.totalShipping} kali</p>
                            </div>
                            <div>
                                <span className="text-gray-400">Tanggal Mulai</span>
                                <p className="font-medium text-gray-800">{formatDate(contract.startDate)}</p>
                            </div>
                            <div>
                                <span className="text-gray-400">Tanggal Berakhir</span>
                                <p className="font-medium text-gray-800">{formatDate(contract.endDate)}</p>
                            </div>
                            <div className="col-span-2">
                                <span className="text-gray-400">Total Biaya</span>
                                <p className="font-medium text-gray-800 text-lg">
                                    Rp {Number(contract.totalAmount).toLocaleString('id-ID')}
                                </p>
                            </div>
                        </div>
                        {contract.description && (
                            <div>
                                <span className="text-xs text-gray-400">Catatan</span>
                                <p className="text-sm text-gray-700 mt-0.5">{contract.description}</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                            <Package size={16} /> Produk
                        </h2>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-400 border-b border-gray-100">
                                    <th className="pb-2 font-medium">Produk</th>
                                    <th className="pb-2 font-medium">Jumlah</th>
                                    <th className="pb-2 font-medium">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(contract.products || []).map((p) => (
                                    <tr key={p.id} className="border-b border-gray-50">
                                        <td className="py-2.5">
                                            <p className="font-medium text-gray-800">{p.productName}</p>
                                            {p.description && <p className="text-xs text-gray-400">{p.description}</p>}
                                        </td>
                                        <td className="py-2.5 text-gray-600">
                                            {Number(p.quantity).toLocaleString('id-ID')} {p.unitName}
                                            <span className="text-xs text-gray-400 ml-1">
                                                (total {Number(p.totalQuantity).toLocaleString('id-ID')})
                                            </span>
                                        </td>
                                        <td className="py-2.5 text-gray-800 font-medium">
                                            Rp {Number(p.subtotal).toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                            <MapPin size={16} /> Lokasi Pengiriman
                        </h2>
                        <p className="text-sm text-gray-700">{contract.deliveryLocation}</p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                            <Calendar size={16} /> Jadwal Pengiriman
                        </h2>
                        {(!contract.schedules || contract.schedules.length === 0) ? (
                            <p className="text-sm text-gray-400">Tidak ada jadwal</p>
                        ) : (
                            <div className="space-y-2">
                                {contract.schedules.map((s, i) => (
                                    <div key={s.id || i} className="text-sm bg-gray-50 rounded-lg p-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-700 font-medium">
                                                {s.deliveryDay
                                                    ? s.deliveryDay.charAt(0).toUpperCase() + s.deliveryDay.slice(1)
                                                    : `Tanggal ${s.deliveryDate}`}
                                            </span>
                                            <span className="text-gray-500 text-xs">{formatTime(s.deliveryTime)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {(canRespond || canCancel) && (
                        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                            <h2 className="text-sm font-semibold text-gray-800">
                                {canRespond ? 'Tanggapan Anda' : 'Aksi'}
                            </h2>
                            {canRespond && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowConfirm('accepted')}
                                        disabled={responding}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                                    >
                                        <Check size={16} /> Terima
                                    </button>
                                    <button
                                        onClick={() => setShowConfirm('rejected')}
                                        disabled={responding}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
                                    >
                                        <X size={16} /> Tolak
                                    </button>
                                </div>
                            )}
                            {canCancel && (
                                <button
                                    onClick={() => setShowConfirm('cancelled')}
                                    disabled={responding}
                                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition disabled:opacity-50"
                                >
                                    <X size={16} /> Batalkan Pengajuan
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
                        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
                            showConfirm === 'accepted' ? 'bg-green-100' : showConfirm === 'cancelled' ? 'bg-gray-100' : 'bg-red-100'
                        }`}>
                            {showConfirm === 'accepted'
                                ? <Check size={24} className="text-green-600" />
                                : <X size={24} className="text-red-500" />}
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">
                            {showConfirm === 'accepted' ? 'Terima Kemitraan?' : showConfirm === 'cancelled' ? 'Batalkan Pengajuan?' : 'Tolak Kemitraan?'}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {showConfirm === 'accepted'
                                ? 'Kontrak akan aktif dan kamu berkomitmen untuk memenuhi pengiriman sesuai jadwal.'
                                : showConfirm === 'cancelled'
                                    ? 'Pengajuan kemitraan akan dibatalkan dan penjual akan mendapat notifikasi.'
                                    : 'Kemitraan ini akan ditolak dan pembeli akan mendapat notifikasi.'}
                        </p>
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setShowConfirm(null)}
                                disabled={responding}
                                className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleRespond(showConfirm)}
                                disabled={responding}
                                className={`flex-1 px-4 py-2.5 text-sm text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-1 ${
                                    showConfirm === 'accepted' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'
                                }`}
                            >
                                {responding && <Loader size={14} className="animate-spin" />}
                                {showConfirm === 'accepted' ? 'Ya, Terima' : showConfirm === 'cancelled' ? 'Ya, Batalkan' : 'Ya, Tolak'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}