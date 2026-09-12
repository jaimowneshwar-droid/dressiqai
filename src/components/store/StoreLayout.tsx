import { useState } from 'react';
import { Search, ShoppingBag, Menu, X, Home, Grid, Phone, Heart, Package, User, Bell, MessageCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';
import { useSettings } from '@/context/SettingsContext';
import { navigate } from '@/lib/router';
import { classNames } from '@/lib/utils';

export function StoreHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { totalItems } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { session } = useAuth();
  const { unreadCount } = useNotifications();
  const { settings } = useSettings();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  function doSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery('');
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-amber-500/20">
      <div className="flex items-center justify-between px-4 h-14">
        <button onClick={onMenuClick} className="text-amber-400 p-1">
          <Menu size={22} />
        </button>

        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt={settings.store_name} className="h-7 w-auto" />
          ) : (
            <span className="text-lg font-bold tracking-tight">
              <span className="text-amber-400">Dress</span>
              <span className="text-white">IQ</span>
            </span>
          )}
        </button>

        <div className="flex items-center gap-1">
          <button onClick={() => setSearchOpen(!searchOpen)} className="text-amber-400 p-1">
            <Search size={22} />
          </button>
          {session && (
            <button onClick={() => navigate('/profile')} className="relative text-amber-400 p-1">
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </button>
          )}
          <button onClick={() => navigate('/wishlist')} className="relative text-amber-400 p-1">
            <Heart size={22} />
            {wishlistItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                {wishlistItems.length}
              </span>
            )}
          </button>
          <button onClick={() => navigate('/cart')} className="relative text-amber-400 p-1">
            <ShoppingBag size={22} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[10px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {searchOpen && (
        <form onSubmit={doSearch} className="px-4 pb-3">
          <div className="flex items-center gap-2 bg-zinc-900 rounded-xl border border-zinc-700 px-3 py-2">
            <Search size={18} className="text-zinc-500" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="flex-1 bg-transparent text-white text-sm outline-none"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')}>
                <X size={16} className="text-zinc-500" />
              </button>
            )}
          </div>
        </form>
      )}
    </header>
  );
}

export function StoreBottomNav() {
  const { totalItems } = useCart();
  const { session } = useAuth();

  const items: { label: string; icon: typeof Home; path: string; badge?: number }[] = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Shop', icon: Grid, path: '/shop' },
    { label: 'AI', icon: MessageCircle, path: '/ai-stylist' },
    { label: 'Orders', icon: Package, path: '/track-order' },
    { label: 'Account', icon: User, path: session ? '/profile' : '/login' },
  ];

  const currentPath = window.location.hash.slice(1) || '/';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-t border-amber-500/20">
      <div className="flex items-center justify-around h-16 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = currentPath === item.path ||
            (item.path !== '/' && currentPath.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={classNames(
                'flex flex-col items-center gap-0.5 px-2 py-1 transition',
                active ? 'text-amber-400' : 'text-zinc-500'
              )}
            >
              <div className="relative">
                <item.icon size={22} />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 bg-amber-500 text-black text-[10px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings } = useSettings();
  const { session, isAdmin, signOut } = useAuth();

  const links = [
    { label: 'Home', path: '/' },
    { label: 'Shop All', path: '/shop' },
    { label: 'Featured', path: '/shop?filter=featured' },
    { label: 'WhatsApp Style Assistant', path: '/ai-stylist' },
    { label: 'AI Size Finder', path: '/ai-size' },
    { label: 'AI Outfit Planner', path: '/ai-outfit' },
    { label: 'Virtual Try-On', path: '/virtual-tryon' },
    { label: 'Track Order', path: '/track-order' },
    { label: 'Wishlist', path: '/wishlist' },
    { label: 'Contact Us', path: '/contact' },
  ];

  if (session) {
    links.push({ label: 'My Profile', path: '/profile' });
  } else {
    links.push({ label: 'Sign In', path: '/login' });
    links.push({ label: 'Sign Up', path: '/signup' });
  }

  if (isAdmin) {
    links.push({ label: 'Admin Panel', path: '/admin' });
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={onClose} />}
      <div
        className={classNames(
          'fixed top-0 left-0 bottom-0 z-[70] w-72 bg-zinc-950 border-r border-amber-500/20 transition-transform duration-300 overflow-y-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
          <span className="text-lg font-bold">
            <span className="text-amber-400">Dress</span>
            <span className="text-white">IQ</span>
          </span>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X size={22} />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {links.map((link) => (
            <button
              key={link.path}
              onClick={() => { navigate(link.path); onClose(); }}
              className="block w-full text-left px-4 py-3 rounded-xl text-zinc-300 hover:bg-zinc-900 hover:text-amber-400 transition font-medium"
            >
              {link.label}
            </button>
          ))}
          {session && (
            <button
              onClick={() => { signOut(); navigate('/'); onClose(); }}
              className="block w-full text-left px-4 py-3 rounded-xl text-red-400 hover:bg-zinc-900 transition font-medium"
            >
              Sign Out
            </button>
          )}
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-600">{settings.contact_email}</p>
          <p className="text-xs text-zinc-600">{settings.contact_phone}</p>
        </div>
      </div>
    </>
  );
}
