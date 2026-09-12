import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { supabase } from './lib/supabase';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

async function applyAppIcon() {
  try {
    const { data } = await supabase
      .from('app_settings')
      .select('app_icon_url')
      .maybeSingle();

    const iconUrl = (data as { app_icon_url: string | null } | null)?.app_icon_url;
    if (!iconUrl) return;

    // Update favicon
    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.type = 'image/png';
    favicon.href = iconUrl;

    // Update apple-touch-icon
    let appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = iconUrl;

    // Update og:image and twitter:image
    document.querySelectorAll<HTMLMetaElement>('meta[property="og:image"], meta[name="twitter:image"]').forEach((m) => {
      m.content = iconUrl;
    });

    // Dynamically update PWA manifest icons
    const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (manifestLink) {
      try {
        const res = await fetch(manifestLink.href);
        const manifest = await res.json();
        manifest.icons = [
          { src: iconUrl, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: iconUrl, sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: iconUrl, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ];
        const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
        const blobUrl = URL.createObjectURL(blob);
        manifestLink.href = blobUrl;
      } catch { /* manifest fetch failed — keep static manifest */ }
    }
  } catch { /* settings fetch failed — keep defaults */ }
}

applyAppIcon();
