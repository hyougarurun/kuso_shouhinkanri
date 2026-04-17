/**
 * PoC 対象の請求書 PDF 一覧。
 * 詳細: docs/design-notes/print-cost-estimation.md §4
 *
 * md5 重複チェック済み（KUSOMEGANE様1月納品分ご請求金額(1).pdf は除外）。
 * 同月に複数ファイルがあるものは、全部バッチ処理して内容で区別する。
 */

export type InvoiceSource = {
  path: string;
  label: string;
  expectedMonth: string;
};

const DOWNLOADS = '/Users/mega/Downloads';

export const INVOICE_CATALOG: InvoiceSource[] = [
  {
    path: `${DOWNLOADS}/KUSOMEGA様9月ご注文分ご請求書.pdf`,
    label: '2024-09-order',
    expectedMonth: '2024/09',
  },
  {
    path: `${DOWNLOADS}/megamegakun_20240531-20250331/KUSOMEGANE様-11月納品分ご請求書.pdf`,
    label: '2024-11-delivery-a',
    expectedMonth: '2024/11',
  },
  {
    path: `${DOWNLOADS}/KUSOMEGANE様11月納品分ご請求金額.pdf`,
    label: '2024-11-delivery-b',
    expectedMonth: '2024/11',
  },
  {
    path: `${DOWNLOADS}/KUSOMEGANE様-12月納品分ご請求書.pdf`,
    label: '2024-12-delivery',
    expectedMonth: '2024/12',
  },
  {
    path: `${DOWNLOADS}/KUSOMEGANE様12月ご注文分ご請求金額.pdf`,
    label: '2024-12-order',
    expectedMonth: '2024/12',
  },
  {
    path: `${DOWNLOADS}/KUSOMEGANE様202501.pdf`,
    label: '2025-01-a',
    expectedMonth: '2025/01',
  },
  {
    path: `${DOWNLOADS}/KUSOMEGANE様_1月納品分御請求書.pdf`,
    label: '2025-01-b',
    expectedMonth: '2025/01',
  },
  {
    path: `${DOWNLOADS}/KUSOMEGANE様202502.pdf`,
    label: '2025-02-a',
    expectedMonth: '2025/02',
  },
  {
    path: `${DOWNLOADS}/KUSOMEGANE様-2月納品分御請求書.pdf`,
    label: '2025-02-b',
    expectedMonth: '2025/02',
  },
  {
    path: `${DOWNLOADS}/KUSOMEGANE様2月納品分ご請求金額.pdf`,
    label: '2025-02-c',
    expectedMonth: '2025/02',
  },
  {
    path: `${DOWNLOADS}/KUSOMEGANE様_5月納品分御請求書.pdf`,
    label: '2025-05-delivery',
    expectedMonth: '2025/05',
  },
  {
    path: `${DOWNLOADS}/KUSOMEGANE様_6月納品分御請求書.pdf`,
    label: '2025-06-delivery',
    expectedMonth: '2025/06',
  },
  {
    path: `${DOWNLOADS}/KUSOMEGANE様8月発注分請求書.pdf`,
    label: '2025-08-order',
    expectedMonth: '2025/08',
  },
  {
    path: `${DOWNLOADS}/KUSOMEGANE様1月納品分ご請求金額.pdf`,
    label: '2026-01-delivery',
    expectedMonth: '2026/01',
  },
];
