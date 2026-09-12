import { useEffect, useState } from 'react';
import { Package, ShoppingCart, Users, Star, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/SettingsContext';
import { formatPrice, formatDateTime, classNames } from '@/lib/utils';
import { Spinner } from '@/components/ui/Feedback';
import type { Order } from '@/types';

export function AdminDashboardPage() {
  const { settings } = useSettings();
  const [stats, setStats] = useState({
    products: 0, orders: 0, customers: 0, reviews: 0, revenue: 0, pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [p, o, c, r] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*'),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
      ]);

      const orders = (o.data as Order[]) ?? [];
      const revenue = orders.reduce((sum, ord) => sum + Number(ord.total), 0);
      const pending = orders.filter((ord) => ord.status === 'pending').length;

      setStats({
        products: p.count ?? 0,
        orders: o.data?.length ?? 0,
        customers: c.count ?? 0,
        reviews: r.count ?? 0,
        revenue,
        pendingOrders: pending,
      });
      setRecentOrders(orders.slice(0, 5));
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  const cards = [
    { label: 'Revenue', value: formatPrice(stats.revenue, settings.currency_symbol), icon: DollarSign, color: 'text-green-500' },
    { label: 'Orders', value: stats.orders, icon: ShoppingCart, color: 'text-blue-500' },
    { label: 'Products', value: stats.products, icon: Package, color: 'text-amber-500' },
    { label: 'Customers', value: stats.customers, icon: Users, color: 'text-purple-500' },
    { label: 'Reviews', value: stats.reviews, icon: Star, color: 'text-yellow-500' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Welcome back</h2>
        <p className="text-sm text-zinc-500 mt-1">Here's what's happening in your store</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <card.icon size={20} className={card.color} />
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-sm text-zinc-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">Recent Orders</h3>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-8">No orders yet</p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{order.shipping_name}</p>
                  <p className="text-xs text-zinc-500">{formatDateTime(order.created_at)}</p>
                </div>
                <div className="text-right ml-2">
                  <p className="text-sm font-bold text-amber-400">{formatPrice(order.total, settings.currency_symbol)}</p>
                  <span className={classNames(
                    'text-[10px] font-medium px-2 py-0.5 rounded-full',
                    order.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                    order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400'
  )}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
