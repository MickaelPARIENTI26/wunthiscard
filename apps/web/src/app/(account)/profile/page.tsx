import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ProfileForm } from './profile-form';

export const metadata = {
  title: 'Profile | WinUCard',
  description: 'Manage your personal information and profile settings',
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/profile');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      dateOfBirth: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold md:text-3xl font-[family-name:var(--font-outfit)] text-gradient-gold"
        >
          Profile
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
          Manage your personal information
        </p>
      </div>

      <ProfileForm
        user={{
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone ?? '',
          dateOfBirth: user.dateOfBirth?.toISOString().split('T')[0] ?? '',
          avatarUrl: user.avatarUrl ?? '',
        }}
      />
    </div>
  );
}
