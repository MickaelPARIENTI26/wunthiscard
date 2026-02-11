'use client';

import { useState } from 'react';
import { User, Mail, Shield, Calendar, Lock, Loader2, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ProfileContentProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
}

export function ProfileContent({ user }: ProfileContentProps) {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to change password');
        return;
      }

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'destructive';
      case 'ADMIN':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Full Name</Label>
            <p className="font-medium">
              {user.firstName} {user.lastName}
            </p>
          </div>

          <Separator />

          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs flex items-center gap-1">
              <Mail className="h-3 w-3" />
              Email Address
            </Label>
            <p className="font-medium">{user.email}</p>
          </div>

          <Separator />

          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Role
            </Label>
            <div>
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {user.role.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Account Created
            </Label>
            <p className="text-sm">{formatDate(user.createdAt)}</p>
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Last Updated
            </Label>
            <p className="text-sm">{formatDate(user.updatedAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {success && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                Password changed successfully
              </div>
            )}

            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
