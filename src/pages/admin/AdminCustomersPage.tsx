import { useEffect, useState } from 'react';
import { Trash2, Mail, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Spinner, EmptyState } from '@/components/ui/Feedback';
import { formatPrice, formatDate } from '@/lib/utils';
import { useSettings } from '@/context/SettingsContext';
import type { Customer } from '@/types';

export function AdminCustomersPage() {
  const { settings } = useSettings();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    setCustomers((data as Customer[]) ?? []);
    setLoading(false);
  }

  async function del(id: string) {
    if (!confirm('Delete this customer?')) return;
    await supabase.from('customers').delete().eq('id', id);
    load();
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div>
      <p className="text-sm text-zinc-500 mb-4">{customers.length} customers</p>
      {customers.length === 0 ? (
        <EmptyState icon={<Phone size={40} />} title="No customers yet" subtitle="Customers appear after their first order" />
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <div key={c.id} className="flex items-start gap-3 bg-zinc-900 rounded-xl border border-zinc-800 p-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-amber-400">{c.name[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{c.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-zinc-400 flex items-center gap-1 truncate"><Mail size={12} /> {c.email}</span>
                  {c.phone && <span className="text-xs text-zinc-400 flex items-center gap-1"><Phone size={12} /> {c.phone}</span>}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">{c.total_orders} orders</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">{formatPrice(c.total_spent, settings.currency_symbol)} spent</span>
                  <span className="text-[10px] text-zinc-600">{formatDate(c.created_at)}</span>
                </div>
              </div>
              <button onClick={() => del(c.id)} className="p-2 text-zinc-400 hover:text-red-400"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
