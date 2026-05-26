import { useState, useEffect } from 'react';
import { admin } from '../../services/api';
import { Search } from 'lucide-react';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchUsers = () => {
        setLoading(true);
        admin.listUsers().then((json) => {
            if (json.success) setUsers(json.data);
            setLoading(false);
        });
    };

    useEffect(() => { fetchUsers(); }, []);

    const toggleStatus = async (id, currentStatus) => {
        const next = currentStatus === 'active' ? 'suspended' : 'active';
        const json = await admin.updateUserStatus(id, next);
        if (json.success) fetchUsers();
    };

    const filtered = users.filter(
        (u) =>
            u.fullName.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            (u.phone && u.phone.toLowerCase().includes(search.toLowerCase())) ||
            u.role.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <p className="text-gray-400">Memuat...</p>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Users</h1>

            <div className="relative max-w-md mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari user..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left">
                        <tr>
                            <th className="px-4 py-3 font-medium text-gray-500">ID</th>
                            <th className="px-4 py-3 font-medium text-gray-500">Nama</th>
                            <th className="px-4 py-3 font-medium text-gray-500">Email</th>
                            <th className="px-4 py-3 font-medium text-gray-500">Phone</th>
                            <th className="px-4 py-3 font-medium text-gray-500">Role</th>
                            <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                            <th className="px-4 py-3 font-medium text-gray-500">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filtered.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">{u.id}</td>
                                <td className="px-4 py-3 font-medium">{u.fullName}</td>
                                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                                <td className="px-4 py-3 text-gray-500">{u.phone || '-'}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'seller' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {u.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {u.role !== 'admin' && (
                                        <button
                                            onClick={() => toggleStatus(u.id, u.status)}
                                            className={`text-xs px-3 py-1 rounded font-medium transition ${u.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                        >
                                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <p className="text-center text-gray-400 py-6">Tidak ada user ditemukan</p>
                )}
            </div>
        </div>
    );
}
