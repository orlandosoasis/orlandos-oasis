// Admin mock data has been removed — data now comes from Supabase via
// src/hooks/useAdmin.ts. This file is kept only as a thin re-export so any
// remaining `@/data/adminMockData` import resolves to the canonical types in
// src/types/admin.ts. New code should import from "@/types/admin" directly.

export type {
  ReviewStatus,
  ReviewRejectionReason,
  AdminTechReview,
  AdminTechPool,
  AdminTechnician,
  AdminHomeownerPool,
  AdminHomeownerService,
  AdminHomeowner,
  AdminIssue,
  AdminApplicantCert,
  AdminApplicant,
} from "@/types/admin";
