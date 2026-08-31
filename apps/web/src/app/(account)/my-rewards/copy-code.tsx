'use client';

import { useState } from 'react';

/** Codes get typed into a checkout box, so copying them must be one tap. */
export function CopyCode({ code }: { code: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  return (
    <div style={{ textAlign: 'right' }}>
      <button
        type="button"
        onClick={async () => {
          try {
            // Rejected inside Instagram's and TikTok's in-app browsers, which is
            // a realistic way into this product. Silence there left the button
            // looking broken; say so and tell them what to do instead.
            await navigator.clipboard.writeText(code);
            setState('copied');
            setTimeout(() => setState('idle'), 2000);
          } catch {
            setState('failed');
          }
        }}
        className="btn btn-ghost"
        style={{ padding: '7px 14px', fontSize: '13px' }}
      >
        {state === 'copied' ? 'Copied ✓' : 'Copy'}
      </button>
      {state === 'failed' && (
        <p style={{ fontSize: '12px', color: 'var(--ink-faint)', marginTop: '4px' }}>
          Press and hold the code to copy it.
        </p>
      )}
    </div>
  );
}
