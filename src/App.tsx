import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { useRouter } from '@/lib/router';
import { FullPageLoader } from '@/components/ui/Feedback';
import { StoreHeader, StoreBottomNav, SideMenu } from '@/components/store/StoreLayout';
import { AdminLayout } from '@/components/admin/AdminLayout';

// Store pages
import { HomePage } from '@/pages/store/HomePage';
import { ShopPage } from '@/pages/store/ShopPage';
import { ProductDetailPage } from '@/pages/store/ProductDetailPage';
import { CartPage } from '@/pages/store/CartPage';
import { CheckoutPage } from '@/pages/store/CheckoutPage';
import { ContactPage, AIStylistPage } from '@/pages/store/ContactPage';
import { OrderTrackingPage } from '@/pages/store/OrderTrackingPage';
import { AISizePage } from '@/pages/store/AISizePage';
import { AIOutfitPage } from '@/pages/store/AIOutfitPage';
import { VirtualTryOnPage } from '@/pages/store/VirtualTryOnPage';
import { WishlistPage } from '@/pages/store/WishlistPage';
import { CustomerLoginPage, CustomerSignupPage, ProfilePage } from '@/pages/store/AuthPages';

// Admin pages
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminBannersPage } from '@/pages/admin/AdminBannersPage';
import { AdminCategoriesPage } from '@/pages/admin/AdminCategoriesPage';
import { AdminProductsPage } from '@/pages/admin/AdminProductsPage';
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage';
import { AdminCustomersPage } from '@/pages/admin/AdminCustomersPage';
import { AdminReviewsPage } from '@/pages/admin/AdminReviewsPage';
import { AdminThemePage } from '@/pages/admin/AdminThemePage';
import { AdminContactPage } from '@/pages/admin/AdminContactPage';
import { AdminAIPage } from '@/pages/admin/AdminAIPage';
import { AdminAdminsPage } from '@/pages/admin/AdminAdminsPage';

function StoreShell({ route }: { route: { path: string } }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const path = route.path.split('?')[0];

  let page;
  if (path === '/' || path === '') page = <HomePage />;
  else if (path.startsWith('/shop')) page = <ShopPage />;
  else if (path.startsWith('/product/')) page = <ProductDetailPage slug={path.replace('/product/', '')} />;
  else if (path.startsWith('/cart')) page = <CartPage />;
  else if (path.startsWith('/checkout')) page = <CheckoutPage />;
  else if (path.startsWith('/contact')) page = <ContactPage />;
  else if (path.startsWith('/ai-stylist')) page = <AIStylistPage />;
  else if (path.startsWith('/ai-size')) page = <AISizePage />;
  else if (path.startsWith('/ai-outfit')) page = <AIOutfitPage />;
  else if (path.startsWith('/virtual-tryon')) page = <VirtualTryOnPage />;
  else if (path.startsWith('/track-order')) page = <OrderTrackingPage />;
  else if (path.startsWith('/wishlist')) page = <WishlistPage />;
  else if (path.startsWith('/login')) page = <CustomerLoginPage />;
  else if (path.startsWith('/signup')) page = <CustomerSignupPage />;
  else if (path.startsWith('/profile')) page = <ProfilePage />;
  else page = <HomePage />;

  const hideChrome = path.startsWith('/ai-stylist') || path.startsWith('/ai-size') || path.startsWith('/ai-outfit') || path.startsWith('/virtual-tryon') || path.startsWith('/login') || path.startsWith('/signup');

  return (
    <div className="min-h-screen bg-black text-white">
      {!hideChrome && <StoreHeader onMenuClick={() => setMenuOpen(true)} />}
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className={hideChrome ? '' : 'pb-20'}>
        {page}
      </main>
      <StoreBottomNav />
    </div>
  );
}

function AdminShell({ route }: { route: { path: string } }) {
  const { session, isAdmin, loading } = useAuth();
  const path = route.path.split('?')[0];

  if (loading) return <FullPageLoader label="Loading..." />;
  if (!session || !isAdmin) return <AdminLoginPage />;

  let page;
  if (path === '/admin' || path === '/admin/dashboard') page = <AdminDashboardPage />;
  else if (path.startsWith('/admin/banners')) page = <AdminBannersPage />;
  else if (path.startsWith('/admin/categories')) page = <AdminCategoriesPage />;
  else if (path.startsWith('/admin/products')) page = <AdminProductsPage />;
  else if (path.startsWith('/admin/orders')) page = <AdminOrdersPage />;
  else if (path.startsWith('/admin/customers')) page = <AdminCustomersPage />;
  else if (path.startsWith('/admin/reviews')) page = <AdminReviewsPage />;
  else if (path.startsWith('/admin/theme')) page = <AdminThemePage />;
  else if (path.startsWith('/admin/contact')) page = <AdminContactPage />;
  else if (path.startsWith('/admin/ai')) page = <AdminAIPage />;
  else if (path.startsWith('/admin/admins')) page = <AdminAdminsPage />;
  else page = <AdminDashboardPage />;

  return <AdminLayout currentPath={path}>{page}</AdminLayout>;
}

function AppRouter() {
  const { route } = useRouter();
  const path = route.path.split('?')[0];

  if (path.startsWith('/admin')) return <AdminShell route={route} />;
  return <StoreShell route={route} />;
}

export default function App() {
  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = '/';
    }
  }, []);

  return (
    <SettingsProvider>
      <AuthProvider>
        <NotificationsProvider>
          <CartProvider>
            <WishlistProvider>
              <AppRouter />
            </WishlistProvider>
          </CartProvider>
        </NotificationsProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
