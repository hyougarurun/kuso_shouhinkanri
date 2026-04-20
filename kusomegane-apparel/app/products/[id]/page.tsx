"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Product, FlowStep, AssetStatus, ProductImages } from "@/types"
import { storage } from "@/lib/storage"
import { getProductStatus } from "@/lib/productStatus"
import { computeSampleCountdown } from "@/lib/sampleCountdown"
import { getColorStyle } from "@/lib/colorPalette"
import { duplicateProduct } from "@/lib/productDuplicate"
import { resizeImage } from "@/lib/imageResize"
import { ensureImages } from "@/lib/migrateProduct"
import { exportProductZip, downloadBlob } from "@/lib/exportZip"
import { StatusBadge } from "@/components/StatusBadge"
import { StepTimeline } from "@/components/StepTimeline"
import {
  AssetsChecklist,
  AssetKey,
  BooleanAssetKey,
  ThreeStateKey,
} from "@/components/AssetsChecklist"
import { CaptionBlock } from "@/components/CaptionBlock"
import { ProductInfoTable } from "@/components/ProductInfoTable"
import { SampleCountdownLabel } from "@/components/SampleCountdown"
import { DriveStorageSection } from "@/components/DriveStorageSection"
import { SheetRegistrationSection } from "@/components/SheetRegistrationSection"
import { ImageSlots, SlotKey } from "@/components/ImageSlots"
import { GallerySection } from "@/components/GallerySection"

