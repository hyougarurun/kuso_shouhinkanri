'use client';

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type {
  EstimationResult,
  ImageAnalysisResult,
  NormalizedLocation,
  NormalizedMethod,
} from '@/src/types';

const LOCATIONS: { value: NormalizedLocation; label: string }[] = [
  { value: 'front', label: 'front（正面）' },
  { value: 'back', label: 'back（背面）' },
  { value: 'sleeve', label: '袖' },
  { value: 'both_sleeves', label: '両袖' },
  { value: 'three_locations', label: '三か所' },
  { value: 'sleeve_patch', label: '袖ワッペン' },
];

const METHODS: { value: NormalizedMethod | ''; label: string }[] = [
  { value: '', label: '(自動判定)' },
  { value: 'ink_print', label: 'インク' },
  { value: 'embroidery', label: '刺繍' },
  { value: 'patch', label: 'ワッペン' },
  { value: 'sagara_attach', label: '相良取付' },
];

type SelectedLocation = { location: NormalizedLocation; method: NormalizedMethod | '' };

type Meta = {
  invoices: number;
  lineItems: number;
  products: number;
  bodyCodes: number;
};

export default function Page() {
  const [bodyCode, setBodyCode] = useState('5001-01');
  const [color, setColor] = useState('ホワイト');
  const [selected, setSelected] = useState<SelectedLocation[]>([
    { location: 'front', method: 'ink_print' },
  ]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [result, setResult] = useState<EstimationResult | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateLocation = (i: number, field: keyof SelectedLocation, value: string) => {
    setSelected((prev) =>
      prev.map((s, idx) =>
        idx === i ? { ...s, [field]: value as SelectedLocation[typeof field] } : s,
      ),
    );
  };

  const addLocation = () =>
    setSelected((prev) => [...prev, { location: 'front', method: '' }]);
  const removeLocation = (i: number) =>
    setSelected((prev) => prev.filter((_, idx) => idx !== i));

  const onImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setAnalysis(null);
    setResult(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const onAnalyze = async () => {
    if (!imageFile) return;
    setAnalyzing(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('image', imageFile);
      const res = await fetch('/api/analyze-image', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      const a = data.analysis as ImageAnalysisResult;
      setAnalysis(a);
      if (a.locations.length > 0) {
        setSelected(
          a.locations.map((loc) => ({
            location: loc.location,
            method: loc.method,
          })),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAnalyzing(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bodyCode,
          color: color || undefined,
          locations: selected.map((s) => ({
            location: s.location,
            method: s.method || undefined,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setResult(data.result as EstimationResult);
      setMeta(data.meta as Meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px' }}>
      <h1>KUSOMEGANE 加工費推定 PoC</h1>
      <p style={{ color: '#555' }}>
        請求書 14 件・明細約 1,900 件を元にした推定エンジン（画像アップロード対応版）
      </p>

      <section
        style={{
          marginTop: 30,
          padding: 20,
          background: '#fff',
          border: '1px solid #e5e5e5',
          borderRadius: 8,
        }}
      >
        <h2 style={{ marginTop: 0 }}>① 合成商品画像（任意）</h2>
        <p style={{ color: '#666', fontSize: 14, marginTop: 0 }}>
          画像をアップロードすると Claude Vision が加工箇所・方法を自動判定して
          下のフォームに反映します。
        </p>
        <input type="file" accept="image/*" onChange={onImageChange} />
        {imagePreview && (
          <div style={{ marginTop: 16, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <img
              src={imagePreview}
              alt="アップロードされた画像"
              style={{ maxWidth: 240, border: '1px solid #ccc', borderRadius: 6 }}
            />
            <div style={{ flex: 1 }}>
              <button
                type="button"
                onClick={onAnalyze}
                disabled={analyzing || !imageFile}
                style={{
                  padding: '10px 16px',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                }}
              >
                {analyzing ? '解析中…' : 'この画像を解析する'}
              </button>
              {analysis && (
                <div style={{ marginTop: 12, fontSize: 14 }}>
                  <p>
                    <strong>ボディ観察:</strong> {analysis.bodyObservation || '（記載なし）'}
                    <br />
                    <strong>信頼度:</strong> {analysis.confidence}
                  </p>
                  {analysis.locations.length === 0 ? (
                    <p style={{ color: '#b91c1c' }}>
                      加工箇所が検出されませんでした。手動で追加してください。
                    </p>
                  ) : (
                    <ul style={{ paddingLeft: 20 }}>
                      {analysis.locations.map((loc, i) => (
                        <li key={i}>
                          <strong>
                            {loc.location} / {loc.method}
                          </strong>
                          （サイズ: {loc.sizeHint}）
                          <br />
                          <span style={{ color: '#666' }}>{loc.description}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <form
        onSubmit={onSubmit}
        style={{
          marginTop: 20,
          display: 'grid',
          gap: 16,
          padding: 20,
          background: '#fff',
          border: '1px solid #e5e5e5',
          borderRadius: 8,
        }}
      >
        <h2 style={{ marginTop: 0 }}>② ボディと加工箇所</h2>

        <div>
          <label>ボディ型番</label>
          <input
            type="text"
            value={bodyCode}
            onChange={(e) => setBodyCode(e.target.value)}
            placeholder="5001-01"
            required
            style={{ width: '100%', padding: 10, fontSize: 16, marginTop: 4 }}
          />
        </div>

        <div>
          <label>色（任意）</label>
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="ホワイト / カラー 等"
            style={{ width: '100%', padding: 10, fontSize: 16, marginTop: 4 }}
          />
        </div>

        <div>
          <label>加工箇所（複数可 / 画像解析で自動反映 / 手動編集可）</label>
          <div style={{ display: 'grid', gap: 8, marginTop: 4 }}>
            {selected.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 8 }}>
                <select
                  value={s.location}
                  onChange={(e) => updateLocation(i, 'location', e.target.value)}
                  style={{ flex: 1, padding: 10, fontSize: 15 }}
                >
                  {LOCATIONS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <select
                  value={s.method}
                  onChange={(e) => updateLocation(i, 'method', e.target.value)}
                  style={{ flex: 1, padding: 10, fontSize: 15 }}
                >
                  {METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeLocation(i)}
                  disabled={selected.length === 1}
                  aria-label="この行を削除"
                  style={{ padding: '0 14px' }}
                >
                  ×
                </button>
              </div>
            ))}
            <button type="button" onClick={addLocation} style={{ justifySelf: 'start' }}>
              + 加工箇所を追加
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 20px',
            fontSize: 16,
            background: '#111',
            color: '#fff',
            border: 'none',
          }}
        >
          {loading ? '推定中…' : '加工費を推定する'}
        </button>
      </form>

      {error && <p style={{ marginTop: 20, color: '#b91c1c' }}>エラー: {error}</p>}

      {meta && (
        <p style={{ marginTop: 20, color: '#666', fontSize: 14 }}>
          学習データ: {meta.invoices} 請求書 / {meta.lineItems.toLocaleString()} 明細 /{' '}
          {meta.products} 商品（番号付き） / {meta.bodyCodes} ボディレンジ
        </p>
      )}

      {result && (
        <section
          style={{
            marginTop: 20,
            padding: 20,
            background: '#fff',
            border: '1px solid #e5e5e5',
            borderRadius: 8,
          }}
        >
          <h2>推定結果</h2>
          <p>
            <strong>ボディ:</strong> {result.bodyPrice.bodyCode}
            {result.bodyPrice.color ? ` / ${result.bodyPrice.color}` : ''}
            <br />
            <strong>単価レンジ:</strong> ¥{result.bodyPrice.range}
          </p>

          <h3>加工費内訳</h3>
          <table style={{ width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ccc' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>箇所</th>
                <th style={{ textAlign: 'left', padding: 8 }}>方法</th>
                <th style={{ textAlign: 'right', padding: 8 }}>推定単価</th>
                <th style={{ textAlign: 'right', padding: 8 }}>信頼度</th>
                <th style={{ textAlign: 'right', padding: 8 }}>基づく件数</th>
              </tr>
            </thead>
            <tbody>
              {result.processing.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>{p.location}</td>
                  <td style={{ padding: 8 }}>{p.method}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>
                    ¥{p.estimatedPrice.toLocaleString()}
                  </td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{p.confidence}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{p.basedOn}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #ccc' }}>
                <td colSpan={2} style={{ padding: 8, fontWeight: 'bold' }}>
                  加工費小計
                </td>
                <td
                  colSpan={3}
                  style={{ padding: 8, textAlign: 'right', fontWeight: 'bold' }}
                >
                  ¥{result.subtotalProcessing.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>

          {result.totalMin !== undefined && result.totalMax !== undefined ? (
            <div
              style={{
                marginTop: 20,
                padding: 16,
                background: '#f0f9ff',
                border: '2px solid #0284c7',
                borderRadius: 8,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 13, color: '#0369a1', marginBottom: 4 }}>
                商品単価合計（ボディ + 加工費 / 1枚あたり）
              </div>
              <div
                style={{ fontSize: 28, fontWeight: 'bold', color: '#0c4a6e' }}
              >
                ¥{result.totalMin.toLocaleString()} 〜 ¥
                {result.totalMax.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                ※ サイズにより変動（ボディ ¥
                {result.bodyPrice.minPrice?.toLocaleString()}〜¥
                {result.bodyPrice.maxPrice?.toLocaleString()} + 加工費 ¥
                {result.subtotalProcessing.toLocaleString()}）
              </div>
            </div>
          ) : (
            <div
              style={{
                marginTop: 20,
                padding: 12,
                background: '#fff7ed',
                border: '1px solid #fb923c',
                borderRadius: 8,
                fontSize: 14,
                color: '#9a3412',
              }}
            >
              ボディ単価データが無いため、商品単価合計は算出できません。
              加工費のみ: ¥{result.subtotalProcessing.toLocaleString()}
            </div>
          )}

          {result.notes.length > 0 && (
            <ul style={{ marginTop: 16, color: '#666', fontSize: 14 }}>
              {result.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
