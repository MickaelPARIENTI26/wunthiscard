'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { generateSlug } from '@winucard/shared';
import type { CompetitionStatus } from '@winucard/database';
import Stripe from 'stripe';
import { sendCancellationNotificationEmail } from '@/lib/email';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' })
  : null;

export async function createCompetition(formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized');
  }

  const title = formData.get('title') as string;
  const subtitle = formData.get('subtitle') as string | null;
  const descriptionShort = formData.get('descriptionShort') as string;
  const descriptionLong = formData.get('descriptionLong') as string;
  const category = formData.get('category') as string;
  const subcategory = formData.get('subcategory') as string | null;
  const isFree = formData.get('isFree') === 'true';
  const drawType = (formData.get('drawType') as string) || 'single';
  const prizesStr = formData.get('prizes') as string | null;
  let prizes = null;
  if (prizesStr) {
    try { prizes = JSON.parse(prizesStr); } catch { throw new Error('Invalid prizes format'); }
  }
  const prizeValue = parseFloat(formData.get('prizeValue') as string);
  const ticketPrice = isFree ? 0 : parseFloat(formData.get('ticketPrice') as string);
  const unlimitedParticipants = formData.get('unlimitedParticipants') === 'true';
  const totalTicketsRaw = formData.get('totalTickets') as string;
  const totalTickets = (isFree && unlimitedParticipants) ? null : parseInt(totalTicketsRaw);
  const maxTicketsPerUser = parseInt(formData.get('maxTicketsPerUser') as string) || (isFree ? 1 : 0); // 0 = unlimited
  const saleStartDate = formData.get('saleStartDate') as string | null;
  const drawDate = formData.get('drawDate') as string;
  const mainImageUrl = formData.get('mainImageUrl') as string;
  const galleryUrlsStr = formData.get('galleryUrls') as string;
  const videoUrl = formData.get('videoUrl') as string | null;
  const certificationNumber = formData.get('certificationNumber') as string | null;
  const grade = formData.get('grade') as string | null;
  const condition = formData.get('condition') as string | null;
  const provenance = formData.get('provenance') as string | null;
  const questionText = formData.get('questionText') as string;
  const questionChoicesStr = formData.get('questionChoices') as string;
  const questionAnswer = parseInt(formData.get('questionAnswer') as string);
  const metaTitle = formData.get('metaTitle') as string | null;
  const metaDescription = formData.get('metaDescription') as string | null;

  // Mystery card fields
  const isMystery = formData.get('isMystery') === 'true';
  const minimumValueStr = formData.get('minimumValue') as string | null;
  const minimumValue = minimumValueStr ? parseFloat(minimumValueStr) : null;
  const teaser = formData.get('teaser') as string | null;
  const realTitle = formData.get('realTitle') as string | null;
  const realValueStr = formData.get('realValue') as string | null;
  const realValue = realValueStr ? parseFloat(realValueStr) : null;
  const realImagesStr = formData.get('realImages') as string | null;
  const realImages = realImagesStr ? realImagesStr.split(',').map(s => s.trim()).filter(Boolean) : [];
  const realCertification = formData.get('realCertification') as string | null;
  const realGrade = formData.get('realGrade') as string | null;

  const galleryUrls = galleryUrlsStr ? galleryUrlsStr.split(',').map(s => s.trim()).filter(Boolean) : [];

  let questionChoices: string[];
  try {
    questionChoices = JSON.parse(questionChoicesStr || '[]') as string[];
  } catch {
    throw new Error('Invalid question choices format');
  }

  if (typeof prizes === 'string') {
    try {
      JSON.parse(prizes);
    } catch {
      throw new Error('Invalid prizes format');
    }
  }

  // Validation
  const errors: string[] = [];

  // P1-62: Title required
  if (!title || title.trim().length === 0) {
    errors.push('Title is required');
  }

  // P1-63, P1-64: Ticket price validation (paid competitions only)
  if (!isFree && (isNaN(ticketPrice) || ticketPrice < 1)) {
    errors.push('Ticket price must be at least £1');
  }

  // P1-65: Total tickets must be positive (unless unlimited free)
  if (!unlimitedParticipants && (totalTickets === null || isNaN(totalTickets) || totalTickets < 1)) {
    errors.push('Total tickets must be at least 1');
  }

  // P0: Cap total tickets at the shared validator's bound (createCompetitionSchema:
  // totalTickets.max(100000)). The participant export (draw manifest) is sized to
  // this ceiling, so allowing more here would let the export silently truncate.
  if (totalTickets !== null && !isNaN(totalTickets) && totalTickets > 100000) {
    errors.push('Total tickets cannot exceed 100,000');
  }

  // P1-66: Main image required
  if (!mainImageUrl || mainImageUrl.trim().length === 0) {
    errors.push('Main image is required');
  }

  // P1-67: QCM question required
  if (!questionText || questionText.trim().length === 0) {
    errors.push('Skill question is required');
  }

  // P1-68: Must have exactly 4 choices
  const validChoices = questionChoices.filter(c => c && c.trim().length > 0);
  if (validChoices.length !== 4) {
    errors.push('Skill question must have exactly 4 answer choices');
  }

  // P1-69: Answer must be valid (0-3)
  if (isNaN(questionAnswer) || questionAnswer < 0 || questionAnswer > 3) {
    errors.push('Please select a correct answer');
  }

  // P1-70: Draw date must be in the future
  const drawDateObj = new Date(drawDate);
  if (isNaN(drawDateObj.getTime()) || drawDateObj <= new Date()) {
    errors.push('Draw date must be in the future');
  }

  // P1-71: Sale start date must be before draw date
  if (saleStartDate) {
    const saleStartDateObj = new Date(saleStartDate);
    if (saleStartDateObj >= drawDateObj) {
      errors.push('Sale start date must be before draw date');
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('. '));
  }

  const slug = generateSlug(title);

  // Check for unique slug
  let uniqueSlug = slug;
  let counter = 1;
  while (await prisma.competition.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  const competition = await prisma.competition.create({
    data: {
      slug: uniqueSlug,
      title,
      subtitle,
      descriptionShort,
      descriptionLong,
      category: category as never,
      subcategory,
      status: 'DRAFT',
      isFree,
      drawType,
      prizes: prizes ?? undefined,
      prizeValue,
      ticketPrice,
      totalTickets,
      maxTicketsPerUser,
      saleStartDate: saleStartDate ? new Date(saleStartDate) : null,
      drawDate: new Date(drawDate),
      mainImageUrl,
      galleryUrls,
      videoUrl,
      certificationNumber,
      grade,
      condition,
      provenance,
      questionText,
      questionChoices,
      questionAnswer,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || descriptionShort,
      // Mystery card fields
      isMystery,
      isRevealed: false,
      minimumValue: isMystery && minimumValue !== null ? minimumValue : null,
      teaser: isMystery ? teaser : null,
      realTitle: isMystery ? realTitle : null,
      realValue: isMystery && realValue !== null ? realValue : null,
      realImages: isMystery ? realImages : [],
      realCertification: isMystery ? realCertification : null,
      realGrade: isMystery ? realGrade : null,
    },
  });

  // Log action
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'COMPETITION_CREATED',
      entity: 'competition',
      entityId: competition.id,
      metadata: { title },
    },
  });

  revalidatePath('/dashboard/competitions');
  redirect(`/dashboard/competitions/${competition.id}`);
}

