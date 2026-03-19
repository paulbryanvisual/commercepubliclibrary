-- Commerce Public Library - Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Events table
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique,
  description text,
  date date not null,
  start_time text,
  end_time text,
  location text default 'Main Library',
  audience text default 'all',
  recurring text,
  registration_required boolean default false,
  image text,
  image_alt text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Announcements table
create table if not exists announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  body text,
  type text default 'info',
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Staff picks table
create table if not exists staff_picks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  author text,
  isbn text,
  staff_name text,
  blurb text,
  genre text,
  cover_url text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Closures table
create table if not exists closures (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  reason text,
  created_at timestamptz default now()
);

-- Hours overrides table
create table if not exists hours_overrides (
  id uuid default gen_random_uuid() primary key,
  day_of_week text unique not null,
  open_time text,
  close_time text,
  closed boolean default false,
  updated_at timestamptz default now()
);

-- Page content table (key-value for CMS-editable sections)
create table if not exists page_content (
  id uuid default gen_random_uuid() primary key,
  page text not null,
  section text not null,
  content jsonb default '{}',
  updated_at timestamptz default now(),
  unique(page, section)
);

-- Form submissions table (passport, room, library card)
create table if not exists form_submissions (
  id uuid default gen_random_uuid() primary key,
  form_type text not null,
  data jsonb not null,
  status text default 'new',
  created_at timestamptz default now()
);

-- Disable RLS for demo (enable + add policies before production)
alter table events enable row level security;
alter table announcements enable row level security;
alter table staff_picks enable row level security;
alter table closures enable row level security;
alter table hours_overrides enable row level security;
alter table page_content enable row level security;
alter table form_submissions enable row level security;

-- Permissive policies for demo
create policy "Allow all on events" on events for all using (true) with check (true);
create policy "Allow all on announcements" on announcements for all using (true) with check (true);
create policy "Allow all on staff_picks" on staff_picks for all using (true) with check (true);
create policy "Allow all on closures" on closures for all using (true) with check (true);
create policy "Allow all on hours_overrides" on hours_overrides for all using (true) with check (true);
create policy "Allow all on page_content" on page_content for all using (true) with check (true);
create policy "Allow all on form_submissions" on form_submissions for all using (true) with check (true);

-- Seed data: events
insert into events (title, slug, description, date, start_time, end_time, location, audience, recurring, image) values
  ('Preschool Story Time', 'preschool-story-time', 'Join us for stories, songs, and a simple craft! Ages 2-5 with a caregiver.', '2026-04-01', '10:00 AM', '10:45 AM', 'Children''s Room', 'kids', 'Weekly on Tuesdays', 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=400&fit=crop'),
  ('GED Tutoring', 'ged-tutoring', 'Free one-on-one GED prep tutoring. Walk-ins welcome, appointments preferred.', '2026-04-02', '2:00 PM', '5:00 PM', 'Study Room B', 'adults', 'Weekly on Wednesdays', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=400&fit=crop'),
  ('LEGO Club', 'lego-club', 'Build, create, and imagine! All LEGO provided. Ages 6-12.', '2026-04-04', '3:30 PM', '4:30 PM', 'Community Room', 'kids', 'First Friday monthly', 'https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=400&h=400&fit=crop'),
  ('Adult Book Club', 'adult-book-club', 'This month we''re reading "The Women" by Kristin Hannah. New members welcome!', '2026-04-08', '6:30 PM', '7:30 PM', 'Conference Room', 'adults', 'Second Tuesday monthly', 'https://images.unsplash.com/photo-1529148482759-b35b25c5f217?w=400&h=400&fit=crop'),
  ('Teen Art Studio', 'teen-art-studio', 'Express yourself through art! This month: watercolor basics. All supplies provided.', '2026-04-10', '4:00 PM', '5:30 PM', 'Maker Space', 'teens', 'Second Thursday monthly', 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=400&fit=crop'),
  ('Senior Tech Help', 'senior-tech-help', 'Need help with your phone, tablet, or computer? Our teen volunteers are here to assist.', '2026-04-03', '10:00 AM', '12:00 PM', 'Computer Lab', 'seniors', 'Weekly on Thursdays', 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&h=400&fit=crop'),
  ('Baby Bounce & Rhyme', 'baby-bounce-rhyme', 'Gentle songs, bouncing rhymes, and board books for babies 0-18 months with a caregiver.', '2026-04-07', '9:30 AM', '10:00 AM', 'Children''s Room', 'kids', 'Weekly on Mondays', 'https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=400&h=400&fit=crop');

-- Seed data: announcements
insert into announcements (title, body, type) values
  ('Summer Reading Program', 'Registration opens May 15! Read, earn prizes, and have fun all summer long.', 'info'),
  ('New Self-Checkout Kiosks', 'Try our new self-checkout stations near the front entrance. Staff are happy to help!', 'info');

-- Seed data: staff picks
insert into staff_picks (title, author, isbn, staff_name, blurb, genre) values
  ('The Women', 'Kristin Hannah', '9781250178305', 'Sarah M.', 'A powerful story about the women who served in Vietnam. Couldn''t put it down!', 'Fiction'),
  ('Atomic Habits', 'James Clear', '9780735211292', 'David K.', 'Changed how I think about building good habits. Perfect for the new year.', 'Non-Fiction');
