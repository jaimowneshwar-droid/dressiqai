import { useEffect, useState } from 'react';
import { Plus, Trash2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { Spinner, EmptyState } from '@/components/ui/Feedback';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface AdminRow {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
}

export function AdminAdminsPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('admins').select('*').order('created_at');
    setAdmins((data as AdminRow[]) ?? []);
    setLoading(false);
  }

  async function addAdmin(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (newPassword.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setFormLoading(true);

    const { data, error: rpcError } = await supabase.rpc('add_admin_user', {
      p_email: newEmail,
      p_password: newPassword,
    });

    if (rpcError) {
      setFormError(rpcError.message);
      setFormLoading(false);
      return;
    }

    if (data && !(data as any).success) {
      setFormError((data as any).error || 'Failed to add admin.');
      setFormLoading(false);
      return;
    }

    setShowForm(false);
    setNewEmail('');
    setNewPassword('');
    setFormLoading(false);
    load();
  }

  async function del(id: string, email: string) {
    if (email === user?.email) {
      alert('You cannot remove your own admin account.');
      return;
    }
    if (!confirm(`Remove admin access for ${email}?`)) return;
    await supabase.from('admins').delete().eq('id', id);
    load();
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-zinc-500">{admins.length} admin{admins.length !== 1 ? 's' : ''}</p>
        <Button onClick={() => setShowForm(true)} size="sm"><Plus size={16} /> Add Admin</Button>
      </div>

      {admins.length === 0 ? (
        <EmptyState icon={<ShieldCheck size={40} />} title="No admins" />
      ) : (
        <div className="space-y-2">
          {admins.map((a) => (
            <div key={a.id} className="flex items-center gap-3 bg-zinc-900 rounded-xl border border-zinc-800 p-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{a.email}</p>
                <p className="text-xs text-zinc-500">Added {formatDate(a.created_at)}</p>
              </div>
              {a.email === user?.email && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">You</span>
              )}
              {a.email !== user?.email && (
                <button onClick={() => del(a.id, a.email)} className="p-2 text-zinc-400 hover:text-red-400">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Admin Account">
        <form onSubmit={addAdmin} className="space-y-4">
          <Input
            label="Email"
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="newadmin@dressiq.ai"
          />
          <Input
            label="Password"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
          {formError && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg p-2.5">{formError}</p>
          )}
          <Button type="submit" disabled={formLoading} className="w-full">
            {formLoading ? <Spinner size={16} /> : 'Create Admin Account'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
