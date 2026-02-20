import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'shadow hover:opacity-90',
        destructive: 'shadow-sm hover:opacity-90',
        outline:
          'border shadow-sm hover:opacity-90',
        secondary: 'shadow-sm hover:opacity-80',
        ghost: 'hover:opacity-80',
        link: 'underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-md px-8',
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

// Inline style fallbacks for button variants
const variantStyles: Record<string, React.CSSProperties> = {
  default: { backgroundColor: '#FFD700', color: '#0f0f1a' },
  destructive: { backgroundColor: '#dc2626', color: '#f5f5f5' },
  outline: { backgroundColor: 'transparent', color: '#f5f5f5', borderColor: '#2a2a4a' },
  secondary: { backgroundColor: '#1f1f35', color: '#f5f5f5' },
  ghost: { backgroundColor: 'transparent', color: '#f5f5f5' },
  link: { backgroundColor: 'transparent', color: '#FFD700' },
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const inlineStyle = { ...variantStyles[variant ?? 'default'], ...style };
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={inlineStyle}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
