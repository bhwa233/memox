import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Memox',
    short_name: 'Memox',
    description: 'Quick notes, powered by lark',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: 'icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
