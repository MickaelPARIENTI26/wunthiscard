'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import { updateStaticPage } from '@/app/dashboard/pages/actions';
import { Loader2, Save } from 'lucide-react';

interface StaticPageFormProps {
  slug: string;
  defaultTitle: string;
  defaultContent: string;
}

export function StaticPageForm({
  slug,
  defaultTitle,
  defaultContent,
}: StaticPageFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState(defaultContent);

  async function handleSubmit(formData: FormData) {
    formData.set('content', content);

    startTransition(async () => {
      await updateStaticPage(slug, formData);
      router.push('/dashboard/pages');
    });
  }

  return (
    <form action={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Page Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Page Title *</Label>
            <Input
              id="title"
              name="title"
              defaultValue={defaultTitle}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Content *</Label>
            <div className="min-h-[400px]">
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Write your page content here..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/pages')}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
