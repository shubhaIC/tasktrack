-- TaskTrack schema for Supabase / PostgreSQL

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  description text,
  color text,
  created_at timestamp with time zone default timezone('utc', now())
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  course_id uuid references courses(id) on delete set null,
  title text not null,
  description text,
  due_date timestamp with time zone,
  status text default 'Open',
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  course_id uuid references courses(id) on delete set null,
  title text not null,
  description text,
  meeting_date timestamp with time zone,
  location text,
  created_at timestamp with time zone default timezone('utc', now())
);
