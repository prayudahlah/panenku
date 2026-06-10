import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    CalendarDays,
    ChevronRight,
    Handshake,
    Package,
    RotateCcw,
    Wallet,
} from 'lucide-react';
import { dashboard, checkout } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';

const getArray = (value) => (Array.isArray(value) ? value : []);

function formatShortDate(value) {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 5);
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit' }).format(parsed);
}

function groupRevenueByDay(history) {
    const map = new Map();

    getArray(history).forEach((item) => {
        const rawDate = item.createdAt || item.date;
        const parsed = rawDate ? new Date(rawDate) : new Date();
        const key = Number.isNaN(parsed.getTime()) ? 'unknown' : parsed.toISOString().slice(0, 10);
        const current = map.get(key) || 0;
        map.set(key, current + Number(item.subtotal || item.totalAmount || 0));
    });

    const series = Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-8)
        .map(([day, total]) => ({ day, total }));

    if (series.length === 0) {
        return Array.from({ length: 8 }, (_, index) => ({ day: `D${index + 1}`, total: 0 }));
    }

    return series;
}

function SellerRevenueBars({ history }) {
    const series = groupRevenueByDay(history);
    const maxValue = Math.max(...series.map((item) => item.total), 1);

    return (
        <div className="flex h-24 items-end gap-3 md:gap-4">
            {series.map((item, index) => {
                const height = item.total <= 0 ? 18 : Math.max(24, Math.round((item.total / maxValue) * 92));
                return (
                    <div key={`${item.day}-${index}`} className="group relative flex flex-1 flex-col items-center">
                        <div
                            className="w-full rounded-t-sm bg-white/45 transition-all group-hover:bg-white/70"
                            style={{ height }}
                            title={`${formatShortDate(item.day)} · ${formatCurrency(item.total)}`}
                        />
                        <span className="absolute -bottom-6 hidden text-[10px] text-white/70 group-hover:block">{formatShortDate(item.day)}</span>
                    </div>
                );
            })}
        </div>
    );
}

function EmptyCard({ children }) {
    return <div className="rounded-2xl border border-gray-100 bg-white px-6 py-5 text-sm text-gray-400 shadow-sm">{children}</div>;
}

function SectionHeader({ icon: Icon, title, actionText, onAction, expanded }) {
    return (
        <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-primary-green">
                <Icon size={20} />
                <h2 className="text-xl font-extrabold">{title}</h2>
            </div>
            {onAction && (
                <button type="button" onClick={onAction} className="text-sm font-bold text-secondary-brown transition hover:text-primary-green">
                    {expanded ? 'Tampilkan Ringkas' : actionText}
                </button>
            )}
        </div>
    );
}

function navigateByReference(navigate, item) {
    const type = String(item?.referenceType || item?.reference_type || '').toLowerCase();
    const id = item?.referenceId || item?.reference_id;

    if (type === 'negotiation' && id) navigate(`/negotiations/${id}`);
    else if (type === 'contract' && id) navigate(`/contracts/${id}`);
    else if (['order', 'checkout', 'checkout_payment'].includes(type)) navigate('/dashboard');
    else navigate('/notifications');
}

