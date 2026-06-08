import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Activity,
    Download,
    Handshake,
    RotateCcw,
    ShieldCheck,
    Store,
    Users,
} from 'lucide-react';
import { dashboard } from '../services/api';
import { formatCurrency, formatNumber, formatDateTime } from '../utils/format';

const getArray = (value) => (Array.isArray(value) ? value : []);

function downloadCsv(filename, rows) {
    if (!rows || rows.length === 0) return;

    const headers = Object.keys(rows[0]);
    const escapeCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [
        headers.join(','),
        ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function MetricCard({ title, value, suffix, icon: Icon, tone }) {
    return (
        <article className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">{title}</p>
                    <div className="mt-3 flex items-end gap-2">
                        <p className="text-3xl font-extrabold text-gray-950">{value}</p>
                        {suffix && <span className="pb-1 text-sm text-gray-500">{suffix}</span>}
                    </div>
                </div>
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
                    <Icon size={23} />
                </span>
            </div>
        </article>
    );
}

function makeGrowthSeries(rawGrowth, days) {
    const rows = getArray(rawGrowth).map((item) => ({
        date: item.date,
        totalAmount: Number(item.totalAmount || 0),
        totalTransactions: Number(item.totalTransactions || 0),
    }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() - (days - 1));

    const filtered = rows.filter((item) => {
        const parsed = new Date(item.date);
        return !Number.isNaN(parsed.getTime()) && parsed >= cutoff;
    });

    if (days <= 7) {
        return Array.from({ length: 7 }, (_, index) => {
            const day = new Date(cutoff);
            day.setDate(cutoff.getDate() + index);
            const key = day.toISOString().slice(0, 10);
            const found = filtered.find((item) => item.date === key);
            return {
                label: new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit' }).format(day),
                totalAmount: found?.totalAmount || 0,
                totalTransactions: found?.totalTransactions || 0,
            };
        });
    }

    const bucketCount = days <= 30 ? 5 : 6;
    const bucketSize = Math.ceil(days / bucketCount);

    return Array.from({ length: bucketCount }, (_, index) => {
        const start = new Date(cutoff);
        start.setDate(cutoff.getDate() + index * bucketSize);
        const end = new Date(start);
        end.setDate(start.getDate() + bucketSize);

        const bucketRows = filtered.filter((item) => {
            const parsed = new Date(item.date);
            return parsed >= start && parsed < end;
        });

        return {
            label: `W${index + 1}`,
            totalAmount: bucketRows.reduce((sum, item) => sum + item.totalAmount, 0),
            totalTransactions: bucketRows.reduce((sum, item) => sum + item.totalTransactions, 0),
        };
    });
}

function GrowthChart({ growth, days }) {
    const series = makeGrowthSeries(growth, days);
    const maxAmount = Math.max(...series.map((item) => item.totalAmount), 1);
    const totalTransactions = series.reduce((sum, item) => sum + item.totalTransactions, 0);
    const totalRevenue = series.reduce((sum, item) => sum + item.totalAmount, 0);

    return (
        <div>
            <div className="flex h-48 items-end gap-3 border-b border-gray-100 pb-7">
                {series.map((item) => {
                    const height = item.totalAmount <= 0 ? 28 : Math.max(34, Math.round((item.totalAmount / maxAmount) * 150));
                    return (
                        <div key={item.label} className="group flex flex-1 flex-col items-center gap-2">
                            <div
                                className="w-full rounded-t-sm bg-primary-green transition-all group-hover:opacity-80"
                                style={{ height }}
                                title={`${item.label} · ${formatCurrency(item.totalAmount)} · ${formatNumber(item.totalTransactions)} transaksi`}
                            />
                            <span className="text-xs text-gray-400">{item.label}</span>
                        </div>
                    );
                })}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-6">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Transaksi</p>
                    <p className="mt-1 text-lg font-extrabold text-gray-950">{formatNumber(totalTransactions)}</p>
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Revenue</p>
                    <p className="mt-1 text-lg font-extrabold text-gray-950">{formatCurrency(totalRevenue)}</p>
                </div>
            </div>
        </div>
    );
}

function Panel({ title, children, action }) {
    return (
        <section className="rounded-2xl bg-white p-7 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-xl font-extrabold text-primary-green">{title}</h2>
                {action}
            </div>
            {children}
        </section>
    );
}

export default function AdminPage() {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [range, setRange] = useState(30);

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const json = await dashboard.admin();
            if (json?.success === false) throw new Error(json.message || 'Gagal mengambil data dashboard admin');
            setData(json?.data || {});
        } catch (err) {
            setError(err.message || 'Gagal mengambil data dashboard admin, silakan coba lagi');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, []);

    const metrics = data.metrics || {};
    const activityLogs = useMemo(() => getArray(data.activityLogs), [data]);
    const growthAnalysis = useMemo(() => getArray(data.growthAnalysis), [data]);
    const categoryLeaderboard = useMemo(() => getArray(data.categoryLeaderboard).slice(0, 5), [data]);
    const sellerLeaderboard = useMemo(() => getArray(data.sellerLeaderboard).slice(0, 5), [data]);

    if (loading) {
        return (
            <main>
                <div className="h-8 w-64 animate-pulse rounded bg-gray-100" />
                <div className="mt-8 grid gap-5 md:grid-cols-4">
                    {[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-gray-100" />)}
                </div>
            </main>
        );
    }

    return (
        <main>
            <header className="mb-8 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-primary-green">Dashboard Admin</h1>
                    <p className="mt-1 text-sm text-gray-500">Monitoring performa sistem, transaksi, dan aktivitas pengguna.</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-2 text-sm text-gray-500">
                        <span className="h-2 w-2 rounded-full bg-primary-green" /> Live Data Feed
                    </span>
                    <button
                        type="button"
                        onClick={loadDashboard}
                        className="inline-flex items-center gap-2 rounded-xl border border-primary-green bg-white px-4 py-2 text-sm font-bold text-primary-green transition hover:bg-green-50"
                    >
                        <RotateCcw size={16} /> Muat Ulang
                    </button>
                </div>
            </header>

            {error && <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Pengguna Aktif Saat Ini"
                    value={formatNumber(metrics.activeUsers)}
                    suffix="User"
                    icon={Users}
                    tone="bg-green-100 text-primary-green"
                />
                <MetricCard
                    title="Total Partnership Aktif"
                    value={formatNumber(metrics.activePartnerships)}
                    suffix="Kontrak"
                    icon={Handshake}
                    tone="bg-orange-100 text-secondary-brown"
                />
                <MetricCard
                    title="Rasio Keberhasilan Transaksi"
                    value={`${formatNumber(metrics.successTransactionRatio)}%`}
                    icon={ShieldCheck}
                    tone="bg-green-100 text-primary-green"
                />
                <MetricCard
                    title="Total Penjual Aktif"
                    value={formatNumber(metrics.activeSellers)}
                    suffix="Penjual"
                    icon={Store}
                    tone="bg-green-100 text-primary-green"
                />
            </section>

            <section className="mt-7 grid gap-6 xl:grid-cols-[1.05fr_1fr]">
                <Panel
                    title="Analisis Perkembangan"
                    action={
                        <select
                            value={range}
                            onChange={(event) => setRange(Number(event.target.value))}
                            className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600 outline-none"
                        >
                            <option value={7}>7 Hari Terakhir</option>
                            <option value={30}>30 Hari Terakhir</option>
                            <option value={90}>90 Hari Terakhir</option>
                        </select>
                    }
                >
                    {growthAnalysis.length === 0 ? (
                        <p className="rounded-xl bg-gray-50 px-4 py-8 text-sm text-gray-400">Belum ada data perkembangan.</p>
                    ) : (
                        <GrowthChart growth={growthAnalysis} days={range} />
                    )}
                </Panel>

                <Panel
                    title="Recent Activity Log"
                    action={
                        <button
                            type="button"
                            onClick={() => downloadCsv('admin-activity-log.csv', activityLogs)}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary-green px-4 py-2 text-xs font-bold text-white hover:opacity-90"
                        >
                            <Download size={14} /> Ekspor
                        </button>
                    }
                >
                    {activityLogs.length === 0 ? (
                        <p className="rounded-xl bg-gray-50 px-4 py-8 text-sm text-gray-400">Belum ada activity log.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-xs uppercase tracking-[0.16em] text-gray-400">
                                    <tr>
                                        <th className="border-b border-gray-200 py-3">Event Type</th>
                                        <th className="border-b border-gray-200 py-3">Details</th>
                                        <th className="border-b border-gray-200 py-3">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activityLogs.slice(0, 6).map((log) => (
                                        <tr key={log.id} className="border-b border-gray-100 last:border-b-0">
                                            <td className="py-4 font-bold text-gray-900">{log.action || log.eventType || '-'}</td>
                                            <td className="py-4 text-gray-500">{log.entityType || 'entity'} #{log.entityId || log.userId || '-'}</td>
                                            <td className="py-4 text-gray-500">{formatDateTime(log.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Panel>
            </section>

            <section className="mt-7 grid gap-6 xl:grid-cols-2">
                <Panel
                    title="Leaderboard Kategori Produk"
                    action={
                        <button
                            type="button"
                            onClick={() => downloadCsv('leaderboard-kategori.csv', categoryLeaderboard)}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary-green px-4 py-2 text-xs font-bold text-white hover:opacity-90"
                        >
                            <Download size={14} /> Ekspor
                        </button>
                    }
                >
                    {categoryLeaderboard.length === 0 ? (
                        <p className="rounded-xl bg-gray-50 px-4 py-8 text-sm text-gray-400">Belum ada data leaderboard.</p>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs uppercase tracking-[0.16em] text-gray-400">
                                <tr>
                                    <th className="border-b border-gray-100 py-3">Kategori</th>
                                    <th className="border-b border-gray-100 py-3">Pendapatan</th>
                                    <th className="border-b border-gray-100 py-3">Pesanan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categoryLeaderboard.map((item) => (
                                    <tr key={item.categoryId || item.categoryName} className="border-b border-gray-100 last:border-b-0">
                                        <td className="py-4 font-bold text-gray-900">{item.categoryName}</td>
                                        <td className="py-4 text-gray-700">{formatCurrency(item.totalRevenue)}</td>
                                        <td className="py-4 text-gray-700">{formatNumber(item.totalOrders)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Panel>

                <Panel
                    title="Leaderboard Penjual"
                    action={
                        <button
                            type="button"
                            onClick={() => downloadCsv('leaderboard-penjual.csv', sellerLeaderboard)}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary-green px-4 py-2 text-xs font-bold text-white hover:opacity-90"
                        >
                            <Download size={14} /> Ekspor
                        </button>
                    }
                >
                    {sellerLeaderboard.length === 0 ? (
                        <p className="rounded-xl bg-gray-50 px-4 py-8 text-sm text-gray-400">Belum ada data leaderboard.</p>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs uppercase tracking-[0.16em] text-gray-400">
                                <tr>
                                    <th className="border-b border-gray-100 py-3">Penjual</th>
                                    <th className="border-b border-gray-100 py-3">Pendapatan</th>
                                    <th className="border-b border-gray-100 py-3">Pesanan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sellerLeaderboard.map((item, index) => (
                                    <tr key={item.sellerId || item.sellerName} className="border-b border-gray-100 last:border-b-0">
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-primary-green">
                                                    {index + 1}
                                                </span>
                                                <span className="font-bold text-gray-900">{item.sellerName}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-gray-700">{formatCurrency(item.totalRevenue)}</td>
                                        <td className="py-4 text-gray-700">{formatNumber(item.totalOrders)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Panel>
            </section>

            <section className="mt-7 rounded-2xl bg-white p-5 text-sm text-gray-500 shadow-sm">
                <div className="flex items-start gap-3">
                    <Activity size={18} className="mt-0.5 text-primary-green" />
                    <p>
                        “Pengguna Aktif Saat Ini” dihitung dari sesi yang masih berlaku. Jika hanya satu akun sedang login aktif, angka ini memang bisa tetap bernilai 1.
                    </p>
                </div>
            </section>
        </main>
    );
}
