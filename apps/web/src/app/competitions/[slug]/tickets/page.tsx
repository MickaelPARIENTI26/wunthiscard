import { redirect } from 'next/navigation';

interface PageParams {
  slug: string;
}

/**
 * Legacy ticket-selection route. The current funnel selects tickets directly on the
 * competition detail page (/competitions/[slug], the SimpleTicketSelector). This route
 * is kept only so old links / bookmarks / browser Back-button history don't 404 or land
 * on the retired off-brand selector — it just redirects to the competition page.
 */
export default async function LegacyTicketsRedirect({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug } = await params;
  redirect(`/competitions/${slug}`);
}
