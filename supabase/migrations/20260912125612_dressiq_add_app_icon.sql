/*
# Add App Icon column to app_settings

1. Changes
- Adds `app_icon_url` (text, nullable) to `app_settings`.
- This stores the admin-uploaded app icon URL used for PWA manifest icons and browser favicon.
- It is separate from `logo_url` which is used for the in-app store logo.

2. Security
- No RLS changes needed — app_settings already has existing policies.
*/

ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS app_icon_url text;
