-- Phase 1.4a: base モデル画像基盤
-- KUSOMEGANE 着画生成用の「プレーン服の base モデル画像」を管理するテーブル。
-- 対応 Storage バケット: `base-models`（SERVICE_ROLE で読み書き）

-- ========================================
-- 1. base_models テーブル
-- ========================================

create table public.base_models (
  id uuid primary key default gen_random_uuid(),

  -- メタ属性（フィルタ・検索用）
  gender text not null check (gender in ('male', 'female')),
  pose text not null check (pose in ('front', 'back')),
  garment_type text not null check (garment_type in ('crewneck', 'hoodie', 'tshirt', 'longsleeve')),
  garment_color text not null default '',
  background_color text not null default '',

  -- バリエーション識別（#01〜#10 等。任意）
  variant_label text not null default '',

  -- Storage 情報
  storage_path text not null,
  bucket text not null default 'base-models',
  mime_type text not null default 'image/png',
  size_bytes bigint,
  width int,
  height int,

  -- 採用・お気に入り・メモ
  is_favorite boolean not null default false,
  notes text not null default '',

  -- 生成時メタ（プロンプト/モデル）将来の再生成・系譜追跡用
  source_prompt text not null default '',
  source_model text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index base_models_gender_idx on public.base_models(gender);
create index base_models_pose_idx on public.base_models(pose);
create index base_models_garment_type_idx on public.base_models(garment_type);
create index base_models_is_favorite_idx on public.base_models(is_favorite);
create index base_models_created_at_idx on public.base_models(created_at desc);

create trigger set_base_models_updated_at
  before update on public.base_models
  for each row execute function public.set_updated_at();

-- ========================================
-- 2. RLS（Phase 1 では disabled、SERVICE_ROLE 経由のみ）
-- ========================================

alter table public.base_models disable row level security;

-- ========================================
-- 3. Storage バケット作成
-- ========================================
-- base-models は非公開バケット。Signed URL で配信する。

insert into storage.buckets (id, name, public)
values ('base-models', 'base-models', false)
on conflict (id) do nothing;