export async function updateCompetition(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized');
  }

  // Fetch existing competition to preserve values for fields not in form data
  const existing = await prisma.competition.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Competition not found');
  }

  const title = formData.get('title') as string;
  const subtitle = formData.get('subtitle') as string | null;
  const descriptionShort = formData.get('descriptionShort') as string;
  const descriptionLong = formData.get('descriptionLong') as string;
  const category = formData.get('category') as string;
  const subcategory = formData.get('subcategory') as string | null;
  const isFree = formData.get('isFree') === 'true';
  const drawType = (formData.get('drawType') as string) || existing.drawType;
  const prizesStr = formData.get('prizes') as string | null;
  let prizes = drawType === 'multi' ? existing.prizes : null;
  if (prizesStr) {
    try { prizes = JSON.parse(prizesStr); } catch { throw new Error('Invalid prizes format'); }
  }
  const prizeValue = parseFloat(formData.get('prizeValue') as string);
  const ticketPrice = isFree ? 0 : parseFloat(formData.get('ticketPrice') as string);
  const unlimitedParticipants = formData.get('unlimitedParticipants') === 'true';
  const totalTicketsRaw = formData.get('totalTickets') as string;
  const totalTickets = (isFree && unlimitedParticipants) ? null : parseInt(totalTicketsRaw);
  const maxTicketsPerUser = parseInt(formData.get('maxTicketsPerUser') as string) || (isFree ? 1 : 0); // 0 = unlimited
  const saleStartDate = formData.get('saleStartDate') as string | null;
  const drawDate = formData.get('drawDate') as string;
  const mainImageUrl = (formData.get('mainImageUrl') as string) || existing.mainImageUrl;
  const galleryUrlsStr = formData.get('galleryUrls') as string;
  const videoUrl = formData.get('videoUrl') as string | null;
  const certificationNumber = formData.get('certificationNumber') as string | null;
  const grade = formData.get('grade') as string | null;
  const condition = formData.get('condition') as string | null;
  const provenance = formData.get('provenance') as string | null;
  const questionText = (formData.get('questionText') as string) || existing.questionText;
  const questionChoicesStr = formData.get('questionChoices') as string;
  const questionAnswerStr = formData.get('questionAnswer') as string;
  const questionAnswer = questionAnswerStr ? parseInt(questionAnswerStr) : existing.questionAnswer;
  const metaTitle = formData.get('metaTitle') as string | null;
  const metaDescription = formData.get('metaDescription') as string | null;

  // Mystery card fields
  const isMystery = formData.get('isMystery') === 'true';
  const minimumValueStr = formData.get('minimumValue') as string | null;
  const minimumValue = minimumValueStr ? parseFloat(minimumValueStr) : null;
  const teaser = formData.get('teaser') as string | null;
  const realTitle = formData.get('realTitle') as string | null;
  const realValueStr = formData.get('realValue') as string | null;
  const realValue = realValueStr ? parseFloat(realValueStr) : null;
  const realImagesStr = formData.get('realImages') as string | null;
  const realImages = realImagesStr ? realImagesStr.split(',').map(s => s.trim()).filter(Boolean) : [];
  const realCertification = formData.get('realCertification') as string | null;
  const realGrade = formData.get('realGrade') as string | null;

  const galleryUrls = galleryUrlsStr ? galleryUrlsStr.split(',').map(s => s.trim()).filter(Boolean) : existing.galleryUrls;
  let questionChoices = existing.questionChoices;
  if (questionChoicesStr) {
    try { questionChoices = JSON.parse(questionChoicesStr); } catch { throw new Error('Invalid question choices format'); }
  }

  // P0: Cap total tickets at the shared validator's bound (createCompetitionSchema:
  // totalTickets.max(100000)). The participant export (draw manifest) is sized to
  // this ceiling, so allowing more here would let the export silently truncate.
  if (totalTickets !== null) {
    if (isNaN(totalTickets) || totalTickets < 1) {
      throw new Error('Total tickets must be at least 1');
    }
    if (totalTickets > 100000) {
      throw new Error('Total tickets cannot exceed 100,000');
    }
  }

  // P1-6: totalTickets controls how many Ticket rows are generated on the
  // UPCOMING -> ACTIVE transition. Once a competition leaves DRAFT/UPCOMING the
  // Ticket inventory is fixed, so changing totalTickets afterwards corrupts
  // inventory (raising = phantom unsellable capacity, lowering below sold =
  // negative remaining). Only allow it while the inventory has not been minted yet.
  const totalTicketsChanged = totalTickets !== existing.totalTickets;
  if (totalTicketsChanged && existing.status !== 'DRAFT' && existing.status !== 'UPCOMING') {
    throw new Error(
      'Total tickets can only be changed while the competition is in DRAFT or UPCOMING status. ' +
        'The ticket inventory is locked once the competition becomes active.',
    );
  }

  await prisma.competition.update({
    where: { id },
    data: {
      title,
      subtitle,
      descriptionShort,
      descriptionLong,
      category: category as never,
      subcategory,
      isFree,
      drawType,
      prizes: prizes ?? undefined,
      prizeValue,
      ticketPrice,
      totalTickets,
      maxTicketsPerUser,
      saleStartDate: saleStartDate ? new Date(saleStartDate) : null,
      drawDate: new Date(drawDate),
      mainImageUrl,
      galleryUrls,
      videoUrl,
      certificationNumber,
      grade,
      condition,
      provenance,
      questionText,
      questionChoices: questionChoices as string[],
      questionAnswer: isNaN(questionAnswer) ? existing.questionAnswer : questionAnswer,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || descriptionShort,
      // Mystery card fields
      isMystery,
      minimumValue: isMystery && minimumValue !== null ? minimumValue : null,
      teaser: isMystery ? teaser : null,
      realTitle: isMystery ? realTitle : null,
      realValue: isMystery && realValue !== null ? realValue : null,
      realImages: isMystery ? realImages : [],
      realCertification: isMystery ? realCertification : null,
      realGrade: isMystery ? realGrade : null,
    },
  });

  // Log action
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'COMPETITION_UPDATED',
      entity: 'competition',
      entityId: id,
      metadata: { title },
    },
  });

  revalidatePath('/dashboard/competitions');
  revalidatePath(`/dashboard/competitions/${id}`);
  redirect(`/dashboard/competitions/${id}`);
}

