'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pencil, Mail, Zap, Clock, Hand } from 'lucide-react';
import { toggleTemplateActive } from './actions';

interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  subject: string;
  isActive: boolean;
  trigger: 'AUTO' | 'MANUAL' | 'CRON';
  updatedAt: Date;
}

interface EmailTemplateListProps {
  templates: EmailTemplate[];
}

const triggerConfig = {
  AUTO: {
    label: 'Auto',
    icon: Zap,
    className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  },
  MANUAL: {
    label: 'Manual',
    icon: Hand,
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
  CRON: {
    label: 'Cron',
    icon: Clock,
    className: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  },
};

function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function EmailTemplateList({ templates }: EmailTemplateListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggleActive = async (id: string, currentValue: boolean) => {
    setLoadingId(id);
    startTransition(async () => {
      await toggleTemplateActive(id, !currentValue);
      setLoadingId(null);
    });
  };

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Mail className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">No email templates found.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Name</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead className="w-[100px]">Trigger</TableHead>
          <TableHead className="w-[80px] text-center">Active</TableHead>
          <TableHead className="w-[150px]">Last Modified</TableHead>
          <TableHead className="w-[80px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {templates.map((template) => {
          const trigger = triggerConfig[template.trigger];
          const TriggerIcon = trigger.icon;

          return (
            <TableRow
              key={template.id}
              className="cursor-pointer"
              onClick={() => router.push(`/dashboard/email-templates/${template.id}`)}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {template.name}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {truncate(template.subject, 50)}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={trigger.className}>
                  <TriggerIcon className="h-3 w-3 mr-1" />
                  {trigger.label}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={template.isActive}
                  disabled={isPending && loadingId === template.id}
                  onCheckedChange={() => handleToggleActive(template.id, template.isActive)}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDistanceToNow(new Date(template.updatedAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link href={`/dashboard/email-templates/${template.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
