import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function tokenFrom(request: Request): string | null {
  return new URL(request.url).searchParams.get('token');
}

/**
 * One-click unsubscribe endpoint (RFC 8058). Mail providers (Gmail/Outlook) POST
 * here when the user hits their native "Unsubscribe" button — no login, no
 * confirmation screen. Always responds 200 so the provider marks it handled.
 */
export async function POST(request: Request) {
  const token = tokenFrom(request);
  if (token) {
    await prisma.user.updateMany({
      where: { unsubscribeToken: token },
      data: { emailMarketing: false },
    });
  }
  return new NextResponse(null, { status: 200 });
}

// A GET (e.g. a link-scanner following the header URL) just forwards to the
// human confirmation page — it must NOT silently unsubscribe on GET.
export async function GET(request: Request) {
  const token = tokenFrom(request) ?? '';
  return NextResponse.redirect(new URL(`/unsubscribe?token=${encodeURIComponent(token)}`, request.url));
}
