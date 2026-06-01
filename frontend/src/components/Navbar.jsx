import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, ShoppingCart, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import UserDropdown from './UserDropdown';

const navItems = [
    { label: ShoppingCart, path: '/cart' },
    { label: Bell, path: '/notifications' },
];

export default function Navbar() {
    const { user } = useAuth();
    const { unreadCount } = useNotifications();
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-[80%] mx-auto px-4">
                <div className="flex justify-between h-16 items-center">
                    <div className="shrink-0 flex">
                        <NavLink to="/" className="text-primary-green font-bold text-2xl">
                            Panenku
                        </NavLink>
                    </div>

                    <div className="flex flex-1 justify-center px-8 mx-8">
                        <form onSubmit={handleSearch} className="w-full relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari produk..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green text-sm"
                            />
                        </form>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex space-x-4 items-center">
                            {user && navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 relative"
                                >
                                    <item.label size={24} />
                                    {item.path === '/notifications' && unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </NavLink>
                            ))}
                        </div>

                        {user && <div className="h-8 w-0.5 bg-neutral-stone-dim" />}

                        <div className="flex space-x-2 items-center">
                            {user ? (
                                <UserDropdown />
                            ) : (
                                <>
                                    <NavLink
                                        to="/login"
                                        className="px-3 py-1.5 rounded-xl text-sm font-bold text-primary-green border-primary-green border-2 hover:shadow-md"
                                    >
                                        Masuk
                                    </NavLink>

                                    <NavLink
                                        to="/register"
                                        className="px-3 py-1.5 rounded-xl text-sm font-bold text-white bg-primary-green border-primary-green border-2 hover:shadow-md"
                                    >
                                        Daftar
                                    </NavLink>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
