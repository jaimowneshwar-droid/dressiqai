import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { AppSettings } from '@/types';

interface SettingsContextValue {
  settings: AppSettings;
  loading: boolean;
  refresh: () => void;
}

const defaultSettings: AppSettings = {
  id: '',
  store_name: 'DressIQ AI',
  logo_url: null,
  app_icon_url: null,
  primary_color: '#D4AF37',
  secondary_color: '#0A0A0A',
  accent_color: '#F5E6A8',
  hero_title: 'Dress Smarter with AI',
  hero_subtitle: 'AI-powered fashion at your fingertips',
  contact_email: 'support@dressiq.ai',
  contact_phone: '+91 98765 43210',
  contact_phone_2: null,
  whatsapp_number: null,
  instagram_url: null,
  contact_address: '123 Fashion Street, Mumbai, Maharashtra 400001',
  ai_enabled: true,
  ai_provider: 'gemini',
  ai_api_key: null,
  ai_model: 'gemini-2.5-flash',
  ai_system_prompt: 'You are DressIQ, a fashion AI assistant helping customers find the perfect outfit.',
  free_shipping_threshold: 999,
  shipping_flat_rate: 49,
  currency_symbol: '₹',
  updated_at: '',
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultSettings,
  loading: true,
  refresh: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('app_settings')
        .select('*')
        .maybeSingle();
      if (!cancelled && data) {
        setSettings(data as AppSettings);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <SettingsContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
