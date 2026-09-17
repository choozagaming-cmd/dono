# Stream Hub V9 — Clean Consolidated Build

This build intentionally removes legacy streamer-side pages from earlier versions.

## Public / runtime pages
- `/` — viewer page
- `/stream-studio.html` — the only streamer control center
- `/studio` and `/studio.html` — aliases that redirect to Streamer Studio
- `/overlay.html?obs=1&profile=landscape-1080` — OBS runtime

## What was removed
- legacy Dashboard page
- separate Advanced Canvas page
- old Overlay Editor page
- buttons that bounced between multiple editors
- old version-specific documentation and redirect paths

Media/TTS and Rules/Pricing are now tabs inside the same Streamer Studio.
