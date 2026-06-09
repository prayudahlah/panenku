import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Box,
  CheckCircle2,
  ChevronRight,
  Handshake,
  History,
  Package,
  RefreshCcw,
  Repeat2,
} from 'lucide-react';
import { dashboard } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';

const emptyDashboard = {
  activeOrders: [],
  notifications: [],
  activeContracts: [],
  recentTransactions: [],
  activeNegotiations: [],
};

const statusLabel = {
  paid: 'Dibayar',
  awaiting_payment: 'Menunggu Pembayaran',
  pending: 'Menunggu Pembayaran',
  unpaid: 'Belum Dibayar',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  shipped: 'Dikirim',
  picked_up: 'Dijemput',
  delivered: 'Terkirim',
  active: 'Aktif',
  accepted: 'Disetujui',
  rejected: 'Ditolak',
  negotiation: 'Negosiasi',
  confirmed: 'Dikonfirmasi',
};

function normalizeDashboard(payload) {
  const source = payload?.data ?? payload ?? {};

  return {
    activeOrders: Array.isArray(source.activeOrders) ? source.activeOrders : [],
    notifications: Array.isArray(source.notifications) ? source.notifications : [],
    activeContracts: Array.isArray(source.activeContracts) ? source.activeContracts : [],
    recentTransactions: Array.isArray(source.recentTransactions) ? source.recentTransactions : [],
    activeNegotiations: Array.isArray(source.activeNegotiations) ? source.activeNegotiations : [],
  };
}

function getOrderTitle(order) {
  if (order?.orderNumber) return `Pesanan ${order.orderNumber}`;
  if (order?.orderId || order?.id) return `Pesanan #${order.orderId || order.id}`;

  return 'Pesanan';
}

function getOrderStatus(order) {
  return (
    statusLabel[order?.shipmentStatus] ||
    statusLabel[order?.checkoutStatus] ||
    order?.shipmentStatus ||
    order?.checkoutStatus ||
    'Diproses'
  );
}

function getTransactionStatus(transaction) {
  return (
    statusLabel[transaction?.paymentStatus] ||
    statusLabel[transaction?.checkoutStatus] ||
    transaction?.paymentStatus ||
    transaction?.checkoutStatus ||
    '-'
  );
}

function SectionTitle({ icon: Icon, title, actionText, onAction, expanded }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-primary-green">
        <Icon size={19} strokeWidth={2.2} />
        <h2 className="text-[20px] font-bold leading-tight tracking-[-0.01em]">
          {title}
        </h2>
      </div>

      {actionText ? (
        <button
          type="button"
          onClick={onAction}
          className="text-[13px] font-bold text-secondary-brown transition hover:text-primary-green"
        >
          {expanded ? 'Tampilkan Lebih Sedikit' : actionText}
        </button>
      ) : null}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-6 py-6 text-[14px] text-slate-400 shadow-sm">
      {message}
    </div>
  );
}

function getOrderBadgeStyle(order) {
  const status = order?.checkoutStatus;
  if (status === 'paid') return 'bg-green-50 text-green-700';
  if (status === 'cancelled') return 'bg-red-50 text-red-600';
  if (status === 'awaiting_payment') return 'bg-yellow-50 text-yellow-700';
  const shipStatus = order?.shipmentStatus;
  if (shipStatus === 'shipped' || shipStatus === 'picked_up') return 'bg-blue-50 text-blue-600';
  if (shipStatus === 'delivered') return 'bg-green-50 text-green-700';
  return 'bg-gray-100 text-gray-500';
}

function OrderCard({ order }) {
  return (
    <article className="min-h-36 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:border-primary-green/25 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <h3 className="max-w-[230px] text-[17px] font-bold leading-snug tracking-[-0.01em] text-slate-900">
          {getOrderTitle(order)}
        </h3>

        <span className={`shrink-0 rounded-xl px-3 py-1.5 text-[12px] font-bold ${getOrderBadgeStyle(order)}`}>
          {getOrderStatus(order)}
        </span>
      </div>

      <p className="mt-4 text-[14px] font-medium text-slate-500">
        Subtotal {formatCurrency(order.subtotal || order.totalAmount)}
      </p>

      <p className="mt-4 line-clamp-2 text-[14px] leading-6 text-slate-500">
        {order.shippingAddress ||
          order.deliveryLocation ||
          'Alamat pengiriman belum tersedia.'}
      </p>
    </article>
  );
}

