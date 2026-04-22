import { createServerClient } from "./server"

export const BUCKET = "animator-library"
export const SIGNED_URL_TTL_SECONDS = 60 * 60 * 2 // 2h

export type AnimatorStore = "projects" | "assets" | "folders"

export function isAnimatorStore(v: unknown): v is AnimatorStore {
  return v === "projects" || v === "assets" || v === "folders"
}

// ─── projects ───────────────────────────────────────────────────

export interface ProjectMetadata {
  id: string
  name: string
  folder: string
  frameCount: number
  fps: number | null
  platform: string | null
  motionId: string | null
  created: number
  updated: number
  thumbnail: string // signedUrl
}

/**
 * client から届くフル project データ（IndexedDB 当時と同じ shape）。
 * { id, name, folder, created, updated, frameCount, fps, platform, motionId, srcURL, thumbnail, frames: [{json, dataURL}] }
 */
export interface FullProjectData {
  id: string
  name: string
  folder?: string
  created?: number
  updated?: number
  frameCount?: number
  fps?: number
  platform?: string
  motionId?: string | null
  srcURL?: string | null
  thumbnail?: string
  frames?: Array<{ json: unknown; dataURL: string }>
}

function thumbDataUrlToBuffer(
  thumb: string | undefined,
): { buffer: ArrayBuffer; mime: string } | null {
  if (!thumb) return null
  const m = thumb.match(/^data:([^;]+);base64,(.+)$/)
  if (!m) return null
  const mime = m[1]
  const bin = Buffer.from(m[2], "base64")
  return { buffer: bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength), mime }
}

export async function putProject(data: FullProjectData): Promise<void> {
  const sb = createServerClient()

  // 重い部分を JSON としてアップロード
  const heavy = {
    frames: data.frames ?? [],
    srcURL: data.srcURL ?? null,
    // thumbnail は別途サムネとしても保存するが JSON にも残しておく（完全復元用）
    thumbnail: data.thumbnail ?? null,
  }
  const dataPath = `projects/${data.id}.json`
  const jsonBlob = new Blob([JSON.stringify(heavy)], {
    type: "application/json",
  })
  const { error: dataErr } = await sb.storage
    .from(BUCKET)
    .upload(dataPath, jsonBlob, {
      contentType: "application/json",
      upsert: true,
    })
  if (dataErr) throw new Error(`project json upload 失敗: ${dataErr.message}`)

  // サムネを PNG として別アップロード（list で高速表示）
  let thumbPath: string | null = null
  const thumb = thumbDataUrlToBuffer(data.thumbnail)
  if (thumb) {
    const ext = thumb.mime === "image/png" ? "png" : "jpg"
    thumbPath = `thumbs/${data.id}.${ext}`
    await sb.storage.from(BUCKET).upload(thumbPath, thumb.buffer, {
      contentType: thumb.mime,
      upsert: true,
    })
  }

  // DB upsert（metadata のみ）
  const { error: upsertErr } = await sb.from("animator_projects").upsert({
    id: data.id,
    name: data.name ?? "",
    folder: data.folder ?? "",
    frame_count: data.frameCount ?? 0,
    fps: data.fps ?? null,
    platform: data.platform ?? null,
    motion_id: data.motionId ?? null,
    data_path: dataPath,
    thumbnail_path: thumbPath,
    size_bytes: jsonBlob.size,
    updated_at: new Date(
      typeof data.updated === "number" ? data.updated : Date.now(),
    ).toISOString(),
  })
  if (upsertErr) throw new Error(`animator_projects upsert 失敗: ${upsertErr.message}`)
}

