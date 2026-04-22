'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-semibold',
    'border-[1.5px] border-[var(--ink)] rounded-[10px]',
    'shadow-[var(--shadow-sm)] transition-all duration-150 ease-out',
    'hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--ink)]',
    'active:translate-x-0 active:translate-y-0 active:shadow-[0_0_0_var(--ink)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'cursor-pointer [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: 'bg-[var(--ink)] text-[var(--bg)]',
        hot: 'bg-[var(--hot)] text-white',
        ghost: 'bg-[var(--surface)] text-[var(--ink)]',
        accent: 'bg-[var(--accent)] text-[var(--ink)]',
        // Legacy aliases — map old variants to Drop equivalents
        default: 'bg-[var(--ink)] text-[var(--bg)]',
        outline: 'bg-[var(--surface)] text-[var(--ink)]',
        secondary: 'bg-[var(--bg-2)] text-[var(--ink)]',
        destructive: 'bg-[var(--hot)] text-white',
        link: 'bg-transparent text-[var(--ink)] !border-0 !shadow-none hover:!shadow-none hover:translate-x-0 hover:translate-y-0 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'px-[18px] py-[11px] text-[13px]',
        default: 'px-[18px] py-[11px] text-[13px]',
        lg: 'px-[22px] py-[14px] text-[14px]',
        xl: 'px-[28px] py-[16px] text-[15px] rounded-[12px] shadow-[var(--shadow)] hover:shadow-[var(--shadow-lg)]',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'sm',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
