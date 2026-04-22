import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PasswordChangeForm } from './password-change-form';
import { NotificationPreferences } from './notification-preferences';
import { DeleteAccountSection } from './delete-account-section';

export const metadata = {
  title: 'Settings | WinUCard',
  description: 'Manage your account settings and security options',
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/settings');
  }

  // Check if user has a password (OAuth users may not have one)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      passwordHash: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  const hasPassword = !!user.passwordHash;

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: '44px', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 8px' }}>
          Account Settings
        </h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: '15px' }}>
          Manage your account settings and security
        </p>
      </div>

      <PasswordChangeForm hasExistingPassword={hasPassword} />

      <NotificationPreferences />

      <DeleteAccountSection email={user.email} />
    </div>
  );
}
