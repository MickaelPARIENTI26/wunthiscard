import { MetadataRoute } from 'next';

/**
 * Web App Manifest for WinUCard
 * Enables PWA features and defines app appearance
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WinUCard - Win Collectible Cards & Memorabilia',
    short_name: 'WTC',
    description:
      'Enter to win rare Pokemon cards, One Piece TCG, sports memorabilia and more. UK-based prize competitions with free entry route available.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1e40af', // Blue-800 for primary brand colour
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'en-GB',
    categories: ['entertainment', 'games', 'shopping'],
    icons: [
      {
        src: '/icons/icon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        src: '/icons/icon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