export async function listProjects(): Promise<ProjectMetadata[]> {
  const sb = createServerClient()
  const { data, error } = await sb
    .from("animator_projects")
    .select("*")
    .order("updated_at", { ascending: false })
  if (error) throw new Error(`animator_projects list 失敗: ${error.message}`)
  const rows = data ?? []
  if (rows.length === 0) return []

  const thumbPaths = rows
    .map((r) => r.thumbnail_path)
    .filter((p): p is string => !!p)
  const urlByPath = new Map<string, string>()
  if (thumbPaths.length > 0) {
    const { data: signed } = await sb.storage
      .from(BUCKET)
      .createSignedUrls(thumbPaths, SIGNED_URL_TTL_SECONDS)
    ;(signed ?? []).forEach((s) => {
      if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl)
    })
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    folder: row.folder,
    frameCount: row.frame_count,
    fps: row.fps,
    platform: row.platform,
    motionId: row.motion_id,
    created: Date.parse(row.created_at),
    updated: Date.parse(row.updated_at),
    thumbnail: row.thumbnail_path
      ? (urlByPath.get(row.thumbnail_path) ?? "")
      : "",
  }))
}

export async function getProject(id: string): Promise<FullProjectData | null> {
  const sb = createServerClient()
  const { data: row } = await sb
    .from("animator_projects")
    .select("*")
    .eq("id", id)
    .single()
  if (!row) return null

  const { data: blob } = await sb.storage.from(BUCKET).download(row.data_path)
  if (!blob) return null
  const heavy = JSON.parse(await blob.text()) as {
    frames: Array<{ json: unknown; dataURL: string }>
    srcURL: string | null
    thumbnail: string | null
  }

  return {
    id: row.id,
    name: row.name,
    folder: row.folder,
    frameCount: row.frame_count,
    fps: row.fps ?? undefined,
    platform: row.platform ?? undefined,
    motionId: row.motion_id ?? undefined,
    created: Date.parse(row.created_at),
    updated: Date.parse(row.updated_at),
    srcURL: heavy.srcURL,
    thumbnail: heavy.thumbnail ?? undefined,
    frames: heavy.frames,
  }
}

export async function deleteProject(id: string): Promise<void> {
  const sb = createServerClient()
  const { data } = await sb
    .from("animator_projects")
    .select("data_path, thumbnail_path")
    .eq("id", id)
    .single()
  await sb.from("animator_projects").delete().eq("id", id)
  const paths = [data?.data_path, data?.thumbnail_path].filter(
    (x): x is string => !!x,
  )
  if (paths.length > 0) await sb.storage.from(BUCKET).remove(paths)
}

// ─── assets ─────────────────────────────────────────────────────

export interface AssetMetadata {
  id: string
  name: string
  folder: string
  format: string | null
  sizeKB: number | null
  created: number
  thumbnail: string // signedUrl
  blobUrl: string // signedUrl (download)
}

/**
 * client からの PUT ペイロード。blob は dataURL（base64）で受ける。
 */
export interface AssetPayload {
  id: string
  name: string
  folder?: string
  created?: number
  format?: string
  sizeKB?: number
  thumbnail?: string // dataURL
  blob?: string // dataURL
}

export async function putAsset(data: AssetPayload): Promise<void> {
  const sb = createServerClient()
  if (!data.blob) throw new Error("asset.blob (dataURL) が必要です")

  const m = data.blob.match(/^data:([^;]+);base64,(.+)$/)
  if (!m) throw new Error("asset.blob は dataURL 形式で渡してください")
  const mime = m[1]
  const binBuf = Buffer.from(m[2], "base64")
  const bin: ArrayBuffer = binBuf.buffer.slice(binBuf.byteOffset, binBuf.byteOffset + binBuf.byteLength)

  const ext =
    data.format?.toLowerCase() ||
    (mime.includes("png")
      ? "png"
      : mime.includes("gif")
        ? "gif"
        : mime.includes("webp")
          ? "webp"
          : "bin")
  const dataPath = `assets/${data.id}.${ext}`
  const { error: upErr } = await sb.storage
    .from(BUCKET)
    .upload(dataPath, bin, { contentType: mime, upsert: true })
  if (upErr) throw new Error(`asset upload 失敗: ${upErr.message}`)

  let thumbPath: string | null = null
  const thumb = thumbDataUrlToBuffer(data.thumbnail)
  if (thumb) {
    const tExt = thumb.mime === "image/png" ? "png" : "jpg"
    thumbPath = `asset-thumbs/${data.id}.${tExt}`
    await sb.storage.from(BUCKET).upload(thumbPath, thumb.buffer, {
      contentType: thumb.mime,
      upsert: true,
    })
  }

  const { error } = await sb.from("animator_assets").upsert({
    id: data.id,
    name: data.name,
    folder: data.folder ?? "",
    format: data.format ?? null,
    size_kb: data.sizeKB ?? null,
    data_path: dataPath,
    thumbnail_path: thumbPath,
  })
  if (error) throw new Error(`animator_assets upsert 失敗: ${error.message}`)
}

