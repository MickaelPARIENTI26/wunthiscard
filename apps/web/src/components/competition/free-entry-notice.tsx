'use client';

import { useState } from 'react';
import { Mail, ChevronDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FreeEntryNoticeProps {
  competitionTitle: string;
  className?: string;
}

export function FreeEntryNotice({ competitionTitle, className }: FreeEntryNoticeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Secondary Button - Free Entry Route */}
      <Button
        variant="outline"
        size="lg"
        className="w-full text-base font-medium"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          background: 'transparent',
          border: '1px solid oklch(0.35 0.02 270)',
          color: 'oklch(0.85 0.02 270)',
        }}
      >
        <Mail className="h-4 w-4 mr-2" style={{ color: 'oklch(0.7 0.02 270)' }} />
        📮 Free Entry Route
        <ChevronDown
          className={cn(
            'h-4 w-4 ml-auto transition-transform duration-200',
            isExpanded && 'rotate-180'
          )}
          style={{ color: 'oklch(0.6 0.02 270)' }}
        />
      </Button>

      {/* Collapsible Content */}
      <div
        className={cn(
          'grid transition-all duration-200 ease-in-out',
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div
            className="rounded-xl p-4 space-y-3"
            style={{
              background: 'linear-gradient(135deg, oklch(0.12 0.02 270) 0%, oklch(0.09 0.02 270) 100%)',
              border: '1px solid oklch(0.25 0.02 270)',
            }}
          >
            <p style={{ color: 'oklch(0.85 0.02 270)' }} className="text-sm">
              You can enter this competition for free by post.
            </p>

            <div>
              <p style={{ color: 'oklch(0.75 0.02 270)' }} className="text-sm mb-2">
                Send a handwritten letter including:
              </p>
              <ul className="space-y-1.5 text-sm" style={{ color: 'oklch(0.8 0.02 270)' }}>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'oklch(0.82 0.165 85)' }}>•</span>
                  Your full name and email address
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'oklch(0.82 0.165 85)' }}>•</span>
                  Competition name: &ldquo;{competitionTitle}&rdquo;
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'oklch(0.82 0.165 85)' }}>•</span>
                  Answer to the skill question
                </li>
              </ul>
            </div>

            <p style={{ color: 'oklch(0.75 0.02 270)' }} className="text-sm">
              Post to: <span style={{ color: 'oklch(0.85 0.02 270)' }}>WinThisCard Ltd, PO Box 1234, London, UK</span>
            </p>

            <p style={{ color: 'oklch(0.65 0.02 270)' }} className="text-xs">
              Free entries have equal chance of winning as paid entries.
            </p>

            <Link
              href="/competition-rules"
              className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: 'oklch(0.82 0.165 85)' }}
            >
              View Competition Rules
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
