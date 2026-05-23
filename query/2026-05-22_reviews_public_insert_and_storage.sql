alter table reviews add column if not exists photo_paths text[] default '{}';

drop policy if exists "Users can insert own reviews" on reviews;
create policy "Anyone can insert reviews" on reviews for insert with check (true);

insert into storage.buckets (id, name, public)
values ('review-photos', 'review-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view review photos" on storage.objects;
create policy "Public can view review photos"
on storage.objects for select
using (bucket_id = 'review-photos');

drop policy if exists "Anyone can upload review photos" on storage.objects;
create policy "Anyone can upload review photos"
on storage.objects for insert
with check (bucket_id = 'review-photos');
