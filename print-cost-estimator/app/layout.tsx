import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'KUSOMEGANE 加工費推定 PoC',
  description: '請求書学習ベースの加工費推定エンジン',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
