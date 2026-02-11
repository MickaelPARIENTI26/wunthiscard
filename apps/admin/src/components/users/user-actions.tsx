'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Ban, ShieldCheck, MoreVertical, Shield, Mail } from 'lucide-react';
import { banUser, unbanUser, updateUserRole } from '@/app/dashboard/users/actions';

interface UserActionsProps {
  user: {
    id: string;
    email: string;
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
    isBanned: boolean;
  };
}

export function UserActions({ user }: UserActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);

  const handleBan = () => {
    startTransition(async () => {
      await banUser(user.id);
      setShowBanDialog(false);
    });
  };

  const handleUnban = () => {
    startTransition(async () => {
      await unbanUser(user.id);
    });
  };

  const handleRoleChange = () => {
    startTransition(async () => {
      await updateUserRole(user.id, user.role === 'ADMIN' ? 'USER' : 'ADMIN');
      setShowRoleDialog(false);
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Actions
            <MoreVertical className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => window.location.href = `mailto:${user.email}`}
          >
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowRoleDialog(true)}>
            <Shield className="mr-2 h-4 w-4" />
            {user.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.isBanned ? (
            <DropdownMenuItem onClick={handleUnban} disabled={isPending}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Unban User
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setShowBanDialog(true)}
              className="text-destructive"
            >
              <Ban className="mr-2 h-4 w-4" />
              Ban User
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban {user.email}? They will no longer be able to
              log in or participate in competitions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBan}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Banning...' : 'Ban User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.role === 'ADMIN' ? 'Remove Admin Role' : 'Grant Admin Role'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.role === 'ADMIN'
                ? `Are you sure you want to remove admin privileges from ${user.email}?`
                : `Are you sure you want to make ${user.email} an admin? They will have full access to the admin panel.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange} disabled={isPending}>
              {isPending ? 'Updating...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
