import { useState } from 'react';
import { Save, Bot, Sparkles, KeyRound, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/SettingsContext';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Toggle, Select } from '@/components/ui/Form';
import { Spinner } from '@/components/ui/Feedback';

export function AdminAIPage() {
  const { settings, refresh } = useSettings();
  const [form, setForm] = useState({
    ai_enabled: settings.ai_enabled,
    ai_provider: settings.ai_provider,
    ai_model: settings.ai_model,
    ai_system_prompt: settings.ai_system_prompt,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await supabase.from('app_settings').update({
      ai_enabled: form.ai_enabled,
      ai_provider: form.ai_provider,
      ai_model: form.ai_model,
      ai_system_prompt: form.ai_system_prompt,
    }).eq('id', settings.id);
    setSaving(false);
    setSaved(true);
    refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  if (!settings.id) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-2 text-amber-400">
        <Bot size={20} />
        <h2 className="text-base font-bold text-white">AI Settings</h2>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-amber-500/20 p-4 flex items-start gap-3">
        <KeyRound size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-white">Gemini API Key</p>
          <p className="text-xs text-zinc-400 mt-1">
            The API key is read from the <code className="text-amber-400">GEMINI_API_KEY</code> environment variable.
            Set it in your project's environment variables — it never enters the database.
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4">
        <Toggle label="Enable AI Stylist" checked={form.ai_enabled} onChange={(v) => setForm({ ...form, ai_enabled: v })} />

        <Select label="AI Provider" value={form.ai_provider} onChange={(e) => {
          const provider = e.target.value;
          const model = provider === 'gemini' ? 'gemini-3.5-flash-lite' : 'gpt-4o-mini';
          setForm({ ...form, ai_provider: provider, ai_model: model });
        }}>
          <option value="gemini">Google Gemini</option>
          <option value="openai">OpenAI</option>
        </Select>

        <Input
          label="Model"
          value={form.ai_model}
          onChange={(e) => setForm({ ...form, ai_model: e.target.value })}
          placeholder="gemini-3.5-flash-lite"
        />

        <Textarea
          label="System Prompt"
          value={form.ai_system_prompt}
          onChange={(e) => setForm({ ...form, ai_system_prompt: e.target.value })}
        />

        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-400">
            The AI Stylist chat appears on the storefront. The Gemini API key is loaded from the
            <code className="text-amber-400 mx-1">GEMINI_API_KEY</code>
            environment variable — no need to enter it here.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? <Spinner size={16} /> : <><Save size={16} /> Save Settings</>}</Button>
        {saved && <span className="text-sm text-green-400 flex items-center gap-1"><CheckCircle2 size={14} /> Saved successfully!</span>}
      </div>
    </div>
  );
}
