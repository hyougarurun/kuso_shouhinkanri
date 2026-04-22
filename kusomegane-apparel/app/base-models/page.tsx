"use client"

import { useEffect, useState } from "react"
import type {
  BaseModel,
  BaseModelGarmentType,
  BaseModelGender,
  BaseModelPose,
} from "@/types"
import dynamic from "next/dynamic"
import {
  getCachedSignedUrl,
  ingestSignedUrls,
} from "@/lib/signedUrlCache"

// ダイアログは開いた時だけロード
const BaseModelUploadDialog = dynamic(
  () =>
    import("@/components/base-models/BaseModelUploadDialog").then(
      (m) => m.BaseModelUploadDialog,
    ),
  { ssr: false },
)
const GenerateVariationDialog = dynamic(
  () =>
    import("@/components/base-models/GenerateVariationDialog").then(
      (m) => m.GenerateVariationDialog,
    ),
  { ssr: false },
)

interface BaseModelWithUrl extends BaseModel {
  signedUrl: string
}

type GenderFilter = "all" | BaseModelGender
type PoseFilter = "all" | BaseModelPose
type GarmentFilter = "all" | BaseModelGarmentType

const GARMENT_LABELS: Record<BaseModelGarmentType, string> = {
  crewneck: "スウェット",
  hoodie: "パーカー",
  tshirt: "Tシャツ",
  longsleeve: "ロンT",
}

