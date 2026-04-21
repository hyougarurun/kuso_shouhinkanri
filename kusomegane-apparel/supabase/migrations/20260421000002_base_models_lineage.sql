-- Phase 1.4b: 派生生成（バリエーション）系譜
-- base_models 同士の親子関係を保持し、派生元の追跡・グルーピングを可能にする。

alter table public.base_models
  add column if not exists parent_id uuid references public.base_models(id) on delete set null,
  add column if not exists target_garment text,
  add column if not exists generation_prompt text not null default '',
  add column if not exists generation_model text not null default '';

create index if not exists base_models_parent_id_idx on public.base_models(parent_id);
