create table todos (
  id         uuid        primary key default gen_random_uuid(),
  text       text        not null,
  completed  boolean     not null default false,
  due_date   date,
  priority   text        check (priority in ('high', 'medium', 'low')),
  notes      text,
  created_at timestamptz not null default now()
);
