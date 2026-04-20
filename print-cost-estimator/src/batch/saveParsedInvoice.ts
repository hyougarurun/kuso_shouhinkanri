import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { ParsedInvoice } from '../types.js';

export async function saveParsedInvoice(
  invoice: ParsedInvoice,
  outputDir: string,
): Promise<string> {
  await mkdir(outputDir, { recursive: true });
  const filePath = resolve(outputDir, `${invoice.sourceFile}.json`);
  await writeFile(filePath, JSON.stringify(invoice, null, 2), 'utf-8');
  return filePath;
}
