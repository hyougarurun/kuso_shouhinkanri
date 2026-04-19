"use client"

import { Product } from "@/types"

type Props = {
  product: Product
  onUpdate: (next: Product) => void
}

export function SheetRegistrationSection({ product, onUpdate }: Props) {
  const registered = !!product.sheetRegisteredAt

  function register() {
    const now = new Date().toISOString()
    onUpdate({
      ...product,
      sheetRegisteredAt: now,
      updatedAt: now,
    })
  }

  function unregister() {
    onUpdate({
      ...product,
      sheetRegisteredAt: undefined,
      sheetRowNumber: undefined,
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <section className="bg-white rounded-lg shadow-sm p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold">ASTORE シート登録</h2>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            「リスト1」シートに 8 列（商品 / 商品番号 / 色 / サイズ / 加工 /
            ボディ型番 / デザインファイル / 備考）を追記
          </p>
        </div>
        {registered && (
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
            登録済み
          </span>
        )}
      </div>

      {registered ? (
        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-zinc-600">
            {new Date(product.sheetRegisteredAt!).toLocaleString("ja-JP")} に登録
            {product.sheetRowNumber !== undefined &&
              ` (行 ${product.sheetRowNumber})`}
          </p>
          <button
            type="button"
            onClick={unregister}
            className="text-[11px] text-zinc-500 hover:text-red-600 underline"
          >
            登録を取り消す
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={register}
          className="w-full rounded-md bg-brand-yellow text-black text-sm font-bold py-2.5 hover:brightness-95 transition"
        >
          リスト1 シートに登録する
        </button>
      )}

      <p className="text-[10px] text-zinc-400">
        ※ Phase 1.6 で Google Sheets へ自動追記。現在はローカル状態のみ
      </p>
    </section>
  )
}
