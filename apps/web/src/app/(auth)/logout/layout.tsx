import type { Metadata } from 'next';

// The page itself is a client component, so its title lives here.
export const metadata: Metadata = {
  title: 'Signing Out',
  description: 'Signing you out of WinUPrize.',
};

export default function LogoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
