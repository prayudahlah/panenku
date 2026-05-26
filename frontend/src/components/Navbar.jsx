import { NavLink } from 'react-router-dom';
import { Bell, ShoppingCart, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
    { label: ShoppingCart, path: '/cart' },
    { label: Bell, path: '/notifications' },
];

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-[80%] mx-auto px-4">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="shrink-0 flex items-center">
                        <NavLink to="/" className="text-primary-green font-bold text-2xl">
                            Panenku
                        </NavLink>
                    </div>

                    <div className='flex items-center space-x-4'>
                        {/* Nav Items */}
                        <div className="flex space-x-4 items-center">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200"
                                >
                                    <item.label size={24} />
                                </NavLink>
                            ))}
                        </div>

                        <div className='h-8 w-0.5 bg-neutral-stone-dim' />

                        {/* Auth Items */}
                        <div className="flex space-x-2 items-center">
                            {user ? (
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-700">{user.fullName}</span>
                                    <div className="w-8 h-8 rounded-full bg-primary-green flex items-center justify-center">
                                        <User size={16} className="text-white" />
                                    </div>
                                    <button onClick={logout} className="text-gray-400 hover:text-red-500 transition">
                                        <LogOut size={18} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <NavLink
                                        to='/login'
                                        className="px-3 py-1.5 rounded-xl text-sm font-bold text-primary-green border-primary-green border-2 hover:mb-1"
                                    >
                                        Masuk
                                    </NavLink>

                                    <NavLink
                                        to='/register'
                                        className="px-3 py-1.5 rounded-xl text-sm font-bold text-white bg-primary-green border-primary-green border-2 hover:mb-1"
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
