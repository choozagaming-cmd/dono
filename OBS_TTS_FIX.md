# OBS ElevenLabs TTS fix — v5.1

This patch fixes the case where the website voice preview uses ElevenLabs but OBS still speaks with a generic browser voice.

## What changed
- First-party scripts are cache-busted with `?v=5.1.0` so OBS fetches the current overlay runtime after deploys.
- Demo events now carry the selected TTS provider/voice metadata.
- If an ElevenLabs voice is selected and the ElevenLabs request fails inside OBS, the overlay no longer silently falls back to a generic browser voice.

## OBS URL
After deploying this build, update the Browser Source URL once to:

`https://YOUR-DOMAIN/overlay.html?obs=1&v=5.1.0`

Then click **Refresh cache of current page** in OBS.

## Test
1. Preview Serafina on the public page.
2. Send **Try this alert in OBS**.
3. OBS should use the same ElevenLabs Serafina voice.

If the visual alert arrives but there is no TTS, check Vercel runtime logs for `/api/tts`. There should no longer be a misleading generic voice fallback.
