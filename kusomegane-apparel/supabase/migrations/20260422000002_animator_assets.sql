-- Phase A: KUSOMEGANE Animator アップロード画像のクラウドバックアップ
-- IndexedDB に閉じていた元画像を Storage にもバックアップしておくことで、
-- 別デバイス / ブラウザクリア後でも素材が失われない。

-- Storage バケット（非公開、Signed URL 配信）
insert into storage.buckets (id, name, public)
values ('animator-assets', 'animator-assets', false)
on conflict (id) do nothing;
