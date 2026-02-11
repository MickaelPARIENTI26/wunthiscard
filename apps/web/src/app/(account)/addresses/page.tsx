import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AddressList } from './address-list';
import { AddressForm } from './address-form';

export const metadata = {
  title: 'Addresses | WinThisCard',
  description: 'Manage your delivery addresses',
};

export default async function AddressesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/addresses');
  }

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: { isDefault: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Addresses</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your delivery addresses
        </p>
      </div>

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
  );
}