function ContractCard({ contract }) {
    const progress = (() => {
        if (!contract?.startDate || !contract?.endDate) return 0;
        const start = new Date(contract.startDate);
        const end = new Date(contract.endDate);
        const now = new Date();
        const total = end - start;
        if (total <= 0) return 0;
        const elapsed = now - start;
        return Math.min(Math.round((elapsed / total) * 100), 100);
    })();

    return (
        <article className="relative overflow-hidden rounded-2xl bg-[#eeeee9] p-8 shadow-sm cursor-pointer hover:shadow-md hover:brightness-[0.98] transition-all">
            <div className="relative z-10 max-w-2xl">
                <h3 className="text-xl font-extrabold text-gray-900">
                    Kontrak dengan {contract.buyerName || contract.sellerName || 'Mitra Panenku'}
                </h3>
                <p className="mt-2 text-sm font-bold text-secondary-brown">
                    Durasi: {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                </p>
                <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm text-gray-500">
                    <CalendarDays size={16} />
                    {contract.frequency || 'Jadwal berkala'}
                </div>
                <div className="mt-6 max-w-sm">
                    <div className="mb-2 flex items-center justify-between text-xs font-bold text-primary-green">
                        <span>Pemenuhan Kontrak</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white">
                        <div className="h-2 rounded-full bg-primary-green" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </div>
            <Handshake size={92} className="absolute bottom-10 right-12 text-primary-green/10" />
        </article>
    );
}

export default function DashboardSeller() {
    const navigate = useNavigate();
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAllNotifications, setShowAllNotifications] = useState(false);
    const [showAllContracts, setShowAllContracts] = useState(false);
    const [showFullHistory, setShowFullHistory] = useState(false);
    const [actionLoading, setActionLoading] = useState({});
    const [completedActions, setCompletedActions] = useState({});

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const json = await dashboard.seller();
            if (json?.success === false) throw new Error(json.message || 'Gagal mengambil data dashboard penjual');
            setData(json?.data || {});
        } catch (err) {
            setError(err.message || 'Gagal mengambil data dashboard penjual, silakan coba lagi');
        } finally {
            setLoading(false);
        }
    }, []);

    // -------------------------------------------------------------------
    // Order actions (shipping & cancel) – FSD 06.3 implementation
    // -------------------------------------------------------------------
    const handleShipOrder = async (order) => {
        const orderId = order.orderId || order.id;
        const checkoutId = order.checkoutId; // assume present
        if (!checkoutId) {
            setError('Tidak ada checkoutId untuk pesanan ini.');
            return;
        }
        setActionLoading((prev) => ({ ...prev, [orderId]: true }));
        try {
            const res = await checkout.shipOrder(checkoutId, orderId);
            if (res?.success === false) {
    const msg = res.errorCode === 'ERR-LOG-01' ? 'Akses Ditolak' : (res.message || 'Gagal mengirim pesanan');
    throw new Error(msg);
}
            await loadDashboard();
            setCompletedActions((prev) => ({ ...prev, [orderId]: 'shipped' }));
        } catch (err) {
            setError(err.message || 'Error mengirim pesanan');
        } finally {
            setActionLoading((prev) => ({ ...prev, [orderId]: false }));
        }
    };

    const handleCancelOrder = async (order) => {
        const orderId = order.orderId || order.id;
        const checkoutId = order.checkoutId;
        if (!checkoutId) {
            setError('Tidak ada checkoutId untuk pesanan ini.');
            return;
        }
        setActionLoading((prev) => ({ ...prev, [orderId]: true }));
        try {
            const res = await checkout.cancelOrder(checkoutId, orderId);
            if (res?.success === false) {
    const msg = res.errorCode === 'ERR-LOG-01' ? 'Akses Ditolak' : (res.message || 'Gagal membatalkan pesanan');
    throw new Error(msg);
}
            await loadDashboard();
            setCompletedActions((prev) => ({ ...prev, [orderId]: 'cancelled' }));
        } catch (err) {
            setError(err.message || 'Error membatalkan pesanan');
        } finally {
            setActionLoading((prev) => ({ ...prev, [orderId]: false }));
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);



    const notifications = useMemo(() => getArray(data.notifications), [data]);
    const contracts = useMemo(() => getArray(data.activeContracts), [data]);
    const history = useMemo(() => getArray(data.sellerHistory), [data]);
    const visibleNotifications = showAllNotifications ? notifications : notifications.slice(0, 2);
    const visibleContracts = showAllContracts ? contracts : contracts.slice(0, 1);
    const visibleHistory = showFullHistory ? history : history.slice(0, 3);

    if (loading) {
        return (
            <main className="mx-auto max-w-6xl px-4 py-10">
                <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
                <div className="mt-8 space-y-4">
                    <div className="h-20 animate-pulse rounded-2xl bg-gray-100" />
                    <div className="h-20 animate-pulse rounded-2xl bg-gray-100" />
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-6xl px-4 py-10">
            {error && <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

            <section className="relative overflow-hidden rounded-2xl bg-primary-green p-8 text-white shadow-sm md:p-10">
                <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_55%)] md:block" />
                <div className="relative z-10 grid items-end gap-8 md:grid-cols-[1fr_360px]">
                    <div>
                        <div className="mb-4 flex items-center gap-2 text-white/85">
                            <Wallet size={18} />
                            <span className="font-medium">Pendapatan Bulan Ini</span>
                        </div>
                        <h1 className="text-4xl font-extrabold md:text-5xl">{formatCurrency(data.totalRevenue)}</h1>
                        <p className="mt-3 text-sm text-white/80">↗ Data dihitung dari transaksi berstatus paid</p>
                    </div>
                    <SellerRevenueBars history={history} />
                </div>
            </section>

            <div className="mt-5 flex justify-end">
                <button
                    type="button"
                    onClick={loadDashboard}
                    className="inline-flex items-center gap-2 rounded-xl border border-primary-green px-4 py-2 text-sm font-bold text-primary-green transition hover:bg-green-50"
                >
                    <RotateCcw size={16} /> Muat Ulang
                </button>
            </div>

            <section className="mt-7">
                <SectionHeader
                    icon={Bell}
                    title="Notifikasi"
                    actionText="Lihat Semua"
                    expanded={showAllNotifications}
                    onAction={() => setShowAllNotifications((value) => !value)}
                />

                {visibleNotifications.length === 0 ? (
                    <EmptyCard>Belum ada notifikasi terbaru.</EmptyCard>
                ) : (
                    <div className="space-y-4">
                        {visibleNotifications.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => navigateByReference(navigate, item)}
                                className="group flex w-full items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-primary-green"
                            >
                                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${['order', 'checkout', 'checkout_payment'].includes(item.type) ? 'bg-orange-100 text-secondary-brown' : 'bg-green-100 text-primary-green'}`}>
                                    {['order', 'checkout', 'checkout_payment'].includes(item.type) ? <Package size={18} /> : <Bell size={18} />}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block font-bold text-gray-900">{item.title || 'Notifikasi'}</span>
                                    <span className="block truncate text-sm text-gray-500">{item.message || 'Ada pembaruan aktivitas.'}</span>
                                </span>
                                <ChevronRight size={18} className="text-gray-300 group-hover:text-primary-green" />
                            </button>
                        ))}
                    </div>
                )}
            </section>

            <section className="mt-8">
                <SectionHeader
                    icon={Handshake}
                    title="Kemitraan Aktif"
                    actionText="Lihat Semua"
                    expanded={showAllContracts}
                    onAction={contracts.length > 1 ? () => setShowAllContracts((value) => !value) : undefined}
                />

                {visibleContracts.length === 0 ? (
                    <EmptyCard>Belum ada kemitraan aktif.</EmptyCard>
                ) : (
                    <div className="space-y-5">
                        {visibleContracts.map((contract) => (
                            <button
                                key={contract.contractId || contract.id}
                                onClick={() => navigate(`/contracts/${contract.id}`)}
                                className="w-full text-left"
                            >
                                <ContractCard contract={contract} />
                            </button>
                        ))}
                    </div>
                )}
            </section>

            <section className="mt-8">
                <SectionHeader
                    icon={Package}
                    title="Riwayat Penjualan Terakhir"
                    actionText={history.length > 3 ? 'Lihat Semua' : undefined}
                    expanded={showFullHistory}
                    onAction={history.length > 3 ? () => setShowFullHistory((value) => !value) : undefined}
                />

                {visibleHistory.length === 0 ? (
                    <EmptyCard>Belum ada riwayat penjualan.</EmptyCard>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-400">
                                <tr>
                                    <th className="px-5 py-4">Order</th>
                                    <th className="px-5 py-4">Tanggal</th>
                                    <th className="px-5 py-4">Subtotal</th>
                                    <th className="px-5 py-4">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleHistory.map((item) => (
                                    <tr key={item.orderId || item.id} className="border-t border-gray-100">
                                        <td className="px-5 py-4 font-bold text-gray-900">{item.orderNumber || `ORD-${item.orderId || item.id}`}</td>
                                        <td className="px-5 py-4 text-gray-500">{formatDate(item.createdAt)}</td>
                                        <td className="px-5 py-4 font-bold text-primary-green">{formatCurrency(item.subtotal || item.totalAmount)}</td>
                                        <td className="px-5 py-4">
                                            {(() => {
                                                const id = item.orderId || item.id;
                                                const statusFromBackend = item.orderItemStatusId;
                                                const checkoutStatus = item.checkoutStatusId;
                                                const isAwaitingPayment = checkoutStatus === 4;
                                                const isCheckoutCancelled = checkoutStatus === 2;
                                                const isShipped = statusFromBackend === 4 || completedActions[id] === 'shipped';
                                                const isItemCancelled = statusFromBackend === 5 || completedActions[id] === 'cancelled';
                                                if (isAwaitingPayment) return <span className="text-xs font-medium text-amber-600">Menunggu Konfirmasi Pembayaran</span>;
                                                if (isCheckoutCancelled) return <span className="text-xs font-medium text-gray-500">Pesanan Dibatalkan oleh Pembeli</span>;
                                                if (isShipped) return <span className="text-xs font-medium text-green-600">Pesanan Sudah Dikirim</span>;
                                                if (isItemCancelled) return <span className="text-xs font-medium text-red-500">Pesanan Dibatalkan</span>;
                                                return (
                                                <div className="space-x-2">
                                                    <button
                                                        type="button"
                                                        disabled={actionLoading[item.orderId || item.id]}
                                                        onClick={() => handleShipOrder(item)}
                                                        className="rounded-md bg-primary-green px-3 py-1 text-xs font-medium text-white hover:bg-primary-green/80 disabled:opacity-50"
                                                    >
                                                        Barang Sudah Dikirim
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={actionLoading[item.orderId || item.id]}
                                                        onClick={() => handleCancelOrder(item)}
                                                        className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                                    >
                                                        Batalkan Pesanan
                                                    </button>
                                                </div>
                                            );
                                        })()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
