-- Phase 1.1: 商品管理基盤
-- Products + Steps + Images + DriveFiles の 4 テーブル
-- RLS は Phase 1 では disabled（SERVICE_ROLE_KEY で server-side からのみアクセス）

-- ========================================
-- 1. 更新日時自動更新トリガー関数
-- ========================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ========================================
-- 2. products テーブル
-- ========================================

create table public.products (
  id uuid primary key default gen_random_uuid(),
  product_number text unique not null,
  base_product_number int not null,
  color_variant_index int,

  name text not null,
  series text not null default '',
  product_type text not null default '',
  colors jsonb not null default '[]'::jsonb,
  sizes jsonb not null default '[]'::jsonb,

  processing_type text not null default '',
  processing_instruction text not null default '',
  body_model_number text not null default '',
  material text not null default '',

  is_made_to_order boolean not null default true,
  free_shipping boolean not null default true,
  notes text not null default '',

  order_quantities jsonb not null default '{}'::jsonb,

  -- Drive / Sheet 連携
  drive_folder_url text not null default '',
  sheet_row_number int,
  sheet_registered_at timestamptz,

  caption_text text not null default '',

  -- 進捗
  current_step int not null default 1,
  sample_arrival_date date,

  -- 加工費推定（PoC）
  estimation jsonb,

  -- Asset 状態（composite/processing/aiWearing/sizeDetail/caption）
  assets jsonb not null default '{"compositeImage":"pending","processingImage":"pending","aiWearingImage":"pending","sizeDetailDone":false,"captionDone":false}'::jsonb,

  -- 画像プレビュー（小サムネ、DB 直置き。将来 storage 参照に移行予定）
  image_preview text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_base_number_idx on public.products(base_product_number);
create index products_updated_at_idx on public.products(updated_at desc);

create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ========================================
-- 3. product_steps テーブル（8 ステップ）
-- ========================================

create table public.product_steps (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  step_number int not null check (step_number between 1 and 8),
  status text not null check (status in ('pending', 'in_progress', 'done')),
  completed_at timestamptz,
  notes text not null default '',
  unique(product_id, step_number)
);

create index product_steps_product_idx on public.product_steps(product_id);

-- ========================================
-- 4. product_images テーブル（画像スロット）
-- ========================================

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  slot text not null check (slot in ('composite', 'processing', 'wearing', 'sizeDetail')),
  storage_path text not null,
  bucket text not null default 'product-images',
  mime_type text not null default 'image/jpeg',
  size_bytes bigint,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique(product_id, slot)
);

create index product_images_product_idx on public.product_images(product_id);

-- ========================================
-- 5. product_drive_files テーブル（Drive 添付）
-- ========================================

create table public.product_drive_files (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  drive_file_id text not null,
  name text not null,
  mime_type text not null,
  size_bytes bigint,
  web_view_link text,
  uploaded_at timestamptz not null default now()
);

create index product_drive_files_product_idx on public.product_drive_files(product_id);

-- ========================================
-- 6. RLS（Phase 1 では disabled）
-- ========================================
-- server-side（SERVICE_ROLE_KEY）からのみアクセス。
-- Phase 2 で認証追加時に RLS を有効化する。

alter table public.products disable row level security;
alter table public.product_steps disable row level security;
alter table public.product_images disable row level security;
alter table public.product_drive_files disable row level security;
