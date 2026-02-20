import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { EmailTemplateEditor } from './email-template-editor';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EmailTemplateEditPage({ params }: Props) {
  const { id } = await params;

  const template = await prisma.emailTemplate.findUnique({
    where: { id },
  });

  if (!template) {
    notFound();
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <EmailTemplateEditor
        template={{
          id: template.id,
          slug: template.slug,
          name: template.name,
          subject: template.subject,
          htmlContent: template.htmlContent,
          isActive: template.isActive,
          trigger: template.trigger,
        }}
      />
    </div>
  );
}
