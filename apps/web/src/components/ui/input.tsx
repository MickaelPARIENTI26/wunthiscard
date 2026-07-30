import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, style, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full px-4 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        style={{
          backgroundColor: 'var(--bg-input)',
          color: 'var(--ink)',
          border: '1px solid rgba(244, 241, 234, 0.2)',
          borderRadius: 0,
          outline: 'none',
          transition: 'border-color 0.2s ease',
          ...style,
        }}
        // Focus styling comes from the global `input:focus { border-color: var(--accent) }`
        // rule — the old JS handlers hardcoded the previous theme's green ring.
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
