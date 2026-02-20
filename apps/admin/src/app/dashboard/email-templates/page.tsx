import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmailTemplateList } from './email-template-list';

export default async function EmailTemplatesPage() {
  const templates = await prisma.emailTemplate.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      subject: true,
      isActive: true,
      trigger: true,
      updatedAt: true,
    },
    orderBy: { name: 'asc' },
  });

  const activeCount = templates.filter((t) => t.isActive).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <span>Email Templates</span>
        </h1>
        <p className="text-muted-foreground">
          Manage your transactional and marketing email templates
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Templates</CardTitle>
          <CardDescription>
            {templates.length} template{templates.length !== 1 ? 's' : ''}, {activeCount} active
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmailTemplateList templates={templates} />
        </CardContent>
      </Card>
    </div>
  );
}
