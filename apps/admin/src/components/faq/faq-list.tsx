'use client';

import { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pencil, Trash2, MoreVertical, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import { deleteFaq, toggleFaqActive, reorderFaqs } from '@/app/dashboard/faq/actions';

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}

interface FaqListProps {
  faqs: Faq[];
  categories: string[];
}

// Safe HTML rendering with XSS protection
function SafeHtml({ html, className }: { html: string; className?: string }) {
  const sanitizedHtml = useMemo(() => {
    if (!html) return '';
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    });
  }, [html]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

export function FaqList({ faqs, categories }: FaqListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteFaq(deleteId);
      setDeleteId(null);
    });
  };

  const handleToggleActive = (id: string) => {
    startTransition(async () => {
      await toggleFaqActive(id);
    });
  };

  const handleMoveUp = (category: string, index: number) => {
    if (index === 0) return;
    const categoryFaqs = faqsByCategory[category] ?? [];
    const newOrder = [...categoryFaqs];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index]!, newOrder[index - 1]!];
    startTransition(async () => {
      await reorderFaqs(newOrder.map((f) => f.id));
    });
  };

  const handleMoveDown = (category: string, index: number) => {
    const categoryFaqs = faqsByCategory[category] ?? [];
    if (index >= categoryFaqs.length - 1) return;
    const newOrder = [...categoryFaqs];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1]!, newOrder[index]!];
    startTransition(async () => {
      await reorderFaqs(newOrder.map((f) => f.id));
    });
  };

  const faqsByCategory = categories.reduce((acc, category) => {
    acc[category] = faqs.filter((faq) => faq.category === category);
    return acc;
  }, {} as Record<string, Faq[]>);

  if (faqs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No FAQs yet. Add your first question.</p>
      </div>
    );
  }

  return (
    <>
      <Tabs defaultValue={categories[0] || 'all'}>
        <TabsList className="mb-4">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
              <Badge variant="secondary" className="ml-2">
                {faqsByCategory[category]?.length ?? 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category}>
            <Accordion type="single" collapsible className="space-y-2">
              {(faqsByCategory[category] ?? []).map((faq, index) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="border rounded-lg px-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={(e) => {
                    // Don't navigate if clicking on buttons, dropdown menu, or accordion chevron
                    const target = e.target as HTMLElement;
                    if (
                      target.closest('button') ||
                      target.closest('[role="menuitem"]') ||
                      target.closest('svg') ||
                      target.closest('[data-radix-collection-item]')
                    ) {
                      return;
                    }
                    router.push(`/dashboard/faq/${faq.id}`);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <AccordionTrigger className="flex-1 text-left hover:no-underline">
                      <div className="flex items-center gap-2">
                        {!faq.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        <span>{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); handleMoveUp(category, index); }}
                        disabled={isPending || index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); handleMoveDown(category, index); }}
                        disabled={isPending || index >= (faqsByCategory[category]?.length ?? 0) - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="ml-2">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/faq/${faq.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(faq.id)}
                          disabled={isPending}
                        >
                          {faq.isActive ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(faq.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <AccordionContent className="text-muted-foreground pb-4">
                    <SafeHtml html={faq.answer} className="prose prose-sm max-w-none" />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
        ))}
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this FAQ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
