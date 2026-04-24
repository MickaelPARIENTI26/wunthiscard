import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ProfileForm } from './profile-form';
import { AddressSection } from './address-section';

export const metadata = {
  title: 'Profile | WinUCard',
  description: 'Manage your personal information and profile settings',
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/profile');
  }

  const [user, addresses] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        instagram: true,
        dateOfBirth: true,
        avatarUrl: true,
      },
    }),
    prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: { isDefault: 'desc' },
    }),
  ]);

  if (!user) {
    redirect('/login');
  }

  return (
    <div>
      {/* Drop-style profile hero */}
      <div
        style={{
          marginBottom: '32px',
          paddingBottom: '22px',
          borderBottom: '1.5px solid var(--ink)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
            fontWeight: 700,
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span className="live-dot" /> Your account · {user.firstName}
        </div>
        <h1
          style={{
            fontFamily: 'var(--display)',
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 700,
            letterSpacing: '-0.035em',
            lineHeight: 0.95,
            marginBottom: '10px',
          }}
        >
          Your <span className="chip">profile</span>.
        </h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: '15px', maxWidth: '640px' }}>
          Keep your details fresh so we can send your wins straight to your door.
        </p>
      </div>

      {/* Two-column layout: Personal Info (left) + Addresses (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <ProfileForm
          user={{
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone ?? '',
            instagram: user.instagram ?? '',
            dateOfBirth: user.dateOfBirth?.toISOString().split('T')[0] ?? '',
            avatarUrl: user.avatarUrl ?? '',
          }}
        />

        <AddressSection
          addresses={addresses.map((addr) => ({
            id: addr.id,
            label: addr.label,
            line1: addr.line1,
            line2: addr.line2,
            city: addr.city,
            county: addr.county,
            postcode: addr.postcode,
            country: addr.country,
            isDefault: addr.isDefault,
          }))}
        />
      </div>
    </div>
  );
}