export async function updateCompetitionStatus(id: string, status: CompetitionStatus) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized');
  }

  const competition = await prisma.competition.findUnique({ where: { id } });
  if (!competition) {
    throw new Error('Competition not found');
  }

  const oldStatus = competition.status;

  // Validate status transitions
  const validTransitions: Record<string, string[]> = {
    DRAFT: ['UPCOMING'],
    UPCOMING: ['ACTIVE', 'DRAFT'],
    ACTIVE: ['SOLD_OUT', 'DRAWING', 'CANCELLED'],
    SOLD_OUT: ['DRAWING', 'CANCELLED'],
    DRAWING: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
  };

  if (!validTransitions[oldStatus]?.includes(status)) {
    throw new Error(`Invalid status transition from ${oldStatus} to ${status}`);
  }

  // Additional validation when activating
  if (status === 'ACTIVE') {
    // P1-93: Must have draw date
    if (!competition.drawDate) {
      throw new Error('Cannot activate: Draw date is required');
    }
    // P1-94: Must have QCM question
    if (!competition.questionText || !competition.questionChoices || (competition.questionChoices as string[]).length !== 4) {
      throw new Error('Cannot activate: Skill question with 4 choices is required');
    }
  }

  // If activating, create tickets (only for paid competitions with a defined ticket count)
  if (status === 'ACTIVE' && oldStatus === 'UPCOMING' && competition.totalTickets !== null) {
    const existingTickets = await prisma.ticket.count({ where: { competitionId: id } });
    if (existingTickets === 0) {
      const tickets = [];
      for (let i = 1; i <= competition.totalTickets; i++) {
        tickets.push({
          competitionId: id,
          ticketNumber: i,
        });
      }
      await prisma.ticket.createMany({ data: tickets });
    }
  }

  await prisma.competition.update({
    where: { id },
    data: { status },
  });

  // Log action
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'COMPETITION_STATUS_CHANGED',
      entity: 'competition',
      entityId: id,
      metadata: { oldStatus, newStatus: status },
    },
  });

  revalidatePath('/dashboard/competitions');
  revalidatePath(`/dashboard/competitions/${id}`);
}

