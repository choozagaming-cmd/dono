# Make the personal stream hub live

## What is already working in this package
- Public viewer interaction UI for Support/TTS, Rare Drops and Challenges.
- A visual 1920×1080 Overlay Studio (`overlay-editor.html`).
- Drag, resize, layer, add text/box/media, and scene-specific layouts.
- OBS overlay renderer (`overlay.html?obs=1`) using the exact saved coordinates.
- Local demo trigger queue and browser TTS.

## Production architecture
Viewer -> public page -> payment checkout -> payment provider webhook -> server verification -> moderation -> Supabase `stream_events` -> Supabase Realtime Broadcast -> OBS overlay.

Admin -> authenticated Overlay Studio -> save layout to `overlay_layouts` -> OBS reads active layout.

Assets -> Supabase Storage -> public/signed asset URL -> Rare Drop or overlay media element.

## Supabase setup
1. Create/open your Supabase project.
2. Run `supabase-schema.sql` in the SQL editor.
3. Create a private admin account with Supabase Auth.
4. Replace `YOUR_ADMIN_USER_UUID` in the commented admin policies and enable them.
5. Create a Storage bucket such as `stream-assets` for `.webm`, `.mp4`, `.png`, `.gif`, `.mp3` and `.wav` assets.
6. Keep the service-role key server-side only. The browser may use only the publishable/anon key with RLS protecting tables.
7. For production alerts, subscribe the OBS page to the private `stream:main` Broadcast topic.

## Vercel deployment
For a no-backend public demo, this folder can be deployed as a static site. For real payments, add Vercel Functions under `/api` for checkout creation and provider webhooks.

Environment variables you will eventually need:
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- payment provider API key / merchant ID
- payment webhook signing secret
- optional neural TTS provider key

## OBS setup
1. Deploy the site.
2. Add a Browser Source in OBS.
3. URL: `https://YOUR-DOMAIN/overlay.html?obs=1&token=YOUR_PRIVATE_OVERLAY_TOKEN`
4. Width: 1920, Height: 1080.
5. Enable browser-source audio if TTS/sounds are produced by the overlay.
6. Use Overlay Studio to position everything; save/publish the layout.

## Before taking real money
- Never trust a browser "payment successful" screen.
- Verify payment provider signatures on the server.
- Use a unique `provider_event_id` to prevent duplicate webhook replays.
- Insert into `stream_events` only after payment verification.
- Moderate the text before broadcasting it to OBS.
- Add rate limits, minimum amounts, TTS cooldown and a panic mute/clear queue control.
