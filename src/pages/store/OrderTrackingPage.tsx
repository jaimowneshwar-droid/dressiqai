import { useState } from 'react';
import { Package, Search, ChevronLeft, Truck, CheckCircle2, Clock, XCircle, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { formatDateTime, formatPrice, classNames } from '@/lib/utils';
import { useSettings } from '@/context/SettingsContext';
import type { Order } from '@/types';
import { Button, Input } from '@/components/ui';

const STATUS_STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
const STATUS_ICONS: Record<string, typeof Clock> = {
  pending: Clock,
  confirmed: CheckCircle2,
  shipped: Truck,
  delivered: Package,
  cancelled: XCircle,
};

export function OrderTrackingPage() {
  const { settings } = useSettings();
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function trackOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);

    const { data, error: queryError } = await supabase
      .from('orders')
      .select('*')
      .or(`order_number.ilike.%${orderNumber.trim()}%,shipping_email.ilike.%${orderNumber.trim()}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (queryError) {
      setError('Unable to search orders. Please try again.');
    } else if (data) {
      setOrder(data as Order);
    } else {
      setError('No order found. Check your order number or email.');
    }
    setLoading(false);
  }

  const currentStep = order ? STATUS_STEPS.indexOf(order.status) : -1;
  const isCancelled = order?.status === 'cancelled';

  return (
    <div className="pb-6">
      <div className="px-4 py-3">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-zinc-400 text-sm">
          <ChevronLeft size={18} /> Back
        </button>
      </div>

      <div className="px-4 py-2">
        <h1 className="text-2xl font-bold text-white">Track Your Order</h1>
        <p className="text-sm text-zinc-500 mt-1">Enter your order number or email</p>
      </div>

      <form onSubmit={trackOrder} className="px-4 py-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="DQ-20260907-12345 or your email" required />
          </div>
          <Button type="submit" disabled={loading} size="lg">{loading ? '...' : <Search size={18} />}</Button>
        </div>
      </form>

      {error && <div className="px-4"><p className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3 text-center">{error}</p></div>}

      {order && !error && (
        <div className="px-4 space-y-4">
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-zinc-500">Order Number</p>
                <p className="text-sm font-mono font-bold text-amber-400">{order.order_number}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">Order Date</p>
                <p className="text-sm text-white">{formatDateTime(order.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={classNames('text-xs font-semibold px-3 py-1 rounded-full', isCancelled ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400')}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
              <span className="text-xs text-zinc-500">{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
            </div>
          </div>

          {!isCancelled && (
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <div className="space-y-0">
                {STATUS_STEPS.map((step, i) => {
                  const Icon = STATUS_ICONS[step];
                  const done = i <= currentStep;
                  const isLast = i === STATUS_STEPS.length - 1;
                  return (
                    <div key={step} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={classNames('h-10 w-10 rounded-full flex items-center justify-center border-2 transition', done ? 'bg-amber-500 border-amber-500' : 'bg-zinc-800 border-zinc-700')}>
                          <Icon size={18} className={done ? 'text-black' : 'text-zinc-600'} />
                        </div>
                        {!isLast && <div className={classNames('w-0.5 h-8', done ? 'bg-amber-500' : 'bg-zinc-800')} />}
                      </div>
                      <div className="pt-2">
                        <p className={classNames('text-sm font-medium', done ? 'text-white' : 'text-zinc-600')}>{STATUS_LABELS[step]}</p>
                        {i === currentStep && <p className="text-xs text-amber-400 mt-0.5">Current status</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <MapPin size={16} className="text-amber-500" /> Shipping Address
            </h3>
            <div className="text-sm text-zinc-400 space-y-0.5">
              <p className="text-white font-medium">{order.shipping_name}</p>
              <p>{order.shipping_address}</p>
              <p>{order.shipping_city}, {order.shipping_state} {order.shipping_zip}</p>
              <p>{order.shipping_phone}</p>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <h3 className="text-sm font-bold text-white mb-3">Items ({order.items.length})</h3>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-16 w-16 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                    {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    {(item.size || item.color) && <p className="text-xs text-zinc-500">{[item.size, item.color].filter(Boolean).join(' / ')}</p>}
                    <p className="text-xs text-zinc-400">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-zinc-800 mt-3 pt-3 flex justify-between">
              <span className="text-sm font-bold text-white">Total</span>
              <span className="text-sm font-bold text-amber-400">{formatPrice(order.total, settings.currency_symbol)}</span>
            </div>
          </div>
        </div>
      )}

      {!searched && !order && (
        <div className="px-4 py-10 text-center">
          <Package size={48} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">Enter your order number above to track your shipment</p>
        </div>
      )}
    </div>
  );
}
