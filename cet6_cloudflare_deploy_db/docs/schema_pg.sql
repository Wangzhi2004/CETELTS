-- CET6 Database Schema (PostgreSQL / Neon compatible)
-- Converted from SQLite syntax

CREATE TABLE IF NOT EXISTS answer_question_details(
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  paper_id TEXT,
  answer_id TEXT,
  question_no INTEGER,
  answer_key TEXT,
  source_type TEXT,
  explanation_text TEXT,
  raw_block TEXT,
  provenance TEXT,
  confidence DOUBLE PRECISION,
  review_status TEXT
);

CREATE TABLE IF NOT EXISTS answer_resources(
  answer_id TEXT PRIMARY KEY,
  year INTEGER,
  month INTEGER,
  set_part TEXT,
  answer_pdf TEXT,
  answer_docx TEXT,
  source_format TEXT,
  text_coverage TEXT,
  parsed_question_count INTEGER,
  answer_key_count INTEGER,
  linked_papers TEXT
);

CREATE TABLE IF NOT EXISTS paper_answer_links(
  paper_id TEXT,
  answer_id TEXT,
  link_type TEXT
);

CREATE TABLE IF NOT EXISTS papers(
  paper_id TEXT PRIMARY KEY,
  year INTEGER,
  month INTEGER,
  set_no INTEGER,
  original_pdf TEXT,
  answer_pdf TEXT,
  answer_docx TEXT,
  answer_pair_status TEXT,
  original_page_count INTEGER,
  answer_text_coverage TEXT,
  notes TEXT,
  writing_prompt TEXT,
  translation_prompt TEXT
);

CREATE TABLE IF NOT EXISTS question_shells(
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  paper_id TEXT,
  question_no INTEGER,
  section_code TEXT,
  question_type TEXT,
  stem TEXT,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  answer_key TEXT,
  answer_status TEXT,
  source_updated_from TEXT
);

CREATE TABLE IF NOT EXISTS section_texts(
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  paper_id TEXT,
  section_code TEXT,
  source_type TEXT,
  text TEXT
);

CREATE TABLE IF NOT EXISTS word_bank_items(
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  paper_id TEXT,
  section_code TEXT,
  letter TEXT,
  word TEXT
);
