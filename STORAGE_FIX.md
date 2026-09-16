# Permanent asset fix

The old editor used `URL.createObjectURL(file)`, which creates a temporary `blob:` URL visible only to the browser tab that selected the file. OBS cannot resolve that URL.

This build uploads signed-in files to the public `stream-assets` Supabase Storage bucket and stores the resulting permanent HTTPS URL in the scene.

## One-time Supabase setup

1. Open your personal stream Supabase project.
2. Go to SQL Editor.
3. Run `storage-setup.sql` from this package.
4. Open Authentication -> Users and either create your admin account there, or use **Create admin** in Overlay Studio.
5. For production, disable public user sign-ups after your admin account exists.

## Then

1. Deploy this package to Vercel.
2. Open `overlay-editor.html`.
3. Sign in in **My assets -> Storage**.
4. Upload an image/video/audio file.
5. Drag an image/video asset onto the canvas or click an audio asset to use it as the scene sound.
6. Save the layout.
7. Test current scene in OBS.

The media URL should now begin with `https://...supabase.co/storage/v1/object/public/stream-assets/...`, not `blob:`.
