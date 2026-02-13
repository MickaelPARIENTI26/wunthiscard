'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { generateSlug } from '@winthiscard/shared';
import type { CompetitionStatus } from '@winthiscard/database';
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
  const prizeValue = parseFloat(formData.get('prizeValue') as string);
  const ticketPrice = parseFloat(formData.get('ticketPrice') as string);
  const totalTickets = parseInt(formData.get('totalTickets') as string);
  const maxTicketsPerUser = parseInt(formData.get('maxTicketsPerUser') as string) || 50;
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

  const galleryUrls = galleryUrlsStr ? galleryUrlsStr.split(',').map(s => s.trim()).filter(Boolean) : [];
  const questionChoices = JSON.parse(questionChoicesStr || '[]') as string[];

  // Validation
  const errors: string[] = [];

  // P1-62: Title required
  if (!title || title.trim().length === 0) {
    errors.push('Title is required');
  }

  // P1-63, P1-64: Ticket price must be positive (at least £1)
  if (isNaN(ticketPrice) || ticketPrice < 1) {
    errors.push('Ticket price must be at least £1');
  }

  // P1-65: Total tickets must be positive
  if (isNaN(totalTickets) || totalTickets < 1) {
    errors.push('Total tickets must be at least 1');
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
  const prizeValue = parseFloat(formData.get('prizeValue') as string);
  const ticketPrice = parseFloat(formData.get('ticketPrice') as string);
  const totalTickets = parseInt(formData.get('totalTickets') as string);
  const maxTicketsPerUser = parseInt(formData.get('maxTicketsPerUser') as string) || 50;
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

  const galleryUrls = galleryUrlsStr ? galleryUrlsStr.split(',').map(s => s.trim()).filter(Boolean) : existing.galleryUrls;
  const questionChoices = questionChoicesStr ? JSON.parse(questionChoicesStr) : existing.questionChoices;

  await prisma.competition.update({
    where: { id },
    data: {
      title,
      subtitle,
      descriptionShort,
      descriptionLong,
      category: category as never,
      subcategory,
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
      questionAnswer: isNaN(questionAnswer) ? existing.questionAnswer : questionAnswer,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || descriptionShort,
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

  // If activating, create tickets
  if (status === 'ACTIVE' && oldStatus === 'UPCOMING') {
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

  // Process refunds for all successful orders
  for (const order of competition.orders) {
    if (order.stripePaymentIntentId && stripe) {
      try {
        // Create a full refund
        await stripe.refunds.create({
          payment_intent: order.stripePaymentIntentId,
          reason: 'requested_by_customer',
        });

        // Update order status
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'REFUNDED' },
        });

        refundedCount++;
        refundedAmount += Number(order.totalAmount);
      } catch (error) {
        console.error(`Failed to refund order ${order.id}:`, error);
        refundErrors.push(order.id);
      }
    } else {
      // No Stripe, just mark as refunded
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'REFUNDED' },
      });
      refundedCount++;
      refundedAmount += Number(order.totalAmount);
    }
  }

  // Update competition status and release all tickets
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
          refundErrors: refundErrors.length > 0 ? refundErrors : undefined,
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

  if (refundErrors.length > 0) {
    return {
      success: true,
      refundedCount,
      refundedAmount,
      error: `Competition cancelled but ${refundErrors.length} refund(s) failed. Check audit log for details.`,
    };
  }

  return {
    success: true,
    refundedCount,
    refundedAmount,
  };
}