export async function deleteCompetition(id: string) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized');
  }

  const competition = await prisma.competition.findUnique({ where: { id } });
  if (!competition) {
    throw new Error('Competition not found');
  }

  if (competition.status !== 'DRAFT') {
    throw new Error('Only draft competitions can be deleted');
  }

  await prisma.competition.delete({ where: { id } });

  // Log action
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'COMPETITION_DELETED',
      entity: 'competition',
      entityId: id,
      metadata: { title: competition.title },
    },
  });

  revalidatePath('/dashboard/competitions');
}

export async function duplicateCompetition(id: string) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized');
  }

  const original = await prisma.competition.findUnique({ where: { id } });
  if (!original) {
    throw new Error('Competition not found');
  }

  const newTitle = `${original.title} (Copy)`;
  const slug = generateSlug(newTitle);

  // Check for unique slug
  let uniqueSlug = slug;
  let counter = 1;
  while (await prisma.competition.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  const competition = await prisma.competition.create({
    data: {
      slug: uniqueSlug,
      title: newTitle,
      subtitle: original.subtitle,
      descriptionShort: original.descriptionShort,
      descriptionLong: original.descriptionLong,
      category: original.category,
      subcategory: original.subcategory,
      status: 'DRAFT',
      isFree: original.isFree,
      drawType: original.drawType,
      prizes: original.prizes ?? undefined,
      prizeValue: original.prizeValue,
      ticketPrice: original.ticketPrice,
      totalTickets: original.totalTickets,
      maxTicketsPerUser: original.maxTicketsPerUser,
      saleStartDate: null,
      drawDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      mainImageUrl: original.mainImageUrl,
      galleryUrls: original.galleryUrls,
      videoUrl: original.videoUrl,
      certificationNumber: original.certificationNumber,
      grade: original.grade,
      condition: original.condition,
      provenance: original.provenance,
      questionText: original.questionText,
      questionChoices: original.questionChoices as string[],
      questionAnswer: original.questionAnswer,
      metaTitle: original.metaTitle,
      metaDescription: original.metaDescription,
      // Mystery card fields — copy but always reset isRevealed
      isMystery: original.isMystery,
      isRevealed: false,
      minimumValue: original.minimumValue,
      teaser: original.teaser,
      realTitle: original.realTitle,
      realValue: original.realValue,
      realImages: original.realImages,
      realCertification: original.realCertification,
      realGrade: original.realGrade,
    },
  });

  // Log action
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'COMPETITION_CREATED',
      entity: 'competition',
      entityId: competition.id,
      metadata: { title: newTitle, duplicatedFrom: id },
    },
  });

  revalidatePath('/dashboard/competitions');
  redirect(`/dashboard/competitions/${competition.id}/edit`);
}

