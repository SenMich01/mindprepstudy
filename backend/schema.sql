-- PrepMind Supabase schema
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query -> paste -> Run)

create extension if not exists "uuid-ossp";

create table if not exists courses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references courses(id) on delete cascade,
  source_type text not null check (source_type in ('text', 'pdf', 'docx', 'pptx')),
  extracted_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists revision_packs (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references courses(id) on delete cascade,
  content_json jsonb not null,
  is_focused boolean not null default false,
  focus_topics text[] default '{}',
  created_at timestamptz not null default now()
);

create table if not exists quiz_questions (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references courses(id) on delete cascade,
  revision_pack_id uuid references revision_packs(id) on delete set null,
  question text not null,
  type text not null check (type in ('mcq', 'short')),
  options text[],
  correct_answer text not null,
  topic text,
  created_at timestamptz not null default now()
);

create table if not exists quiz_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  score int not null,
  weak_topics text[] default '{}',
  created_at timestamptz not null default now()
);

-- Row Level Security: users can only access their own courses and everything
-- underneath them. The backend uses the service role key, which bypasses RLS
-- entirely -- these policies matter if the frontend ever queries Supabase directly.

alter table courses enable row level security;
alter table documents enable row level security;
alter table revision_packs enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_attempts enable row level security;

create policy "Users manage their own courses"
  on courses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users access documents via their own courses"
  on documents for all
  using (course_id in (select id from courses where user_id = auth.uid()));

create policy "Users access revision packs via their own courses"
  on revision_packs for all
  using (course_id in (select id from courses where user_id = auth.uid()));

create policy "Users access quiz questions via their own courses"
  on quiz_questions for all
  using (course_id in (select id from courses where user_id = auth.uid()));

create policy "Users manage their own quiz attempts"
  on quiz_attempts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
