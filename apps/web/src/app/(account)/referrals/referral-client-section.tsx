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

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Join WinUPrize and win amazing prizes! Use my referral link: ${referralLink}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Win collectible cards and prizes on @WinUPrize! Use my link: ${referralLink}`)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent('Win amazing prizes on WinUPrize!')}&body=${encodeURIComponent(`Hey! Check out WinUPrize - you can win collectible cards and memorabilia. Use my referral link to sign up: ${referralLink}`)}`;

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
            minWidth: 0,
            padding: '10px 14px',
            borderRadius: 0,
            border: '1px solid rgba(244, 241, 234, 0.18)',
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
            borderRadius: 0,
            border: 'none',
            background: copied ? 'var(--gold-bright)' : 'var(--accent)',
            color: '#0A0A0A',
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
            borderRadius: 0,
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
            borderRadius: 0,
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
            borderRadius: 0,
            background: 'transparent', border: '1px solid var(--line-2)',
            color: 'var(--ink)',
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
