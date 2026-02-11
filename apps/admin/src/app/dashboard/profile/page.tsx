import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@winthiscard/database';
import { ProfileContent } from './profile-content';

export const metadata = {
  title: 'Profile - Admin',
  description: 'Manage your admin profile',
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch full user data including last login
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and password
        </p>
      </div>

      <ProfileContent
        user={{
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        }}
      />
    </div>
  );
}
