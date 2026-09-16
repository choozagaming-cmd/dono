# Supabase-connected OBS test build

This build is preconfigured for the personal Supabase project used for OBS preview testing.

## Deploy
Deploy the contents of this folder to Vercel.

## OBS
Add a Browser Source pointing to:

`https://YOUR-VERCEL-DOMAIN/overlay.html?obs=1`

Set the browser source to 1920x1080.

## Test
1. Keep the OBS browser source visible.
2. Open `/overlay-editor.html`.
3. Wait until the connection indicator says the cloud/OBS preview is connected.
4. Click **Test current scene in OBS**.

The Supabase publishable key in this build is intended for client-side use. Do not put a service-role key in browser files.

For production donations, replace this public preview path with a private/authenticated channel and server-verified payment triggers.
