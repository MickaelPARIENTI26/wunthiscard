'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';

export function LegalLanguageBanner() {
  const t = useTranslations('legal');

  return (
    <div
      className="mb-6 rounded-lg border p-4"
      style={{
        backgroundColor: 'rgba(255, 165, 0, 0.1)',
        borderColor: 'rgba(255, 165, 0, 0.3)',
      }}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 flex-shrink-0"
          style={{ color: '#FFA500' }}
        />
        <div className="text-sm">
          <p className="font-medium" style={{ color: '#f5f5f5' }}>
            {t('documentInEnglish')}
          </p>
          <p className="mt-1" style={{ color: '#a0a0a0' }}>
            {t('documentInEnglishNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
