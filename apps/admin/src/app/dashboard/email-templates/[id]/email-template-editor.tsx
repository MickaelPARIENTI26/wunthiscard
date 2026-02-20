'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Send, RotateCcw, Copy, Check, Mail, Zap, Clock, Hand } from 'lucide-react';

interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  subject: string;
  htmlContent: string;
  isActive: boolean;
  trigger: 'AUTO' | 'MANUAL' | 'CRON';
}

interface EmailTemplateEditorProps {
  template: EmailTemplate;
}

// Test data for preview
const testData: Record<string, string> = {
  user_firstname: 'John',
  user_lastname: 'Smith',
  user_email: 'john@example.com',
  competition_title: 'Charizard Base Set PSA 10',
  competition_card_name: 'Charizard Holo PSA 10',
  competition_card_image: 'https://images.pokemontcg.io/base1/4_hires.png',
  competition_card_value: '£1,000',
  competition_ticket_price: '£30',
  competition_total_tickets: '134',
  competition_tickets_sold: '98',
  competition_tickets_remaining: '36',
  competition_end_date: 'March 15, 2026',
  competition_draw_date: 'March 16, 2026 at 8:00 PM GMT',
  competition_url: 'https://winucard.co.uk/competitions/charizard-psa10',
  competition_category: 'Pokémon',
  order_id: 'WUC-20260301-0042',
  order_total: '£90',
  order_tickets_count: '3',
  order_ticket_numbers: '#0042, #0043, #0044',
  order_date: 'March 1, 2026',
  draw_winner_name: 'John Smith',
  draw_winning_ticket: '0042',
  draw_video_url: 'https://youtube.com/live/example',
  draw_date: 'March 16, 2026',
  draw_time: '8:00 PM GMT',
  site_url: 'https://winucard.co.uk',
  site_name: 'WinUCard',
  site_logo_url: 'https://winucard.co.uk/logo-email.png',
  current_year: new Date().getFullYear().toString(),
  unsubscribe_url: 'https://winucard.co.uk/unsubscribe?token=test',
  verification_url: 'https://winucard.co.uk/verify?token=test',
  cart_url: 'https://winucard.co.uk/cart?recover=test',
};

const availableVariables = [
  { name: 'user_firstname', category: 'User' },
  { name: 'user_lastname', category: 'User' },
  { name: 'competition_title', category: 'Competition' },
  { name: 'competition_card_name', category: 'Competition' },
  { name: 'competition_card_image', category: 'Competition' },
  { name: 'competition_card_value', category: 'Competition' },
  { name: 'competition_ticket_price', category: 'Competition' },
  { name: 'competition_total_tickets', category: 'Competition' },
  { name: 'competition_tickets_sold', category: 'Competition' },
  { name: 'competition_tickets_remaining', category: 'Competition' },
  { name: 'competition_end_date', category: 'Competition' },
  { name: 'competition_draw_date', category: 'Competition' },
  { name: 'competition_url', category: 'Competition' },
  { name: 'order_id', category: 'Order' },
  { name: 'order_total', category: 'Order' },
  { name: 'order_tickets_count', category: 'Order' },
  { name: 'order_ticket_numbers', category: 'Order' },
  { name: 'draw_winning_ticket', category: 'Draw' },
  { name: 'draw_video_url', category: 'Draw' },
  { name: 'site_url', category: 'Site' },
  { name: 'site_name', category: 'Site' },
  { name: 'unsubscribe_url', category: 'Site' },
];

const triggerConfig = {
  AUTO: { label: 'Auto', icon: Zap, className: 'bg-emerald-500/10 text-emerald-500' },
  MANUAL: { label: 'Manual', icon: Hand, className: 'bg-blue-500/10 text-blue-500' },
  CRON: { label: 'Cron', icon: Clock, className: 'bg-amber-500/10 text-amber-500' },
};

