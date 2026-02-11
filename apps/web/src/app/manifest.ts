import { MetadataRoute } from 'next';

/**
 * Web App Manifest for WinThisCard
 * Enables PWA features and defines app appearance
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WinThisCard - Win Collectible Cards & Memorabilia',
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
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/home-wide.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'WinThisCard Homepage',
      },
      {
        src: '/screenshots/home-narrow.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'WinThisCard Mobile Homepage',
      },
    ],
    shortcuts: [
      {
        name: 'View Competitions',
        short_name: 'Competitions',
        description: 'Browse all active competitions',
        url: '/competitions',
        icons: [
          {
            src: '/icons/shortcut-competitions.png',
            sizes: '96x96',
            type: 'image/png',
          },
        ],
      },
      {
        name: 'My Tickets',
        short_name: 'Tickets',
        description: 'View your purchased tickets',
        url: '/account/my-tickets',
        icons: [
          {
            src: '/icons/shortcut-tickets.png',
            sizes: '96x96',
            type: 'image/png',
          },
        ],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}
