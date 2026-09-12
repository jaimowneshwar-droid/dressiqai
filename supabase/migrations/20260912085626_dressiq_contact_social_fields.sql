/*
# Add contact and social fields to app_settings

1. Modified Tables
- `app_settings`
  - `contact_phone_2` (text, nullable) — second contact phone number for display on Contact page
  - `whatsapp_number` (text, nullable) — WhatsApp number for the "Chat on WhatsApp" button (digits only, e.g. 919876543210)
  - `instagram_url` (text, nullable) — full Instagram profile URL (e.g. https://instagram.com/dressiq)

2. Security
- No RLS changes. `app_settings` already has existing policies for anon read and authenticated update.

3. Notes
- All three columns are nullable so existing rows remain valid without backfill.
- The frontend reads these via the existing `useSettings()` context which selects `*` from `app_settings`.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'contact_phone_2') THEN
    ALTER TABLE app_settings ADD COLUMN contact_phone_2 text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'whatsapp_number') THEN
    ALTER TABLE app_settings ADD COLUMN whatsapp_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'instagram_url') THEN
    ALTER TABLE app_settings ADD COLUMN instagram_url text;
  END IF;
END $$;
