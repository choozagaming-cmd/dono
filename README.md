
## V7 Stream Control Studio
The viewer frontend is now treated as stable. Streamer-side setup lives at `stream-studio.html`, with 1080p, 2K, and vertical source profiles, nine placement presets, per-donation-type customization, custom donation types, OBS publishing, and an Advanced Canvas fallback. See `STREAM_STUDIO_V7.md`.
# Personal Stream Interaction Tab

This build is deliberately **not a creator platform**. It is one branded support page for one streamer, one private dashboard, and one OBS alert queue.

The viewer gets only three choices:

1. **Support + TTS** — normal support with an optional spoken message after the configured minimum.
2. **Rare Drops** — premium, limited signature alerts that you define yourself.
3. **Challenges** — pre-approved stream challenges with fixed prices.

The concepts are inspired by common interactive-donation mechanics, but the names, catalogue, visuals, pricing, assets and business logic in this starter are yours to replace.

## Files

- `index.html` — viewer-facing personal stream support tab.
- `overlay.html` — one OBS browser source for all interaction types.
- `dashboard.html` — creator-only control concept.
- `config.js` — edit your stream name, TTS settings, Rare Drops and Challenges.
- `app.js` — demo interaction logic using localStorage.
- `styles.css` — full responsive UI.
- `server-example.js` — provider-agnostic production backend skeleton.

## Run the demo

From this folder:

```bash
python -m http.server 8080
```

Open:

- `http://localhost:8080/index.html`
- `http://localhost:8080/overlay.html`
- `http://localhost:8080/dashboard.html`

Keep `overlay.html` open in another tab, then send a demo support message, Rare Drop, or Challenge from `index.html`.

## How the production version should work

```text
Viewer selects interaction
        ↓
Your backend validates its real server-side price/rules
        ↓
Hosted payment checkout
        ↓
Payment provider sends signed webhook
        ↓
Your server verifies signature + amount + currency + idempotency
        ↓
Server marks interaction PAID
        ↓
Server applies moderation / TTS generation
        ↓
Single alert queue
        ↓
Private OBS overlay receives verified event via SSE/WebSocket
        ↓
Alert animation → optional TTS → next queued event
```

## Personal-only design decisions

### No creator accounts or marketplace
You do not need:
- streamer registration
- creator discovery
- creator payout splitting
- multi-tenant dashboards
- platform commission logic
- creator KYC flows beyond whatever your own payment provider requires from you

You only need an admin login for yourself.

### Rare Drops
A Rare Drop should be a product-like interaction you define. Recommended fields:

- internal ID
- name
- rarity label
- fixed server-side price
- active/inactive toggle
- optional limited quantity per stream / day / month
- animation asset
- sound asset
- alert duration
- TTS included yes/no
- message character limit
- cooldown

Never accept the Rare Drop price from the browser. The backend looks up the item ID and uses its stored price.

For real limited drops, decrement stock only after confirmed payment and do it atomically in the database so two viewers cannot buy the final copy simultaneously.

### Challenges
For a personal stream, the simplest and cleanest model is a **pre-approved challenge menu**. Only list things you are already willing and able to do.

Recommended fields:
- title
- price
- description
- exact rules
- eligible game/category
- active/inactive toggle
- max purchases per stream
- cooldown
- optional viewer choice field

This starter treats a Challenge as a paid interactive item, not financial escrow. True escrow/refund-on-performance is materially more complex and may create payment-provider, accounting, consumer-refund and regulatory considerations. Add that only after your payment provider and legal/accounting setup support it.

A good alternative for custom challenges is:
1. viewer submits request **before payment**;
2. you approve it;
3. the system creates a one-time checkout link;
4. payment then triggers the challenge.

That avoids taking money for random requests you may need to reject.

### TTS
Production TTS should run only after a verified payment event.

Recommended controls:
- master TTS on/off
- minimum amount
- max message length
- language/voice
- volume/rate
- URL blocking
- banned words
- repeated-character/spam filtering
- donor/IP/payment cooldown
- skip current
- pause queue
- clear queue
- emergency mute

Browser speech is included for the prototype. A polished build should use a server-generated neural TTS audio file so OBS always uses the same voice.

## Payment model

Use hosted checkout or secure payment elements. Do not collect raw card numbers yourself.

You can route:
- Pakistan viewers → your approved local payment methods/gateway
- International viewers → cards/global method supported by your approved merchant account

The payment provider's signed server webhook is the source of truth. A success redirect is not enough to trigger an alert.

## Suggested database

Because this is one streamer, the schema can stay small:

### `interactions`
- id
- type (`support`, `drop`, `challenge`)
- donor_name
- message
- tts_enabled
- item_id nullable
- amount
- currency
- status (`pending`, `paid`, `queued`, `played`, `skipped`, `refunded`)
- provider_transaction_id
- created_at
- played_at

### `catalogue_items`
- id
- type (`drop`, `challenge`)
- name
- description
- rules
- price
- active
- stock nullable
- animation_url nullable
- sound_url nullable
- tts_included
- metadata JSON

### `payment_events`
- provider_event_id UNIQUE
- interaction_id
- transaction_id
- verified_at
- raw_event_reference / audit fields

### `settings`
One row is sufficient for your TTS, overlay, moderation and branding settings.

### `alert_queue`
- interaction_id UNIQUE
- queue_position / created_at
- state
- attempts
- locked_at

## What you still need for a real launch

- your final streamer name / handle / logo
- your real Rare Drop names, prices, animations and sounds
- your real Challenge menu and rules
- domain + HTTPS hosting
- PostgreSQL database
- one secure admin login
- approved payment merchant account(s)
- payment API keys and webhook signing secret
- settlement account
- SSE/WebSocket service for OBS
- production TTS provider if you want higher-quality voices
- moderation rules
- Terms / Privacy / Refund policy appropriate for your jurisdiction and payment provider

## The three most important security rules

1. **Never trust prices from the browser.** Look up Drop/Challenge prices on the server.
2. **Never trigger OBS/TTS from a success page.** Trigger only from a verified payment webhook.
3. **Never put payment secret keys or private overlay credentials in frontend JavaScript.**

## Overlay Studio (new)
Open `overlay-editor.html` to edit your 1920×1080 OBS layout visually. Each interaction type has its own scene: Support/TTS, Rare Drop and Challenge. Drag elements, resize them with the orange handle, change text/media/style, add custom elements, and save. `overlay.html` reads the saved layout.

For production, persist the layout in Supabase instead of localStorage. See `supabase-schema.sql` and `LIVE_SETUP.md`.

## Milestone 1: live visual preview
The Overlay Studio can now send the exact scene/layout to `overlay.html` using a same-browser preview transport, or Supabase Realtime for testing inside the OBS desktop app. Open `START_HERE.md` for the deployment and OBS steps.
