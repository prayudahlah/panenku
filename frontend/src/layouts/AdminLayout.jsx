import { NavLink, Outlet, Link } from 'react-router-dom';
import { Users, Wheat, ArrowLeft } from 'lucide-react';

const sidebarItems = [
    { label: 'Users', icon: Users, path: '/admin/users' },
    { label: 'Products', icon: Wheat, path: '/admin/products' },
];

export default function AdminLayout() {
    return (
        <div className="h-screen flex overflow-hidden">
            <aside className="w-64 bg-gray-900 text-white flex flex-col shrink-0">
                <div className="p-6 border-b border-gray-700">
                    <NavLink to="/" className="text-lg font-bold">Panenku</NavLink>
                    <p className="text-xs text-gray-400 mt-0.5">Admin Panel</p>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {sidebarItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition ${isActive ? 'bg-primary-green text-white' : 'text-gray-300 hover:bg-gray-800'}`
                            }
                        >
                            <item.icon size={18} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-700">
                    <Link
                        to="/"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition"
                    >
                        <ArrowLeft size={18} />
                        Kembali ke beranda
                    </Link>
                </div>
            </aside>
            <main className="flex-1 bg-gray-50 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}
