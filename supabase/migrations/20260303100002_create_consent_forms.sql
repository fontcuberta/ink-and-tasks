-- Consent forms table
create table if not exists public.consent_forms (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  project_id uuid references public.projects(id) on delete set null,
  client_name text not null,
  client_dob date,
  allergies text,
  medical_conditions text,
  skin_conditions text,
  acknowledgements jsonb default '[]'::jsonb,
  signature_path text,
  signed_at timestamptz default now()
);

alter table public.consent_forms enable row level security;

create policy "Users can view their own consent forms"
  on public.consent_forms for select
  using (auth.uid() = user_id);

create policy "Users can insert their own consent forms"
  on public.consent_forms for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own consent forms"
  on public.consent_forms for delete
  using (auth.uid() = user_id);
