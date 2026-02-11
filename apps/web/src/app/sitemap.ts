import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

const BASE_URL = 'https://winthiscard.com';

/**
 * Dynamic sitemap generation for WinThisCard
 * Includes all public pages and competition detail pages
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages with their priorities and change frequencies
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/competitions`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/winners`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cookies`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/competition-rules`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ];

  // Fetch ACTIVE and COMPLETED competitions from database
  let competitionPages: MetadataRoute.Sitemap = [];

  try {
    const competitions = await prisma.competition.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'COMPLETED', 'SOLD_OUT'],
        },
      },
      select: {
        slug: true,
        updatedAt: true,
        status: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    competitionPages = competitions.map((competition) => ({
      url: `${BASE_URL}/competitions/${competition.slug}`,
      lastModified: competition.updatedAt,
      changeFrequency: competition.status === 'ACTIVE' ? 'hourly' : 'weekly' as const,
      priority: competition.status === 'ACTIVE' ? 0.9 : 0.6,
    }));
  } catch (error) {
    // If database is unavailable, continue with static pages only
    console.error('Error fetching competitions for sitemap:', error);
  }

  return [...staticPages, ...competitionPages];
}
