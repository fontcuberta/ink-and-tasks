-- Projects table (Kanban cards)
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  client_name text not null,
  client_email text,
  client_phone text,
  description text,
  placement text,
  size text,
  style text check (style in ('traditional', 'fineline', 'realism', 'watercolor', 'japanese', 'blackwork', 'dotwork', 'geometric', 'other')),
  budget numeric,
  status text not null default 'inbox' check (status in ('inbox', 'deposit', 'drawing', 'ready', 'done')),
  position integer not null default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.projects enable row level security;

create policy "Users can view their own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert their own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete their own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Project images table
create table if not exists public.project_images (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  storage_path text not null,
  is_primary boolean default false,
  created_at timestamptz default now()
);

alter table public.project_images enable row level security;

create policy "Users can view images for their projects"
  on public.project_images for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_images.project_id
        and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert images for their projects"
  on public.project_images for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_images.project_id
        and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete images for their projects"
  on public.project_images for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_images.project_id
        and projects.user_id = auth.uid()
    )
  );
