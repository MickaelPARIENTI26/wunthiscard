'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface ReferralClientSectionProps {
  referralLink: string;
  referralCode: string;
}

export function ReferralClientSection({ referralLink, referralCode: _referralCode }: ReferralClientSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.querySelector<HTMLInputElement>('#referral-link-input');
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Join WinUCard and win amazing prizes! Use my referral link: ${referralLink}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Win collectible cards and prizes on @WinUCard! Use my link: ${referralLink}`)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent('Win amazing prizes on WinUCard!')}&body=${encodeURIComponent(`Hey! Check out WinUCard - you can win collectible cards and memorabilia. Use my referral link to sign up: ${referralLink}`)}`;

  return (
    <div>
      <div className="flex gap-2" style={{ marginBottom: '12px' }}>
        <input
          id="referral-link-input"
          type="text"
          readOnly
          value={referralLink}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1.5px solid var(--ink)',
            background: 'var(--bg-2)',
            fontSize: '14px',
            color: 'var(--ink)',
            outline: 'none',
          }}
        />
        <button
          onClick={handleCopy}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            background: copied ? 'var(--accent)' : 'var(--ink)',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {copied ? (
            <>
              <Check style={{ width: '16px', height: '16px' }} />
              Copied!
            </>
          ) : (
            <>
              <Copy style={{ width: '16px', height: '16px' }} />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Share buttons */}
      <div className="flex gap-3 flex-wrap">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '10px',
            background: '#25D366',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}
        >
          WhatsApp
        </a>
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '10px',
            background: '#1DA1F2',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}
        >
          X / Twitter
        </a>
        <a
          href={emailUrl}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '10px',
            background: 'var(--ink-dim)',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}
        >
          Email
        </a>
      </div>
    </div>
  );
}
