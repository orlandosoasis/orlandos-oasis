// Domain types for the admin portal view layer.
// IDs are strings (Supabase UUIDs) for fetched rows, but we accept
// number too so the AddHomeownerModal can keep using crypto.randomUUID() / Date.now()
// without immediate breakage.

export type ReviewStatus = "Pending" | "Approved" | "Rejected";
export type ReviewRejectionReason = "spam" | "inappropriate" | "irrelevant" | "";

export interface AdminTechReview {
  id: string;
  reviewer: string;
  technicianName: string;
  rating: number;
  message: string;
  date: string;
  status: ReviewStatus;
  rejectionReason?: ReviewRejectionReason | string | null;
}

export interface AdminTechPool {
  address: string;
  homeowner: string;
  nextService: string;
  serviceType: string;
}

export interface AdminTechnician {
  id: string;
  name: string;
  rating: number;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
  assignedPools: number;
  completedServices: number;
  payoutPerPool?: number;
  reviews: AdminTechReview[];
  pools: AdminTechPool[];
}

export interface AdminHomeownerPool {
  id?: string;
  address: string;
  size: string;
  technician: string;
  technicianId?: string | null;
  nextService: string;
}

export interface AdminHomeownerService {
  id?: string;
  date: string;
  serviceDate?: string;
  type: string;
  technician: string;
  technicianId?: string | null;
  status: "Completed" | "Scheduled";
  poolId?: string;
}

export interface AdminHomeowner {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  plan: string;
  startDate: string;
  monthlyAmount?: number;
  pools: AdminHomeownerPool[];
  services: AdminHomeownerService[];
  manuallyAdded?: boolean;
  status?: "Active" | "Offline";
  frequency?: string;
  paymentMethod?: string;
  notes?: string;
  isGrandfathered?: boolean;
  grandfatheredNote?: string | null;
  isFreds?: boolean;
  notificationsEnabled?: boolean;
  subscriptionStatus?: "active" | "pending_cancellation" | "cancelled";
  subscriptionCancelledAt?: string | null;
  subscriptionEffectiveEndDate?: string | null;
  subscriptionCancellationReason?: string | null;
}

export type AdminIssueStatus = "Open" | "In Progress" | "Resolved";

export interface AdminIssue {
  id: string;
  homeowner: string;
  type: string;
  message: string;
  serviceDate: string;
  email: string;
  phone: string;
  status: AdminIssueStatus;
  relatedService: string;
  adminNotes?: string | null;
  assignedTechnicianId?: string | null;
}

export interface AdminApplicantCert {
  name: string;
  file: string;
}

export interface AdminApplicant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zip: string;
  experience: string;
  resume: string;
  certifications: AdminApplicantCert[];
  appliedDate: string;
  status: "Pending" | "Approved" | "Rejected";
}
