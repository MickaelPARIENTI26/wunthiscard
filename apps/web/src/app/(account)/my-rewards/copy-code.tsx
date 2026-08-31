'use client';

import { useState } from 'react';

/** Codes get typed into a checkout box, so copying them must be one tap. */
export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
      className="btn btn-ghost"
      style={{ padding: '7px 14px', fontSize: '13px' }}
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  );
}
