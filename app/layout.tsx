import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Thai, Inter } from 'next/font/google';
import './globals.css';
import { getActiveTheme } from '@/lib/theme';
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register';

const notoThai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  variable: '--font-noto-thai',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MoneyTracker — บันทึกรายรับรายจ่าย',
  description: 'แอปบันทึกรายรับ-รายจ่ายส่วนบุคคล',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MoneyTracker',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0f1a',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read theme on the server so <html data-theme> is correct before first paint.
  const theme = await getActiveTheme();

  return (
    <html
      lang="th"
      data-theme={theme}
      className={`${notoThai.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
