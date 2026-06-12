/**
 * Server-side age helpers. The client AgeGate cookie is UX only — these are the
 * real control that gates every money/entry path (UK Gambling Act 2005, 18+).
 */

export function getAge(dateOfBirth: Date | string): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function isAdult(dateOfBirth: Date | string | null | undefined): boolean {
  if (!dateOfBirth) return false;
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  if (Number.isNaN(dob.getTime())) return false;
  return getAge(dob) >= 18;
}