function replaceVariables(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match;
  });
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function EmailTemplateEditor({ template }: EmailTemplateEditorProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [subject, setSubject] = useState(template.subject);
  const [htmlContent, setHtmlContent] = useState(template.htmlContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<'subject' | 'html'>('html');

  const subjectInputRef = useRef<HTMLInputElement>(null);
  const htmlTextareaRef = useRef<HTMLTextAreaElement>(null);

  const debouncedHtmlContent = useDebounce(htmlContent, 300);
  const debouncedSubject = useDebounce(subject, 300);

  const previewHtml = replaceVariables(debouncedHtmlContent, testData);
  const previewSubject = replaceVariables(debouncedSubject, testData);

  const trigger = triggerConfig[template.trigger];
  const TriggerIcon = trigger.icon;

  const hasChanges = subject !== template.subject || htmlContent !== template.htmlContent;

  const insertVariable = useCallback((variable: string) => {
    const variableText = `{{${variable}}}`;

    if (activeField === 'subject' && subjectInputRef.current) {
      const input = subjectInputRef.current;
      const start = input.selectionStart ?? subject.length;
      const end = input.selectionEnd ?? subject.length;
      const newValue = subject.slice(0, start) + variableText + subject.slice(end);
      setSubject(newValue);
      // Set cursor position after variable
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + variableText.length, start + variableText.length);
      }, 0);
    } else if (htmlTextareaRef.current) {
      const textarea = htmlTextareaRef.current;
      const start = textarea.selectionStart ?? htmlContent.length;
      const end = textarea.selectionEnd ?? htmlContent.length;
      const newValue = htmlContent.slice(0, start) + variableText + htmlContent.slice(end);
      setHtmlContent(newValue);
      // Set cursor position after variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variableText.length, start + variableText.length);
      }, 0);
    }

    // Show copied feedback
    setCopiedVariable(variable);
    setTimeout(() => setCopiedVariable(null), 1000);
  }, [activeField, subject, htmlContent]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/email-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, htmlContent }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save template');
      }

      toast({
        title: 'Template saved',
        description: 'Your changes have been saved successfully.',
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save template',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) return;

    setIsSendingTest(true);
    try {
      const response = await fetch(`/api/admin/email-templates/${template.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test email');
      }

      toast({
        title: 'Test email sent',
        description: data.mock
          ? `Test email logged (no RESEND_API_KEY configured)`
          : `Test email sent to ${testEmail}`,
      });

      setTestEmailDialogOpen(false);
      setTestEmail('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send test email',
        variant: 'destructive',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleReset = () => {
    setSubject(template.subject);
    setHtmlContent(template.htmlContent);
    setResetDialogOpen(false);
    toast({
      title: 'Changes discarded',
      description: 'Template has been reset to last saved version.',
    });
  };

  // Group variables by category
  const variablesByCategory = availableVariables.reduce<Record<string, string[]>>((acc, v) => {
    if (!acc[v.category]) acc[v.category] = [];
    acc[v.category]!.push(v.name);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/email-templates">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-xl font-bold">{template.name}</h1>
              <Badge variant="outline" className={trigger.className}>
                <TriggerIcon className="h-3 w-3 mr-1" />
                {trigger.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{template.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setResetDialogOpen(true)}
            disabled={!hasChanges}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTestEmailDialogOpen(true)}
          >
            <Send className="h-4 w-4 mr-2" />
            Send Test
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Left Column - Editor */}
        <div className="flex flex-col gap-4 overflow-hidden">
          {/* Subject */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Subject Line</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Input
                ref={subjectInputRef}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onFocus={() => setActiveField('subject')}
                placeholder="Email subject..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Preview: <span className="text-foreground">{previewSubject}</span>
              </p>
            </CardContent>
          </Card>

          {/* Variables */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Available Variables</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 max-h-[180px] overflow-y-auto">
                {Object.entries(variablesByCategory).map(([category, variables]) => (
                  <div key={category}>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      {category}
                    </Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {variables.map((variable) => (
                        <Badge
                          key={variable}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs font-mono"
                          onClick={() => insertVariable(variable)}
                        >
                          {copiedVariable === variable ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : (
                            <Copy className="h-3 w-3 mr-1 opacity-50" />
                          )}
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* HTML Editor */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">HTML Content</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex flex-col min-h-0">
              <div className="relative flex-1 min-h-0">
                <textarea
                  ref={htmlTextareaRef}
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  onFocus={() => setActiveField('html')}
                  className="w-full h-full min-h-[300px] p-3 rounded-md border bg-muted/50 font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter HTML content..."
                  spellCheck={false}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview */}
        <Card className="flex flex-col min-h-0">
          <CardHeader className="py-3 border-b">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Live Preview
              <Badge variant="outline" className="text-xs font-normal">
                Auto-updates
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-0">
            <iframe
              srcDoc={previewHtml}
              className="w-full h-full border-0 bg-white rounded-b-lg"
              title="Email Preview"
              sandbox="allow-same-origin"
            />
          </CardContent>
        </Card>
      </div>

      {/* Test Email Dialog */}
      <Dialog open={testEmailDialogOpen} onOpenChange={setTestEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email to preview how the template looks in a real inbox.
              Variables will be replaced with sample data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="testEmail">Email Address</Label>
            <Input
              id="testEmail"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="your@email.com"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendTest} disabled={isSendingTest || !testEmail}>
              <Send className="h-4 w-4 mr-2" />
              {isSendingTest ? 'Sending...' : 'Send Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the template to the last saved version. All unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
