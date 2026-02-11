'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { deleteAccount } from './actions';

interface DeleteAccountSectionProps {
  email: string;
}

export function DeleteAccountSection({ email }: DeleteAccountSectionProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = confirmEmail.toLowerCase() === email.toLowerCase();

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteAccount();

      if (result.success) {
        // Redirect to home page after account deletion
        router.push('/?deleted=true');
      } else {
        setError(result.error ?? 'Failed to delete account');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </div>
        <CardDescription>
          Irreversible and destructive actions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <h4 className="mb-2 font-semibold">Delete Account</h4>
          <p className="mb-4 text-sm text-muted-foreground">
            Permanently delete your account and all associated data. This action cannot be undone.
            You will lose access to your tickets, wins history, and saved addresses.
          </p>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Delete Account
                </DialogTitle>
                <DialogDescription>
                  This action is permanent and cannot be reversed. All your data will be deleted.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="rounded-lg bg-destructive/10 p-3 text-sm">
                  <p className="font-medium text-destructive">Warning:</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                    <li>Your account will be permanently deleted</li>
                    <li>All your tickets and competition entries will be removed</li>
                    <li>Your wins history will no longer be accessible</li>
                    <li>Your saved addresses will be deleted</li>
                    <li>This action cannot be undone</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmEmail">
                    Type <strong>{email}</strong> to confirm
                  </Label>
                  <Input
                    id="confirmEmail"
                    type="email"
                    placeholder="Enter your email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    autoComplete="off"
                  />
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    setConfirmEmail('');
                    setError(null);
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={!isConfirmed || isDeleting}
                >
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
