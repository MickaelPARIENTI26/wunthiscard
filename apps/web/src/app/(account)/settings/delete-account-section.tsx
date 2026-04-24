'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
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
    <div
      style={{
        background: 'var(--surface)',
        border: '1.5px solid var(--ink)',
        borderRadius: 'var(--radius)',
        boxShadow: '4px 4px 0 var(--hot)',
        padding: '28px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          paddingBottom: '20px',
          marginBottom: '20px',
          borderBottom: '1.5px dashed var(--line-2)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '1.5px solid var(--ink)',
            borderRadius: '12px',
            background: 'var(--hot)',
            boxShadow: '3px 3px 0 var(--ink)',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <AlertTriangle className="h-5 w-5" style={{ color: '#fff' }} />
        </div>
        <div>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '10px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--hot)',
              fontWeight: 700,
              marginBottom: '4px',
            }}
          >
            Danger zone
          </div>
          <h2
            style={{
              fontFamily: 'var(--display)',
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            Delete account
          </h2>
        </div>
      </div>

      <p style={{ fontSize: '14px', color: 'var(--ink-dim)', lineHeight: 1.5, marginBottom: '18px' }}>
        Permanently delete your account and all associated data. You will lose access to your tickets,
        wins history, and saved addresses. This action cannot be undone.
      </p>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button type="button" className="btn btn-hot">
            Delete account
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle
              style={{
                fontFamily: 'var(--display)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle className="h-5 w-5" style={{ color: 'var(--hot)' }} />
              Delete account
            </DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be reversed. All your data will be deleted.
            </DialogDescription>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
            <div
              style={{
                padding: '12px 14px',
                background: 'var(--bg-2)',
                border: '1px dashed var(--line-2)',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            >
              <p style={{ fontWeight: 700, color: 'var(--hot)', marginBottom: '6px' }}>Warning:</p>
              <ul
                style={{
                  listStyle: 'disc',
                  paddingLeft: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  color: 'var(--ink-dim)',
                }}
              >
                <li>Your account will be permanently deleted</li>
                <li>All your tickets and competition entries will be removed</li>
                <li>Your wins history will no longer be accessible</li>
                <li>Your saved addresses will be deleted</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="confirmEmail">
                Type <b>{email}</b> to confirm
              </label>
              <input
                id="confirmEmail"
                type="email"
                className="input"
                placeholder="Enter your email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                autoComplete="off"
              />
            </div>

            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'var(--hot)',
                  color: '#fff',
                  border: '1.5px solid var(--ink)',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setConfirmEmail('');
                setError(null);
              }}
              disabled={isDeleting}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!isConfirmed || isDeleting}
              className={`btn ${!isConfirmed || isDeleting ? 'btn-mute' : 'btn-hot'}`}
            >
              {isDeleting ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }}
                  />
                  Deleting...
                </>
              ) : (
                <>Delete account</>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
