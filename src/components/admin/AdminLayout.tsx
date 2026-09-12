import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard, Image, Palette, Tag, Package, ShoppingCart,
  Users, Star, Phone, Bot, ShieldCheck, LogOut, Menu, X, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { navigate } from '@/lib/router';
import { classNames } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Banners', icon: Image, path: '/admin/banners' },
  { label: 'Theme & Colors', icon: Palette, path: '/admin/theme' },
  { label: 'Categories', icon: Tag, path: '/admin/categories' },
  { label: 'Products', icon: Package, path: '/admin/products' },
  { label: 'Orders', icon: ShoppingCart, path: '/admin/orders' },
  { label: 'Customers', icon: Users, path: '/admin/customers' },
  { label: 'Reviews', icon: Star, path: '/admin/reviews' },
  { label: 'Contact Details', icon: Phone, path: '/admin/contact' },
  { label: 'AI Settings', icon: Bot, path: '/admin/ai' },
  { label: 'Admins', icon: ShieldCheck, path: '/admin/admins' },
];

export function AdminLayout({ children, currentPath }: { children: ReactNode; currentPath: string }) {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeSection = navItems.find((n) => currentPath.startsWith(n.path))?.label ?? 'Dashboard';

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside
        className={classNames(
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-black border-r border-amber-500/20 transition-transform shrink-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <span className="text-lg font-bold">
            <span className="text-amber-400">Dress</span>
            <span className="text-white">IQ Admin</span>
          </span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-zinc-400">
            <X size={20} />
          </button>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-180px)]">
          {navItems.map((item) => {
            const active = currentPath.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={classNames(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition',
                  active ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                )}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-zinc-800 space-y-1">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
          >
            <ExternalLink size={18} /> View Store
          </button>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 px-4 lg:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-zinc-400">
              <Menu size={22} />
            </button>
            <h1 className="text-base font-bold text-white">{activeSection}</h1>
          </div>
          <span className="text-xs text-zinc-500 hidden sm:block">{user?.email}</span>
        </header>
        <main className="p-4 lg:p-6 max-w-6xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
