'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Matchday Gold recipes: squared, condensed uppercase, no resting shadow;
// gold fills always carry #0A0A0A text (never white).
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-bold',
    'font-[family-name:var(--display)] uppercase tracking-[0.1em]',
    'rounded-none border border-transparent',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
    'disabled:pointer-events-none disabled:opacity-50',
    'cursor-pointer [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--accent)] text-[#0A0A0A] hover:brightness-[1.14] hover:-translate-y-[3px] hover:shadow-[var(--glow)]',
        hot: 'bg-[var(--accent)] text-[#0A0A0A] hover:brightness-[1.14] hover:-translate-y-[3px] hover:shadow-[var(--glow)]',
        ghost:
          'bg-transparent font-semibold border-[var(--line-2)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
        accent:
          'bg-[var(--accent)] text-[#0A0A0A] hover:brightness-[1.14] hover:-translate-y-[3px] hover:shadow-[var(--glow)]',
        // Legacy aliases — mapped to the Matchday equivalents
        default:
          'bg-[var(--accent)] text-[#0A0A0A] hover:brightness-[1.14] hover:-translate-y-[3px] hover:shadow-[var(--glow)]',
        outline:
          'bg-transparent font-semibold border-[var(--line-2)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
        secondary:
          'bg-[var(--bg-2)] font-semibold border-[var(--line)] text-[var(--ink)] hover:border-[var(--accent)]',
        destructive:
          'bg-[var(--accent)] text-[#0A0A0A] hover:brightness-[1.14] hover:-translate-y-[3px] hover:shadow-[var(--glow)]',
        link: 'bg-transparent text-[var(--accent)] normal-case tracking-normal underline-offset-4 hover:underline',
      },
      size: {
        sm: 'px-[18px] py-[11px] text-[13px]',
        default: 'px-[18px] py-[11px] text-[13px]',
        lg: 'px-[24px] py-[14px] text-[15px]',
        xl: 'px-[30px] py-[17px] text-[16px]',
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