export async function listAssets(): Promise<AssetMetadata[]> {
  const sb = createServerClient()
  const { data, error } = await sb
    .from("animator_assets")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw new Error(`animator_assets list 失敗: ${error.message}`)
  const rows = data ?? []
  if (rows.length === 0) return []

  const allPaths = rows.flatMap((r) =>
    [r.data_path, r.thumbnail_path].filter((p): p is string => !!p),
  )
  const urlByPath = new Map<string, string>()
  if (allPaths.length > 0) {
    const { data: signed } = await sb.storage
      .from(BUCKET)
      .createSignedUrls(allPaths, SIGNED_URL_TTL_SECONDS)
    ;(signed ?? []).forEach((s) => {
      if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl)
    })
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    folder: row.folder,
    format: row.format,
    sizeKB: row.size_kb,
    created: Date.parse(row.created_at),
    thumbnail: row.thumbnail_path
      ? (urlByPath.get(row.thumbnail_path) ?? "")
      : "",
    blobUrl: urlByPath.get(row.data_path) ?? "",
  }))
}

export async function getAsset(
  id: string,
): Promise<AssetMetadata | null> {
  const sb = createServerClient()
  const { data: row } = await sb
    .from("animator_assets")
    .select("*")
    .eq("id", id)
    .single()
  if (!row) return null

  const paths = [row.data_path, row.thumbnail_path].filter(
    (p): p is string => !!p,
  )
  const { data: signed } = await sb.storage
    .from(BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS)
  const urlByPath = new Map<string, string>()
  ;(signed ?? []).forEach((s) => {
    if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl)
  })

  return {
    id: row.id,
    name: row.name,
    folder: row.folder,
    format: row.format,
    sizeKB: row.size_kb,
    created: Date.parse(row.created_at),
    thumbnail: row.thumbnail_path
      ? (urlByPath.get(row.thumbnail_path) ?? "")
      : "",
    blobUrl: urlByPath.get(row.data_path) ?? "",
  }
}

export async function deleteAsset(id: string): Promise<void> {
  const sb = createServerClient()
  const { data } = await sb
    .from("animator_assets")
    .select("data_path, thumbnail_path")
    .eq("id", id)
    .single()
  await sb.from("animator_assets").delete().eq("id", id)
  const paths = [data?.data_path, data?.thumbnail_path].filter(
    (x): x is string => !!x,
  )
  if (paths.length > 0) await sb.storage.from(BUCKET).remove(paths)
}

// ─── folders ────────────────────────────────────────────────────

export interface FolderRow {
  id: string
  name: string
  tab: string
  parent: string
  created: number
}

export interface FolderPayload {
  id: string
  name?: string
  tab: string
  parent?: string
}

export async function putFolder(data: FolderPayload): Promise<void> {
  const sb = createServerClient()
  const { error } = await sb.from("animator_folders").upsert({
    id: data.id,
    name: data.name ?? data.id,
    tab: data.tab,
    parent: data.parent ?? "",
  })
  if (error) throw new Error(`animator_folders upsert 失敗: ${error.message}`)
}

export async function listFolders(): Promise<FolderRow[]> {
  const sb = createServerClient()
  const { data, error } = await sb.from("animator_folders").select("*")
  if (error) throw new Error(`animator_folders list 失敗: ${error.message}`)
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    tab: row.tab,
    parent: row.parent,
    created: Date.parse(row.created_at),
  }))
}

export async function deleteFolder(id: string): Promise<void> {
  const sb = createServerClient()
  const { error } = await sb.from("animator_folders").delete().eq("id", id)
  if (error) throw new Error(`animator_folders delete 失敗: ${error.message}`)
}
