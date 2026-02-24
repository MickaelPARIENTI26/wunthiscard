import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'shadow',
        destructive: 'shadow-sm',
        outline: 'border shadow-sm',
        secondary: 'shadow-sm',
        ghost: '',
        link: 'underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-12 px-8',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

// Inline style fallbacks for button variants with CSS transitions
const variantStyles: Record<string, React.CSSProperties> = {
  default: {
    background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
    color: 'var(--text-primary)',
    borderRadius: '10px',
    boxShadow: '0 4px 16px rgba(240, 185, 11, 0.25)',
    transition: 'all 0.3s ease',
  },
  destructive: {
    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    color: 'var(--text-primary)',
    borderRadius: '10px',
    transition: 'all 0.3s ease',
  },
  outline: {
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-light)',
    borderRadius: '10px',
    transition: 'all 0.3s ease',
  },
  secondary: {
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    borderRadius: '10px',
    transition: 'all 0.3s ease',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--text-muted)',
    borderRadius: '10px',
    transition: 'all 0.3s ease',
  },
  link: {
    backgroundColor: 'transparent',
    color: 'var(--accent)',
    transition: 'all 0.3s ease',
  },
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size, asChild = false, style, onMouseEnter, onMouseLeave, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const inlineStyle = { ...variantStyles[variant ?? 'default'], ...style };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (variant === 'default') {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 24px rgba(240, 185, 11, 0.35)';
      } else if (variant === 'outline') {
        e.currentTarget.style.borderColor = 'var(--border-hover)';
        e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
      } else if (variant === 'ghost') {
        e.currentTarget.style.backgroundColor = 'var(--bg-card)';
        e.currentTarget.style.color = 'var(--text-primary)';
      }
      onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (variant === 'default') {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(240, 185, 11, 0.25)';
      } else if (variant === 'outline') {
        e.currentTarget.style.borderColor = 'var(--border-light)';
        e.currentTarget.style.backgroundColor = 'transparent';
      } else if (variant === 'ghost') {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = 'var(--text-muted)';
      }
      onMouseLeave?.(e);
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={inlineStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
