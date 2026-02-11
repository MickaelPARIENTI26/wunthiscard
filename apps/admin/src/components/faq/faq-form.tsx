'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import { createFaq, updateFaq } from '@/app/dashboard/faq/actions';
import { Loader2 } from 'lucide-react';

const FAQ_CATEGORIES = [
  'General',
  'Competitions',
  'Payments',
  'Tickets',
  'Winners',
  'Account',
  'Legal',
];

interface FaqFormProps {
  faq?: {
    id: string;
    question: string;
    answer: string;
    category: string;
    sortOrder: number;
    isActive: boolean;
  };
}

export function FaqForm({ faq }: FaqFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [answer, setAnswer] = useState(faq?.answer ?? '');
  const [isActive, setIsActive] = useState(faq?.isActive ?? true);

  const isEditing = !!faq;

  async function handleSubmit(formData: FormData) {
    formData.set('answer', answer);
    formData.set('isActive', isActive.toString());

    startTransition(async () => {
      if (isEditing) {
        await updateFaq(faq.id, formData);
      } else {
        await createFaq(formData);
      }
    });
  }

  return (
    <form action={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>FAQ Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="question">Question *</Label>
            <Input
              id="question"
              name="question"
              placeholder="How do I enter a competition?"
              defaultValue={faq?.question}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Answer *</Label>
            <RichTextEditor
              content={answer}
              onChange={setAnswer}
              placeholder="Write your answer here..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select name="category" defaultValue={faq?.category ?? 'General'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {FAQ_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min="0"
                placeholder="0"
                defaultValue={faq?.sortOrder?.toString() ?? '0'}
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first within the category
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Active</Label>
              <p className="text-sm text-muted-foreground">
                Make this FAQ visible on the public website
              </p>
            </div>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/faq')}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : isEditing ? (
            'Update FAQ'
          ) : (
            'Create FAQ'
          )}
        </Button>
      </div>
    </form>
  );
}
