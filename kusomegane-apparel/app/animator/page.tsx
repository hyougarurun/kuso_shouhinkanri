/**
 * KUSOMEGANE Animator をフルスクリーン iframe で埋め込むページ。
 *
 * 実体は public/animator/index.html（3,143 行の単一ファイル、fabric.js + UPNG.js）
 * アップロード画像は Supabase Storage（animator-assets）に保存される（A-4 で配線）。
 *
 * レイアウト: サイドバー(220px)と TopBar(48px)を避けて残り領域を iframe で埋める。
 * main の max-w と padding を越えるため fixed positioning で貼り付け。
 */
export default function AnimatorPage() {
  return (
    <div className="fixed top-12 left-[220px] right-0 bottom-0 bg-black">
      <iframe
        src="/animator/index.html"
        title="KUSOMEGANE Animator"
        className="w-full h-full border-0 block"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
}
