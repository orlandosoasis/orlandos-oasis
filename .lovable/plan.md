This is a substantial change spanning the database, admin UI, and billing logic. Here's the proposed plan in four phases.

## Phase 1 — Pricing source of truth (DB + admin UI)

Create a centralized pricing catalog so customer signup, Edit Homeowner, and Edit Scheduled Service all read from the same place.

New tables:
- `pricing_pool_sizes` — `size` (small/medium/large), `base_monthly_price`, `display_name`
- `pricing_frequencies` — `frequency` (weekly/biweekly/monthly), `multiplier` (or `price_delta`), `display_name`
- `pricing_addons` — `key`, `name`, `price`, `billing_type` (one_time / monthly), `active`
- `pricing_grandfathered_plans` — `name`, `monthly_price`, `description`, `active` (selectable templates admins can apply to legacy homeowners)

New admin route: **`/admin-dashboard/pricing`** (sidebar entry: "Services & Pricing") with four tabs:
1. Pool Sizes — edit Small/Medium/Large base prices
2. Service Frequency — edit frequency multipliers/prices
3. Add-ons — CRUD list (name, price, one-time vs monthly, active toggle)
4. Grandfathered Plans — CRUD list of legacy pricing templates

All edits flow through Supabase with realtime invalidation.

Customer signup flow (`ServiceConfigStep`, `AddonsStep`, `Step4Checkout`) will read from these tables via a new `usePricing()` hook instead of hardcoded values.

## Phase 2 — Edit Homeowner: custom charges + grandfathered override

Extend `EditHomeownerModal` (and underlying profile data):
- Show current calculated monthly price broken down: pool size + frequency + recurring add-ons + custom charges.
- New section **"Custom Charges"**: add/remove rows with `{ name, amount, billing_type: one_time | monthly }`. Stored in a new `homeowner_custom_charges` table.
- New section **"Grandfathered Pricing"**: toggle + selector to pick a template from `pricing_grandfathered_plans`, OR enter a manual override monthly amount. When active, this overrides the standard calculation. Existing `is_grandfathered` / `grandfathered_note` fields on `profiles` are reused; add `grandfathered_plan_id` and `grandfathered_monthly_override`.

Monthly billing calculation (new SQL view or function `compute_homeowner_monthly(homeowner_id)`):
```
if grandfathered: return override price
else: pool_size_base + frequency_adjustment + sum(active recurring add-ons) + sum(monthly custom charges)
```
One-time custom charges appear on next invoice only.

## Phase 3 — Edit Scheduled Service pricing

Update the admin "Edit Service" modal (currently in `AdminDashboard`) to display:
- Base service price (derived from service type + pool size)
- Add-ons applied to this specific visit (multi-select from `pricing_addons`)
- Custom one-time charges for this visit
- Total

These values are persisted on the `services` row (new columns: `addon_ids uuid[]`, `custom_charges jsonb`, `computed_price numeric`).

## Phase 4 — Admin-initiated cancellation with outstanding balance

New action on Edit Homeowner: **"Cancel Account"** → opens modal:
- Shows outstanding balance (sum of unpaid invoices / custom charges).
- Options:
  - **Collect payment now** → opens PayNow flow for the outstanding balance, then cancels.
  - **Cancel & keep balance due** → cancels subscription but flags `balance_due` on the profile; balance remains visible in admin until cleared.
- Cancellation effective date picker (today vs end of billing period).
- Calls a new `admin_cancel_subscription(homeowner_id, effective_end, preserve_balance, reason)` RPC.

New columns on `profiles`:
- `outstanding_balance numeric default 0`
- `balance_due_after_cancellation boolean default false`

Admin dashboard gets a small **"Balances Due"** widget listing cancelled homeowners with remaining balances.

## Technical notes

- All new public tables get `GRANT` + RLS (admins manage; homeowners read own; pricing tables readable by authenticated for signup).
- Realtime enabled on pricing tables so signup form updates instantly when admin edits prices.
- The existing `monthly_amount` column on profiles becomes a *cached* value, recomputed by trigger whenever inputs change, so existing UI keeps working.
- New `usePricing`, `useHomeownerBillingBreakdown`, `useCustomCharges` hooks.

## Out of scope (confirm if you want included)

- Actual payment processing integration (Stripe/Paddle) for "Collect payment now" — I'll wire it to the existing PayNow modal which currently simulates payment.
- Invoice PDF generation.
- Historical price snapshots on past services (will use current pricing for display).

---

Shall I proceed with all four phases, or would you like to scope down (e.g. start with Phase 1 + 2 only)?