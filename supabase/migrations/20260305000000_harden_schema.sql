-- 1. Fix todos.user_id: make NOT NULL + ON DELETE CASCADE
-- Backfill any orphan rows first, then add constraint
delete from public.todos where user_id is null;

alter table public.todos
  alter column user_id set not null;

alter table public.todos
  drop constraint if exists todos_user_id_fkey;

alter table public.todos
  add constraint todos_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- 2. Add missing UPDATE policy for project_images
create policy "Users can update images for their projects"
  on public.project_images for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_images.project_id
        and projects.user_id = auth.uid()
    )
  );

-- 3. Add missing UPDATE policy for consent_forms
create policy "Users can update their own consent forms"
  on public.consent_forms for update
  using (auth.uid() = user_id);

-- 4. Make reference-images bucket private instead of public
update storage.buckets
  set public = false
  where id = 'reference-images';

-- 5. Set file size limits (10 MB) and allowed MIME types on buckets
update storage.buckets
  set file_size_limit = 10485760,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  where id = 'reference-images';

update storage.buckets
  set file_size_limit = 2097152,
      allowed_mime_types = array['image/png']
  where id = 'signatures';

-- 6. Add performance indexes
create index if not exists idx_projects_user_status on public.projects (user_id, status);
create index if not exists idx_calendar_events_user on public.calendar_events (user_id, start_time);
create index if not exists idx_consent_forms_user on public.consent_forms (user_id);
create index if not exists idx_project_images_project on public.project_images (project_id);
create index if not exists idx_todos_user on public.todos (user_id);
