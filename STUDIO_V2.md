# Stream Hub Studio V2

This build upgrades the Overlay Studio without changing the viewer-facing concept.

## New in V2

- 1920×1080 visual stage with Fit / 25 / 50 / 75 / 100% zoom
- 8 resize handles plus free rotation
- centre/edge snapping guides while dragging
- keyboard nudging: arrows = 1px, Shift+arrows = 10px
- Undo / Redo history
- Lock / hide controls in the Inspector and Layers panel
- persistent URL Asset Library plus session file uploads
- drag image/video assets directly onto the stream stage
- click audio assets to assign them as the current scene sound
- scene-level duration and sound URL
- enter/exit animations per element
- editable test donor name, amount, event title, message and TTS toggle
- Test in Editor and Test Current Scene in OBS
- exact layout packet is still sent to the live overlay
- overlay runtime now understands rotation, scene sound and per-element animations

## Asset behaviour in this build

Files uploaded from your computer are preview/session assets. Browser-created blob URLs do not survive a full refresh and cannot be used by OBS on another machine.

Assets added by public URL are saved in localStorage and can be used by the live overlay.

The next production step is Supabase Storage, which will make uploaded videos/images/audio permanent and provide URLs that both the editor and OBS can use.

## Deploy

Upload the contents of this folder to the same Vercel project, replacing the previous static build.

Primary pages:

- `/` viewer page
- `/overlay-editor.html` Overlay Studio
- `/overlay.html?obs=1` OBS overlay
- `/dashboard.html` dashboard

Use 1920×1080 for the OBS Browser Source.
