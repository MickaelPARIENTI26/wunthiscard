import { MetadataRoute } from 'next';

const BASE_URL = 'https://winthiscard.com';

/**
 * Robots.txt configuration for WinThisCard
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/profile',
          '/my-tickets',
          '/my-wins',
          '/addresses',
          '/settings',
          '/checkout/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
