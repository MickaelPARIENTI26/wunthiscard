import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { FaqList } from '@/components/faq/faq-list';

export default async function FaqPage() {
  const faqs = await prisma.faqItem.findMany({
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  });

  const categories = [...new Set(faqs.map((faq) => faq.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FAQ Management</h1>
          <p className="text-muted-foreground">
            Manage frequently asked questions
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/faq/new">
            <Plus className="mr-2 h-4 w-4" />
            Add FAQ
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All FAQs</CardTitle>
          <CardDescription>
            {faqs.length} question{faqs.length !== 1 ? 's' : ''} across {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FaqList faqs={faqs} categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
