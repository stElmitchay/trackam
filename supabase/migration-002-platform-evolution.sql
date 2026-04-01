-- ============================================
-- SINAI TRACKER - Migration 002: Platform Evolution
-- ============================================
-- Adds: open signups, user roles, GitHub OAuth, AI analysis,
--        milestones, monthly demo cycles, project types.
-- Run this in Supabase SQL Editor AFTER migration-001-features.sql

-- ============================================
-- 1. OPEN SIGNUPS — Remove email domain restriction
-- ============================================

drop trigger if exists enforce_email_domain on auth.users;
drop function if exists public.check_email_domain();

-- ============================================
-- 2. PROFILE CHANGES — Roles + GitHub
-- ============================================

alter table profiles
  add column if not exists role text not null default 'community'
    check (role in ('internal', 'community')),
  add column if not exists github_username text,
  add column if not exists github_connected boolean not null default false;

-- Update existing profiles to 'internal' if they have @christex.foundation email
update profiles
set role = 'internal'
where email like '%@christex.foundation';

-- Update the auto-create profile trigger to set role based on email domain
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, department, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    '',
    case
      when new.email like '%@christex.foundation' then 'internal'
      else 'community'
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- ============================================
-- 3. PROJECT CHANGES — Demo cycles + project type
-- ============================================

alter table projects
  add column if not exists demo_cycle integer,
  add column if not exists project_type text not null default 'community'
    check (project_type in ('internal', 'community'));

-- Backfill existing projects: set project_type based on submitter role
update projects p
set project_type = pr.role
from profiles pr
where p.submitted_by = pr.id;

-- Backfill demo_cycle from week (approximate: 4 weeks per cycle)
update projects
set demo_cycle = greatest(1, ceil(week / 4.0))
where demo_cycle is null;

-- ============================================
-- 4. GITHUB CONNECTIONS TABLE
-- ============================================

create table if not exists github_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade unique not null,
  github_user_id bigint not null,
  github_username text not null,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[] default '{}',
  connected_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_github_connections_user_id on github_connections(user_id);

alter table github_connections enable row level security;

-- Users can only read their own connection
create policy "github_connections_select_own" on github_connections
  for select using (auth.uid() = user_id);

-- Users can insert their own connection
create policy "github_connections_insert_own" on github_connections
  for insert with check (auth.uid() = user_id);

-- Users can update their own connection
create policy "github_connections_update_own" on github_connections
  for update using (auth.uid() = user_id);

-- Users can delete their own connection
create policy "github_connections_delete_own" on github_connections
  for delete using (auth.uid() = user_id);

-- ============================================
-- 5. AI ANALYSES TABLE
-- ============================================

create table if not exists ai_analyses (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  demo_cycle integer not null,
  season integer references seasons(id),
  analysis_json jsonb not null default '{}',
  milestones text[] default '{}',
  xp_awarded integer not null default 0,
  commit_count integer not null default 0,
  lines_changed integer not null default 0,
  languages jsonb default '{}',
  analyzed_at timestamptz default now(),
  unique(project_id, demo_cycle, season)
);

create index if not exists idx_ai_analyses_project_id on ai_analyses(project_id);
create index if not exists idx_ai_analyses_demo_cycle on ai_analyses(demo_cycle);

alter table ai_analyses enable row level security;

-- Public read
create policy "ai_analyses_read" on ai_analyses for select using (true);

-- Only service role can insert/update (no user-level insert policy)
-- Server-side code uses supabase-admin (service role) to write

-- ============================================
-- 6. MILESTONES TABLE
-- ============================================

create table if not exists milestones (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  demo_cycle integer not null,
  season integer references seasons(id),
  title text not null,
  description text not null default '',
  category text not null check (category in ('feature', 'bugfix', 'docs', 'refactor', 'test', 'infra', 'other')),
  source text not null default 'ai' check (source in ('ai', 'manual')),
  xp_value integer not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_milestones_project_id on milestones(project_id);
create index if not exists idx_milestones_demo_cycle on milestones(demo_cycle);

alter table milestones enable row level security;

-- Public read
create policy "milestones_read" on milestones for select using (true);

-- Only service role can insert/update (server-side writes via supabase-admin)

-- ============================================
-- 7. NEW / UPDATED RPC FUNCTIONS
-- ============================================

-- Monthly streak: count consecutive demo cycles with submissions
create or replace function calculate_monthly_streak(p_user_id uuid)
returns integer as $$
declare
  season_start date;
  current_cycle integer;
  check_cycle integer;
  has_submission boolean;
  streak integer := 0;
begin
  select s.start_date into season_start
  from seasons s where s.is_active = true limit 1;

  if season_start is null then
    update profiles set streak = 0 where id = p_user_id;
    return 0;
  end if;

  -- Current demo cycle = months since season start + 1
  current_cycle := greatest(1,
    (extract(year from now())::int - extract(year from season_start)::int) * 12
    + (extract(month from now())::int - extract(month from season_start)::int)
    + 1
  );
  check_cycle := current_cycle;

  loop
    select exists(
      select 1 from projects
      where submitted_by = p_user_id
        and demo_cycle = check_cycle
        and status in ('submitted', 'featured')
    ) into has_submission;

    if has_submission then
      streak := streak + 1;
      check_cycle := check_cycle - 1;
      if check_cycle < 1 then exit; end if;
    else
      exit;
    end if;
  end loop;

  update profiles set streak = calculate_monthly_streak.streak where id = p_user_id;
  return streak;
end;
$$ language plpgsql security definer;

-- Award XP from AI analysis (wraps add_xp with tracking)
create or replace function award_analysis_xp(
  p_user_id uuid,
  p_project_id uuid,
  p_amount integer,
  p_demo_cycle integer,
  p_season integer
)
returns void as $$
begin
  -- Award the XP
  perform add_xp(p_user_id, p_amount);

  -- Update the analysis record
  update ai_analyses
  set xp_awarded = p_amount
  where project_id = p_project_id
    and demo_cycle = p_demo_cycle
    and season = p_season;
end;
$$ language plpgsql security definer;

-- ============================================
-- DONE! Platform evolution migration complete.
-- ============================================
