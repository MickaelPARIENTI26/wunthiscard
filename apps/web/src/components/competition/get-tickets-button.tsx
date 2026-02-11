import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface GetTicketsButtonProps {
  competitionSlug: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
}

export function GetTicketsButton({
  competitionSlug,
  className,
  size = 'lg',
  children = 'Get Your Tickets',
}: GetTicketsButtonProps) {
  return (
    <Button asChild size={size} className={className}>
      <Link href={`/competitions/${competitionSlug}/tickets`}>
        {children}
      </Link>
    </Button>
  );
}
