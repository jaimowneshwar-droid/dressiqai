import { useEffect, useState } from 'react';
import { Eye, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Spinner, EmptyState } from '@/components/ui/Feedback';
import { formatPrice, formatDateTime, classNames } from '@/lib/utils';
import { useSettings } from '@/context/SettingsContext';
import type { Order } from '@/types';

const statusOptions = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const paymentOptions = ['pending', 'unpaid', 'paid', 'refunded'];

export function AdminOrdersPage() {
  const { settings } = useSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Order | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('orders').update({ status }).eq('id', id);
    setOrders(orders.map((o) => o.id === id ? { ...o, status } : o));
    if (viewing?.id === id) setViewing({ ...viewing, status });

    const order = orders.find((o) => o.id === id);
    if (order) {
      const { data: customer } = await supabase.from('customers').select('user_id').eq('email', order.shipping_email).maybeSingle();
      if (customer?.user_id) {
        await supabase.from('notifications').insert({
          user_id: customer.user_id,
          title: `Order ${order.order_number} — ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          body: `Your order status has been updated to: ${status}`,
          type: 'order',
        });
      }
    }
  }

  async function updatePayment(id: string, payment_status: string) {
    await supabase.from('orders').update({ payment_status }).eq('id', id);
    setOrders(orders.map((o) => o.id === id ? { ...o, payment_status } : o));
    if (viewing?.id === id) setViewing({ ...viewing, payment_status });
  }

  async function del(id: string) {
    if (!confirm('Delete this order?')) return;
    await supabase.from('orders').delete().eq('id', id);
    load();
  }

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div>
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
        {['all', ...statusOptions].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={classNames(
              'shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition capitalize',
              filter === s ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Eye size={40} />} title="No orders yet" subtitle="Orders will appear here" />
      ) : (
        <div className="space-y-2">
          {filtered.map((o) => (
            <div key={o.id} className="bg-zinc-900 rounded-xl border border-zinc-800 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{o.shipping_name}</p>
                  <p className="text-xs text-zinc-500">{o.order_number} · {formatDateTime(o.created_at)}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={classNames(
                      'text-[10px] font-medium px-2 py-0.5 rounded-full capitalize',
                      o.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                      o.status === 'completed' || o.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                      o.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                    )}>{o.status}</span>
                    <span className={classNames(
                      'text-[10px] font-medium px-2 py-0.5 rounded-full capitalize',
                      o.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' :
                      o.payment_status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                      o.payment_status === 'refunded' ? 'bg-red-500/20 text-red-400' : 'bg-zinc-700 text-zinc-400'
                    )}>{o.payment_status}</span>
                    <span className="text-xs font-bold text-amber-400">{formatPrice(o.total, settings.currency_symbol)}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setViewing(o)} className="p-2 text-zinc-400 hover:text-amber-400"><Eye size={16} /></button>
                  <button onClick={() => del(o.id)} className="p-2 text-zinc-400 hover:text-red-400"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={`Order ${viewing?.order_number ?? ''}`} size="lg">
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <p className="text-xs text-zinc-500">Customer</p>
                <p className="text-sm text-white font-medium mt-1">{viewing.shipping_name}</p>
                <p className="text-xs text-zinc-400">{viewing.shipping_email}</p>
                <p className="text-xs text-zinc-400">{viewing.shipping_phone}</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <p className="text-xs text-zinc-500">Shipping Address</p>
                <p className="text-sm text-zinc-300 mt-1">{viewing.shipping_address}</p>
                <p className="text-xs text-zinc-400">{[viewing.shipping_city, viewing.shipping_state, viewing.shipping_zip].filter(Boolean).join(', ')}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-zinc-300 mb-2">Items</p>
              <div className="space-y-2">
                {viewing.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-zinc-800/50 rounded-lg p-2">
                    <div className="h-12 w-12 rounded bg-zinc-700 overflow-hidden shrink-0">
                      {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{item.name}</p>
                      <p className="text-xs text-zinc-500">Qty: {item.quantity}{item.size ? ` · Size: ${item.size}` : ''}{item.color ? ` · Color: ${item.color}` : ''}</p>
                    </div>
                    <span className="text-sm font-medium text-amber-400">{formatPrice(item.price * item.quantity, settings.currency_symbol)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm"><span className="text-zinc-400">Subtotal</span><span className="text-white">{formatPrice(viewing.subtotal, settings.currency_symbol)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-zinc-400">Shipping</span><span className="text-white">{viewing.shipping === 0 ? 'FREE' : formatPrice(viewing.shipping, settings.currency_symbol)}</span></div>
              <div className="flex justify-between font-bold pt-1 border-t border-zinc-700"><span className="text-white">Total</span><span className="text-amber-400">{formatPrice(viewing.total, settings.currency_symbol)}</span></div>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="flex justify-between text-sm"><span className="text-zinc-400">Payment Method</span><span className="text-white capitalize">{viewing.payment_method === 'cod' ? 'Cash on Delivery' : 'UPI / Online'}</span></div>
              {viewing.razorpay_order_id && <div className="flex justify-between text-xs mt-1"><span className="text-zinc-500">Razorpay Order ID</span><span className="text-zinc-400 font-mono">{viewing.razorpay_order_id}</span></div>}
            </div>

            {viewing.notes && <div className="bg-zinc-800/50 rounded-lg p-3"><p className="text-xs text-zinc-500">Notes</p><p className="text-sm text-zinc-300 mt-1">{viewing.notes}</p></div>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Order Status</label>
                <select value={viewing.status} onChange={(e) => updateStatus(viewing.id, e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none">
                  {statusOptions.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Payment Status</label>
                <select value={viewing.payment_status} onChange={(e) => updatePayment(viewing.id, e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none">
                  {paymentOptions.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
