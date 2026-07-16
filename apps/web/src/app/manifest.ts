import { MetadataRoute } from 'next';

/**
 * Web App Manifest for Lucky TCG
 * Enables PWA features and defines app appearance
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Lucky TCG - Win Collectible Cards & Memorabilia',
    short_name: 'Lucky TCG',
    description:
      'Enter to win graded collectible cards (Pokemon, One Piece, sports) and memorabilia. UK-based prize competitions with a free entry route.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f2f0ec',
    theme_color: '#f2f0ec', // cream — matches the site background / layout theme-color
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
