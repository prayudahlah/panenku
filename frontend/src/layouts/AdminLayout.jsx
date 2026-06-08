import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  LayoutDashboard,
  Leaf,
  ScrollText,
  ShieldCheck,
  Users,
  Wheat,
} from 'lucide-react';

const menuItems = [
  {
    label: 'Dashboard',
    path: '/admin',
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: 'Users',
    path: '/admin/users',
    icon: Users,
  },
  {
    label: 'Products',
    path: '/admin/products',
    icon: Wheat,
  },
  {
    label: 'Audit Logs',
    path: '/admin/audit',
    icon: ScrollText,
  },
];

const AdminLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#faf9f4] text-slate-950">
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-[280px] flex-col overflow-hidden bg-[#0A3D0A] text-white shadow-xl">
        <div className="flex h-full flex-col">
          <div className="border-b border-[#fff7df]/10 px-6 py-7">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="group flex items-center gap-3"
              aria-label="Kembali ke beranda Panenku"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff7df]/12 ring-1 ring-[#fff7df]/15">
                <Leaf size={24} className="text-[#fff7df]" />
              </span>

              <span className="text-left">
                <span className="block text-2xl font-black tracking-tight text-[#fff7df]">
                  Panenku
                </span>
                <span className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[#f8efd2]">
                  <ShieldCheck size={14} />
                  Admin Panel
                </span>
              </span>
            </button>
          </div>

          <nav className="flex-1 space-y-3 px-4 py-6">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    [
                      'group flex items-center gap-4 rounded-2xl px-4 py-4 text-[15px] font-bold transition-all duration-200',
                      isActive
                        ? 'bg-[#fff7df]/16 text-[#fff7df] ring-1 ring-[#fff7df]/22 shadow-md backdrop-blur-sm'
                        : 'text-[#f8efd2] hover:bg-[#fff7df]/10 hover:text-white',
                    ].join(' ')
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={[
                          'flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200',
                          isActive
                            ? 'bg-[#fff7df]/18 text-[#fff7df] ring-1 ring-[#fff7df]/18'
                            : 'bg-[#fff7df]/10 text-[#fff7df] group-hover:bg-[#fff7df]/15',
                        ].join(' ')}
                      >
                        <Icon size={21} strokeWidth={2.2} />
                      </span>

                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-[#fff7df]/10 p-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex w-full items-center gap-3 rounded-2xl bg-[#fff7df]/14 px-4 py-4 text-sm font-black text-[#fff7df] ring-1 ring-[#fff7df]/18 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-[#fff7df]/20 hover:text-white"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff7df]/16">
                <ArrowLeft size={20} />
              </span>
              <span>Kembali ke beranda</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="min-h-screen pl-[280px]">
        <div className="mx-auto w-full max-w-[1500px] px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;