import { z } from 'zod';

// Password validation regex: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Auth validators
export const emailSchema = z.string().email('Invalid email address').toLowerCase().trim();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    passwordRegex,
    'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character'
  );

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  firstName: z.string().min(1, 'First name is required').max(50).trim(),
  lastName: z.string().min(1, 'Last name is required').max(50).trim(),
  dateOfBirth: z.coerce.date({
    required_error: 'Date of birth is required',
    invalid_type_error: 'Invalid date',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine((data) => {
  const today = new Date();
  const birthDate = new Date(data.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 18;
}, {
  message: 'You must be at least 18 years old to register',
  path: ['dateOfBirth'],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
});

// User validators
export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName: z.string().min(1).max(50).trim().optional(),
  displayName: z.string().max(50).trim().optional(),
  dateOfBirth: z.coerce.date().optional(),
  phone: z.string().max(20).optional(),
});

export const addressSchema = z.object({
  label: z.string().max(50).optional(),
  line1: z.string().min(1, 'Address line 1 is required').max(100),
  line2: z.string().max(100).optional(),
  city: z.string().min(1, 'City is required').max(50),
  county: z.string().max(50).optional(),
  postcode: z.string().min(1, 'Postcode is required').max(10),
  country: z.string().default('GB'),
  isDefault: z.boolean().default(false),
});

// Competition validators
export const competitionCategorySchema = z.enum([
  'POKEMON',
  'ONE_PIECE',
  'SPORTS_BASKETBALL',
  'SPORTS_FOOTBALL',
  'SPORTS_OTHER',
  'MEMORABILIA',
  'YUGIOH',
  'MTG',
  'OTHER',
]);

export const competitionStatusSchema = z.enum([
  'DRAFT',
  'UPCOMING',
  'ACTIVE',
  'SOLD_OUT',
  'DRAWING',
  'COMPLETED',
  'CANCELLED',
]);

export const createCompetitionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  subtitle: z.string().max(300).optional(),
  descriptionShort: z.string().min(1, 'Short description is required').max(500),
  descriptionLong: z.string().min(1, 'Long description is required'),
  category: competitionCategorySchema,
  subcategory: z.string().max(100).optional(),
  prizeValue: z.number().positive('Prize value must be positive'),
  ticketPrice: z.number().min(1, 'Ticket price must be at least £1'),
  totalTickets: z.number().int().min(1).max(100000),
  maxTicketsPerUser: z.number().int().min(1).max(100).default(50),
  saleStartDate: z.coerce.date().optional(),
  drawDate: z.coerce.date(),
  mainImageUrl: z.string().url('Invalid main image URL'),
  galleryUrls: z.array(z.string().url()).max(10).default([]),
  videoUrl: z.string().url().optional(),
  certificationNumber: z.string().max(50).optional(),
  grade: z.string().max(20).optional(),
  condition: z.string().max(100).optional(),
  provenance: z.string().optional(),
  questionText: z.string().min(1, 'Question is required'),
  questionChoices: z.array(z.string()).length(4, 'Must have exactly 4 choices'),
  questionAnswer: z.number().int().min(0).max(3, 'Answer must be 0-3'),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
});

// Ticket validators
export const reserveTicketsSchema = z.object({
  competitionId: z.string().min(1, 'Competition ID is required'),
  quantity: z.number().int().min(1, 'Select at least 1 ticket').max(50, 'Maximum 50 tickets per purchase'),
});

export const validateAnswerSchema = z.object({
  competitionId: z.string().cuid('Invalid competition ID'),
  answer: z.number().int().min(0).max(3, 'Answer must be 0-3'),
});

// Contact form validator
export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: emailSchema,
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
});

// Admin validators
export const adminUserActionSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  reason: z.string().max(500).optional(),
});

export const addFreeEntrySchema = z.object({
  competitionId: z.string().cuid('Invalid competition ID'),
  ticketNumbers: z.array(z.number().int().positive()).min(1),
  userEmail: emailSchema,
  userName: z.string().min(1).max(100),
});

// Export types from validators
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CreateCompetitionInput = z.infer<typeof createCompetitionSchema>;
export type ReserveTicketsInput = z.infer<typeof reserveTicketsSchema>;
// Legacy interface for backward compatibility
export interface ReserveTicketsLegacyInput { competitionId: string; ticketNumbers: number[] }
export type ValidateAnswerInput = z.infer<typeof validateAnswerSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type AdminUserActionInput = z.infer<typeof adminUserActionSchema>;
export type AddFreeEntryInput = z.infer<typeof addFreeEntrySchema>;
