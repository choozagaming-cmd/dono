-- One-time setup for permanent OBS assets.
-- Run this in Supabase Dashboard -> SQL Editor for the personal stream project.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'stream-assets',
  'stream-assets',
  true,
  52428800,
  array[
    'image/png','image/jpeg','image/webp','image/gif',
    'video/webm','video/mp4',
    'audio/mpeg','audio/wav','audio/ogg'
  ]::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Only signed-in users can create/change/delete files.
create policy "stream_assets_authenticated_insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'stream-assets');

create policy "stream_assets_authenticated_update"
on storage.objects for update to authenticated
using (bucket_id = 'stream-assets')
with check (bucket_id = 'stream-assets');

create policy "stream_assets_authenticated_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'stream-assets');