function isBooleanKey(k: AssetKey): k is BooleanAssetKey {
  return k === "sizeDetailDone" || k === "captionDone"
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const [product, setProduct] = useState<Product | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!id) return
    const found = storage.getProducts().find((p) => p.id === id) ?? null
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProduct(found ? ensureImages(found) : null)
    setLoaded(true)
  }, [id])

  const countdown = useMemo(() => {
    if (!product) return null
    return computeSampleCountdown(product.sampleArrivalDate)
  }, [product])

  function update(next: Product) {
    setProduct(next)
    storage.upsertProduct(next)
  }

  function toggleStep(stepNumber: number) {
    if (!product) return
    const steps: FlowStep[] = product.steps.map((s) => {
      if (s.stepNumber !== stepNumber) return s
      if (s.status === "done") return { ...s, status: "pending", completedAt: undefined }
      return { ...s, status: "done", completedAt: new Date().toISOString() }
    })
    const nextCurrent = steps.findIndex((s) => s.status !== "done")
    update({
      ...product,
      steps,
      currentStep: nextCurrent === -1 ? steps.length : nextCurrent + 1,
    })
  }

  function setSampleDate(value: string) {
    if (!product) return
    update({ ...product, sampleArrivalDate: value || undefined })
  }

  function toggleAsset(key: AssetKey) {
    if (!product) return
    if (isBooleanKey(key)) {
      update({
        ...product,
        assets: { ...product.assets, [key]: !product.assets[key] },
      })
    } else {
      const threeKey: ThreeStateKey = key
      const current: AssetStatus = product.assets[threeKey]
      const nextStatus: AssetStatus = current === "done" ? "pending" : "done"
      update({
        ...product,
        assets: { ...product.assets, [threeKey]: nextStatus },
      })
    }
  }

  function handleDuplicate() {
    if (!product) return
    const dup = duplicateProduct(product)
    storage.upsertProduct(dup)
    router.push(`/products/${dup.id}`)
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!product) return
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const resized = await resizeImage(file)
      const images: ProductImages = product.images ?? {
        composite: null,
        processing: null,
        wearing: null,
        sizeDetail: null,
      }
      update({
        ...product,
        imagePreview: resized.dataUrl,
        images: { ...images, composite: resized.dataUrl },
      })
    } catch {
      // 画像読み込み失敗は無視
    }
  }

  async function handleSlotUpload(key: SlotKey, file: File) {
    if (!product) return
    try {
      const resized = await resizeImage(file)
      const images: ProductImages = product.images ?? {
        composite: null,
        processing: null,
        wearing: null,
        sizeDetail: null,
      }
      const next: Product = {
        ...product,
        images: { ...images, [key]: resized.dataUrl },
      }
      // composite スロット更新時は imagePreview も同期
      if (key === "composite") {
        next.imagePreview = resized.dataUrl
      }
      update(next)
    } catch {
      // 画像読み込み失敗は無視
    }
  }

  function handleSlotDelete(key: SlotKey) {
    if (!product || !product.images) return
    const next: Product = {
      ...product,
      images: { ...product.images, [key]: null },
    }
    if (key === "composite") {
      next.imagePreview = null
    }
    update(next)
  }

  async function handleDownloadZip() {
    if (!product) return
    try {
      const blob = await exportProductZip(product)
      downloadBlob(blob, `${product.productNumber}_${product.name}.zip`)
    } catch {
      // ZIP生成失敗は無視
    }
  }

  function deleteProduct() {
    if (!product) return
    if (!window.confirm(`商品 "${product.name}" を削除します。よろしいですか？`)) return
    storage.deleteProduct(product.id)
    router.push("/")
  }

  if (!loaded) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-10 text-center text-xs text-zinc-500">
        読み込み中...
      </div>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-10 text-center text-xs text-zinc-500 space-y-3">
        <div>商品が見つかりません</div>
        <Link href="/" className="inline-block text-zinc-900 underline">
          ホームに戻る
        </Link>
      </div>
    )
  }

  const status = getProductStatus(product)
  const colorStyle = getColorStyle(product.colors[0])
  const step5Done = product.steps.find((s) => s.stepNumber === 5)?.status === "done"

  return (
    <div>
      {/* ヒーロー画像 */}
      <div
        className="relative h-[200px] w-full"
        style={{ backgroundColor: colorStyle.bg, color: colorStyle.fg }}
      >
        {product.imagePreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imagePreview}
            alt={product.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs opacity-70">
            No Image
          </div>
        )}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <Link
            href="/"
            className="rounded-full bg-white/90 text-black text-[11px] font-bold px-2.5 py-1"
          >
            ← 戻る
          </Link>
          <StatusBadge status={status} />
        </div>
        <label className="absolute bottom-2 right-2 rounded-full bg-white/90 text-black text-[10px] font-bold px-2 py-1 cursor-pointer hover:bg-white">
          📷 画像を変更
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </label>
        <div
          className="absolute bottom-2 left-2 right-16 space-y-0.5"
          style={{ textShadow: "0 0 3px rgba(0,0,0,0.35)" }}
        >
          <div className="text-[11px] opacity-90">No.{product.productNumber}</div>
          <div className="text-base font-bold leading-tight">{product.name}</div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 py-4 space-y-5">
        {/* クリエイティブ素材: スロット + ギャラリー */}
        <section className="space-y-2">
          <h2 className="text-[11px] font-bold text-zinc-500 px-1">
            クリエイティブ素材
          </h2>
          {product.images && (
            <div className="bg-white rounded-lg shadow-sm p-3">
              <ImageSlots
                images={product.images}
                onUpload={handleSlotUpload}
                onDelete={handleSlotDelete}
              />
            </div>
          )}
          <GallerySection product={product} onUpdate={update} />
        </section>

        {/* カウントダウン */}
        {!step5Done && countdown && (
          <div className="flex items-center justify-between bg-white rounded-lg shadow-sm px-3 py-2">
            <div className="text-[12px] text-zinc-500">サンプル到着</div>
            <SampleCountdownLabel data={countdown} />
          </div>
        )}

        {/* ステップタイムライン */}
        <section className="space-y-2">
          <h2 className="text-[11px] font-bold text-zinc-500 px-1">進捗ステップ</h2>
          <StepTimeline
            product={product}
            onToggle={toggleStep}
            onSampleDateChange={setSampleDate}
            step5Content={
              !step5Done && countdown ? (
                <SampleCountdownLabel data={countdown} />
              ) : null
            }
            step7Content={
              <AssetsChecklist
                assets={product.assets}
                onToggle={toggleAsset}
                images={product.images}
                captionText={product.captionText}
              />
            }
          />
        </section>

        {/* キャプション */}
        <section className="space-y-2">
          <h2 className="text-[11px] font-bold text-zinc-500 px-1">キャプション</h2>
          <CaptionBlock text={product.captionText} />
        </section>

        {/* 商品情報 */}
        <section className="space-y-2">
          <h2 className="text-[11px] font-bold text-zinc-500 px-1">商品情報</h2>
          <ProductInfoTable product={product} />
        </section>

        {/* ASTORE シート登録 + Drive 添付 */}
        <section className="space-y-3">
          <h2 className="text-[11px] font-bold text-zinc-500 px-1">
            外部連携（シート / Drive）
          </h2>
          <SheetRegistrationSection product={product} onUpdate={update} />
          <DriveStorageSection product={product} onUpdate={update} />
        </section>

        {/* アクション */}
        <section className="pt-2 space-y-2">
          <button
            type="button"
            onClick={handleDownloadZip}
            className="w-full rounded-lg bg-zinc-900 text-white text-xs font-bold py-2 hover:bg-zinc-800"
          >
            クリエイティブをダウンロード
          </button>
          <button
            type="button"
            onClick={handleDuplicate}
            className="w-full rounded-lg border border-zinc-300 bg-white text-zinc-900 text-xs font-bold py-2 hover:bg-zinc-50"
          >
            この商品を複製する
          </button>
          <button
            type="button"
            onClick={deleteProduct}
            className="w-full rounded-lg border border-red-200 bg-white text-red-600 text-xs font-bold py-2 hover:bg-red-50"
          >
            この商品を削除する
          </button>
        </section>
      </div>
    </div>
  )
}
