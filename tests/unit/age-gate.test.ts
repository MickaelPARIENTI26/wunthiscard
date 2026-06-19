import { describe, it, expect } from 'vitest';
import { isAdult, getAge } from '../../apps/web/src/lib/age';
import { registerSchema } from '../../packages/shared/src/validators/index';

/**
 * The 18+ age gate is a legal control (UK Gambling Act 2005). These tests pin
 * the exact boundary behaviour of the server-side helpers in apps/web/src/lib/age.ts
 * and confirm the registration schema refuses anyone under 18.
 *
 * Helper: build a Date that is exactly `years`/`days` before *today* so the
 * assertions stay correct on any run date (no hard-coded calendar years).
 */
function dateYearsAgo(years: number, dayOffset = 0): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  if (dayOffset !== 0) {
    d.setDate(d.getDate() + dayOffset);
  }
  return d;
}

describe('Age gate · getAge', () => {
  it('returns exactly 18 on the 18th birthday (today)', () => {
    expect(getAge(dateYearsAgo(18))).toBe(18);
  });

  it('returns 17 the day before the 18th birthday', () => {
    // born 18 years ago + 1 day => birthday is tomorrow => still 17 today
    expect(getAge(dateYearsAgo(18, 1))).toBe(17);
  });

  it('returns 18 the day after the 18th birthday', () => {
    expect(getAge(dateYearsAgo(18, -1))).toBe(18);
  });

  it('returns 17 for someone born 17 years ago', () => {
    expect(getAge(dateYearsAgo(17))).toBe(17);
  });

  it('accepts an ISO string and a Date interchangeably', () => {
    const dob = dateYearsAgo(30);
    expect(getAge(dob.toISOString())).toBe(getAge(dob));
  });
});

describe('Age gate · isAdult', () => {
  it('is true at exactly 18 (birthday today)', () => {
    expect(isAdult(dateYearsAgo(18))).toBe(true);
  });

  it('is false one day before the 18th birthday', () => {
    expect(isAdult(dateYearsAgo(18, 1))).toBe(false);
  });

  it('is false at 17', () => {
    expect(isAdult(dateYearsAgo(17))).toBe(false);
  });

  it('is true at 18 + one day and well above', () => {
    expect(isAdult(dateYearsAgo(18, -1))).toBe(true);
    expect(isAdult(dateYearsAgo(40))).toBe(true);
  });

  it('handles the leap-year (29 Feb) birthday edge', () => {
    // Someone born 29 Feb 2000 turned 18 well before today (2026-06-19 baseline).
    // In a non-leap year their "birthday" effectively rolls to 1 Mar; either way
    // they are unambiguously an adult and isAdult must agree.
    expect(isAdult(new Date('2000-02-29'))).toBe(true);
    // A leap-day baby who is still a minor must be rejected.
    const recentLeap = new Date('2016-02-29'); // ~10 years old at 2026 baseline
    expect(isAdult(recentLeap)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isAdult(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isAdult(undefined)).toBe(false);
  });

  it('returns false for an invalid date string', () => {
    expect(isAdult('not-a-date')).toBe(false);
  });

  it('returns false for an Invalid Date object', () => {
    expect(isAdult(new Date('nonsense'))).toBe(false);
  });
});

describe('Age gate · registerSchema rejects under-18 DOB', () => {
  const base = {
    email: 'newuser@example.com',
    password: 'SecureP@ss1',
    confirmPassword: 'SecureP@ss1',
    firstName: 'John',
    lastName: 'Doe',
  };

  it('accepts an adult (exactly 18 today)', () => {
    expect(() =>
      registerSchema.parse({ ...base, dateOfBirth: dateYearsAgo(18) })
    ).not.toThrow();
  });

  it('rejects a 17-year-old', () => {
    expect(() =>
      registerSchema.parse({ ...base, dateOfBirth: dateYearsAgo(17) })
    ).toThrow();
  });

  it('rejects someone one day shy of 18', () => {
    expect(() =>
      registerSchema.parse({ ...base, dateOfBirth: dateYearsAgo(18, 1) })
    ).toThrow();
  });

  it('surfaces the 18+ message on the dateOfBirth path', () => {
    const result = registerSchema.safeParse({
      ...base,
      dateOfBirth: dateYearsAgo(15),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const dobIssue = result.error.issues.find((i) =>
        i.path.includes('dateOfBirth')
      );
      expect(dobIssue?.message).toBe(
        'You must be at least 18 years old to register'
      );
    }
  });
});
