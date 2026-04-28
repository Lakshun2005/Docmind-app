-- App-wide state (single row, upserted on change)
create table if not exists app_state (
  id                integer primary key default 1,
  active_mode       text default null,
  onboarding_done   boolean default false,
  theme             text default 'light',
  sidebar_collapsed boolean default false,
  constraint app_state_single_row check (id = 1)
);

insert into app_state (id) values (1) on conflict (id) do nothing;

-- Documents
create table if not exists documents (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  mode              text not null,
  file_type         text not null,
  storage_path      text,
  full_text         text,
  page_count        integer default 0,
  file_size         integer,
  is_large          boolean default false,
  summary_json      jsonb,
  suggested_actions jsonb,
  starred           boolean default false,
  created_at        timestamptz default now()
);

-- Workspaces
create table if not exists workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  mode        text not null,
  created_at  timestamptz default now()
);

-- Document <-> Workspace (many-to-many)
create table if not exists workspace_documents (
  workspace_id  uuid references workspaces(id) on delete cascade,
  document_id   uuid references documents(id) on delete cascade,
  added_at      timestamptz default now(),
  primary key (workspace_id, document_id)
);

-- Chat messages (persisted per document)
create table if not exists chat_messages (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid references documents(id) on delete cascade,
  role          text not null check (role in ('user', 'assistant')),
  content       text not null,
  created_at    timestamptz default now()
);

-- Generated outputs
create table if not exists generated_outputs (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid references documents(id) on delete cascade,
  type          text not null,
  content       text not null,
  length        text,
  tone          text,
  created_at    timestamptz default now()
);
