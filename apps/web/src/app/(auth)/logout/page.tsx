'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LogoutPage() {
  useEffect(() => {
    // Immediately sign out and redirect to home
    signOut({ callbackUrl: '/' });
  }, []);

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Signing out...</CardTitle>
        <CardDescription>Please wait while we log you out</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </CardContent>
    </Card>
  );
}
