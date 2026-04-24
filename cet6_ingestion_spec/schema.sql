-- CET-6 真题与解析数据规范 (PostgreSQL)

create extension if not exists pgcrypto;

create table if not exists source_documents (
  id uuid primary key default gen_random_uuid(),
  doc_type text not null check (doc_type in ('paper_pdf', 'explanation_pdf', 'answer_pdf', 'other')),
  file_name text not null,
  file_path text not null,
  file_sha256 text,
  year integer,
  month integer check (month in (6, 12)),
  set_no integer,
  pages integer,
  language text default 'en',
  uploaded_at timestamptz default now(),
  notes text,
  unique (file_path)
);

create table if not exists exam_papers (
  id uuid primary key default gen_random_uuid(),
  exam_type text not null default 'cet6' check (exam_type = 'cet6'),
  year integer not null,
  month integer not null check (month in (6, 12)),
  set_no integer not null,
  title text,
  paper_code text generated always as (
    exam_type || '-' || year::text || '-' || lpad(month::text, 2, '0') || '-set' || set_no::text
  ) stored,
  paper_pdf_id uuid references source_documents(id),
  explanation_pdf_id uuid references source_documents(id),
  status text not null default 'draft' check (status in ('draft', 'extracted', 'reviewed', 'published')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (exam_type, year, month, set_no)
);

create table if not exists exam_sections (
  id uuid primary key default gen_random_uuid(),
  exam_paper_id uuid not null references exam_papers(id) on delete cascade,
  section_type text not null check (section_type in ('writing', 'listening', 'reading', 'translation')),
  section_order integer not null,
  title text,
  instructions text,
  raw_text text,
  created_at timestamptz default now(),
  unique (exam_paper_id, section_type, section_order)
);

create table if not exists passages (
  id uuid primary key default gen_random_uuid(),
  exam_paper_id uuid not null references exam_papers(id) on delete cascade,
  exam_section_id uuid references exam_sections(id) on delete cascade,
  passage_group text,
  passage_order integer,
  title text,
  prompt text,
  content text,
  audio_ref text,
  source_page_start integer,
  source_page_end integer,
  created_at timestamptz default now()
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  exam_paper_id uuid not null references exam_papers(id) on delete cascade,
  exam_section_id uuid references exam_sections(id) on delete cascade,
  passage_id uuid references passages(id) on delete set null,
  question_no integer not null,
  question_type text not null check (question_type in (
    'writing_prompt',
    'listening_mcq',
    'listening_fill',
    'reading_bank',
    'reading_match',
    'reading_mcq',
    'translation_prompt'
  )),
  stem text,
  prompt text,
  raw_text text,
  difficulty numeric(4,2),
  estimated_seconds integer,
  source_page integer,
  created_at timestamptz default now(),
  unique (exam_paper_id, question_no)
);

create table if not exists choices (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  choice_key text not null,
  choice_text text not null,
  choice_order integer not null,
  unique (question_id, choice_key)
);

create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  answer_type text not null check (answer_type in ('single_choice', 'multi_choice', 'free_text', 'essay', 'translation')),
  answer_value text,
  answer_json jsonb,
  confidence numeric(4,2),
  unique (question_id)
);

create table if not exists explanations (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  explanation_text text,
  evidence_span text,
  source_page integer,
  source_type text default 'official_pdf' check (source_type in ('official_pdf', 'editorial', 'ai_augmented')),
  unique (question_id, source_type)
);

create table if not exists skill_tags (
  id uuid primary key default gen_random_uuid(),
  tag_code text not null unique,
  tag_name text not null,
  tag_group text not null check (tag_group in ('reading', 'listening', 'writing', 'translation', 'meta')),
  description text
);

create table if not exists question_skill_tags (
  question_id uuid not null references questions(id) on delete cascade,
  skill_tag_id uuid not null references skill_tags(id) on delete cascade,
  weight numeric(4,2) default 1.00,
  primary key (question_id, skill_tag_id)
);

