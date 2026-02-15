import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@winucard/shared';
import { Pencil, FileText } from 'lucide-react';

const STATIC_PAGES = [
  { slug: 'about', title: 'About Us', description: 'Company information and story' },
  { slug: 'how-it-works', title: 'How It Works', description: 'Guide for users on how to participate' },
  { slug: 'terms', title: 'Terms & Conditions', description: 'Legal terms of service' },
  { slug: 'privacy', title: 'Privacy Policy', description: 'Data protection and privacy information' },
  { slug: 'responsible-play', title: 'Responsible Play', description: 'Guidelines for responsible participation' },
  { slug: 'contact', title: 'Contact Us', description: 'Contact information and support' },
];

export default async function PagesPage() {
  const existingPages = await prisma.staticPage.findMany({
    where: {
      slug: { in: STATIC_PAGES.map((p) => p.slug) },
    },
  });

  const pagesMap = new Map(existingPages.map((p) => [p.slug, p]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Static Pages</h1>
        <p className="text-muted-foreground">
          Manage content for static pages on the website
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Website Pages</CardTitle>
          <CardDescription>
            Edit content for legal pages, about sections, and other static content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STATIC_PAGES.map((page) => {
                const existingPage = pagesMap.get(page.slug);
                return (
                  <TableRow key={page.slug}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{page.title}</p>
                          <code className="text-xs text-muted-foreground">/{page.slug}</code>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {page.description}
                    </TableCell>
                    <TableCell>
                      {existingPage ? (
                        <Badge variant="success">Published</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {existingPage ? formatDateTime(existingPage.updatedAt) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/pages/${page.slug}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
