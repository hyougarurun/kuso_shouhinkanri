-- Phase ANM: Animator ライブラリを IndexedDB → Supabase に移行
-- 既存の animator-assets バケット（アップロード画像バックアップ用）とは別に、
-- 「ライブラリ」用の新バケット animator-library を作成。

-- ─── projects: アニメーションプロジェクト ───
create table public.animator_projects (
  id text primary key,        -- client 発行 'proj_<ts>' を尊重
  name text not null,
  folder text not null default '',

  frame_count int not null default 0,
  fps int,
  platform text,
  motion_id text,

  -- フレーム配列 + srcURL 等の重いデータは Storage JSON ファイル参照
  data_path text not null,           -- animator-library/projects/<id>.json
  thumbnail_path text,               -- animator-library/thumbs/<id>.png
  size_bytes bigint,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index animator_projects_folder_idx
  on public.animator_projects(folder);
create index animator_projects_updated_idx
  on public.animator_projects(updated_at desc);

create trigger set_animator_projects_updated_at
  before update on public.animator_projects
  for each row execute function public.set_updated_at();

-- ─── assets: 書き出し済み APNG/GIF ───
create table public.animator_assets (
  id text primary key,
  name text not null,
  folder text not null default '',
  format text,
  size_kb int,
  data_path text not null,           -- animator-library/assets/<id>.<ext>
  thumbnail_path text,
  created_at timestamptz not null default now()
);
create index animator_assets_folder_idx
  on public.animator_assets(folder);
create index animator_assets_created_idx
  on public.animator_assets(created_at desc);

-- ─── folders: フォルダ（軽量、Storage 不使用）───
create table public.animator_folders (
  id text primary key,               -- name と同一（既存構造を踏襲）
  name text not null,
  tab text not null,                 -- 'projects' | 'assets'
  parent text not null default '',
  created_at timestamptz not null default now()
);
create index animator_folders_tab_parent_idx
  on public.animator_folders(tab, parent);

alter table public.animator_projects disable row level security;
alter table public.animator_assets disable row level security;
alter table public.animator_folders disable row level security;

-- Storage バケット
insert into storage.buckets (id, name, public)
values ('animator-library', 'animator-library', false)
on conflict (id) do nothing;
