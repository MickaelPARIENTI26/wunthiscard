'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WinnersFilterProps {
  categories: string[];
  categoryDisplayNames: Record<string, string>;
  currentCategory?: string;
}

export function WinnersFilter({
  categories,
  categoryDisplayNames,
  currentCategory,
}: WinnersFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === 'all') {
      params.delete('category');
    } else {
      params.set('category', value);
    }

    // Reset to page 1 when changing filter
    params.delete('page');

    router.push(`/winners?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Filter by:</span>
      <Select
        value={currentCategory || 'all'}
        onValueChange={handleCategoryChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {categoryDisplayNames[category] || category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
