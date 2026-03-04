-- Storage buckets for reference images and signatures
insert into storage.buckets (id, name, public)
values ('reference-images', 'reference-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', false)
on conflict (id) do nothing;

-- RLS for reference-images bucket
create policy "Users can upload reference images"
  on storage.objects for insert
  with check (
    bucket_id = 'reference-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view reference images"
  on storage.objects for select
  using (bucket_id = 'reference-images');

create policy "Users can delete their reference images"
  on storage.objects for delete
  using (
    bucket_id = 'reference-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS for signatures bucket
create policy "Users can upload signatures"
  on storage.objects for insert
  with check (
    bucket_id = 'signatures'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view their signatures"
  on storage.objects for select
  using (
    bucket_id = 'signatures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their signatures"
  on storage.objects for delete
  using (
    bucket_id = 'signatures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
