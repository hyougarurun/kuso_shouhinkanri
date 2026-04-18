"use client"

import { WizardBasic, WizardState } from "@/lib/wizardState"

const PRINT_COST_ESTIMATOR_URL =
  process.env.NEXT_PUBLIC_PRINT_COST_ESTIMATOR_URL ?? "http://localhost:3101"

function mapMethodFromProcessingType(pt: string): string {
  if (!pt) return "ink_print"
  if (pt.includes("刺繍")) return "embroidery"
  if (pt.includes("ワッペン")) return "patch"
  if (pt.includes("相良")) return "sagara_attach"
  return "ink_print"
}

function buildEstimateUrl(basic: WizardBasic): string {
  const params = new URLSearchParams()
  if (basic.bodyModelNumber) params.set("bodyCode", basic.bodyModelNumber)
  const firstColor = basic.colors[0] ?? ""
  if (firstColor) params.set("color", firstColor)
  params.set("locations", "front")
  params.set("methods", mapMethodFromProcessingType(basic.processingType))
  params.set("source", "kusomegane-apparel")
  return `${PRINT_COST_ESTIMATOR_URL}/?${params.toString()}`
}

export function StepD_Confirm({
  state,
  productNumbers,
  saving,
  onSave,
}: {
  state: WizardState
  productNumbers: string[]
  saving: boolean
  onSave: () => void
}) {
  const { basic, image, caption } = state
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-zinc-900">STEP D: 確認・保存</h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          以下の内容で登録します。カラーの数だけレコードが作成されます。
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-3 space-y-3">
        <div className="flex gap-3">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.dataUrl}
              alt="preview"
              className="w-24 h-24 object-contain rounded border border-zinc-200"
            />
          )}
          <div className="flex-1 space-y-1 text-[12px]">
            <div className="font-bold text-zinc-900 text-sm">{basic.name}</div>
            <div className="text-zinc-500">{basic.series || "シリーズ未設定"}</div>
            <div>
              <span className="text-zinc-500">商品番号: </span>
              {productNumbers.join(" / ")}
            </div>
            <div>
              <span className="text-zinc-500">カラー: </span>
              {basic.colors.join("・")}
            </div>
            <div>
              <span className="text-zinc-500">サイズ: </span>
              {basic.sizes.join("/")}
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-2 grid grid-cols-2 gap-y-1 text-[12px]">
          <div className="text-zinc-500">加工種別</div>
          <div>{basic.processingType || "-"}</div>
          <div className="text-zinc-500">ボディ型番</div>
          <div>{basic.bodyModelNumber || "-"}</div>
          <div className="text-zinc-500">素材</div>
          <div>{basic.material}</div>
          <div className="text-zinc-500">受注生産</div>
          <div>{basic.isMadeToOrder ? "あり" : "なし"}</div>
          <div className="text-zinc-500">送料無料</div>
          <div>{basic.freeShipping ? "あり" : "なし"}</div>
        </div>

        {basic.notes && (
          <div className="border-t border-zinc-100 pt-2 text-[12px]">
            <div className="text-zinc-500 mb-1">備考</div>
            <div className="whitespace-pre-wrap">{basic.notes}</div>
          </div>
        )}

        {caption?.fullText && (
          <div className="border-t border-zinc-100 pt-2 text-[12px]">
            <div className="text-zinc-500 mb-1">キャプション</div>
            <div className="whitespace-pre-wrap font-mono text-[11px] bg-zinc-50 p-2 rounded max-h-40 overflow-y-auto">
              {caption.fullText}
            </div>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-[11px] text-zinc-700">
        <div className="font-bold mb-1">Phase 1 で自動化されること</div>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>Google Drive に商品番号フォルダを自動作成</li>
          <li>合成画像を Drive にアップロード</li>
          <li>スプレッドシートに B〜H 列 + 発注数量列を自動追記</li>
        </ul>
      </div>

      {basic.bodyModelNumber && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-[11px] text-zinc-700">
          <div className="font-bold mb-1">加工費推定（PoC）</div>
          <p className="text-zinc-600 mb-2">
            過去請求書（14 件・明細 約 1,900 件）を学習した推定エンジンで、
            この商品の加工費レンジを確認できます（別タブで開きます）。
          </p>
          <a
            href={buildEstimateUrl(basic)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded bg-sky-600 text-white text-[11px] font-bold px-3 py-1.5"
          >
            加工費推定を開く →
          </a>
          <p className="text-zinc-500 mt-2 text-[10px]">
            別ターミナルで <code>cd print-cost-estimator && npm run dev -- -p 3101</code> を起動している必要があります
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="w-full rounded-lg bg-brand-yellow text-black text-sm font-bold py-2.5 disabled:opacity-50"
      >
        {saving ? "保存中..." : "商品を登録する"}
      </button>
    </div>
  )
}
