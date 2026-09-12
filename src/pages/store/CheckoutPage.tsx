import { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle2, Clock, Truck, CreditCard, Wallet, Banknote } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { formatPrice, generateOrderNumber, classNames } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Form';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import type { OrderItem } from '@/types';

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal: { ondismiss: () => void };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (err: unknown) => void) => void;
}

export function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { settings } = useSettings();
  const { customer, user } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', state: '', zip: '', notes: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [pendingOrderNum, setPendingOrderNum] = useState<string>('');

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zip: customer.zip_code,
        notes: '',
      });
    } else if (user?.email) {
      setForm((prev) => ({ ...prev, email: user.email ?? '', name: user.user_metadata?.name ?? '' }));
    }
  }, [customer, user]);

  const shipping = subtotal >= settings.free_shipping_threshold ? 0 : settings.shipping_flat_rate;
  const total = subtotal + shipping;

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setPlacing(true);

    try {
      const orderItems: OrderItem[] = items.map((i) => ({
        product_id: i.product.id,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        image: i.product.images[0] || '',
        size: i.size,
        color: i.color,
      }));

      let customerId: string | null = null;
      const { data: existing } = await supabase
        .from('customers')
        .select('id, total_orders, total_spent')
        .eq('email', form.email)
        .maybeSingle();

      if (existing) {
        customerId = (existing as { id: string; total_orders: number; total_spent: number }).id;
        await supabase.from('customers').update({
          total_orders: (existing as { total_orders: number }).total_orders + 1,
          total_spent: (existing as { total_spent: number }).total_spent + total,
          name: form.name,
          phone: form.phone,
          address: form.address,
          city: form.city,
          state: form.state,
          zip_code: form.zip,
          ...(user?.id ? { user_id: user.id } : {}),
        }).eq('id', customerId);
      } else {
        const { data: newCust } = await supabase.from('customers').insert({
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          city: form.city,
          state: form.state,
          zip_code: form.zip,
          total_orders: 1,
          total_spent: total,
          ...(user?.id ? { user_id: user.id } : {}),
        }).select('id').single();
        if (newCust) customerId = newCust.id;
      }

      const num = generateOrderNumber();
      const { data: order, error } = await supabase.from('orders').insert({
        order_number: num,
        customer_id: customerId,
        items: orderItems,
        subtotal,
        shipping,
        tax: 0,
        total,
        status: 'pending',
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cod' ? 'unpaid' : 'pending',
        shipping_name: form.name,
        shipping_email: form.email,
        shipping_phone: form.phone,
        shipping_address: form.address,
        shipping_city: form.city,
        shipping_state: form.state,
        shipping_zip: form.zip,
        notes: form.notes,
      }).select('id').single();

      if (error) throw error;
      if (!order) throw new Error('Order was not created');

      if (paymentMethod === 'upi') {
        setPendingOrderId(order.id);
        setPendingAmount(total);
        setPendingOrderNum(num);
        await initiateRazorpayPayment(order.id, total, num);
      } else {
        clearCart();
        showConfirmation(order.id, num, 'unpaid');
      }
    } catch (err) {
      console.error('Order placement failed:', err);
      if (pendingOrderId) {
        setPaymentStatus('pending');
      } else {
        alert('Failed to place order. Please check your details and try again.');
      }
    } finally {
      setPlacing(false);
    }
  }

  async function initiateRazorpayPayment(orderId: string, amount: number, num: string) {
    setPaymentStatus('');
    const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-payment/create-order`;
    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order_id: orderId, amount }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || 'Failed to initiate payment. Please try again or use Cash on Delivery.');
    }

    const data = await res.json() as {
      razorpay_order_id: string;
      razorpay_key_id: string;
      amount: number;
      currency: string;
    };

    if (!data.razorpay_order_id || !data.razorpay_key_id) {
      throw new Error('Invalid response from payment server');
    }

    await new Promise<void>((resolve, reject) => {
      if (!window.Razorpay) {
        reject(new Error('Razorpay checkout failed to load. Please check your connection and try again.'));
        return;
      }

      const rzp = new window.Razorpay({
        key: data.razorpay_key_id,
        amount: data.amount,
        currency: data.currency,
        name: settings.store_name || 'DressIQ',
        description: `Order ${num}`,
        order_id: data.razorpay_order_id,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: settings.primary_color || '#f59e0b' },
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-payment/verify-payment`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  order_id: orderId,
                }),
              }
            );

            if (!verifyRes.ok) {
              const errBody = await verifyRes.json().catch(() => ({}));
              throw new Error(errBody.error || 'Payment verification failed');
            }

            clearCart();
            setPendingOrderId(null);
            showConfirmation(orderId, num, 'paid');
            resolve();
          } catch (err) {
            console.error('Payment verification failed:', err);
            setPaymentStatus('pending');
            resolve();
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus('pending');
            resolve();
          },
        },
      });

      rzp.on('payment.failed', (err: unknown) => {
        console.error('Razorpay payment failed:', err);
        setPaymentStatus('pending');
        resolve();
      });

      rzp.open();
    });
  }

  function showConfirmation(id: string, num: string, status: string) {
    setOrderId(id);
    setOrderNumber(num);
    setPaymentStatus(status);
    if (user?.id) {
      supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Order Placed Successfully',
        body: `Your order ${num} for ${formatPrice(total, settings.currency_symbol)} has been received.`,
        type: 'order',
      }).then(() => {});
    }
  }

  if (paymentStatus === 'pending' && pendingOrderId) {
    return (
      <div className="py-20 px-4 flex flex-col items-center text-center">
        <Clock size={64} className="text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Payment Pending</h1>
        <p className="text-zinc-400 mb-6">Your order has been created but payment hasn't been completed yet. You can retry the payment now or later.</p>
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 w-full max-w-sm mb-6 space-y-2">
          <div>
            <p className="text-sm text-zinc-500">Order Number</p>
            <p className="text-lg font-mono font-bold text-amber-400">{pendingOrderNum}</p>
          </div>
          <div className="pt-2 border-t border-zinc-800">
            <p className="text-sm text-zinc-500">Amount Due</p>
            <p className="text-sm text-white font-medium mt-0.5">{formatPrice(pendingAmount, settings.currency_symbol)}</p>
          </div>
          <div className="pt-2 border-t border-zinc-800">
            <p className="text-sm text-zinc-500">Track your order anytime</p>
            <button onClick={() => navigate('/track-order')} className="text-amber-400 text-sm font-medium mt-1">Track Order →</button>
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Button onClick={() => initiateRazorpayPayment(pendingOrderId, pendingAmount, pendingOrderNum)} className="w-full">
            Retry Payment
          </Button>
          <Button variant="secondary" onClick={() => navigate('/')} className="w-full">Back to Home</Button>
        </div>
      </div>
    );
  }

  if (orderId) {
    return (
      <div className="py-20 px-4 flex flex-col items-center text-center">
        <CheckCircle2 size={64} className="text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Order Placed!</h1>
        <p className="text-zinc-400 mb-6">Thank you for your purchase. We'll send a confirmation to your email.</p>
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 w-full max-w-sm mb-6 space-y-2">
          <div>
            <p className="text-sm text-zinc-500">Order Number</p>
            <p className="text-lg font-mono font-bold text-amber-400">{orderNumber}</p>
          </div>
          <div className="pt-2 border-t border-zinc-800">
            <p className="text-sm text-zinc-500">Payment</p>
            <p className="text-sm text-white font-medium mt-0.5">
              {paymentMethod === 'cod'
                ? 'Cash on Delivery'
                : paymentStatus === 'paid'
                  ? 'UPI / Online — Paid'
                  : 'UPI / Online — Pending'}
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-800">
            <p className="text-sm text-zinc-500">Track your order anytime</p>
            <button onClick={() => navigate('/track-order')} className="text-amber-400 text-sm font-medium mt-1">
              Track Order →
            </button>
          </div>
        </div>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-20">
        <EmptyState title="Your cart is empty" subtitle="Add items before checkout" icon={<Truck size={48} />} />
        <div className="text-center mt-4">
          <Button onClick={() => navigate('/shop')}>Browse Products</Button>
        </div>
      </div>
    );
  }

  const paymentMethods = [
    { val: 'cod', label: 'Cash on Delivery', icon: Banknote, desc: 'Pay when you receive your order' },
    { val: 'upi', label: 'UPI / Online Payment', icon: Wallet, desc: 'UPI, Cards, EMI, Net Banking, Wallets' },
  ];

  return (
    <div className="pb-6">
      <div className="px-4 py-3">
        <button onClick={() => navigate('/cart')} className="flex items-center gap-1 text-zinc-400 text-sm">
          <ChevronLeft size={18} /> Back to Cart
        </button>
      </div>

      <form onSubmit={placeOrder} className="px-4 space-y-5">
        <h1 className="text-xl font-bold text-white">Checkout</h1>

        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Truck size={16} className="text-amber-500" /> Shipping Details
          </h3>
          <Input label="Full Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Textarea label="Address" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input label="State" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
          <Input label="ZIP Code" required value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
          <Textarea label="Order Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CreditCard size={16} className="text-amber-500" /> Payment Method
          </h3>
          {paymentMethods.map((method) => (
            <button
              key={method.val}
              type="button"
              onClick={() => setPaymentMethod(method.val)}
              className={classNames(
                'w-full flex items-center gap-3 p-3 rounded-xl border transition text-left',
                paymentMethod === method.val
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-zinc-800 bg-zinc-800/50'
              )}
            >
              <method.icon size={20} className={paymentMethod === method.val ? 'text-amber-400' : 'text-zinc-500'} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${paymentMethod === method.val ? 'text-white' : 'text-zinc-400'}`}>{method.label}</p>
                <p className="text-xs text-zinc-500">{method.desc}</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 ${paymentMethod === method.val ? 'border-amber-500 bg-amber-500' : 'border-zinc-700'}`}>
                {paymentMethod === method.val && <div className="h-2 w-2 bg-black rounded-full m-auto mt-[3px]" />}
              </div>
            </button>
          ))}
        </div>

        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-2">
          <h3 className="text-sm font-bold text-white mb-2">Order Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Subtotal ({items.length} items)</span>
            <span className="text-white">{formatPrice(subtotal, settings.currency_symbol)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Shipping</span>
            <span className="text-white">{shipping === 0 ? 'FREE' : formatPrice(shipping, settings.currency_symbol)}</span>
          </div>
          <div className="border-t border-zinc-800 pt-2 flex justify-between">
            <span className="font-bold text-white">Total</span>
            <span className="font-bold text-amber-400">{formatPrice(total, settings.currency_symbol)}</span>
          </div>
        </div>

        <Button type="submit" disabled={placing} className="w-full" size="lg">
          {placing ? <Spinner size={18} /> : `Place Order — ${formatPrice(total, settings.currency_symbol)}`}
        </Button>
      </form>
    </div>
  );
}
