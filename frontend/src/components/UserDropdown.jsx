import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    LogOut,
    MessageCircle,
    Package,
    Shield,
    ShoppingCart,
    Store,
    User,
    UserPlus,
    Wheat,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const menus = {
    buyer: [
        { label: 'Dashboard Transaksi', icon: LayoutDashboard, path: '/dashboard' },
        { label: 'Negosiasi', icon: MessageCircle, path: '/negotiations' },
        { label: 'Transaksi Saya', icon: Package, path: '/transactions' },
        { label: 'Keranjang', icon: ShoppingCart, path: '/cart' },
        { label: 'Daftar Jadi Penjual', icon: UserPlus, path: '/shop/new' },
    ],
    seller: [
        { label: 'Dashboard Penjualan', icon: LayoutDashboard, path: '/shop/dashboard' },
        { label: 'Negosiasi', icon: MessageCircle, path: '/negotiations' },
        { label: 'Transaksi Saya', icon: Package, path: '/transactions' },
        { label: 'Keranjang', icon: ShoppingCart, path: '/cart' },
        { label: 'Toko Saya', icon: Store, path: '/shop' },
        { label: 'Produk Saya', icon: Wheat, path: '/shop/products' },
    ],
    admin: [{ label: 'Dashboard Admin', icon: Shield, path: '/admin' }],
    super_admin: [{ label: 'Dashboard Admin', icon: Shield, path: '/admin' }],
    superadmin: [{ label: 'Dashboard Admin', icon: Shield, path: '/admin' }],
};

export default function UserDropdown() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (event) => {
            if (ref.current && !ref.current.contains(event.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const role = String(user?.role || '').toLowerCase();
    const items = menus[role] || [];

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-gray-100"
            >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-green">
                    <User size={16} className="text-white" />
                </div>
                <span className="max-w-[120px] truncate text-sm font-medium text-gray-700">{user?.fullName || user?.full_name || user?.email}</span>
            </button>

            {open && (
                <div className="absolute right-0 top-full z-50 mt-1 w-60 overflow-hidden rounded-xl border bg-white py-3 shadow-lg">
                    {items.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.path}
                                type="button"
                                onClick={() => {
                                    setOpen(false);
                                    navigate(item.path);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                            >
                                <Icon size={18} className="text-gray-400" />
                                {item.label}
                            </button>
                        );
                    })}
                    <div className="my-1 border-t" />
                    <button
                        type="button"
                        onClick={async () => {
                            setOpen(false);
                            await logout();
                            navigate('/');
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-500 transition hover:bg-red-50"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}
