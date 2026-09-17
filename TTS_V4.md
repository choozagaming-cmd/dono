# Studio V4 — Integrated Demo Alerts + TTS Voices

## What changed

- Removed the separate Demo Alert tab.
- Support, Rare Drops, and Challenges each have their own **Try in OBS** button.
- Demo events use the exact interaction selected on the real page and are marked `DEMO` only at the overlay layer.
- Added selectable TTS voice profiles:
  - Ayla — Natural Pakistani female
  - Rayyan — Natural Pakistani male
  - Nova — Clear female
  - Atlas — Clear male
  - Velvet Female — warm / seductive / intimate
  - Velvet Male — deep / seductive / intimate
- Added a TTS preview button.
- Added basic automatic Roman Urdu vs English detection for browser TTS.
- TTS profile selection is carried inside the realtime event to OBS.

## Important limitation of this version

The live OBS TTS still uses the browser / operating-system speech engine. The profile settings tune rate, pitch and language preference, but the exact installed voice varies by the stream PC.

For production-quality Roman Urdu, connect a server-side TTS provider. The event contract already carries `voiceProfile`, so changing engines later does not require changing the viewer forms or donation event model.

## Recommended production TTS path

For this stream, a Roman-Urdu-first engine is preferable. A good architecture is:

viewer text -> moderation -> language/code-switch handling -> server TTS -> generated audio -> OBS queue

Do not expose a private TTS API key in browser JavaScript. Put it in a Vercel server route / server environment variable.
