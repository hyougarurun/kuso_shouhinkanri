"use client"

import type { WizardState } from "@/lib/wizardState"

type Props = {
  state: WizardState
  productNumbers: string[]
  saving: boolean
  onSave: () => void
}

export function Step3_Complete({
  state,
  productNumbers,
  saving,
  onSave,
}: Props) {
  const { basic, image, caption, estimation } = state
  const estResult = estimation?.result ?? null

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
      <div>
        <h2 className="text-base font-bold">STEP 3: 内容確認・登録</h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          以下の内容で登録します（複数色でも 1 商品としてまとめて登録）。
        </p>
      </div>

      <section className="rounded-md border border-zinc-200 p-4">
        <div className="flex gap-4">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.dataUrl}
              alt="preview"
              className="w-32 h-32 object-contain rounded border border-zinc-200 bg-zinc-50"
            />
          ) : (
            <div className="w-32 h-32 rounded border border-dashed border-zinc-300 bg-zinc-50 flex items-center justify-center text-[11px] text-zinc-400">
              画像なし
            </div>
          )}
          <div className="flex-1 space-y-1 text-sm">
            <div className="text-base font-bold text-zinc-900">
              {basic.name || "（商品名未入力）"}
            </div>
            <div className="text-xs text-zinc-500">
              {basic.series || "シリーズ未設定"}
            </div>
            <div className="text-xs">
              <span className="text-zinc-500">商品番号: </span>
              {productNumbers.join(" / ")}
            </div>
            <div className="text-xs">
              <span className="text-zinc-500">カラー: </span>
              {basic.colors.join("・") || "未選択"}
            </div>
            <div className="text-xs">
              <span className="text-zinc-500">サイズ: </span>
              {basic.sizes.join("/") || "未選択"}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-zinc-200 p-4 grid grid-cols-2 gap-y-2 gap-x-6 text-xs">
        <div className="text-zinc-500">商品タイプ</div>
        <div>{basic.productType || "-"}</div>
        <div className="text-zinc-500">素材</div>
        <div>{basic.material}</div>
        <div className="text-zinc-500">ボディ型番</div>
        <div>{basic.bodyModelNumber || "-"}</div>
        <div className="text-zinc-500">受注生産</div>
        <div>{basic.isMadeToOrder ? "あり" : "なし"}</div>
        <div className="text-zinc-500">送料無料</div>
        <div>{basic.freeShipping ? "あり" : "なし"}</div>
      </section>

      {basic.notes && (
        <section className="rounded-md border border-zinc-200 p-4 text-xs">
          <div className="text-zinc-500 mb-1">備考</div>
          <div className="whitespace-pre-wrap">{basic.notes}</div>
        </section>
      )}

      {caption?.fullText && (
        <section className="rounded-md border border-zinc-200 p-4 text-xs">
          <div className="text-zinc-500 mb-1">キャプション</div>
          <div className="whitespace-pre-wrap font-mono text-[11px] bg-zinc-50 p-3 rounded max-h-48 overflow-y-auto">
            {caption.fullText}
          </div>
        </section>
      )}

      {estResult ? (
        <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-xs space-y-2">
          <div className="font-bold text-amber-900">
            加工費推定（STEP 1 より）
          </div>
          <div>
            <span className="text-amber-700">ボディレンジ:</span> ¥
            {estResult.bodyPrice.range}
          </div>
          <div className="space-y-0.5">
            {estResult.processing.map((p, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-zinc-700">
                  {p.location} / {p.method}
                </span>
                <span>¥{p.estimatedPrice.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold border-t border-amber-200 pt-1">
              <span>加工費小計</span>
              <span>¥{estResult.subtotalProcessing.toLocaleString()}</span>
            </div>
          </div>
          {estResult.totalMin !== undefined &&
            estResult.totalMax !== undefined && (
              <div className="rounded-md bg-white border border-amber-300 p-2 text-center mt-2">
                <div className="text-[10px] text-amber-700">
                  商品単価合計（ボディ + 加工費）
                </div>
                <div className="text-base font-bold text-amber-900">
                  ¥{estResult.totalMin.toLocaleString()} 〜 ¥
                  {estResult.totalMax.toLocaleString()}
                </div>
              </div>
            )}
        </section>
      ) : (
        <section className="rounded-md border border-zinc-200 p-3 text-[11px] text-zinc-500">
          加工費推定は STEP 1 でスキップされました
        </section>
      )}

      <section className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-[11px] text-zinc-700">
        <div className="font-bold mb-1">Phase 1 で自動化予定</div>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>Google Drive に商品番号フォルダを自動作成</li>
          <li>合成画像を Drive にアップロード</li>
          <li>スプレッドシートに B〜H 列 + 発注数量列を自動追記</li>
        </ul>
      </section>

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="w-full rounded-lg bg-brand-yellow text-black text-sm font-bold py-3 disabled:opacity-50 hover:brightness-95 transition"
      >
        {saving ? "保存中..." : "この内容で商品を登録する"}
      </button>
    </div>
  )
}
