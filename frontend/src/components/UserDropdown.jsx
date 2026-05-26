import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Store, Wheat, LayoutDashboard, ShoppingCart, Package, Shield, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const menus = {
    buyer: [
        { label: 'Transaksi Saya', icon: Package, path: '/transactions' },
        { label: 'Keranjang', icon: ShoppingCart, path: '/cart' },
        { label: 'Daftar Jadi Penjual', icon: UserPlus, path: '/shop/new' },
    ],
    seller: [
        { label: 'Transaksi Saya', icon: Package, path: '/transactions' },
        { label: 'Keranjang', icon: ShoppingCart, path: '/cart' },
        { label: 'Toko Saya', icon: Store, path: '/shop' },
        { label: 'Produk Saya', icon: Wheat, path: '/products' },
        { label: 'Dashboard Penjualan', icon: LayoutDashboard, path: '/shop/dashboard' },
    ],
    admin: [
        { label: 'Admin', icon: Shield, path: '/admin' },
    ],
};

export default function UserDropdown() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const items = menus[user?.role] || [];

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 hover:bg-gray-100 rounded-lg p-1.5 transition"
            >
                <div className="w-8 h-8 rounded-full bg-primary-green flex items-center justify-center">
                    <User size={16} className="text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">{user?.fullName}</span>
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border py-1 z-50">
                    {items.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => { setOpen(false); navigate(item.path); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                        >
                            <item.icon size={18} className="text-gray-400" />
                            {item.label}
                        </button>
                    ))}
                    <div className="border-t my-1" />
                    <button
                        onClick={() => { setOpen(false); logout(); navigate('/'); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}
