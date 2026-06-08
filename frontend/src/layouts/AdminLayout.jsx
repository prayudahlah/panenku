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
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-[284px] flex-col border-r border-[#dfe5d8] bg-[#f1f5ec] text-slate-800 shadow-[10px_0_35px_rgba(15,23,42,0.05)]">
        <div className="flex h-full flex-col">
          <div className="px-5 pb-5 pt-6">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex w-full items-center gap-3 rounded-3xl bg-white px-4 py-4 text-left shadow-sm ring-1 ring-[#dfe5d8]"
              aria-label="Kembali ke beranda Panenku"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A3D0A] text-white shadow-sm">
                <Leaf size={24} strokeWidth={2.1} />
              </span>

              <span>
                <span className="block text-[24px] font-semibold leading-none tracking-[-0.03em] text-[#0A3D0A]">
                  Panenku
                </span>
                <span className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-slate-500">
                  <ShieldCheck size={14} className="text-[#0A3D0A]" />
                  Admin Panel
                </span>
              </span>
            </button>
          </div>

          <nav className="flex-1 space-y-2 px-5 py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    [
                      'group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] font-medium transition-all duration-200',
                      isActive
                        ? 'bg-[#0A3D0A] text-white shadow-md shadow-green-950/10'
                        : 'text-slate-600 hover:bg-white hover:text-[#0A3D0A] hover:shadow-sm',
                    ].join(' ')
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={[
                          'flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200',
                          isActive
                            ? 'bg-white/16 text-white'
                            : 'bg-[#e5ecdf] text-slate-500 group-hover:bg-[#eef5ec] group-hover:text-[#0A3D0A]',
                        ].join(' ')}
                      >
                        <Icon size={20} strokeWidth={2} />
                      </span>

                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-[#dfe5d8] p-5">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-[14px] font-medium text-slate-600 shadow-sm ring-1 ring-[#dfe5d8] transition-all duration-200 hover:bg-[#0A3D0A] hover:text-white hover:ring-[#0A3D0A]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef5ec] text-[#0A3D0A] transition group-hover:bg-white/15">
                <ArrowLeft size={19} strokeWidth={2} />
              </span>
              <span>Kembali ke beranda</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="min-h-screen pl-[284px]">
        <div className="mx-auto w-full max-w-[1500px] px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;