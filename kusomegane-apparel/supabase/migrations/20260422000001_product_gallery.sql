-- Phase G: 商品ギャラリーを LocalStorage → Supabase Storage に移行
-- 1080×1080 × 10 枚 × N 商品 という運用に LocalStorage (5〜10MB) では耐えられないため。
--
-- 設計:
-- - product_gallery_items: 1 商品につき任意枚数の画像行
-- - product-gallery バケット: 非公開、Signed URL 配信（90 分 TTL）
-- - product_id は LocalStorage 由来の UUID なので FK は張らない（products に未登録でも OK）
-- - 並び順は sort_order（0 が先頭 = サムネ判定）
-- - 解像度上限は運用で 1920px。DB 側は縛らない

create table public.product_gallery_items (
  id uuid primary key default gen_random_uuid(),

  -- LocalStorage で発行される Product.id。DB 側の products とは同期保証なしなので FK は張らない
  product_id uuid not null,

  storage_path text not null,
  bucket text not null default 'product-gallery',

  mime_type text not null default 'image/jpeg',
  size_bytes bigint,
  width int,
  height int,

  sort_order int not null default 0,

  created_at timestamptz not null default now()
);

create index product_gallery_items_product_idx
  on public.product_gallery_items(product_id);
create index product_gallery_items_sort_idx
  on public.product_gallery_items(product_id, sort_order);

alter table public.product_gallery_items disable row level security;

-- Storage バケット（非公開、Signed URL 配信）
insert into storage.buckets (id, name, public)
values ('product-gallery', 'product-gallery', false)
on conflict (id) do nothing;
