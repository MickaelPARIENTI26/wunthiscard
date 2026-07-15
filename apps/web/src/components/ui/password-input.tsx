'use client';

import { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Drop-in replacement for a plain `<input type="password">` in this app's
// hand-styled forms (className="input ..." or an inline `style` object) — adds
// a show/hide eye toggle without changing the field's existing look. Forwards
// its ref so react-hook-form's `register()` still works when spread onto it.
export const PasswordInput = forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, style, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div style={{ position: 'relative' }}>
        <input
          {...props}
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={className}
          style={{ ...style, paddingRight: 42 }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            padding: '4px',
            margin: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--ink-faint)',
          }}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';
