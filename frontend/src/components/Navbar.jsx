import { NavLink } from 'react-router-dom';
import { Bell, ShoppingCart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserDropdown from './UserDropdown';

const navItems = [
    { label: ShoppingCart, path: '/cart' },
    { label: Bell, path: '/notifications' },
];

export default function Navbar() {
    const { user } = useAuth();

    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-[80%] mx-auto px-4">
                <div className="flex justify-between h-16">
                    <div className="shrink-0 flex items-center">
                        <NavLink to="/" className="text-primary-green font-bold text-2xl">
                            Panenku
                        </NavLink>
                    </div>

                    <div className='flex items-center space-x-4'>
                        <div className="flex space-x-4 items-center">
                            {user && navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200"
                                >
                                    <item.label size={24} />
                                </NavLink>
                            ))}
                        </div>

                        {user && <div className='h-8 w-0.5 bg-neutral-stone-dim' />}

                        <div className="flex space-x-2 items-center">
                            {user ? (
                                <UserDropdown />
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