interface CancelCompetitionResult {
  success: boolean;
  error?: string;
  refundedCount?: number;
  refundedAmount?: number;
  /** Order ids whose Stripe refund failed and could not be marked REFUNDED. */
  failedRefundOrderIds?: string[];
}

export async function cancelCompetition(id: string, reason: string): Promise<CancelCompetitionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Only SUPER_ADMIN can cancel competitions' };
  }

  const competition = await prisma.competition.findUnique({
    where: { id },
    include: {
      orders: {
        where: {
          paymentStatus: 'SUCCEEDED',
        },
        select: {
          id: true,
          stripePaymentIntentId: true,
          totalAmount: true,
          user: {
            select: {
              email: true,
              firstName: true,
            },
          },
        },
      },
      wins: true,
    },
  });

  if (!competition) {
    return { success: false, error: 'Competition not found' };
  }

  // Can't cancel a completed competition
  if (competition.status === 'COMPLETED') {
    return { success: false, error: 'Cannot cancel a completed competition' };
  }

  // Can't cancel if already cancelled
  if (competition.status === 'CANCELLED') {
    return { success: false, error: 'Competition is already cancelled' };
  }

  // Can't cancel if there's already a winner
  if (competition.wins.length > 0) {
    return { success: false, error: 'Cannot cancel a competition with a winner' };
  }

  let refundedCount = 0;
  let refundedAmount = 0;
  const refundErrors: string[] = [];

  // P1-5: Refunds must be idempotent and replayable so a retry (e.g. after a
  // partial failure) never double-refunds. The Order model has no stripeRefundId
  // column, so we record the returned Stripe refund id in an audit-log entry and
  // use order.paymentStatus === 'REFUNDED' as the skip guard.
  for (const order of competition.orders) {
    // Re-read the live payment status immediately before refunding. The status
    // selected in the include above may be stale on a retry; this guarantees an
    // already-refunded order is skipped and the Stripe refund is never issued twice.
    const current = await prisma.order.findUnique({
      where: { id: order.id },
      select: { paymentStatus: true },
    });

    // Already refunded (e.g. on a previous attempt) — skip without contacting Stripe.
    if (!current || current.paymentStatus === 'REFUNDED') {
      continue;
    }

    if (order.stripePaymentIntentId && stripe) {
      try {
        // Create a full refund. Stripe also de-duplicates server-side, but the
        // status guard above already prevents a second call for the same order.
        const refund = await stripe.refunds.create({
          payment_intent: order.stripePaymentIntentId,
          reason: 'requested_by_customer',
        });

        // Mark the order refunded and record the Stripe refund id in the audit log
        // (no stripeRefundId column exists on Order). Done together so the order is
        // never flipped to REFUNDED without a recorded refund id.
        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'REFUNDED' },
          }),
          prisma.auditLog.create({
            data: {
              userId: session.user.id,
              action: 'ORDER_REFUNDED',
              entity: 'order',
              entityId: order.id,
              metadata: {
                competitionId: id,
                stripeRefundId: refund.id,
                stripePaymentIntentId: order.stripePaymentIntentId,
                amount: Number(order.totalAmount),
              },
            },
          }),
        ]);

        refundedCount++;
        refundedAmount += Number(order.totalAmount);
      } catch (error) {
        console.error(`Failed to refund order ${order.id}:`, error);
        refundErrors.push(order.id);
      }
    } else {
      // No Stripe payment intent (e.g. free entry) — just mark as refunded.
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'REFUNDED' },
      });
      refundedCount++;
      refundedAmount += Number(order.totalAmount);
    }
  }

  // P1-5: If any refund failed, do NOT silently cancel the competition. Return
  // the failed order ids so the caller can surface them and retry. The retry is
  // safe: orders already marked REFUNDED above are skipped before any Stripe call,
  // so only the failed orders are re-attempted, and the competition is only
  // cancelled once every refund has gone through.
  if (refundErrors.length > 0) {
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'COMPETITION_CANCEL_REFUNDS_FAILED',
        entity: 'competition',
        entityId: id,
        metadata: {
          competitionTitle: competition.title,
          reason,
          ordersRefunded: refundedCount,
          amountRefunded: refundedAmount,
          failedRefundOrderIds: refundErrors,
          timestamp: new Date().toISOString(),
        },
      },
    });

    revalidatePath('/dashboard/competitions');
    revalidatePath(`/dashboard/competitions/${id}`);

    return {
      success: false,
      refundedCount,
      refundedAmount,
      failedRefundOrderIds: refundErrors,
      error: `${refundErrors.length} refund(s) failed. The competition was NOT cancelled. ` +
        'Resolve the failures and retry — already-refunded orders will be skipped.',
    };
  }

  // All refunds succeeded — update competition status and release all tickets.
  await prisma.$transaction(async (tx) => {
    // Set competition to CANCELLED
    await tx.competition.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Release all tickets (set them back to AVAILABLE, remove user/order associations)
    await tx.ticket.updateMany({
      where: { competitionId: id },
      data: {
        status: 'AVAILABLE',
        userId: null,
        orderId: null,
        reservedUntil: null,
      },
    });

    // Log the cancellation
    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'COMPETITION_CANCELLED',
        entity: 'competition',
        entityId: id,
        metadata: {
          competitionTitle: competition.title,
          reason,
          ordersRefunded: refundedCount,
          amountRefunded: refundedAmount,
          timestamp: new Date().toISOString(),
        },
      },
    });
  });

  revalidatePath('/dashboard/competitions');
  revalidatePath(`/dashboard/competitions/${id}`);

  // Send cancellation emails to all participants (async, don't block)
  for (const order of competition.orders) {
    if (order.user?.email && order.user?.firstName) {
      sendCancellationNotificationEmail(
        order.user.email,
        order.user.firstName,
        {
          competitionTitle: competition.title,
          refundAmount: Number(order.totalAmount),
        }
      ).catch((err) => console.error('Failed to send cancellation email:', err));
    }
  }

  return {
    success: true,
    refundedCount,
    refundedAmount,
  };
}

