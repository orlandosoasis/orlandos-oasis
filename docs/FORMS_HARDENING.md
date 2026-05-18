# Forms Hardening Setup Guide

This document covers the three additions made to the form layer:

1. **Character limits** — already live in the code
2. **CAPTCHA (Cloudflare Turnstile)** — needs Cloudflare + Supabase setup
3. **Email verification banner** — needs Supabase Auth setting toggled

A short note on **phone verification** is at the end.

---

## 1. Character limits

`src/lib/form-limits.ts` centralizes every `maxLength` value. The DB
also enforces these via CHECK constraints in
`supabase/migrations/20260430010000_security_hardening_v3.sql`, so the
client-side and server-side caps agree.

| Field | Max chars |
|---|---|
| firstName / lastName | 50 |
| fullName | 100 |
| email | 254 (RFC 5321) |
| password | 128 |
| phone | 20 |
| streetAddress | 200 |
| city | 100 |
| state | 2 |
| zipCode | 5 |
| messageBody / issueMessage / techNotes / applicantExperience | 5000 |
| contactMessage / cleaningNotes / reviewMessage | 2000 |
| poolEquipment | 2000 |
| poolAccessDetail | 1000 |

Why these are useful even with React's auto-escaping:

- Prevents users (or bots) from pasting megabytes of text and bloating
  storage.
- Stops simple "paste the entire script of Hamlet" abuse on free-text
  fields.
- Gives screen readers a clear maximum.
- Defense in depth alongside React JSX escaping and DB constraints.

---

## 2. CAPTCHA (Cloudflare Turnstile)

Why Turnstile instead of Google reCAPTCHA:

- Free unlimited.
- No Google tracking (privacy-friendly, better for EU/GDPR).
- Native Supabase Auth integration via the `captchaToken` option.
- Lightweight, no third-party cookies.

### Setup (one-time, ~5 minutes)

1. **Sign in to Cloudflare**: https://dash.cloudflare.com (free account).

2. **Add a Turnstile site**:
   - Navigate: Turnstile → Add site.
   - Name: `Orlando's Oasis`
   - Domains:
     - `orlandosoasispools.com`
     - `pool-snap-magic.lovable.app`
     - `localhost` (for local dev)
   - Widget mode: **Managed**
   - Save → copy the **Site Key** and **Secret Key**.

3. **Add the Site Key to Vite**:
   Open `.env` (or `.env.local`) and add:
   ```
   VITE_TURNSTILE_SITE_KEY=0x4AAAAAAAA_your_site_key_here
   ```
   Restart the dev server. Without this variable the widget renders
   nothing and the forms continue to work (fail-open in dev).

4. **Enable CAPTCHA in Supabase Auth**:
   - Open the Supabase Dashboard → `Authentication` → `Settings`.
   - Scroll to **Bot and Abuse Protection** → **CAPTCHA Settings**.
   - Provider: **Turnstile**.
   - Paste the **Secret Key**.
   - Save.

5. **Verify it works**:
   - Reload `/signup` in your browser.
   - The Turnstile widget should appear above the Sign Up button.
   - Submitting without solving it: Supabase returns 401.

### Forms protected today

| Form | Method |
|---|---|
| Login | `supabase.auth.signInWithPassword` with `captchaToken` |
| Signup | `supabase.auth.signUp` with `captchaToken` |
| Forgot password | `supabase.auth.resetPasswordForEmail` with `captchaToken` |
| Contact (anonymous) | Client-side gate before insert |
| Technician application (anonymous) | Client-side gate before insert |

**Note on the anonymous forms (Contact, Tech application)**: the
client-side check prevents most bot abuse but doesn't cryptographically
prove the Turnstile token. For full bot protection on those two, route
them through a Supabase Edge Function that verifies the Turnstile token
server-side before inserting. That's planned for a follow-up.

---

## 3. Email verification

Supabase Auth has built-in email verification but it's **off by default**
on new projects. Until you turn it on, users can sign up without
confirming their email address.

### Enable

1. Open the Supabase Dashboard → `Authentication` → `Providers` → `Email`.
2. Toggle **Confirm email** ON.
3. Save.

### What changes after toggling

- New signups receive a confirmation email and can't fully sign in
  until they click the link.
- The `EmailVerificationBanner` component (in `src/App.tsx`) appears
  for any logged-in user whose `email_confirmed_at` is still null,
  with a one-click **Resend** button.
- The banner snoozes for 24h when dismissed.

### Custom email template (optional but recommended)

Supabase ships a generic template. To personalize:

1. Dashboard → `Authentication` → `Email Templates` → `Confirm signup`.
2. Customize subject, body, branding.
3. Use the `{{ .ConfirmationURL }}` token where the link should go.

### Custom SMTP (for production)

Supabase's default email service has a low daily quota. Before launch,
configure a real provider:

- **Resend** (recommended): 3,000 emails/mo free, 100/day. Free until
  scale, then $20/mo for 50k.
- **Postmark / SendGrid / SES**: all supported.

Configure in: Dashboard → `Project Settings` → `SMTP Settings`.

---

## 4. Phone verification (deferred)

The user asked for phone verification. Implementation notes for when
you're ready:

### Why we deferred

- Supabase Phone Auth requires a Twilio (or MessageBird, Vonage) account.
- Twilio: ~$0.0075 per SMS sent in the US. With 1k signups/month sending
  one OTP each = ~$7.50/month, plus phone number rental ~$1/mo. Add
  resends and dual-factor login attempts, the cost easily doubles.
- For a marketplace at MVP / pre-launch, email verification + CAPTCHA
  is enough. Add phone verification when:
  - You're processing real payments and want a higher trust signal.
  - You're seeing real bot abuse on signup despite the CAPTCHA.
  - You want SMS-based 2FA for technicians and admins (recommended at
    100+ active users).

### When you turn it on

1. Sign up at Twilio (~$15 free trial credit).
2. Buy a US toll-free number for SMS sending (~$1/mo).
3. Get the Twilio Account SID and Auth Token.
4. Supabase Dashboard → Auth → Providers → Phone → enable, paste
   Twilio creds.
5. Wire `<PhoneVerifyStep>` into Signup (UI not built yet — would
   collect phone, call `supabase.auth.signInWithOtp({ phone })`, show
   a 6-digit input, call `supabase.auth.verifyOtp(...)` to confirm).
6. Add `phone_verified_at` column (or just check `auth.users.phone_confirmed_at`).

I can scaffold this whenever you say "do phone verification."
