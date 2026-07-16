'use client';

import { useState, useRef } from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { submitContactForm, type ContactFormState } from './actions';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

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
  const [state, setState] = useState<ContactFormState>(initialState);
  const [isPending, setIsPending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  // Explicit client-side submit: preventDefault stops any native page reload,
  // we call the server action ourselves and apply the result. This guarantees
  // the user always sees a banner (success or error) and never a silent reload.
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;

    // Require the captcha when Turnstile is configured; the server verifies it
    // (fail-closed in prod). The token is single-use, so reset the widget afterwards.
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setState({ success: false, message: 'Please complete the captcha before sending.' });
      messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const formData = new FormData(form);
    if (turnstileToken) formData.set('cf-turnstile-response', turnstileToken);

    setIsPending(true);
    try {
      const result = await submitContactForm(initialState, formData);
      setState(result);
      if (result.success) {
        form.reset();
      }
    } catch (err) {
      console.error('Contact submit failed:', err);
      setState({
        success: false,
        message: 'Network error — please try again, or email contact@lucky-tcg.com directly.',
      });
    } finally {
      // The token was consumed by the server — get a fresh one for any retry.
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setIsPending(false);
      messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <div ref={messageRef}>
        {state.success && state.message && (
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
                <ul
                  style={{
                    margin: '6px 0 0',
                    paddingLeft: '18px',
                    fontWeight: 600,
                    fontSize: '13.5px',
                  }}
                >
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
            placeholder="How can we help you? (at least 10 characters)"
            rows={6}
            required
            disabled={isPending}
            className={`textarea ${state.errors?.message ? 'input-error' : ''}`}
          />
          {state.errors?.message && <span className="field-error">{state.errors.message[0]}</span>}
        </div>
      </div>

      {TURNSTILE_SITE_KEY && (
        <Turnstile
          ref={turnstileRef}
          siteKey={TURNSTILE_SITE_KEY}
          onSuccess={setTurnstileToken}
          onError={() => setTurnstileToken(null)}
          onExpire={() => setTurnstileToken(null)}
          options={{ appearance: 'interaction-only', theme: 'auto' }}
        />
      )}

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