export async function setFeaturedCompetition(competitionId: string | null) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized');
  }

  // If setting a new competition as featured, validate it
  if (competitionId) {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
    });

    if (!competition) {
      throw new Error('Competition not found');
    }

    // Only ACTIVE competitions can be featured
    if (competition.status !== 'ACTIVE') {
      throw new Error('Only active competitions can be featured on the homepage');
    }
  }

  // Use a transaction to ensure only one competition is featured at a time
  await prisma.$transaction(async (tx) => {
    // Un-feature all competitions first
    await tx.competition.updateMany({
      where: { isFeatured: true },
      data: { isFeatured: false },
    });

    // Set the new featured competition (if provided)
    if (competitionId) {
      await tx.competition.update({
        where: { id: competitionId },
        data: { isFeatured: true },
      });
    }
  });

  // Log action
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: competitionId ? 'COMPETITION_FEATURED' : 'COMPETITION_UNFEATURED',
      entity: 'competition',
      entityId: competitionId ?? undefined,
      metadata: { competitionId },
    },
  });

  revalidatePath('/dashboard/competitions');
  revalidatePath('/dashboard/settings');
  if (competitionId) {
    revalidatePath(`/dashboard/competitions/${competitionId}`);
  }
}

export async function recordWinner(competitionId: string, ticketNumber: number) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized');
  }
  const adminId = session.user.id;
  const adminRole = session.user.role;

  if (!Number.isInteger(ticketNumber) || ticketNumber < 1) {
    throw new Error('Please enter a valid winning ticket number.');
  }

  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    select: {
      id: true,
      title: true,
      status: true,
      prizeValue: true,
      totalTickets: true,
      winnerNotified: true,
      drawDate: true,
    },
  });

  if (!competition) {
    throw new Error('Competition not found');
  }

  if (competition.status === 'COMPLETED') {
    throw new Error('A winner has already been recorded for this competition.');
  }

  if (competition.status === 'CANCELLED') {
    throw new Error('This competition was cancelled — a winner cannot be recorded.');
  }

  // Only allow a winner once the competition is actually drawable: SOLD_OUT, in
  // DRAWING, or still ACTIVE but past its advertised draw date. The admin UI already
  // gates the button this way, but enforce it at the server trust boundary too so the
  // action can't be invoked early (recording a winner while tickets are still on sale,
  // excluding people who still intended to enter). DRAFT/UPCOMING are never drawable.
  const drawDatePassed = competition.drawDate
    ? new Date(competition.drawDate) <= new Date()
    : false;
  const isDrawable =
    competition.status === 'SOLD_OUT' ||
    competition.status === 'DRAWING' ||
    (competition.status === 'ACTIVE' && drawDatePassed);
  if (!isDrawable) {
    throw new Error(
      'This competition is not ready to be drawn yet — it must be sold out, in drawing, or past its draw date.',
    );
  }

  // Find the winning ticket (must be a participating SOLD or FREE_ENTRY ticket with a user)
  const ticket = await prisma.ticket.findFirst({
    where: {
      competitionId,
      ticketNumber,
      status: { in: ['SOLD', 'FREE_ENTRY'] },
      userId: { not: null },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          displayName: true,
          email: true,
        },
      },
    },
  });

  if (!ticket || !ticket.userId || !ticket.user) {
    throw new Error('No participating ticket with that number (it must be a SOLD or FREE_ENTRY ticket).');
  }

  const winner = ticket.user;
  const winnerName = winner.displayName || `${winner.firstName} ${winner.lastName}`;

  // Count participating tickets for the draw-log audit trail
  const ticketsSold = await prisma.ticket.count({
    where: { competitionId, status: { in: ['SOLD', 'FREE_ENTRY'] } },
  });

  const drawDate = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.win.create({
      data: {
        competitionId,
        userId: winner.id,
        ticketNumber,
        prizePosition: 1,
      },
    });

    await tx.competition.update({
      where: { id: competitionId },
      data: {
        status: 'COMPLETED',
        actualDrawDate: drawDate,
        winningTicketNumber: ticketNumber,
        drawnById: adminId,
        winnerNotified: false,
      },
    });

    await tx.drawLog.create({
      data: {
        competitionId,
        competitionTitle: competition.title,
        totalTickets: competition.totalTickets ?? ticketsSold,
        ticketsSold,
        winningTicketNumber: ticketNumber,
        winnerUserId: winner.id,
        winnerName,
        winnerEmail: winner.email,
        drawnById: adminId,
        drawnByRole: adminRole,
        drawMethod: 'manual_external',
      },
    });

    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: 'WINNER_RECORDED',
        entity: 'competition',
        entityId: competitionId,
        metadata: {
          ticketNumber,
          winnerId: winner.id,
          method: 'manual_external',
        },
      },
    });
  });

  // Send the winner notification email (best-effort — must not throw out of the action)
  try {
    const { sendWinnerNotificationEmail } = await import('@/lib/email');
    const result = await sendWinnerNotificationEmail(winner.email, winner.firstName, {
      competitionTitle: competition.title,
      ticketNumber,
      prizeValue: Number(competition.prizeValue),
    });
    if (result.success) {
      await prisma.competition.update({
        where: { id: competitionId },
        data: { winnerNotified: true },
      });
    }
  } catch (error) {
    console.error('Failed to send winner notification email:', error);
  }

  revalidatePath('/dashboard/competitions');
  revalidatePath(`/dashboard/competitions/${competitionId}`);
  revalidatePath('/dashboard/wins');

  return { success: true };
}

