import { NavLink } from 'react-router-dom';
import { Bell, ShoppingCart } from 'lucide-react';

const navItems = [
    { label: ShoppingCart, path: '/cart' },
    { label: Bell, path: '/notifications' },
];

export default function Navbar() {
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
                            <NavLink
                                key='/login'
                                to='/login'
                                className="px-3 py-1.5 rounded-xl text-sm font-bold text-primary-green border-primary-green border-2 hover:mb-1"
                            >
                                Masuk
                            </NavLink>

                            <NavLink
                                key='/register'
                                to='/register'
                                className="px-3 py-1.5 rounded-xl text-sm font-bold text-white bg-primary-green border-primary-green border-2 hover:mb-1"
                            >
                                Daftar
                            </NavLink>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
