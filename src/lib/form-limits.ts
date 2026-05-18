/**
 * Centralized maxLength values for every text input across the app.
 *
 * These match the DB CHECK constraints set in
 * `supabase/migrations/20260430010000_security_hardening_v3.sql` so that
 * client-side and server-side enforcement agree. If you tighten or expand
 * a DB constraint, update the matching value here too.
 *
 * Use cases:
 *  - Prevent users from pasting megabytes of text (storage DoS).
 *  - Prevent attempted XSS-via-overflow payloads (defense in depth alongside
 *    React's automatic escaping).
 *  - Give browsers and screen readers a clear maximum.
 */
export const FORM_LIMITS = {
  // Identity
  firstName: 50,
  lastName: 50,
  fullName: 100,
  email: 254, // RFC 5321 maximum
  password: 128,
  phone: 20, // formatted "(407) 555-1234" + slack

  // Address
  streetAddress: 200,
  addressLine2: 100,
  city: 100,
  state: 2,
  zipCode: 5,

  // Pool / service detail
  poolEquipment: 2000,
  poolAccessDetail: 1000,
  serviceType: 100,
  techNotes: 5000,

  // Communication
  messageBody: 5000,
  issueMessage: 5000,
  reviewMessage: 2000,
  contactMessage: 2000,
  cleaningNotes: 2000,
  specialNotes: 1000,

  // Tech application
  applicantExperience: 5000,
  certificationName: 100,

  // Misc
  searchQuery: 200,
  reasonOther: 500,
} as const;

export type FormLimit = keyof typeof FORM_LIMITS;
