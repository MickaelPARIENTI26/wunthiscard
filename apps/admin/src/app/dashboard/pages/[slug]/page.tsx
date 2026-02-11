import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { StaticPageForm } from '@/components/pages/static-page-form';

const STATIC_PAGES: Record<string, { title: string; description: string }> = {
  about: { title: 'About Us', description: 'Company information and story' },
  'how-it-works': { title: 'How It Works', description: 'Guide for users on how to participate' },
  terms: { title: 'Terms & Conditions', description: 'Legal terms of service' },
  privacy: { title: 'Privacy Policy', description: 'Data protection and privacy information' },
  'responsible-play': { title: 'Responsible Play', description: 'Guidelines for responsible participation' },
  contact: { title: 'Contact Us', description: 'Contact information and support' },
};

interface PageEditorProps {
  params: Promise<{ slug: string }>;
}

export default async function PageEditor({ params }: PageEditorProps) {
  const { slug } = await params;

  const pageInfo = STATIC_PAGES[slug];
  if (!pageInfo) {
    notFound();
  }

  const existingPage = await prisma.staticPage.findUnique({
    where: { slug },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/pages">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{pageInfo.title}</h1>
          <p className="text-muted-foreground">{pageInfo.description}</p>
        </div>
      </div>

      <StaticPageForm
        slug={slug}
        defaultTitle={existingPage?.title ?? pageInfo.title}
        defaultContent={existingPage?.content ?? ''}
      />
    </div>
  );
}
