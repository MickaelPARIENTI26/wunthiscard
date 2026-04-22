'use client';

import { AlertTriangle } from 'lucide-react';

export function LegalLanguageBanner() {
  return (
    <div
      className="mb-6 rounded-lg border p-4"
      style={{
        backgroundColor: 'rgba(0, 199, 106, 0.08)',
        borderColor: 'rgba(0, 199, 106, 0.2)',
      }}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 flex-shrink-0"
          style={{ color: 'var(--warn)' }}
        />
        <div className="text-sm">
          <p className="font-medium" style={{ color: '#ffffff' }}>
            This document is available in English only.
          </p>
          <p className="mt-1" style={{ color: '#7a7e90' }}>
            This is a UK-based service and legal documents must be validated by a solicitor before translation.
          </p>
        </div>
      </div>
    </div>
  );
}