create table if not exists parsing_jobs (
  id uuid primary key default gen_random_uuid(),
  exam_paper_id uuid references exam_papers(id) on delete cascade,
  job_type text not null check (job_type in ('extract', 'align', 'review', 'publish')),
  status text not null check (status in ('queued', 'running', 'failed', 'completed')),
  input_payload jsonb,
  output_payload jsonb,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists review_tasks (
  id uuid primary key default gen_random_uuid(),
  exam_paper_id uuid not null references exam_papers(id) on delete cascade,
  task_scope text not null check (task_scope in ('paper_metadata', 'section_split', 'question_alignment', 'answer_alignment', 'explanation_alignment', 'final_review')),
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved')),
  assigned_to text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_exam_papers_year_month on exam_papers(year, month, set_no);
create index if not exists idx_sections_paper on exam_sections(exam_paper_id);
create index if not exists idx_passages_paper on passages(exam_paper_id);
create index if not exists idx_questions_paper on questions(exam_paper_id);
create index if not exists idx_questions_section on questions(exam_section_id);
create index if not exists idx_choices_question on choices(question_id);
create index if not exists idx_answers_question on answers(question_id);
create index if not exists idx_explanations_question on explanations(question_id);

-- ==========================================
-- Score Center & Algorithm System Entities
-- ==========================================

create table if not exists user_states (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  target_exam text not null check (target_exam in ('cet6', 'ielts')),
  target_score integer not null,
  exam_date date not null,
  daily_budget_minutes integer not null,
  mode text not null check (mode in ('recovery', 'strengthen', 'sprint', 'light')),
  estimated_score numeric(6,2),
  fatigue_level numeric(4,2) default 0.00,
  confidence_global numeric(4,2) default 0.00,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, target_exam)
);

create table if not exists skill_states (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  skill_node text not null,
  mastery numeric(4,2) not null default 0.00,
  confidence numeric(4,2) not null default 0.00,
  decay_risk numeric(4,2) not null default 0.00,
  speed_deficit numeric(4,2) not null default 0.00,
  recurrence numeric(4,2) not null default 0.00,
  transfer_gain numeric(4,2) not null default 0.00,
  stress_drop numeric(4,2) not null default 0.00,
  evidence_count integer not null default 0,
  last_seen_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, skill_node)
);

create table if not exists score_center_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  session_id text not null unique,
  session_date date not null,
  budget_minutes integer not null,
  mode text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists task_cards (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references score_center_sessions(session_id) on delete cascade,
  user_id text not null,
  card_id text not null,
  task_type text not null,
  card_type text not null,
  title text not null,
  why_this_now text not null,
  estimated_minutes integer not null,
  difficulty text not null,
  expected_impact text not null,
  target_skills jsonb not null,
  prerequisite jsonb,
  action_label text,
  destination_page text not null,
  success_signal text not null,
  fallback_action text,
  expiry timestamptz,
  confidence numeric(4,2) not null default 0.00,
  utility_score numeric(6,3),
  priority_score numeric(4,2) not null default 0.00,
  weight_breakdown jsonb,
  relation jsonb,
  status text not null,
  sequence integer not null,
  origin_engine text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists learning_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  user_id text not null,
  session_id text references score_center_sessions(session_id) on delete set null,
  card_id text,
  page_type text not null,
  action text not null,
  payload jsonb,
  timestamp timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists diagnostic_records (
  id uuid primary key default gen_random_uuid(),
  diagnostic_id text not null unique,
  event_id text not null references learning_events(event_id) on delete cascade,
  user_id text not null,
  primary_error text not null,
  secondary_errors jsonb,
  severity numeric(4,2) not null,
  confidence numeric(4,2) not null,
  evidence jsonb,
  repair_plan_ids jsonb,
  created_at timestamptz default now()
);

create table if not exists review_queues (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  entity_type text not null,
  entity_id text not null,
  reason text not null,
  skill_nodes jsonb,
  last_success_at timestamptz,
  next_review_at timestamptz not null,
  stability numeric(4,2) default 0.00,
  difficulty numeric(4,2) default 0.00,
  forgetting_risk numeric(4,2) default 0.00,
  priority integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, entity_type, entity_id)
);

create table if not exists bandit_arms (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  arm_id text not null,
  alpha numeric(8,3) not null default 1.000,
  beta numeric(8,3) not null default 1.000,
  pulls integer not null default 0,
  total_reward numeric(10,4) not null default 0.0000,
  last_pulled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, arm_id)
);

create table if not exists conversation_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  exam_type text not null check (exam_type in ('cet6', 'ielts')),
  window_index integer not null,
  compacted_count integer not null,
  summary text not null,
  key_decisions jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, exam_type, window_index)
);

create table if not exists policy_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  session_id text not null,
  policy_version text not null default 'score-center-v1',
  selected_arm text not null,
  utility_score numeric(8,4) not null,
  weights jsonb not null,
  feature_vector jsonb not null,
  propensity_score numeric(6,4) not null,
  reward numeric(8,4),
  reward_signal text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ope_reports (
  id uuid primary key default gen_random_uuid(),
  policy_version text not null,
  evaluation_window text not null,
  sample_size integer not null,
  dr_estimate numeric(10,4) not null,
  ips_estimate numeric(10,4) not null,
  dm_estimate numeric(10,4) not null,
  weight_attribution jsonb not null,
  confidence numeric(8,4) not null,
  created_at timestamptz default now()
);
