# Viewer Demo Alerts

This build adds a public **Demo Alert** tab to the viewer page.

## What viewers can send

- Support + TTS demo
- Rare Drop demo
- Challenge demo

Every viewer-triggered test is marked with `demo: true` and the OBS label begins with **DEMO •**. The displayed amount is replaced with **DEMO**, so a test cannot look like a real paid event.

## Live path

Viewer page -> Supabase Realtime (`stream-preview-main`) -> OBS `overlay.html?obs=1`

The viewer page now loads the same Realtime transport used by Overlay Studio. No payment is required for demo alerts.

## Controls

Edit `config.js`:

```js
viewerDemo: {
  enabled: true,
  cooldownSeconds: 20,
  maxChars: 120,
  allowTts: true,
  supportAmount: 500,
  dropAmount: 2500,
  challengeAmount: 1000
}
```

Set `enabled: false` to disable the Demo Alert tab's send button.

## Abuse protection in this milestone

The page includes a per-browser cooldown, message length limit, blocked-link check, and blocked-term check. These controls improve normal use but are **not a security boundary** because a technically skilled visitor can bypass browser-side limits.

Before exposing demo alerts to a large public audience, the next hardening step should move submission through a server/Edge Function with IP/session rate limiting and a streamer-controlled global on/off switch.