export default function BaseModelsPage() {
  const [models, setModels] = useState<BaseModelWithUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [variationTarget, setVariationTarget] = useState<BaseModelWithUrl | null>(null)
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all")
  const [poseFilter, setPoseFilter] = useState<PoseFilter>("all")
  const [garmentFilter, setGarmentFilter] = useState<GarmentFilter>("all")
  const [onlyFavorite, setOnlyFavorite] = useState(false)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const q = new URLSearchParams()
      if (genderFilter !== "all") q.set("gender", genderFilter)
      if (poseFilter !== "all") q.set("pose", poseFilter)
      if (garmentFilter !== "all") q.set("garmentType", garmentFilter)
      if (onlyFavorite) q.set("favorite", "1")
      const res = await fetch(`/api/base-models/list?${q.toString()}`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "unknown" }))
        throw new Error(j.error || "取得失敗")
      }
      const data = await res.json()
      const fetched: BaseModelWithUrl[] = data.models ?? []
      ingestSignedUrls(fetched)
      // キャッシュに既に URL があれば優先（同じ URL でも先に到着した方で即描画可能）
      const merged = fetched.map((m) => {
        const cached = getCachedSignedUrl(m.storagePath)
        return cached ? { ...m, signedUrl: cached } : m
      })
      setModels(merged)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genderFilter, poseFilter, garmentFilter, onlyFavorite])

  async function toggleFavorite(m: BaseModelWithUrl) {
    const res = await fetch(`/api/base-models/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !m.isFavorite }),
    })
    if (res.ok) refresh()
  }

  async function deleteModel(m: BaseModelWithUrl) {
    if (!confirm(`${m.variantLabel || m.id.slice(0, 8)} を削除しますか？`)) return
    const res = await fetch(`/api/base-models/${m.id}`, { method: "DELETE" })
    if (res.ok) refresh()
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">モデル画像</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            着画生成・デザイン検証のための画像アセット
          </p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="rounded-md bg-brand-yellow text-black text-xs font-bold px-3 py-1.5 hover:brightness-95 transition"
        >
          + 画像登録
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value as GenderFilter)}
          className="text-xs border border-zinc-300 rounded px-2 py-1 bg-white"
          aria-label="性別フィルター"
        >
          <option value="all">全性別</option>
          <option value="male">男性</option>
          <option value="female">女性</option>
        </select>
        <select
          value={poseFilter}
          onChange={(e) => setPoseFilter(e.target.value as PoseFilter)}
          className="text-xs border border-zinc-300 rounded px-2 py-1 bg-white"
          aria-label="ポーズフィルター"
        >
          <option value="all">全ポーズ</option>
          <option value="front">前向き</option>
          <option value="back">振り返り</option>
        </select>
        <select
          value={garmentFilter}
          onChange={(e) => setGarmentFilter(e.target.value as GarmentFilter)}
          className="text-xs border border-zinc-300 rounded px-2 py-1 bg-white"
          aria-label="服種フィルター"
        >
          <option value="all">全種類</option>
          <option value="crewneck">スウェット</option>
          <option value="hoodie">パーカー</option>
          <option value="tshirt">Tシャツ</option>
          <option value="longsleeve">ロンT</option>
        </select>
        <label className="text-xs flex items-center gap-1">
          <input
            type="checkbox"
            checked={onlyFavorite}
            onChange={(e) => setOnlyFavorite(e.target.checked)}
          />
          お気に入りのみ
        </label>
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-3 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-sm text-zinc-500 py-10">読み込み中...</div>
      ) : models.length === 0 ? (
        <div className="text-center text-sm text-zinc-500 py-10">
          モデル画像が登録されていません。「+ 画像登録」から追加してください。
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {models.map((m, idx) => (
            <div
              key={m.id}
              className="flex flex-col bg-white rounded-lg border border-zinc-200 overflow-hidden hover:shadow-md transition"
            >
              <div className="relative aspect-square bg-zinc-100">
                {m.signedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.signedUrl}
                    alt={m.variantLabel || m.id}
                    width={m.width ?? 600}
                    height={m.height ?? 600}
                    loading={idx < 8 ? "eager" : "lazy"}
                    fetchPriority={idx < 4 ? "high" : "auto"}
                    decoding="async"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">
                    No Image
                  </div>
                )}
                <button
                  onClick={() => toggleFavorite(m)}
                  className={
                    "absolute top-1 right-1 w-7 h-7 rounded-full flex items-center justify-center text-sm transition " +
                    (m.isFavorite
                      ? "bg-yellow-400 text-black"
                      : "bg-white/80 text-zinc-400 hover:text-yellow-600")
                  }
                  title={m.isFavorite ? "お気に入り解除" : "お気に入り登録"}
                >
                  ★
                </button>
                {m.parentId && (
                  <span
                    className="absolute bottom-1 left-1 bg-amber-400/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded"
                    title="派生生成（AI）"
                  >
                    🎨 派生
                  </span>
                )}
              </div>
              <div className="p-2 text-xs flex flex-col gap-1">
                <div className="flex gap-1 flex-wrap">
                  <span className="bg-zinc-100 text-zinc-700 rounded px-1.5 py-0.5 text-[10px]">
                    {m.gender === "male" ? "男性" : "女性"}
                  </span>
                  <span className="bg-zinc-100 text-zinc-700 rounded px-1.5 py-0.5 text-[10px]">
                    {m.pose === "front" ? "前" : "後"}
                  </span>
                  <span className="bg-zinc-100 text-zinc-700 rounded px-1.5 py-0.5 text-[10px]">
                    {GARMENT_LABELS[m.garmentType]}
                  </span>
                </div>
                {(m.garmentColor || m.backgroundColor) && (
                  <div className="text-[10px] text-zinc-500 truncate">
                    {[m.garmentColor, m.backgroundColor].filter(Boolean).join(" / ")}
                  </div>
                )}
                <div className="flex gap-1 mt-1">
                  <button
                    onClick={() => setVariationTarget(m)}
                    className="flex-1 text-[10px] bg-amber-100 hover:bg-amber-200 rounded px-2 py-1 font-semibold text-amber-900"
                    title="服種の派生バリエーション生成"
                  >
                    🎨 派生
                  </button>
                  <a
                    href={m.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] bg-zinc-100 hover:bg-zinc-200 rounded px-2 py-1 font-semibold text-zinc-700 inline-flex items-center"
                    title="新規タブで開く（右クリック/⌘S で保存）"
                  >
                    DL
                  </a>
                  <button
                    onClick={() => deleteModel(m)}
                    className="text-[10px] bg-red-50 hover:bg-red-100 rounded px-2 py-1 font-semibold text-red-600"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <BaseModelUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={refresh}
      />

      <GenerateVariationDialog
        open={!!variationTarget}
        baseModelId={variationTarget?.id ?? null}
        thumbUrl={variationTarget?.signedUrl}
        parentLabel={variationTarget?.variantLabel}
        parentGarment={variationTarget?.garmentType}
        onClose={() => setVariationTarget(null)}
        onGenerated={refresh}
      />

    </div>
  )
}
