import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-none border px-2.5 py-0.5 font-[family-name:var(--display)] text-[12.5px] font-semibold uppercase tracking-[0.12em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground',
        success:
          'border-transparent bg-green-500 text-white shadow hover:bg-green-500/80 dark:bg-green-600 dark:hover:bg-green-600/80',
        warning:
          'border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-500/80 dark:bg-yellow-600 dark:hover:bg-yellow-600/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

// Anything on a gold/warn fill reads #0A0A0A, never white/off-white.
const variantStyles: Record<string, React.CSSProperties> = {
  default: { backgroundColor: 'var(--accent)', color: '#0A0A0A' },
  secondary: { backgroundColor: 'var(--bg-2)', color: 'var(--ink)' },
  destructive: { backgroundColor: 'var(--hot)', color: '#0A0A0A' },
  outline: { backgroundColor: 'transparent', color: 'var(--ink)', borderColor: 'var(--line-2)' },
  success: { backgroundColor: 'var(--accent)', color: '#0A0A0A' },
  warning: { backgroundColor: 'var(--warn)', color: '#0A0A0A' },
};

function Badge({ className, variant, style, ...props }: BadgeProps) {
  const inlineStyle = { ...variantStyles[variant ?? 'default'], ...style };
  return <div className={cn(badgeVariants({ variant }), className)} style={inlineStyle} {...props} />;
}

export { Badge, badgeVariants };
