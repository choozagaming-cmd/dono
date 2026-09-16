# Milestone 1 — Visual Overlay Studio → Live Overlay

Live site base: `https://dono-two.vercel.app`

This build focuses on the first production foundation: design an alert visually, then fire that exact design into the live overlay.

## What is new

- `overlay-editor.html` is still the 1920×1080 drag/resize editor.
- New **Open live overlay** button opens the renderer in another browser tab.
- New **Test current scene in OBS** button sends the current scene + current layout.
- Same-browser testing uses `BroadcastChannel` + a localStorage fallback, so it works without a backend.
- Optional Supabase Realtime Broadcast sends the same test event to OBS, even though OBS uses a separate browser process.
- The editor now has a **Live connection** panel that builds the complete OBS Browser Source URL for you.

## Fast test — no Supabase required

1. Deploy this folder to Vercel.
2. Open `https://dono-two.vercel.app/overlay-editor`.
3. Click **Open live overlay**.
4. Move/resize something in Support, Rare Drop, or Challenge.
5. Click **Test current scene in OBS**.
6. The other browser tab should render the exact layout you are editing.

This browser-tab test proves the editor-to-renderer event path. It does **not** yet cross into the OBS desktop app.

## Real OBS test with Supabase Realtime

You need an active Supabase project. In the editor's **Live connection** panel:

1. Paste the Supabase Project URL.
2. Paste the Supabase publishable key (`sb_publishable_...`; a legacy anon key also works during migration).
3. Choose a preview channel name.
4. Click **Save connection**.
5. Copy the generated **OBS browser-source URL**.
6. In OBS: Sources → `+` → Browser.
7. Paste the generated URL.
8. Set Width `1920`, Height `1080`.
9. Enable/control Browser Source audio as needed for TTS/sounds.
10. Keep the OBS source active, return to Overlay Studio, and click **Test current scene in OBS**.

For this temporary development transport, Supabase Realtime must allow public channels. This is **not** the final payment-security model. Production should use authenticated/private Realtime and a server-side trigger after verified payment.

## Why the test packet contains the layout

During design/testing, the editor sends both:

- the sample stream event (support/drop/challenge), and
- the current overlay layout JSON.

That means you can move a message from X=690 to X=123 and immediately see the same position in the live renderer without redeploying the site.

Later, **Save / Publish Layout** will persist the approved layout in Supabase so normal viewer payments can use it without including the layout in every event.

## Files added/changed

- `realtime-preview.js` — local + optional Supabase preview transport.
- `overlay-editor.html` — live test + connection UI.
- `overlay-editor.js` — test event sender, OBS URL builder, connection setup.
- `overlay-runtime.js` — receives studio preview packets and renders the included layout.
- `config.js` — optional Realtime defaults.

## Next milestone

After this is deployed and you confirm the preview fires correctly in OBS:

1. Asset Library for `.webm`, `.mp4`, `.png`, `.gif`, `.mp3`, `.wav`.
2. Drag media from the Asset Library directly onto the canvas.
3. Save/Publish layouts to Supabase.
4. Rare Drop Builder with custom animation, sound, rarity, price, quantity and TTS.
5. Challenge Builder + live challenge HUD.
6. Admin login and private overlay token.
7. Payment checkout + signed webhook → verified stream event.
