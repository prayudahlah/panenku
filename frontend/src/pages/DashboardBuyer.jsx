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

const emptyDashboard = {
  activeOrders: [],
  notifications: [],
  activeContracts: [],
  activeNegotiations: [],
  recentTransactions: [],
};

const statusLabel = {
  paid: 'Dibayar',
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
};

function normalizeDashboard(payload) {
  const source = payload?.data || payload || {};

  return {
    activeOrders: Array.isArray(source.activeOrders) ? source.activeOrders : [],
    notifications: Array.isArray(source.notifications) ? source.notifications : [],
    activeContracts: Array.isArray(source.activeContracts) ? source.activeContracts : [],
    activeNegotiations: Array.isArray(source.activeNegotiations) ? source.activeNegotiations : [],
    recentTransactions: Array.isArray(source.recentTransactions) ? source.recentTransactions : [],
  };
}

function formatMoney(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number);
}

function formatDate(value) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
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
      <div className="flex items-center gap-2 text-[#0A3D0A]">
        <Icon size={19} strokeWidth={2.2} />
        <h2 className="text-[20px] font-bold leading-tight tracking-[-0.01em]">
          {title}
        </h2>
      </div>

      {actionText ? (
        <button
          type="button"
          onClick={onAction}
          className="text-[13px] font-bold text-[#9A4F18] transition hover:text-[#0A3D0A]"
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

function OrderCard({ order }) {
  return (
    <article className="min-h-36 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:border-[#0A3D0A]/25 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <h3 className="max-w-[230px] text-[17px] font-bold leading-snug tracking-[-0.01em] text-slate-900">
          {getOrderTitle(order)}
        </h3>

        <span className="shrink-0 rounded-xl bg-blue-50 px-3 py-1.5 text-[12px] font-bold text-blue-600">
          {getOrderStatus(order)}
        </span>
      </div>

      <p className="mt-4 text-[14px] font-medium text-slate-500">
        Subtotal {formatMoney(order.subtotal || order.totalAmount)}
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
      className="group flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-4 text-left shadow-sm transition hover:border-[#0A3D0A]/20 hover:shadow-md"
    >
      <span
        className={[
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          isOrder
            ? 'bg-orange-100 text-orange-700'
            : isContract
              ? 'bg-emerald-100 text-[#0A3D0A]'
              : 'bg-green-100 text-[#0A3D0A]',
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
        className="shrink-0 text-slate-300 transition group-hover:text-[#0A3D0A]"
      />
    </button>
  );
}

function TransactionHistory({ transactions, showAll, onToggle }) {
  const visibleTransactions = showAll ? transactions : transactions.slice(0, 3);

  return (
    <aside className="self-start rounded-2xl bg-[#eeeee8] p-7 text-[#0A3D0A]">
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
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#0A3D0A]/40 bg-white">
                <CheckCircle2 size={17} />
              </span>

              <div>
                <h3 className="text-[15px] font-bold leading-tight text-slate-900">
                  Transaksi #{trx.checkoutId || trx.id || index + 1}
                </h3>

                <p className="mt-1 text-[13px] leading-5 text-slate-500">
                  {formatDate(trx.createdAt)} · {formatMoney(trx.totalAmount)}
                </p>

                <p className="mt-1 text-[12px] font-bold text-[#9A4F18]">
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
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl border border-[#0A3D0A] bg-white px-4 py-3 text-[14px] font-bold text-[#0A3D0A] transition hover:bg-[#0A3D0A] hover:text-white"
        >
          {showAll ? 'Tampilkan Lebih Sedikit' : 'Lihat Semua Riwayat'}
          <ChevronRight size={16} />
        </button>
      ) : null}
    </aside>
  );
}

function ContractCard({ contract }) {
  const progress = Number(contract?.progress || contract?.fulfillmentProgress || 50);

  return (
    <article className="relative overflow-hidden rounded-2xl bg-[#eeeee8] p-7 shadow-sm">
      <div className="relative z-10">
        <h3 className="text-[19px] font-bold leading-snug tracking-[-0.01em] text-slate-900">
          {contract?.title ||
            contract?.contractName ||
            `Kontrak dengan ${contract?.sellerName || contract?.buyerName || 'Mitra'}`}
        </h3>

        <p className="mt-2 text-[14px] font-bold text-[#9A4F18]">
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
          <div className="mb-2 flex items-center justify-between text-[12px] font-bold text-[#0A3D0A]">
            <span>Pemenuhan Kontrak</span>
            <span>{Math.min(progress, 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-white">
            <div
              className="h-full rounded-full bg-[#0A3D0A]"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <Handshake
        size={78}
        className="absolute bottom-8 right-8 text-[#0A3D0A]/10"
      />
    </article>
  );
}

function NegotiationCard({ negotiation }) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-[#0A3D0A]/20 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[16px] font-bold leading-snug text-slate-900">
            {negotiation?.productName ||
              negotiation?.title ||
              `Negosiasi #${negotiation?.id || negotiation?.negotiationId || '-'}`}
          </h3>
          <p className="mt-2 text-[14px] text-slate-500">
            {negotiation?.sellerName || negotiation?.buyerName || 'Mitra Panenku'}
          </p>
        </div>

        <span className="rounded-xl bg-orange-50 px-3 py-1.5 text-[12px] font-bold text-orange-700">
          {statusLabel[negotiation?.status] || negotiation?.status || 'Negosiasi'}
        </span>
      </div>
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
  const [showAllContracts, setShowAllContracts] = useState(false);
  const [showAllNegotiations, setShowAllNegotiations] = useState(false);
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
          <h1 className="text-[32px] font-black leading-tight tracking-[-0.03em] text-[#0A3D0A]">
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
          className="inline-flex items-center gap-2 rounded-xl border border-[#0A3D0A] bg-white px-4 py-3 text-[14px] font-bold text-[#0A3D0A] transition hover:bg-[#0A3D0A] hover:text-white"
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

            {data.activeNegotiations.length > 0 ? (
              <section>
                <SectionTitle
                  icon={Box}
                  title="Negosiasi Aktif"
                  actionText={
                    data.activeNegotiations.length > 2
                      ? 'Lihat Semua'
                      : undefined
                  }
                  expanded={showAllNegotiations}
                  onAction={() => setShowAllNegotiations((value) => !value)}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {negotiations.map((negotiation, index) => (
                    <NegotiationCard
                      key={negotiation.id || negotiation.negotiationId || index}
                      negotiation={negotiation}
                    />
                  ))}
                </div>
              </section>
            ) : null}
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