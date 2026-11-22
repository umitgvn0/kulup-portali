import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'İnegöl Gençlergücü SK | Kulüp Portalı',
  description: 'Maç takvimi, canlı skorlar, oyuncu kadrosu ve kulüp duyuruları.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Gençlergücü',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="bg-slate-200 antialiased">{children}</body>
    </html>
  );
}