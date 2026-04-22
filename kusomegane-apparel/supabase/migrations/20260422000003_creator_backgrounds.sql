-- Phase BG: 背景生成アシスタント
-- 外部画像 + "KUSOMEGANE 作者風に" プロンプトで GPT-image-2 生成 → 履歴保持
-- 2048px スクエアを想定（gpt-image-2 は最大 3840px エッジまで対応）

create table public.creator_backgrounds (
  id uuid primary key default gen_random_uuid(),

  -- 生成結果
  storage_path text not null,
  bucket text not null default 'creator-backgrounds',
  mime_type text not null default 'image/png',
  size_bytes bigint,
  width int,
  height int,

  -- 生成コンテキスト
  source_storage_path text,  -- 入力画像（同バケット別フォルダ）、保持しない場合は null
  source_mime_type text,
  prompt text not null default '',
  model text not null default 'gpt-image-2',
  quality text not null default 'high',

  -- ラベル・お気に入り
  title text not null default '',
  is_favorite boolean not null default false,
  notes text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index creator_backgrounds_created_at_idx
  on public.creator_backgrounds(created_at desc);
create index creator_backgrounds_favorite_idx
  on public.creator_backgrounds(is_favorite)
  where is_favorite = true;

create trigger set_creator_backgrounds_updated_at
  before update on public.creator_backgrounds
  for each row execute function public.set_updated_at();

alter table public.creator_backgrounds disable row level security;

-- Storage バケット（非公開、Signed URL 配信）
insert into storage.buckets (id, name, public)
values ('creator-backgrounds', 'creator-backgrounds', false)
on conflict (id) do nothing;
