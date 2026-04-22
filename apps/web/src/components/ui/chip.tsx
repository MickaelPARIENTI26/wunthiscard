import { cn } from '@/lib/utils';

interface ChipProps {
  children: React.ReactNode;
  color?: 'accent' | 'hot' | 'pop' | 'warn';
  className?: string;
}

const colorMap = {
  accent: 'text-[var(--accent)]',
  hot: 'text-[var(--hot)]',
  pop: 'text-[var(--pop)]',
  warn: 'text-[var(--warn)]',
} as const;

export function Chip({ children, color = 'accent', className }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-block bg-[var(--ink)] px-[0.18em] pb-[2px] pt-0 rounded-[12px] rotate-[-2deg] font-bold',
        colorMap[color],
        className
      )}
    >
      {children}
    </span>
  );
}
