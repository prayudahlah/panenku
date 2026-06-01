import { useState, useEffect } from 'react';
import { formatDateTime } from '../../utils/format';
import { admin, audit } from '../../services/api';
import { Search, Filter } from 'lucide-react';

export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState({ total: 0, page: 1, limit: 50 });
    const [filters, setFilters] = useState({
        action: '',
        entityType: '',
        userId: '',
        dateFrom: '',
        dateTo: '',
    });
    const [showFilters, setShowFilters] = useState(false);

    const fetchLogs = (page = 1, overrideFilters) => {
        setLoading(true);
        const activeFilters = overrideFilters || filters;
        const params = { page, limit: 50 };
        Object.entries(activeFilters).forEach(([k, v]) => { if (v) params[k] = v; });
        audit.list(params).then((json) => {
            if (json.success) {
                setLogs(json.data);
                setMeta(json.meta);
            }
            setLoading(false);
        });
    };

    useEffect(() => { fetchLogs(); }, []);

    const applyFilters = () => { fetchLogs(1); };

    const emptyFilters = { action: '', entityType: '', userId: '', dateFrom: '', dateTo: '' };

    const resetFilters = () => {
        setFilters(emptyFilters);
        fetchLogs(1, emptyFilters);
    };

    const actionBadge = (action) => {
        const colors = {
            'login': 'bg-blue-100 text-blue-700',
            'login.failed': 'bg-red-100 text-red-700',
            'logout': 'bg-gray-100 text-gray-700',
            'register': 'bg-green-100 text-green-700',
        };
        const color = Object.entries(colors).find(([k]) => action.startsWith(k))?.[1] || 'bg-gray-100 text-gray-700';
        return <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{action}</span>;
    };

    if (loading) return <p className="text-gray-400">Memuat...</p>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Audit Logs</h1>

            <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        value={filters.action}
                        onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        placeholder="Cari action..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition ${showFilters ? 'bg-primary-green text-white border-primary-green' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                >
                    <Filter size={16} />
                    Filter
                </button>
            </div>

            {showFilters && (
                <div className="bg-white p-4 rounded-xl border mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs font-medium text-gray-500">Entity Type</label>
                        <select
                            value={filters.entityType}
                            onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary-green"
                        >
                            <option value="">Semua</option>
                            <option value="user">User</option>
                            <option value="seller_profile">Seller Profile</option>
                            <option value="product">Product</option>
                            <option value="negotiation">Negotiation</option>
                            <option value="contract">Contract</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500">User ID</label>
                        <input
                            value={filters.userId}
                            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                            placeholder="ID user..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary-green"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500">Dari</label>
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary-green"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500">Sampai</label>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary-green"
                        />
                    </div>
                    <div className="flex gap-2 col-span-full justify-end">
                        <button onClick={resetFilters} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Reset</button>
                        <button onClick={applyFilters} className="px-4 py-2 text-sm bg-primary-green text-white rounded-lg hover:opacity-90">Terapkan</button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left">
                        <tr>
                            <th className="px-4 py-3 font-medium text-gray-500">ID</th>
                            <th className="px-4 py-3 font-medium text-gray-500">User ID</th>
                            <th className="px-4 py-3 font-medium text-gray-500">Action</th>
                            <th className="px-4 py-3 font-medium text-gray-500">Entity</th>
                            <th className="px-4 py-3 font-medium text-gray-500">Entity ID</th>
                            <th className="px-4 py-3 font-medium text-gray-500">Waktu</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {logs.map((l) => (
                            <tr key={l.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">{l.id}</td>
                                <td className="px-4 py-3">{l.userId || '-'}</td>
                                <td className="px-4 py-3">{actionBadge(l.action)}</td>
                                <td className="px-4 py-3 text-gray-500">{l.entityType || '-'}</td>
                                <td className="px-4 py-3">{l.entityId || '-'}</td>
                                <td className="px-4 py-3 text-gray-500 text-xs">
                                    {formatDateTime(l.createdAt)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {logs.length === 0 && <p className="text-center text-gray-400 py-6">Tidak ada log ditemukan</p>}
            </div>

            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                <span>Total {meta.total} log</span>
                <div className="flex gap-2">
                    <button
                        disabled={meta.page <= 1}
                        onClick={() => fetchLogs(meta.page - 1)}
                        className="px-3 py-1 border rounded-lg disabled:opacity-30 hover:bg-gray-50"
                    >
                        Sebelumnya
                    </button>
                    <span className="px-3 py-1">Halaman {meta.page}</span>
                    <button
                        disabled={logs.length < meta.limit}
                        onClick={() => fetchLogs(meta.page + 1)}
                        className="px-3 py-1 border rounded-lg disabled:opacity-30 hover:bg-gray-50"
                    >
                        Selanjutnya
                    </button>
                </div>
            </div>
        </div>
    );
}
