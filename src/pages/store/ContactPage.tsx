import { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle, Instagram, ChevronRight } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

export function ContactPage() {
  const { settings } = useSettings();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
    setForm({ name: '', email: '', message: '' });
    setTimeout(() => setSent(false), 3000);
  }

  const whatsappNumber = settings.whatsapp_number?.trim();
  const whatsappLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Hi DressIQ, I have a question about your store.')}`
    : null;

  const instagramLink = settings.instagram_url?.trim()
    ? (settings.instagram_url.startsWith('http') ? settings.instagram_url : `https://instagram.com/${settings.instagram_url.replace(/^@/, '')}`)
    : null;

  const phoneEntries = [
    settings.contact_phone,
    settings.contact_phone_2,
  ].filter((p): p is string => Boolean(p && p.trim()));

  return (
    <div className="pb-6">
      <div className="px-4 py-4">
        <h1 className="text-2xl font-bold text-white">Contact Us</h1>
        <p className="text-sm text-zinc-500 mt-1">We'd love to hear from you</p>
      </div>

      <div className="px-4 space-y-4">
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="flex items-start gap-3 p-4 border-b border-zinc-800">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Mail size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Email</p>
              <p className="text-sm text-white font-medium mt-0.5">{settings.contact_email}</p>
            </div>
          </div>

          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-start gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Phone size={20} className="text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-zinc-500">Phone{phoneEntries.length > 1 ? 's' : ''}</p>
                <div className="mt-0.5 space-y-1">
                  {phoneEntries.map((phone, i) => (
                    <a key={i} href={`tel:${phone.replace(/\s/g, '')}`} className="block text-sm text-white font-medium hover:text-amber-400 transition">{phone}</a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <MapPin size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Address</p>
              <p className="text-sm text-white font-medium mt-0.5">{settings.contact_address}</p>
            </div>
          </div>
        </div>

        {(whatsappLink || instagramLink) && (
          <div className="grid grid-cols-2 gap-3">
            {whatsappLink && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-green-500 text-white font-semibold rounded-xl px-4 py-3 hover:bg-green-400 transition active:scale-95">
                <MessageCircle size={18} /> WhatsApp
              </a>
            )}
            {instagramLink && (
              <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl px-4 py-3 hover:opacity-90 transition active:scale-95">
                <Instagram size={18} /> Instagram
              </a>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-3">
          <h3 className="text-base font-bold text-white">Send a Message</h3>
          {sent && <p className="text-green-500 text-sm bg-green-500/10 rounded-lg p-2 text-center">Message sent! We'll get back to you soon.</p>}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none transition" placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none transition" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Message</label>
            <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none transition min-h-[100px] resize-y" placeholder="How can we help?" />
          </div>
          <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 text-black font-semibold rounded-xl px-5 py-3 hover:bg-amber-400 transition active:scale-95">
            <Send size={16} /> Send Message
          </button>
        </form>
      </div>
    </div>
  );
}

function buildWhatsAppLink(whatsappNumber: string): string {
  const digits = whatsappNumber.replace(/\D/g, '');
  const message = encodeURIComponent('Hi DressIQ AI, I need help with my order.');
  return `https://wa.me/${digits}?text=${message}`;
}

export function AIStylistPage() {
  const { settings } = useSettings();
  const whatsappNumber = settings.whatsapp_number?.trim();
  const whatsappLink = whatsappNumber ? buildWhatsAppLink(whatsappNumber) : null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-7.5rem)]">
      <div className="px-4 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <MessageCircle className="text-amber-400" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Style Assistant</h1>
            <p className="text-xs text-zinc-500">Chat with us on WhatsApp</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-5">
        <div className="text-center space-y-2">
          <div className="h-20 w-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
            <MessageCircle className="text-green-400" size={40} />
          </div>
          <h2 className="text-lg font-bold text-white">Need fashion advice?</h2>
          <p className="text-sm text-zinc-400 max-w-xs mx-auto leading-relaxed">
            Chat with our stylists on WhatsApp for personalised outfit recommendations,
            size guidance, and style tips — all in real time.
          </p>
        </div>

        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-3">
          <h3 className="text-sm font-bold text-white">What we can help with:</h3>
          <ul className="space-y-2.5">
            {[
              'Size & fit recommendations based on your measurements',
              'Outfit suggestions for any occasion and budget',
              'Style advice from our fashion experts',
              'Quick answers to product questions',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-300">
                <ChevronRight size={16} className="text-amber-400 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {whatsappLink ? (
          <>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2.5 bg-green-500 text-white font-semibold rounded-xl px-5 py-4 hover:bg-green-400 transition active:scale-95 text-base">
              <MessageCircle size={22} /> Chat with us on WhatsApp
            </a>
            <p className="text-xs text-zinc-600 text-center">Tapping the button opens WhatsApp with a pre-filled message so our team can help you faster.</p>
          </>
        ) : (
          <p className="text-sm text-zinc-500 text-center bg-zinc-900 rounded-xl p-4 border border-zinc-800">WhatsApp contact is not configured yet. Please check back later.</p>
        )}
      </div>
    </div>
  );
}
