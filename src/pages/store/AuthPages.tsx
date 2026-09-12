import { useState, useEffect } from 'react';
import { Lock, Mail, User, Phone, ChevronLeft, ShoppingBag, Package, Heart, LogOut, Bell, Edit2, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';
import { supabase } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { formatPrice, formatDate, classNames } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Form';
import { Spinner, EmptyState } from '@/components/ui/Feedback';
import { useSettings } from '@/context/SettingsContext';
import type { Order } from '@/types';

export function CustomerLoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError);
      setLoading(false);
    } else {
      navigate('/profile');
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
            <ShoppingBag className="text-amber-400" size={28} />
          </div>
          <h1 className="text-2xl font-bold">
            <span className="text-amber-400">Dress</span><span className="text-white">IQ</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSignIn} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4">
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <Input label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg p-2.5">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? <Spinner size={18} /> : 'Sign In'}
          </Button>
          <p className="text-center text-sm text-zinc-500">
            Don't have an account?{' '}
            <button type="button" onClick={() => navigate('/signup')} className="text-amber-400 font-medium">Sign Up</button>
          </p>
        </form>

        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-zinc-500 text-sm mt-4 mx-auto">
          <ChevronLeft size={16} /> Back to Home
        </button>
      </div>
    </div>
  );
}

export function CustomerSignupPage() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error: signUpError } = await signUp(form.email, form.password, form.name, form.phone);
    if (signUpError) {
      setError(signUpError);
      setLoading(false);
    } else {
      navigate('/profile');
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
            <User className="text-amber-400" size={28} />
          </div>
          <h1 className="text-2xl font-bold">
            <span className="text-amber-400">Dress</span><span className="text-white">IQ</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSignUp} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4">
          <Input label="Full Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          <Input label="Phone" type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
          <Input label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" />
          <Input label="Confirm Password" type="password" required value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="Re-enter password" />
          {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg p-2.5">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? <Spinner size={18} /> : 'Create Account'}
          </Button>
          <p className="text-center text-sm text-zinc-500">
            Already have an account?{' '}
            <button type="button" onClick={() => navigate('/login')} className="text-amber-400 font-medium">Sign In</button>
          </p>
        </form>

        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-zinc-500 text-sm mt-4 mx-auto">
          <ChevronLeft size={16} /> Back to Home
        </button>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { session, user, customer, signOut, refreshCustomer } = useAuth();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const { settings } = useSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '', city: '', state: '', zip: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate('/login');
    }
  }, [session]);

  useEffect(() => {
    if (customer) {
      setEditForm({
        name: customer.name, phone: customer.phone, address: customer.address,
        city: customer.city, state: customer.state, zip: customer.zip_code,
      });
    }
  }, [customer]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('shipping_email', user.email ?? '')
        .order('created_at', { ascending: false })
        .limit(20);
      setOrders((data as Order[]) ?? []);
      setLoadingOrders(false);
    })();
  }, [user?.id, user?.email]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    if (customer) {
      await supabase.from('customers').update({
        name: editForm.name,
        phone: editForm.phone,
        address: editForm.address,
        city: editForm.city,
        state: editForm.state,
        zip_code: editForm.zip,
      }).eq('id', customer.id);
      await refreshCustomer();
    }
    setSavingProfile(false);
    setEditing(false);
  }

  if (!session) {
    return null;
  }

  return (
    <div className="pb-6">
      <div className="px-4 py-3">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-zinc-400 text-sm mb-3">
          <ChevronLeft size={18} /> Back
        </button>
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-amber-500/20 flex items-center justify-center">
            <User size={24} className="text-amber-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{customer?.name || user?.email}</h1>
            <p className="text-sm text-zinc-500">{user?.email}</p>
          </div>
          <button
            onClick={() => { setShowNotifs(!showNotifs); if (unreadCount > 0) markAllAsRead(); }}
            className="relative h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center"
          >
            <Bell size={20} className="text-amber-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications dropdown */}
      {showNotifs && (
        <div className="px-4 mb-4">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-3 space-y-2 max-h-64 overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-white">Notifications</p>
              <button onClick={() => setShowNotifs(false)} className="text-zinc-500 text-xs">Close</button>
            </div>
            {notifications.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={classNames('rounded-lg p-3', n.is_read ? 'bg-zinc-800/50' : 'bg-amber-500/10')}>
                  <p className="text-sm font-medium text-white">{n.title}</p>
                  {n.body && <p className="text-xs text-zinc-400 mt-0.5">{n.body}</p>}
                  <p className="text-[10px] text-zinc-600 mt-1">{formatDate(n.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Profile Info */}
      <div className="px-4 space-y-4">
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">Profile Details</h3>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="text-amber-400 text-sm flex items-center gap-1">
                <Edit2 size={14} /> Edit
              </button>
            ) : null}
          </div>
          {editing ? (
            <form onSubmit={saveProfile} className="space-y-3">
              <Input label="Name" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              <Input label="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              <Input label="Address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="City" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                <Input label="State" value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} />
              </div>
              <Input label="ZIP" value={editForm.zip} onChange={(e) => setEditForm({ ...editForm, zip: e.target.value })} />
              <div className="flex gap-2">
                <Button type="submit" disabled={savingProfile} className="flex-1">
                  {savingProfile ? <Spinner size={16} /> : <><Check size={16} /> Save</>}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Phone</span><span className="text-white">{customer?.phone || 'Not set'}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Address</span><span className="text-white text-right">{customer?.address || 'Not set'}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">City</span><span className="text-white">{customer?.city || 'Not set'}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Total Orders</span><span className="text-amber-400 font-medium">{customer?.total_orders ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Total Spent</span><span className="text-amber-400 font-medium">{formatPrice(customer?.total_spent ?? 0, settings.currency_symbol)}</span></div>
            </div>
          )}
        </div>

        {/* Order History */}
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Package size={16} className="text-amber-500" /> Order History
          </h3>
          {loadingOrders ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">No orders yet</p>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => navigate('/track-order')}
                  className="w-full flex items-center justify-between bg-zinc-800/50 rounded-lg p-3 text-left"
                >
                  <div>
                    <p className="text-sm font-mono font-medium text-amber-400">{order.order_number}</p>
                    <p className="text-xs text-zinc-500">{formatDate(order.created_at)} · {order.items.length} items</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{formatPrice(order.total, settings.currency_symbol)}</p>
                    <span className={classNames(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                      order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                      order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                      'bg-amber-500/20 text-amber-400'
                    )}>
                      {order.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => { signOut(); navigate('/'); }}
          className="w-full flex items-center justify-center gap-2 bg-zinc-900 rounded-xl p-4 border border-zinc-800 text-red-400 font-medium text-sm"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  );
}
