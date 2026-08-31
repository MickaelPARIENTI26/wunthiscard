import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateCSV, sanitizeCell } from '@/lib/export';
import { getClientIp } from '@/lib/get-client-ip';
import {
  fetchAllWheelSpins,
  WHEEL_EXPORT_COLUMNS,
  WheelExportTooLargeError,
} from '@/lib/wheel-results';
import * as XLSX from 'xlsx';

/**
 * Every spin of a competition's wheel, for the operator's records.
 *
 * The Wheel Results card only ever shows the most recent page; this is the
 * complete list. The rows and columns live in lib/wheel-results so they can be
 * tested directly — this route is only auth, audit and file format.
 */
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-').substring(0, 50);
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get('competitionId');
    const format = searchParams.get('format') ?? 'csv';

    if (!competitionId) {
      return NextResponse.json({ error: 'competitionId is required' }, { status: 400 });
    }

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { id: true, title: true },
    });
    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    const spins = await fetchAllWheelSpins(competition.id);

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `WinUPrize-${competition.id}-${sanitizeFilename(competition.title)}-wheel-${dateStr}`;

    // Every export of personal data is logged — same rule as participants.
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DATA_EXPORT_WHEEL',
        entity: 'competition',
        entityId: competition.id,
        metadata: {
          exportedCount: spins.length,
          format,
          competitionTitle: competition.title,
          filename,
        },
        ipAddress: getClientIp(request.headers),
      },
    });

    if (format === 'xlsx') {
      const data = spins.map((row) =>
        Object.fromEntries(
          WHEEL_EXPORT_COLUMNS.map((col) => [col.header, sanitizeCell(col.accessor(row))])
        )
      );
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Wheel');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        },
      });
    }

    const csv = generateCSV(
      spins as unknown as Record<string, unknown>[],
      WHEEL_EXPORT_COLUMNS as Parameters<typeof generateCSV>[1]
    );

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof WheelExportTooLargeError) {
      console.error('Wheel export aborted (too large):', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error exporting wheel spins:', error);
    return NextResponse.json({ error: 'Failed to export wheel spins' }, { status: 500 });
  }
}
