-- ============================================================
-- BugStriker — Initial Database Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- Profiles table (extends auth.users)
-- ────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  email       text not null,
  full_name   text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ────────────────────────────────────────────────────────────
-- Problems table
-- ────────────────────────────────────────────────────────────
create table public.problems (
  id                 uuid default uuid_generate_v4() primary key,
  title              text not null,
  slug               text not null unique,
  description        text not null,
  difficulty         text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  constraints        text,
  examples           jsonb default '[]'::jsonb,
  starter_code       text not null,
  function_signature text not null,
  is_active          boolean default true,
  created_at         timestamptz default now() not null
);

alter table public.problems enable row level security;

create policy "Problems are viewable by authenticated users"
  on public.problems for select
  to authenticated
  using (is_active = true);

-- ────────────────────────────────────────────────────────────
-- Test cases table
-- ────────────────────────────────────────────────────────────
create table public.test_cases (
  id              uuid default uuid_generate_v4() primary key,
  problem_id      uuid references public.problems(id) on delete cascade not null,
  input_data      jsonb not null,
  expected_output jsonb not null,
  description     text,
  is_hidden       boolean default false,
  order_index     integer default 0,
  created_at      timestamptz default now() not null
);

alter table public.test_cases enable row level security;

create policy "Non-hidden test cases viewable by authenticated users"
  on public.test_cases for select
  to authenticated
  using (is_hidden = false);

-- ────────────────────────────────────────────────────────────
-- Student runs table (one per evaluation cycle)
-- ────────────────────────────────────────────────────────────
create table public.student_runs (
  id               uuid default uuid_generate_v4() primary key,
  student_id       uuid references auth.users(id) on delete cascade not null,
  problem_id       uuid references public.problems(id) not null,
  state            text not null default 'SUBMITTED' check (state in (
                     'SUBMITTED', 'RUNNING_TESTS', 'ANALYZING', 'QUESTIONING',
                     'WAITING_FOR_STUDENT', 'REVISION', 'FINISHED'
                   )),
  llm_calls_used   integer default 0,
  max_llm_calls    integer default 5,
  violation_reason text,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null,
  finished_at      timestamptz
);

alter table public.student_runs enable row level security;

create policy "Students can view own runs"
  on public.student_runs for select
  using (auth.uid() = student_id);

create policy "Students can insert own runs"
  on public.student_runs for insert
  with check (auth.uid() = student_id);

-- ────────────────────────────────────────────────────────────
-- Code submissions table
-- ────────────────────────────────────────────────────────────
create table public.code_submissions (
  id               uuid default uuid_generate_v4() primary key,
  run_id           uuid references public.student_runs(id) on delete cascade not null,
  submission_type  text not null check (submission_type in ('ORIGINAL', 'REVISION')),
  code             text not null,
  -- per-test results: [{test_id, passed, stdout, stderr, error}]
  execution_evidence jsonb,
  all_passed       boolean,
  pass_count       integer default 0,
  fail_count       integer default 0,
  execution_time_ms integer,
  created_at       timestamptz default now() not null
);

alter table public.code_submissions enable row level security;

create policy "Students can view own submissions"
  on public.code_submissions for select
  using (
    run_id in (
      select id from public.student_runs where student_id = auth.uid()
    )
  );

create policy "Students can insert own submissions"
  on public.code_submissions for insert
  with check (
    run_id in (
      select id from public.student_runs where student_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────
-- Diagnostic questions table
-- ────────────────────────────────────────────────────────────
create table public.diagnostic_questions (
  id                  uuid default uuid_generate_v4() primary key,
  run_id              uuid references public.student_runs(id) on delete cascade not null unique,
  question_text       text not null,
  failure_summary     text,
  most_useful_failure jsonb,
  created_at          timestamptz default now() not null
);

alter table public.diagnostic_questions enable row level security;

create policy "Students can view own questions"
  on public.diagnostic_questions for select
  using (
    run_id in (
      select id from public.student_runs where student_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────
-- Student answers table
-- ────────────────────────────────────────────────────────────
create table public.student_answers (
  id           uuid default uuid_generate_v4() primary key,
  run_id       uuid references public.student_runs(id) on delete cascade not null unique,
  answer_text  text not null,
  submitted_at timestamptz default now() not null
);

alter table public.student_answers enable row level security;

create policy "Students can view own answers"
  on public.student_answers for select
  using (
    run_id in (
      select id from public.student_runs where student_id = auth.uid()
    )
  );

create policy "Students can insert own answers"
  on public.student_answers for insert
  with check (
    run_id in (
      select id from public.student_runs where student_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────
-- Verdicts table
-- ────────────────────────────────────────────────────────────
create table public.verdicts (
  id               uuid default uuid_generate_v4() primary key,
  run_id           uuid references public.student_runs(id) on delete cascade not null unique,
  verdict          text not null check (verdict in ('VERIFIED', 'NOT_VERIFIED', 'PARTIAL', 'AUTO_PASS')),
  rationale        text not null,
  evidence_summary jsonb,
  created_at       timestamptz default now() not null
);

alter table public.verdicts enable row level security;

create policy "Students can view own verdicts"
  on public.verdicts for select
  using (
    run_id in (
      select id from public.student_runs where student_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────
-- Trigger: auto-update updated_at timestamp
-- ────────────────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_updated_at_student_runs
  before update on public.student_runs
  for each row execute function public.handle_updated_at();

create trigger handle_updated_at_profiles
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ────────────────────────────────────────────────────────────
-- Trigger: auto-create profile row on new user signup
-- ────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- Enable Realtime for live run-state updates
-- ────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.student_runs;
