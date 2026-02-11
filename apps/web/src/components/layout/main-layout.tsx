import { Header } from './header';
import { Footer } from './footer';

interface MainLayoutProps {
  children: React.ReactNode;
  /** Mock user state for demo - replace with actual auth session */
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  } | null;
}

export function MainLayout({ children, user = null }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
