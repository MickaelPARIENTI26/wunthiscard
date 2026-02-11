'use client';

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
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

interface FaqSearchProps {
  allItems: FaqItem[];
}

export function FaqSearch({ allItems }: FaqSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return allItems.filter(
      (item) =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }, [searchQuery, allItems]);

  const handleClear = () => {
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {searchQuery && (
        <div className="rounded-lg border bg-card p-4">
          {filteredItems.length > 0 ? (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                Found {filteredItems.length} result
                {filteredItems.length !== 1 ? 's' : ''} for &quot;{searchQuery}
                &quot;
              </p>
              <Accordion type="single" collapsible className="w-full">
                {filteredItems.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger className="text-left">
                      <div>
                        <span>{item.question}</span>
                        <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {item.category}
                        </span>
                      </div>
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
            </>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              No results found for &quot;{searchQuery}&quot;. Try a different
              search term or browse the categories below.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
