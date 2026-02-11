'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SafeHtml } from '@/components/common/safe-html';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id}>
          <AccordionTrigger className="text-left">
            {item.question}
          </AccordionTrigger>
          <AccordionContent>
            <SafeHtml
              html={item.answer}
              className="prose prose-sm max-w-none text-muted-foreground"
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
