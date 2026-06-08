import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, style, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full px-4 py-2 text-base shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        style={{
          backgroundColor: 'var(--bg-input)',
          color: 'var(--ink-dim)',
          border: '1px solid var(--line)',
          borderRadius: '10px',
          outline: 'none',
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 199, 106, 0.2)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--line)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
