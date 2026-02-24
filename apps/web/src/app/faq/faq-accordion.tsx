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
        <AccordionItem
          key={item.id}
          value={item.id}
          className="border-b border-[#e8e8ec] last:border-b-0"
        >
          <AccordionTrigger
            className="text-left px-6 py-4 hover:no-underline"
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#1a1a2e',
            }}
          >
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <div
              style={{
                fontSize: '14px',
                lineHeight: 1.7,
                color: '#555',
              }}
            >
              <SafeHtml
                html={item.answer}
                className="prose prose-sm max-w-none"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
