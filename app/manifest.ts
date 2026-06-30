import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MoneyTracker — บันทึกรายรับรายจ่าย',
    short_name: 'MoneyTracker',
    description:
      'แอปบันทึกรายรับ-รายจ่าย หนี้สิน การลงทุน ทรัพย์สิน และวางแผนการเงินส่วนบุคคล',
    lang: 'th',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0b0f1a',
    theme_color: '#0b0f1a',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
