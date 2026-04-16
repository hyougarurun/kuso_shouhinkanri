"use client"

import { ProductAssets, AssetStatus } from "@/types"

type AssetKey = keyof ProductAssets
type BooleanAssetKey = "sizeDetailDone" | "captionDone"
type ThreeStateKey = Exclude<AssetKey, BooleanAssetKey>

const ITEMS: { key: AssetKey; label: string }[] = [
  { key: "compositeImage", label: "商品画像" },
  { key: "processingImage", label: "加工箇所アップ画像" },
  { key: "aiWearingImage", label: "着画（AI生成）" },
  { key: "sizeDetailDone", label: "サイズ詳細" },
  { key: "captionDone", label: "商品概要キャプション" },
]

function isBooleanKey(k: AssetKey): k is BooleanAssetKey {
  return k === "sizeDetailDone" || k === "captionDone"
}

function isDone(assets: ProductAssets, k: AssetKey): boolean {
  if (isBooleanKey(k)) return assets[k]
  const status: AssetStatus = assets[k]
  return status === "done"
}

export function AssetsChecklist({
  assets,
  onToggle,
}: {
  assets: ProductAssets
  onToggle: (key: AssetKey) => void
}) {
  return (
    <ul className="space-y-1.5">
      {ITEMS.map((it) => {
        const done = isDone(assets, it.key)
        return (
          <li key={it.key}>
            <button
              type="button"
              onClick={() => onToggle(it.key)}
              className="w-full flex items-center gap-2 px-2 py-1 rounded-md hover:bg-zinc-50 text-left"
            >
              <span
                className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                  done
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-zinc-300"
                }`}
              >
                {done ? "✓" : ""}
              </span>
              <span
                className={`text-xs ${
                  done ? "text-zinc-400 line-through" : "text-zinc-700"
                }`}
              >
                {it.label}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export type { AssetKey, BooleanAssetKey, ThreeStateKey }
