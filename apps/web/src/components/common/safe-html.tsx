'use client';

import { useState, useEffect } from 'react';

// Configure allowed tags and attributes for rich text content
const DEFAULT_CONFIG = {
  ALLOWED_TAGS: [
    // Text formatting
    'p', 'br', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins', 'sub', 'sup', 'mark',
    // Headers
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Lists
    'ul', 'ol', 'li',
    // Links and media
    'a', 'img',
    // Block elements
    'div', 'blockquote', 'pre', 'code',
    // Tables
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    // Other
    'hr',
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel',
    'width', 'height', 'style',
  ],
  ALLOW_DATA_ATTR: false,
};

interface SafeHtmlProps {
  html: string;
  className?: string;
  as?: 'div' | 'span' | 'article' | 'section';
}

/**
 * Safely render HTML content with XSS protection
 * Uses DOMPurify to sanitize HTML before rendering
 * DOMPurify is loaded client-side only since it requires DOM
 */
export function SafeHtml({ html, className, as: Component = 'div' }: SafeHtmlProps) {
  const [sanitizedHtml, setSanitizedHtml] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !html) {
      setSanitizedHtml('');
      return;
    }

    // Dynamically import DOMPurify only on the client
    import('dompurify').then((DOMPurify) => {
      const purify = DOMPurify.default || DOMPurify;
      setSanitizedHtml(purify.sanitize(html, DEFAULT_CONFIG));
    });
  }, [html, isClient]);

  // Show nothing during SSR to prevent hydration mismatch
  if (!isClient) {
    return <Component className={className} />;
  }

  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
