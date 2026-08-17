import type { Metadata } from 'next';

// The page itself is a client component, so its title lives here.
export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset the password on your WinUPrize account.',
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
