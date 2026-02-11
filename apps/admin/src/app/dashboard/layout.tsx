import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          user={{
            firstName: session.user.firstName,
            lastName: session.user.lastName,
            email: session.user.email,
            role: session.user.role,
          }}
        />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <div className="mb-4">
            <Breadcrumbs />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
