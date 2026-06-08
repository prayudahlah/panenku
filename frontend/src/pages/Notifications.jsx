import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Loader, CreditCard, XCircle, ShoppingBag } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../contexts/AuthContext';
import { checkout as checkoutApi } from '../services/api';
import { formatNumber } from '../utils/format';

// ── komponen aksi inline untuk notif checkout_payment ─────────────────────────

function CheckoutAction({ notif, onDone }) {
    const [loading, setLoading] = useState(null); // 'pay' | 'cancel' | null
    const [result, setResult]   = useState(null); // 'paid' | 'cancelled' | 'error'
    const [errMsg, setErrMsg]   = useState('');

    const checkoutId = notif.referenceId;

    const handlePay = async () => {
        setLoading('pay');
        setErrMsg('');
        const json = await checkoutApi.pay(checkoutId);
        if (json.success) {
            setResult('paid');
            onDone(notif.id);
        } else {
            setErrMsg(json.message || 'Gagal mengkonfirmasi pembayaran');
        }
        setLoading(null);
    };

    const handleCancel = async () => {
        setLoading('cancel');
        setErrMsg('');
        const json = await checkoutApi.cancel(checkoutId);
        if (json.success) {
            setResult('cancelled');
            onDone(notif.id);
        } else {
            setErrMsg(json.message || 'Gagal membatalkan pesanan');
        }
        setLoading(null);
    };

    if (result === 'paid') {
        return (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600 font-medium">
                <CreditCard size={13} /> Pembayaran dikonfirmasi
            </div>
        );
    }

    if (result === 'cancelled') {
        return (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                <XCircle size={13} /> Pesanan dibatalkan
            </div>
        );
    }

    return (
        <div className="mt-3 space-y-1.5">
            {errMsg && (
                <p className="text-xs text-red-500">{errMsg}</p>
            )}
            <div className="flex gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); handlePay(); }}
                    disabled={!!loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                        bg-primary-green text-white hover:bg-primary-green/90 transition
                        disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading === 'pay'
                        ? <Loader size={12} className="animate-spin" />
                        : <CreditCard size={12} />
                    }
                    Sudah Transfer
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                    disabled={!!loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                        border border-gray-300 text-gray-600 hover:bg-gray-50 transition
                        disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading === 'cancel'
                        ? <Loader size={12} className="animate-spin" />
                        : <XCircle size={12} />
                    }
                    Batalkan Pesanan
                </button>
            </div>
        </div>
    );
}

// ── halaman utama ──────────────────────────────────────────────────────────────

export default function Notifications() {
    const { user } = useAuth();
    const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
    const navigate = useNavigate();

    // set notif checkout yang sudah di-act agar tombol hilang
    const [actedIds, setActedIds] = useState(new Set());

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    if (!user) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8">
                <p className="text-gray-500 text-center">Silakan login untuk melihat notifikasi.</p>
            </div>
        );
    }

    const handleClick = async (notif) => {
        // jangan navigate untuk notif checkout — aksinya inline
        if (notif.type === 'checkout_payment') return;

        if (!notif.isRead) await markAsRead(notif.id);

        if (notif.referenceType === 'negotiation' && notif.referenceId) {
            navigate(`/negotiations/${notif.referenceId}`);
        }
        if (notif.referenceType === 'contract' && notif.referenceId) {
            navigate(`/contracts/${notif.referenceId}`);
        }
    };

    const handleActionDone = async (notifId) => {
        setActedIds((prev) => new Set([...prev, notifId]));
        if (!notifications.find((n) => n.id === notifId)?.isRead) {
            await markAsRead(notifId);
        }
    };

    // ikon per type
    const typeIcon = (type) => {
        if (type === 'checkout_payment' || type === 'checkout') return <ShoppingBag size={15} className="text-primary-green" />;
        return <Bell size={15} className="text-gray-400" />;
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Bell size={22} className="text-gray-700" />
                    <h1 className="text-xl font-bold">Notifikasi</h1>
                </div>
                {notifications.some((n) => !n.isRead) && (
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-1 text-sm text-primary-green hover:underline"
                    >
                        <CheckCheck size={15} />
                        Tandai semua dibaca
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <p className="text-gray-400 text-center py-16 text-sm">Belum ada notifikasi.</p>
            ) : (
                <div className="space-y-2">
                    {notifications.map((notif) => {
                        const isCheckoutPayment = notif.type === 'checkout_payment';
                        const alreadyActed     = actedIds.has(notif.id);
                        const isClickable      = !isCheckoutPayment && (
                            notif.referenceType === 'negotiation' ||
                            notif.referenceType === 'contract'
                        );

                        return (
                            <div
                                key={notif.id}
                                onClick={() => handleClick(notif)}
                                className={`w-full text-left p-4 rounded-xl border transition-colors
                                    ${notif.isRead
                                        ? 'bg-white border-gray-200'
                                        : 'bg-blue-50 border-blue-200'
                                    }
                                    ${isClickable ? 'cursor-pointer hover:border-gray-300' : 'cursor-default'}
                                `}
                            >
                                <div className="flex items-start gap-3">
                                    {/* ikon */}
                                    <div className="mt-0.5 shrink-0">
                                        {typeIcon(notif.type)}
                                    </div>

                                    {/* konten */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`text-sm font-semibold leading-tight ${notif.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                                                {notif.title}
                                            </p>
                                            {!notif.isRead && (
                                                <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />
                                            )}
                                        </div>

                                        {notif.message && (
                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                                {notif.message}
                                            </p>
                                        )}

                                        {/* aksi inline untuk checkout_payment yang belum di-act */}
                                        {isCheckoutPayment && !alreadyActed && notif.referenceId && (
                                            <CheckoutAction
                                                notif={notif}
                                                onDone={handleActionDone}
                                            />
                                        )}

                                        {isCheckoutPayment && alreadyActed && (
                                            <p className="text-xs text-gray-400 mt-2">Aksi selesai</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
