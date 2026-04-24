'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Loader2 } from 'lucide-react';
import { updateProfile } from './actions';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: z.string().max(20).optional(),
  instagram: z.string().max(30).optional(),
  dateOfBirth: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    instagram: string;
    dateOfBirth: string;
    avatarUrl: string;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      instagram: user.instagram,
      dateOfBirth: user.dateOfBirth,
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await updateProfile(data);

      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
      } else {
        setMessage({ type: 'error', text: result.error ?? 'Failed to update profile' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Only JPG, PNG, GIF and WebP files are allowed.' });
      return;
    }

    if (file.size > 1024 * 1024) {
      setMessage({ type: 'error', text: 'File too large. Maximum size is 1MB.' });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setAvatarUrl(result.avatarUrl);
        setMessage({ type: 'success', text: 'Photo updated successfully' });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: result.error ?? 'Failed to upload photo' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to upload photo' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1.5px solid var(--ink)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        padding: '28px',
      }}
    >
      {/* Header with avatar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          paddingBottom: '20px',
          marginBottom: '24px',
          borderBottom: '1.5px dashed var(--line-2)',
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              border: '1.5px solid var(--ink)',
              borderRadius: '50%',
              boxShadow: '3px 3px 0 var(--ink)',
              overflow: 'hidden',
              display: 'grid',
              placeItems: 'center',
              background: 'var(--accent)',
              color: 'var(--ink)',
              fontFamily: 'var(--display)',
              fontSize: '26px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${user.firstName} ${user.lastName}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              initials
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            aria-label="Upload photo"
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              width: '28px',
              height: '28px',
              border: '1.5px solid var(--ink)',
              borderRadius: '50%',
              background: 'var(--ink)',
              color: 'var(--accent)',
              display: 'grid',
              placeItems: 'center',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              opacity: isUploading ? 0.6 : 1,
              boxShadow: '2px 2px 0 var(--ink)',
            }}
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleAvatarUpload}
            style={{ display: 'none' }}
            aria-label="Upload profile photo"
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '10px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
              fontWeight: 700,
              marginBottom: '4px',
            }}
          >
            Personal information
          </div>
          <h2
            style={{
              fontFamily: 'var(--display)',
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              marginBottom: '4px',
            }}
          >
            {user.firstName} {user.lastName}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-dim)' }}>{user.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="billing-grid">
          <div className="field">
            <label className="field-label" htmlFor="firstName">First name</label>
            <input
              id="firstName"
              className={`input ${errors.firstName ? 'input-error' : ''}`}
              {...register('firstName')}
            />
            {errors.firstName && <span className="field-error">{errors.firstName.message}</span>}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="lastName">Last name</label>
            <input
              id="lastName"
              className={`input ${errors.lastName ? 'input-error' : ''}`}
              {...register('lastName')}
            />
            {errors.lastName && <span className="field-error">{errors.lastName.message}</span>}
          </div>

          <div className="field billing-full">
            <label className="field-label" htmlFor="phone">Phone number</label>
            <input
              id="phone"
              type="tel"
              className={`input ${errors.phone ? 'input-error' : ''}`}
              placeholder="+44 7700 900000"
              {...register('phone')}
            />
            {errors.phone && <span className="field-error">{errors.phone.message}</span>}
          </div>

          <div className="field billing-full">
            <label className="field-label" htmlFor="instagram">Instagram</label>
            <div className="phone-row">
              <div className="phone-cc">@</div>
              <input
                id="instagram"
                className={`input ${errors.instagram ? 'input-error' : ''}`}
                placeholder="winucard"
                {...register('instagram')}
              />
            </div>
            {errors.instagram && <span className="field-error">{errors.instagram.message}</span>}
          </div>

          <div className="field billing-full">
            <label className="field-label" htmlFor="dateOfBirth">Date of birth</label>
            <input
              id="dateOfBirth"
              type="date"
              className={`input ${errors.dateOfBirth ? 'input-error' : ''}`}
              {...register('dateOfBirth')}
            />
            <span className="field-hint">You must be 18 or older to participate.</span>
            {errors.dateOfBirth && <span className="field-error">{errors.dateOfBirth.message}</span>}
          </div>
        </div>

        {message && (
          <div
            style={{
              padding: '12px 16px',
              marginTop: '12px',
              background: message.type === 'success' ? 'var(--accent)' : 'var(--hot)',
              color: message.type === 'success' ? 'var(--ink)' : '#fff',
              border: '1.5px solid var(--ink)',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: 'var(--shadow-sm)',
            }}
            role="alert"
          >
            {message.text}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px dashed var(--line-2)',
          }}
        >
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className={`btn ${isSubmitting || !isDirty ? 'btn-mute' : 'btn-primary'} btn-xl`}
          >
            {isSubmitting ? (
              <>
                <Loader2
                  className="h-4 w-4 animate-spin"
                  style={{ display: 'inline-block', marginRight: 8, verticalAlign: 'middle' }}
                />
                Saving...
              </>
            ) : (
              <>Save changes →</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
