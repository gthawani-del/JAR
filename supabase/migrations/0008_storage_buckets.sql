insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('public-media','public-media',true,10485760,array['image/jpeg','image/png','image/webp','image/svg+xml']) on conflict (id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit) values('admin-private','admin-private',false,26214400) on conflict (id) do nothing;
create policy "public media storage read" on storage.objects for select using (bucket_id='public-media');
create policy "admin public media upload" on storage.objects for insert with check (bucket_id='public-media' and is_editor_or_above());
create policy "admin public media update" on storage.objects for update using (bucket_id='public-media' and is_editor_or_above());
create policy "super admin public media delete" on storage.objects for delete using (bucket_id='public-media' and is_super_admin());
create policy "admin private storage read" on storage.objects for select using (bucket_id='admin-private' and is_viewer_or_above());
create policy "admin private storage upload" on storage.objects for insert with check (bucket_id='admin-private' and is_editor_or_above());
