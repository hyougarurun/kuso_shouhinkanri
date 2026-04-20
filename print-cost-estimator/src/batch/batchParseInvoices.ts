import { parseInvoicePdf } from '../parser/parseInvoicePdf.js';
import { saveParsedInvoice } from './saveParsedInvoice.js';
import type { ParsedInvoice } from '../types.js';

export type BatchItemResult =
  | {
      status: 'success';
      path: string;
      savedTo: string;
      invoice: ParsedInvoice;
    }
  | {
      status: 'failure';
      path: string;
      error: string;
    };

export type BatchResult = {
  total: number;
  successes: BatchItemResult[];
  failures: BatchItemResult[];
};

export type BatchOptions = {
  onProgress?: (index: number, total: number, path: string) => void;
};

export async function batchParseInvoices(
  pdfPaths: string[],
  outputDir: string,
  options: BatchOptions = {},
): Promise<BatchResult> {
  const successes: BatchItemResult[] = [];
  const failures: BatchItemResult[] = [];

  for (let i = 0; i < pdfPaths.length; i++) {
    const path = pdfPaths[i];
    options.onProgress?.(i, pdfPaths.length, path);

    try {
      const invoice = await parseInvoicePdf(path);
      const savedTo = await saveParsedInvoice(invoice, outputDir);
      successes.push({ status: 'success', path, savedTo, invoice });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failures.push({ status: 'failure', path, error: message });
    }
  }

  return {
    total: pdfPaths.length,
    successes,
    failures,
  };
}
