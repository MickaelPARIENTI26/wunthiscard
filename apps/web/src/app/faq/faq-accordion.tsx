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
    // Each item is its own bordered panel (spec accordion), so the group is a
    // stack of squared cards rather than one divided block.
    <Accordion type="single" collapsible className="flex w-full flex-col gap-2.5">
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          value={item.id}
          className="wup-accordion-item border-b-0"
          style={{ background: 'var(--surface)', border: '1px solid rgba(244, 241, 234, 0.16)' }}
        >
          <AccordionTrigger
            className="text-left hover:no-underline"
            style={{
              padding: '17px 18px',
              fontFamily: 'var(--display)',
              fontSize: '18.5px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              color: 'var(--ink)',
            }}
          >
            {item.question}
          </AccordionTrigger>
          <AccordionContent style={{ padding: '0 18px 19px' }}>
            <div style={{ fontSize: '15.5px', lineHeight: 1.68, color: 'rgba(244, 241, 234, 0.66)' }}>
              <SafeHtml html={item.answer} className="prose prose-sm max-w-none" />
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
