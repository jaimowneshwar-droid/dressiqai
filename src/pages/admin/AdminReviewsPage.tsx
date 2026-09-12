import { useEffect, useState } from 'react';
import { Check, X, Trash2, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Spinner, EmptyState } from '@/components/ui/Feedback';
import { formatDateTime } from '@/lib/utils';
import type { Review, Product } from '@/types';

export function AdminReviewsPage() {
  const [reviews, setReviews] = useState<(Review & { product?: Product })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('reviews').select('*, product:products(*)').order('created_at', { ascending: false });
    setReviews((data as (Review & { product?: Product })[]) ?? []);
    setLoading(false);
  }

  async function toggleApprove(r: Review) {
    await supabase.from('reviews').update({ is_approved: !r.is_approved }).eq('id', r.id);
    load();
  }

  async function del(id: string) {
    if (!confirm('Delete this review?')) return;
    await supabase.from('reviews').delete().eq('id', id);
    load();
  }

  const filtered = reviews.filter((r) => filter === 'all' ? true : filter === 'pending' ? !r.is_approved : r.is_approved);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'approved'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition ${filter === f ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Star size={40} />} title="No reviews yet" subtitle="Customer reviews will appear here" />
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className="bg-zinc-900 rounded-xl border border-zinc-800 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">{r.author_name}</p>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12} className={s <= r.rating ? 'fill-amber-500 text-amber-500' : 'text-zinc-700'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{r.product?.name ?? 'Unknown product'} · {formatDateTime(r.created_at)}</p>
                  {r.title && <p className="text-sm font-medium text-zinc-300 mt-1">{r.title}</p>}
                  <p className="text-sm text-zinc-400 mt-1">{r.comment}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => toggleApprove(r)}
                    className={`p-2 rounded-lg ${r.is_approved ? 'text-green-400 hover:bg-green-500/10' : 'text-zinc-400 hover:text-green-400 hover:bg-green-500/10'}`}
                    title={r.is_approved ? 'Approved (click to unapprove)' : 'Approve'}
                  >
                    <Check size={16} />
                  </button>
                  <button onClick={() => del(r.id)} className="p-2 text-zinc-400 hover:text-red-400"><Trash2 size={16} /></button>
                </div>
              </div>
              <span className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full ${r.is_approved ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                {r.is_approved ? 'Approved' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
