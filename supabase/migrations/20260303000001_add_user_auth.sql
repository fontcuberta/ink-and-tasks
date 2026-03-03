-- Add user_id column to todos
alter table todos add column user_id uuid references auth.users;

-- Enable Row Level Security
alter table todos enable row level security;

-- Policies: users can only see and modify their own todos
create policy "Users can select own todos"
  on todos for select
  using (auth.uid() = user_id);

create policy "Users can insert own todos"
  on todos for insert
  with check (auth.uid() = user_id);

create policy "Users can update own todos"
  on todos for update
  using (auth.uid() = user_id);

create policy "Users can delete own todos"
  on todos for delete
  using (auth.uid() = user_id);
