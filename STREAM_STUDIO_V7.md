# Stream Control Studio V7

This version freezes the viewer UX and focuses on the streamer/admin side.

## New Stream Studio
Open `stream-studio.html`.

The studio now treats an alert as one logical block. You do not need to manually move every text layer just to reposition an alert.

### Source profiles
- 1080p Landscape: 1920x1080
- 2K Landscape: 2560x1440
- Short / Vertical: 1080x1920

Each source profile keeps its own layout and placement settings.

### Quick placement
For every donation type choose one of nine positions:
Top Left, Top Center, Top Right, Center Left, Center, Center Right, Bottom Left, Bottom Center, Bottom Right.

Then choose Compact, Standard, Large or Takeover. The entire alert is moved/scaled together.

### Per-donation-type tabs
Each donation type has separate settings for:
- Placement
- Appearance
- Content and pricing
- TTS and audio
- Animation/timing

### Add donation types
Use `+ Add donation type` and start from:
- Sound Alert
- Media / GIF Alert
- Support / TTS
- Challenge
- Custom Reward

Custom donation types get their own overlay scene and can be tested in OBS immediately.

### Advanced Canvas
The old freeform editor remains available as Advanced Canvas. It now accepts the source profile and selected scene from Stream Studio, so it opens the correct canvas size.

### Publish to OBS
`Publish layout to OBS` sends the selected source profile to the matching OBS Browser Source and stores it in that OBS browser profile.

OBS URLs use a profile query:
- `overlay.html?obs=1&profile=landscape-1080`
- `overlay.html?obs=1&profile=landscape-2k`
- `overlay.html?obs=1&profile=vertical-short`

Set OBS Browser Source width/height to the matching source resolution.

`Test in OBS` sends the currently selected donation type and current source layout through Supabase Realtime.

## Recommended workflow
1. Open Stream Studio.
2. Choose source format.
3. Choose donation type.
4. Pick position and size.
5. Customize appearance/content/TTS/animation.
6. Test in OBS.
7. Publish layout to OBS.
8. Only use Advanced Canvas if a preset is not enough.
