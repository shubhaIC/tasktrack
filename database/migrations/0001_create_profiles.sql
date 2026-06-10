-- Migration: create profiles table referenced to auth.users
-- Run this SQL in your Supabase SQL editor or via psql against the database

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  created_at timestamptz default now()
);
