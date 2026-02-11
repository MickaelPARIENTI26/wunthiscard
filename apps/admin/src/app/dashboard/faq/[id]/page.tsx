import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { FaqForm } from '@/components/faq/faq-form';

interface EditFaqPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFaqPage({ params }: EditFaqPageProps) {
  const { id } = await params;

  const faq = await prisma.faqItem.findUnique({
    where: { id },
  });

  if (!faq) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit FAQ</h1>
        <p className="text-muted-foreground">
          Update this frequently asked question
        </p>
      </div>

      <FaqForm faq={faq} />
    </div>
  );
}
