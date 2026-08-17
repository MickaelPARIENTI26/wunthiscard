'use client';

import { useState } from 'react';
import { Share2, Link2, Check } from 'lucide-react';

interface ShareCompetitionProps {
  /** Absolute URL of the competition page. */
  url: string;
  title: string;
  prizeValue: number;
}

/**
 * Share row for a competition page.
 *
 * On phones the OS share sheet (Web Share API) is the only thing anyone
 * actually uses, so it gets the primary button and the per-network links are
 * hidden. Desktop browsers mostly lack the API, so they fall back to explicit
 * WhatsApp / X / Facebook links plus copy-to-clipboard.
 */
export function ShareCompetition({ url, title, prizeValue }: ShareCompetitionProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // navigator.share only exists on some clients, and reading it during render
  // would desync the server HTML from the first client paint.
  const measureShareSupport = (node: HTMLDivElement | null) => {
    if (node && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanNativeShare(true);
    }
  };

  const prize = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(prizeValue);

  const text = `${title} — win it for ${prize} on WinUPrize`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  const networks = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` },
    { label: 'X', href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}` },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
  ];

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text, url });
    } catch {
      // The user dismissed the sheet, or the browser refused. Nothing to do —
      // the copy button and the network links are still right there.
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard needs a secure context and permission; if it is refused the
      // button simply doesn't confirm rather than throwing at the user.
    }
  };

  return (
    <div ref={measureShareSupport} className="share-comp">
      <span className="share-comp__label">Share</span>

      {canNativeShare && (
        <button type="button" onClick={nativeShare} className="share-comp__btn share-comp__btn--primary">
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Share
        </button>
      )}

      <div className={canNativeShare ? 'share-comp__networks share-comp__networks--secondary' : 'share-comp__networks'}>
        {networks.map((n) => (
          <a
            key={n.label}
            href={n.href}
            target="_blank"
            rel="noopener noreferrer"
            className="share-comp__btn"
            aria-label={`Share ${title} on ${n.label}`}
          >
            {n.label}
          </a>
        ))}
      </div>

      <button
        type="button"
        onClick={copy}
        className="share-comp__btn"
        aria-label={copied ? 'Link copied' : 'Copy link to this competition'}
      >
        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  );
}
