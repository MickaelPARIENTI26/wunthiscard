'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface SignOutButtonProps {
  className?: string;
}

export function SignOutButton({ className }: SignOutButtonProps) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className={`cursor-pointer ${className || ''}`}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Log out
    </button>
  );
}
