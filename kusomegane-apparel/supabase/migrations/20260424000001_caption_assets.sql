-- Phase A.1: 文言アセット（商品概要キャプション編集の定型文ライブラリ）
-- ※※※※期間限定×数量限定です※※※※※ のような商品横断の定型句を Supabase で共有。

create table public.caption_assets (
  id text primary key,                       -- client 発行 'asset_<ts>_<rand>'
  label text not null,
  body text not null,
  category text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index caption_assets_category_idx
  on public.caption_assets(category);
create index caption_assets_updated_idx
  on public.caption_assets(updated_at desc);

create trigger set_caption_assets_updated_at
  before update on public.caption_assets
  for each row execute function public.set_updated_at();

alter table public.caption_assets disable row level security;
