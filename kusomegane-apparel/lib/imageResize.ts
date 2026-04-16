const MAX_SIZE = 800

export interface ResizedImage {
  base64: string
  dataUrl: string
  mediaType: "image/jpeg" | "image/png" | "image/webp"
  width: number
  height: number
}

export async function resizeImage(file: File): Promise<ResizedImage> {
  const mediaType = detectMediaType(file)
  const img = await loadImage(file)
  const { width, height } = fitSize(img.width, img.height, MAX_SIZE)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D context が取得できませんでした")
  ctx.drawImage(img, 0, 0, width, height)

  const dataUrl = canvas.toDataURL(mediaType, 0.9)
  const base64 = dataUrl.split(",")[1] ?? ""

  return { base64, dataUrl, mediaType, width, height }
}

function detectMediaType(file: File): "image/jpeg" | "image/png" | "image/webp" {
  const t = file.type.toLowerCase()
  if (t === "image/jpeg" || t === "image/jpg") return "image/jpeg"
  if (t === "image/webp") return "image/webp"
  return "image/png"
}

function fitSize(w: number, h: number, max: number): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h }
  if (w >= h) {
    return { width: max, height: Math.round((h * max) / w) }
  }
  return { width: Math.round((w * max) / h), height: max }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error("画像の読み込みに失敗しました"))
      img.src = String(reader.result ?? "")
    }
    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"))
    reader.readAsDataURL(file)
  })
}
