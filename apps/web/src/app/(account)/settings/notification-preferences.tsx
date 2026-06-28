'use client';

import { useState } from 'react';
import { Bell, Loader2, Check } from 'lucide-react';
import { updateEmailMarketing } from './actions';

interface NotificationPreferencesProps {
  initialEmailMarketing: boolean;
}

// Transactional emails we always send (cannot be turned off): they're part of the
// service the user paid for and aren't marketing under PECR.
const ALWAYS_ON = [
  {
    title: 'Order confirmations',
    description: 'Receipts and ticket confirmations after each purchase or free entry',
  },
  {
    title: 'Competition results',
    description: 'When a competition you entered is drawn',
  },
  {
    title: 'Win notifications',
    description: 'When you win — so you can claim your prize',
  },
  {
    title: 'Referral rewards',
    description: 'When you earn a free ticket from someone you referred',
  },
];

export function NotificationPreferences({ initialEmailMarketing }: NotificationPreferencesProps) {
  const [enabled, setEnabled] = useState(initialEmailMarketing);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const toggle = async () => {
    const next = !enabled;
    // Optimistic flip; revert on failure.
    setEnabled(next);
    setIsSaving(true);
    setMessage(null);

    try {
      const result = await updateEmailMarketing(next);
      if (result.success) {
        setMessage({
          type: 'success',
          text: next ? 'You will now receive promotional emails.' : 'Promotional emails turned off.',
        });
      } else {
        setEnabled(!next);
        setMessage({ type: 'error', text: result.error ?? 'Failed to update preferences' });
      }
    } catch {
      setEnabled(!next);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1.5px solid var(--ink)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        padding: '28px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          paddingBottom: '20px',
          marginBottom: '24px',
          borderBottom: '1.5px dashed var(--line-2)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '1.5px solid var(--ink)',
            borderRadius: '12px',
            background: 'var(--accent)',
            boxShadow: '3px 3px 0 var(--ink)',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <Bell className="h-5 w-5" style={{ color: 'var(--ink)' }} />
        </div>
        <div>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '10px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
              fontWeight: 700,
              marginBottom: '4px',
            }}
          >
            Emails
          </div>
          <h2
            style={{
              fontFamily: 'var(--display)',
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              marginBottom: '4px',
            }}
          >
            Email preferences
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-dim)' }}>
            Choose whether we can send you promotional emails.
          </p>
        </div>
      </div>

      {/* Promotional toggle — the one preference the user controls */}
      <button
        type="button"
        onClick={toggle}
        disabled={isSaving}
        aria-pressed={enabled}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          textAlign: 'left',
          padding: '16px',
          background: enabled ? 'var(--accent-soft, var(--bg-2))' : 'var(--bg-2)',
          border: '1.5px solid var(--ink)',
          borderRadius: '12px',
          cursor: isSaving ? 'default' : 'pointer',
          opacity: isSaving ? 0.7 : 1,
        }}
      >
        {/* Switch */}
        <span
          aria-hidden
          style={{
            position: 'relative',
            flexShrink: 0,
            width: '46px',
            height: '28px',
            borderRadius: '999px',
            border: '1.5px solid var(--ink)',
            background: enabled ? 'var(--accent)' : 'var(--surface)',
            transition: 'background 0.15s',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '2px',
              left: enabled ? '20px' : '2px',
              width: '20px',
              height: '20px',
              borderRadius: '999px',
              background: 'var(--ink)',
              transition: 'left 0.15s',
            }}
          />
        </span>
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontWeight: 600, fontSize: '15px', color: 'var(--ink)' }}>
            Promotional emails
          </span>
          <span style={{ display: 'block', fontSize: '13px', color: 'var(--ink-dim)' }}>
            New competitions, special offers and news. Unsubscribe anytime.
          </span>
        </span>
        {isSaving && <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--ink-faint)' }} />}
      </button>

      {message && (
        <div
          style={{
            marginTop: '14px',
            padding: '10px 14px',
            background: message.type === 'success' ? 'var(--accent)' : 'var(--hot)',
            color: message.type === 'success' ? 'var(--ink)' : '#fff',
            border: '1.5px solid var(--ink)',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {message.text}
        </div>
      )}

      {/* Always-on transactional emails */}
      <div
        style={{
          marginTop: '24px',
          paddingTop: '18px',
          borderTop: '1px dashed var(--line-2)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: '10px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
            fontWeight: 700,
            marginBottom: '12px',
          }}
        >
          Always sent
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {ALWAYS_ON.map((item) => (
            <div key={item.title} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Check className="h-4 w-4" style={{ color: 'var(--accent-2, var(--ink))', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>{item.title}</div>
                <div style={{ fontSize: '12.5px', color: 'var(--ink-dim)' }}>{item.description}</div>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '12px', color: 'var(--ink-faint)', marginTop: '12px' }}>
          These keep you informed about your purchases and entries, so they can&apos;t be turned off.
        </p>
      </div>
    </div>
  );
}
