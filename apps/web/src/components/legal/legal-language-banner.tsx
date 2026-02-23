'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';

export function LegalLanguageBanner() {
  const t = useTranslations('legal');

  return (
    <div
      className="mb-6 rounded-lg border p-4"
      style={{
        backgroundColor: 'rgba(240, 185, 11, 0.08)',
        borderColor: 'rgba(240, 185, 11, 0.2)',
      }}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 flex-shrink-0"
          style={{ color: '#F0B90B' }}
        />
        <div className="text-sm">
          <p className="font-medium" style={{ color: '#ffffff' }}>
            {t('documentInEnglish')}
          </p>
          <p className="mt-1" style={{ color: '#7a7e90' }}>
            {t('documentInEnglishNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