function NotificationItem({ item, onClick }) {
  const isOrder = item?.type === 'order';
  const isContract = item?.type === 'contract';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-4 text-left shadow-sm transition hover:border-primary-green/20 hover:shadow-md"
    >
      <span
        className={[
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          isOrder
            ? 'bg-orange-100 text-orange-700'
            : isContract
              ? 'bg-emerald-100 text-primary-green'
              : 'bg-green-100 text-primary-green',
        ].join(' ')}
      >
        <Bell size={18} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold leading-tight text-slate-900">
          {item.title || 'Notifikasi'}
        </span>
        <span className="mt-1 block truncate text-[13px] leading-5 text-slate-500">
          {item.message || 'Ada pembaruan aktivitas.'}
        </span>
      </span>

      <ChevronRight
        size={18}
        className="shrink-0 text-slate-300 transition group-hover:text-primary-green"
      />
    </button>
  );
}

function TransactionHistory({ transactions, showAll, onToggle }) {
  const visibleTransactions = showAll ? transactions : transactions.slice(0, 3);

  return (
    <aside className="self-start rounded-2xl bg-[#eeeee8] p-7 text-primary-green">
      <div className="mb-6 flex items-center gap-2">
        <History size={18} />
        <h2 className="text-[18px] font-bold tracking-[-0.01em]">
          Riwayat Transaksi Terakhir
        </h2>
      </div>

      {visibleTransactions.length > 0 ? (
        <div className="space-y-5">
          {visibleTransactions.map((trx, index) => (
            <div
              key={trx.checkoutId || trx.id || index}
              className="flex gap-4 border-b border-[#d9d9d2] pb-5 last:border-b-0"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary-green/40 bg-white">
                <CheckCircle2 size={17} />
              </span>

              <div>
                <h3 className="text-[15px] font-bold leading-tight text-slate-900">
                  Transaksi #{trx.checkoutId || trx.id || index + 1}
                </h3>

                <p className="mt-1 text-[13px] leading-5 text-slate-500">
                  {formatDate(trx.createdAt)} · {formatCurrency(trx.totalAmount)}
                </p>

                <p className="mt-1 text-[12px] font-bold text-secondary-brown">
                  Status: {getTransactionStatus(trx)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[#d9d9d2] bg-white/50 px-4 py-5 text-[14px] text-slate-500">
          Belum ada riwayat transaksi.
        </div>
      )}

      {transactions.length > 3 ? (
        <button
          type="button"
          onClick={onToggle}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl border border-primary-green bg-white px-4 py-3 text-[14px] font-bold text-primary-green transition hover:bg-primary-green hover:text-white"
        >
          {showAll ? 'Tampilkan Lebih Sedikit' : 'Lihat Semua Riwayat'}
          <ChevronRight size={16} />
        </button>
      ) : null}
    </aside>
  );
}

function NegotiationCard({ negotiation }) {
  return (
    <article className="min-h-36 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:border-secondary-brown/25 hover:shadow-md">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Box size={20} />
        </span>

        <div>
          <h3 className="text-[17px] font-bold leading-tight tracking-[-0.01em] text-slate-900">
            {negotiation?.productName || 'Produk'}
          </h3>

          <p className="mt-1 text-[12px] leading-5 text-slate-500">
            {negotiation?.sellerName
              ? `Dengan ${negotiation.sellerName}`
              : 'Menunggu informasi mitra'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-[12px] font-bold text-amber-700">
          {statusLabel.negotiation}
        </span>

        {negotiation?.price ? (
          <span className="text-[14px] font-bold text-secondary-brown">
            {formatCurrency(negotiation.price)}
          </span>
        ) : null}
      </div>
    </article>
  );
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
    <article className="relative overflow-hidden rounded-2xl bg-[#eeeee8] p-7 shadow-sm">
      <div className="relative z-10">
        <h3 className="text-[19px] font-bold leading-snug tracking-[-0.01em] text-slate-900">
          {contract?.title ||
            contract?.contractName ||
            `Kontrak dengan ${contract?.sellerName || contract?.buyerName || 'Mitra'}`}
        </h3>

        <p className="mt-2 text-[14px] font-bold text-secondary-brown">
          Durasi:{' '}
          {contract?.startDate && contract?.endDate
            ? `${formatDate(contract.startDate)} - ${formatDate(contract.endDate)}`
            : contract?.duration || 'Periode kontrak berjalan'}
        </p>

        <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-[13px] font-medium text-slate-500">
          <Repeat2 size={15} />
          {contract?.frequency || contract?.schedule || 'Pengiriman berkala'}
        </div>

        <div className="mt-7 max-w-md">
          <div className="mb-2 flex items-center justify-between text-[12px] font-bold text-primary-green">
            <span>Pemenuhan Kontrak</span>
            <span>{Math.min(progress, 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-white">
            <div
              className="h-full rounded-full bg-primary-green"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <Handshake
        size={78}
        className="absolute bottom-8 right-8 text-primary-green/10"
      />
    </article>
  );
}

const DashboardBuyer = () => {
  const navigate = useNavigate();

  const [data, setData] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAllOrders, setShowAllOrders] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [showAllNegotiations, setShowAllNegotiations] = useState(false);
  const [showAllContracts, setShowAllContracts] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await dashboard.buyer();
      setData(normalizeDashboard(response));
    } catch (err) {
      setError(
        err?.message ||
          'Gagal mengambil data dashboard pembeli, silakan coba lagi.'
      );
      setData(emptyDashboard);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Reload otomatis kalau ada aksi pembayaran dari halaman Notifikasi
  useEffect(() => {
    let channel;
    try {
      channel = new BroadcastChannel('panenku_checkout');
      channel.onmessage = () => loadDashboard();
    } catch {}
    return () => { try { channel?.close(); } catch {} };
  }, [loadDashboard]);

  const activeOrders = useMemo(
    () => (showAllOrders ? data.activeOrders : data.activeOrders.slice(0, 4)),
    [data.activeOrders, showAllOrders]
  );

  const notifications = useMemo(
    () =>
      showAllNotifications
        ? data.notifications
        : data.notifications.slice(0, 3),
    [data.notifications, showAllNotifications]
  );

  const contracts = useMemo(
    () =>
      showAllContracts
        ? data.activeContracts
        : data.activeContracts.slice(0, 2),
    [data.activeContracts, showAllContracts]
  );

  const negotiations = useMemo(
    () =>
      showAllNegotiations
        ? data.activeNegotiations
        : data.activeNegotiations.slice(0, 2),
    [data.activeNegotiations, showAllNegotiations]
  );

  return (
    <main className="mx-auto max-w-[1180px] px-6 py-10">
      <header className="mb-9 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-black leading-tight tracking-[-0.03em] text-primary-green">
            Dashboard Transaksi
          </h1>
          <p className="mt-2 text-[15px] leading-6 text-slate-500">
            Pantau pesanan aktif, riwayat transaksi, notifikasi, negosiasi, dan
            kemitraan.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboard}
          className="inline-flex items-center gap-2 rounded-xl border border-primary-green bg-white px-4 py-3 text-[14px] font-bold text-primary-green transition hover:bg-primary-green hover:text-white"
        >
          <RefreshCcw size={16} />
          Muat Ulang
        </button>
      </header>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-[14px] text-red-600">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-100 bg-white px-6 py-10 text-center text-[15px] text-slate-500 shadow-sm">
          Memuat dashboard pembeli...
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[1fr_330px]">
          <section className="space-y-8">
            <section>
              <SectionTitle
                icon={Package}
                title="Pesanan Aktif"
                actionText={
                  data.activeOrders.length > 4 ? 'Lihat Semua' : undefined
                }
                expanded={showAllOrders}
                onAction={() => setShowAllOrders((value) => !value)}
              />

              {activeOrders.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {activeOrders.map((order, index) => (
                    <OrderCard
                      key={order.orderId || order.id || index}
                      order={order}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="Belum ada pesanan aktif." />
              )}
            </section>

            <section>
              <SectionTitle
                icon={Bell}
                title="Notifikasi"
                actionText={
                  data.notifications.length > 3 ? 'Lihat Semua' : undefined
                }
                expanded={showAllNotifications}
                onAction={() => setShowAllNotifications((value) => !value)}
              />

              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((item, index) => (
                    <NotificationItem
                      key={item.id || index}
                      item={item}
                      onClick={() => navigate('/notifications')}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="Belum ada notifikasi terbaru." />
              )}
            </section>

            <section>
              <SectionTitle
                icon={Box}
                title="Negosiasi Aktif"
                actionText={
                  data.activeNegotiations.length > 2 ? 'Lihat Semua' : undefined
                }
                expanded={showAllNegotiations}
                onAction={() => setShowAllNegotiations((value) => !value)}
              />

              {negotiations.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {negotiations.map((item, index) => (
                    <NegotiationCard
                      key={item.id || item.negotiationId || index}
                      negotiation={item}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="Belum ada negosiasi aktif." />
              )}
            </section>

            <section>
              <SectionTitle
                icon={Handshake}
                title="Kemitraan Aktif"
                actionText={
                  data.activeContracts.length > 2 ? 'Lihat Semua' : undefined
                }
                expanded={showAllContracts}
                onAction={() => setShowAllContracts((value) => !value)}
              />

              {contracts.length > 0 ? (
                <div className="space-y-4">
                  {contracts.map((contract, index) => (
                    <ContractCard
                      key={contract.id || contract.contractId || index}
                      contract={contract}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="Belum ada kemitraan aktif." />
              )}
            </section>
          </section>

          <TransactionHistory
            transactions={data.recentTransactions}
            showAll={showAllTransactions}
            onToggle={() => setShowAllTransactions((value) => !value)}
          />
        </div>
      )}
    </main>
  );
};

export default DashboardBuyer;