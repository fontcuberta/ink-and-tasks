-- Calendar events table
create table if not exists public.calendar_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  event_type text not null default 'personal' check (event_type in ('tattoo_session', 'drawing_block', 'personal')),
  start_time timestamptz not null,
  end_time timestamptz not null,
  color text,
  notes text,
  created_at timestamptz default now()
);

alter table public.calendar_events enable row level security;

create policy "Users can view their own events"
  on public.calendar_events for select
  using (auth.uid() = user_id);

create policy "Users can insert their own events"
  on public.calendar_events for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own events"
  on public.calendar_events for update
  using (auth.uid() = user_id);

create policy "Users can delete their own events"
  on public.calendar_events for delete
  using (auth.uid() = user_id);
