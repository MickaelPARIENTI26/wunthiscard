import { auth } from '@/lib/auth';
import { Header } from './header';

export async function AuthHeader() {
  const session = await auth();

  const user = session?.user ? {
    name: session.user.name || `${session.user.firstName} ${session.user.lastName}`,
    email: session.user.email,
    avatarUrl: session.user.image ?? undefined,
  } : null;

  return <Header user={user} />;
}
