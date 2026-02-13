'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

interface SignOutButtonProps {
  className?: string;
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter();

  const handleLogout = () => {
    // Redirect to logout page which handles cleanup before signing out
    router.push('/logout');
  };

  return (
    <button
      onClick={handleLogout}
      className={`cursor-pointer ${className || ''}`}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Log out
    </button>
  );
}
