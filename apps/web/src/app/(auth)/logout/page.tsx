'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { clearCheckoutStorage } from '@/lib/client-storage';
import { cleanupOnLogout } from './actions';

export default function LogoutPage() {
  const [status, setStatus] = useState<'cleaning' | 'signing-out'>('cleaning');

  useEffect(() => {
    async function performLogout() {
      try {
        // Step 1: Clear client-side storage
        clearCheckoutStorage();

        // Step 2: Server-side cleanup (release tickets, clear QCM state)
        await cleanupOnLogout();

        setStatus('signing-out');

        // Step 3: Sign out and redirect to home
        await signOut({ callbackUrl: '/' });
      } catch (error) {
        console.error('Logout cleanup error:', error);
        // Even if cleanup fails, still sign out
        await signOut({ callbackUrl: '/' });
      }
    }

    performLogout();
  }, []);

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">
          {status === 'cleaning' ? 'Cleaning up...' : 'Signing out...'}
        </CardTitle>
        <CardDescription>
          {status === 'cleaning'
            ? 'Releasing reserved tickets and clearing session data'
            : 'Please wait while we log you out'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </CardContent>
    </Card>
  );
}
