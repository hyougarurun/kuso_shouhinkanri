'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import type {
  EstimationResult,
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
    { location: 'back', method: 'ink_print' },
  ]);
  const [result, setResult] = useState<EstimationResult | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
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
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setResult(data.result as EstimationResult);
      setMeta(data.meta as Meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 860, margin: '40px auto', padding: '0 20px' }}>
      <h1>KUSOMEGANE 加工費推定 PoC</h1>
      <p style={{ color: '#555' }}>
        請求書 14 件・明細約 1,900 件を元にした推定エンジン（画像なしルールベース版）
      </p>

      <form
        onSubmit={onSubmit}
        style={{
          marginTop: 30,
          display: 'grid',
          gap: 16,
          padding: 20,
          background: '#fff',
          border: '1px solid #e5e5e5',
          borderRadius: 8,
        }}
      >
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
          <label>加工箇所（複数可）</label>
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

      {error && (
        <p style={{ marginTop: 20, color: '#b91c1c' }}>エラー: {error}</p>
      )}

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
