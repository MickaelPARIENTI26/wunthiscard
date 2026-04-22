import { cn } from '@/lib/utils';

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
}

export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2.5 font-mono text-[11px] font-bold tracking-[0.15em] uppercase text-[var(--ink)]',
        'before:block before:w-5 before:h-0.5 before:bg-[var(--ink)]',
        className
      )}
    >
      {children}
    </span>
  );
}
