'use client';

import { useActionState } from 'react';
import { useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { submitContactForm, type ContactFormState } from './actions';

const subjects = [
  { value: 'general', label: 'General enquiry' },
  { value: 'competition', label: 'Competition question' },
  { value: 'payment', label: 'Payment issue' },
  { value: 'delivery', label: 'Delivery & shipping' },
  { value: 'account', label: 'Account help' },
  { value: 'partnership', label: 'Partnership enquiry' },
  { value: 'other', label: 'Other' },
];

const initialState: ContactFormState = {
  success: false,
  message: '',
};

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactForm, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.success && formRef.current) {
      formRef.current.reset();
    }
  }, [state.success]);

  // Whenever there's feedback to show, scroll it into view so the user never
  // misses the confirmation (the message sits at the top of a long form).
  useEffect(() => {
    if (state.message) {
      messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [state.message, state.success]);

  return (
    <form ref={formRef} action={formAction}>
      <div ref={messageRef}>
        {state.success && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 18px',
              marginBottom: '18px',
              background: 'var(--accent)',
              color: 'var(--ink)',
              border: '1.5px solid var(--ink)',
              borderRadius: '10px',
              boxShadow: 'var(--shadow)',
              fontSize: '15px',
              fontWeight: 700,
            }}
          >
            <CheckCircle className="h-6 w-6 shrink-0" />
            <p>{state.message}</p>
          </div>
        )}

        {!state.success && state.message && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '16px 18px',
              marginBottom: '18px',
              background: 'var(--hot)',
              color: '#fff',
              border: '1.5px solid var(--ink)',
              borderRadius: '10px',
              boxShadow: 'var(--shadow)',
              fontSize: '15px',
              fontWeight: 700,
            }}
          >
            <AlertCircle className="h-6 w-6 shrink-0" style={{ marginTop: '2px' }} />
            <div>
              <p>{state.message}</p>
              {state.errors && (
                <ul style={{ margin: '6px 0 0', paddingLeft: '18px', fontWeight: 600, fontSize: '13.5px' }}>
                  {Object.values(state.errors)
                    .flat()
                    .filter(Boolean)
                    .map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="billing-grid">
        <div className="field billing-full">
          <label className="field-label" htmlFor="name">
            Name <span style={{ color: 'var(--hot)' }}>*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Your full name"
            required
            disabled={isPending}
            className={`input ${state.errors?.name ? 'input-error' : ''}`}
          />
          {state.errors?.name && <span className="field-error">{state.errors.name[0]}</span>}
        </div>

        <div className="field billing-full">
          <label className="field-label" htmlFor="email">
            Email <span style={{ color: 'var(--hot)' }}>*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            required
            disabled={isPending}
            className={`input ${state.errors?.email ? 'input-error' : ''}`}
          />
          {state.errors?.email && <span className="field-error">{state.errors.email[0]}</span>}
        </div>

        <div className="field billing-full">
          <label className="field-label" htmlFor="subject">
            Subject <span style={{ color: 'var(--hot)' }}>*</span>
          </label>
          <select
            id="subject"
            name="subject"
            required
            disabled={isPending}
            defaultValue=""
            className={`select ${state.errors?.subject ? 'input-error' : ''}`}
          >
            <option value="" disabled>
              Select a subject
            </option>
            {subjects.map((subject) => (
              <option key={subject.value} value={subject.value}>
                {subject.label}
              </option>
            ))}
          </select>
          {state.errors?.subject && <span className="field-error">{state.errors.subject[0]}</span>}
        </div>

        <div className="field billing-full">
          <label className="field-label" htmlFor="message">
            Message <span style={{ color: 'var(--hot)' }}>*</span>
          </label>
          <textarea
            id="message"
            name="message"
            placeholder="How can we help you?"
            rows={6}
            required
            disabled={isPending}
            className={`textarea ${state.errors?.message ? 'input-error' : ''}`}
          />
          {state.errors?.message && <span className="field-error">{state.errors.message[0]}</span>}
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button
          type="submit"
          disabled={isPending}
          className={`btn ${isPending ? 'btn-mute' : 'btn-hot'} btn-xl btn-block`}
        >
          {isPending ? (
            <>
              <Loader2
                className="h-4 w-4 animate-spin"
                style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }}
              />
              Sending...
            </>
          ) : (
            <>Send message →</>
          )}
        </button>
      </div>
    </form>
  );
}