export async function revealMysteryCard(competitionId: string) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized');
  }

  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
  });

  if (!competition) {
    throw new Error('Competition not found');
  }

  if (!competition.isMystery) {
    throw new Error('This competition is not a mystery card');
  }

  if (competition.isRevealed) {
    throw new Error('This mystery card has already been revealed');
  }

  // Build update data: reveal and copy real fields to public fields
  const updateData: Record<string, unknown> = {
    isRevealed: true,
  };

  if (competition.realValue) {
    updateData.prizeValue = competition.realValue;
  }

  if (competition.realCertification) {
    updateData.certificationNumber = competition.realCertification;
  }

  if (competition.realGrade) {
    updateData.grade = competition.realGrade;
  }

  if (competition.realImages && competition.realImages.length > 0) {
    // Append real images to existing gallery
    updateData.galleryUrls = [...(competition.galleryUrls || []), ...competition.realImages];
  }

  await prisma.competition.update({
    where: { id: competitionId },
    data: updateData,
  });

  // Log action
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'MYSTERY_REVEALED',
      entity: 'competition',
      entityId: competitionId,
      metadata: {
        title: competition.title,
        realTitle: competition.realTitle,
        realValue: competition.realValue ? Number(competition.realValue) : null,
      },
    },
  });

  revalidatePath('/dashboard/competitions');
  revalidatePath(`/dashboard/competitions/${competitionId}`);
  revalidatePath('/'); // Revalidate public pages
}
