# ElevenLabs TTS setup

This build uses ElevenLabs only from the server-side Vercel function `api/tts.js`.
The API key is never stored in `config.js`, `app.js`, or the OBS overlay.

## 1. Add the API key to Vercel

In Vercel open the project -> Settings -> Environment Variables.
Create:

- Name: `ELEVENLABS_API_KEY`
- Value: your ElevenLabs API key
- Environments: Production and Preview (Development optional)

Save it, then redeploy the project so the serverless function receives the variable.

## 2. Serafina

The build is configured to use:

- UI name: Serafina
- ElevenLabs voice: Serafina - Sensual Temptress
- Voice ID: `4tRn1lSkEn13EVTuqb0g`
- Model: `eleven_v3`

The browser never receives the ElevenLabs API key.

## 3. Test

Open the public page, type a short English / Roman Urdu message, select Serafina, then click `Preview selected voice`.
If that works, click `Try this alert in OBS` and the OBS browser source should request and play the same ElevenLabs voice.

## 4. Safety / credit control

The API route:
- only accepts POST
- limits text length
- only accepts allow-listed voice IDs
- includes a lightweight per-IP request throttle

For production, also set a credit quota on the ElevenLabs API key and later move demo alert throttling to a persistent server-side store.
