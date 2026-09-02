-- Storage bucket for re-hosted course photos (public read, parallel to
-- recipe-images and url-images).
--
-- Google's Place Photo URLs embed the GOOGLE_MAPS_API_SERVER_KEY as a query
-- param. Persisting one and rendering it as an <img src> would publish that
-- server key to every visitor, so course photos are downloaded once at add
-- time and re-hosted here instead. Re-hosting also keeps images stable if the
-- key is rotated, and avoids spending Places photo quota on every render.

insert into storage.buckets (id, name, public)
values ('course-images', 'course-images', true)
on conflict (id) do nothing;

create policy "Public read for course images" on storage.objects
  for select to public using (bucket_id = 'course-images');

create policy "Authenticated upload for course images" on storage.objects
  for insert to authenticated with check (bucket_id = 'course-images');

create policy "Authenticated update for course images" on storage.objects
  for update to authenticated using (bucket_id = 'course-images') with check (bucket_id = 'course-images');

create policy "Authenticated delete for course images" on storage.objects
  for delete to authenticated using (bucket_id = 'course-images');
