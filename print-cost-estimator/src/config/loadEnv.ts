import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * `.env` ファイルを読み込み、process.env に展開する（外部依存ゼロ）。
 * 既に環境変数が設定されていればそちらを優先（override しない）。
 *
 * 使い方: バッチスクリプトやテスト setup からプロセス起動時に 1 度呼ぶ。
 */
export function loadEnv(): void {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const envPath = resolve(__dirname, '..', '..', '.env');

  try {
    const envText = readFileSync(envPath, 'utf-8');
    for (const rawLine of envText.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIndex = line.indexOf('=');
      if (eqIndex === -1) continue;
      const key = line.slice(0, eqIndex).trim();
      const value = line.slice(eqIndex + 1).trim();
      if (key && !(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env が無くても静かに続行（CI や純関数テスト用途）
  }
}
