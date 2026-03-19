import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ProfileForm } from './profile-form';
import { AddressList } from '../addresses/address-list';
import { AddressForm } from '../addresses/address-form';

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

      {/* Two-column layout: Personal Info (left) + Addresses (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Personal Information */}
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

        {/* Right: Delivery Addresses */}
        <div className="space-y-6">
          <AddressList
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
          <AddressForm />
        </div>
      </div>
    </div>
  );
}
