import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'İnegöl Gençlergücü SK Resmi Portalı',
    short_name: 'Gençlergücü',
    description: 'İnegöl Gençlergücü Spor Kulübü (1977) maç takvimi, canlı skorlar, kadro ve kulüp duyuruları.',
    start_url: '/',
    display: 'standalone',
    background_color: '#18181b',
    theme_color: '#18181b',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/icon-512.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  };
}