// Domain types for the admin portal.
// Some types are kept for components (AddHomeownerModal, EditHomeownerModal)
// that still create homeowner objects in-memory; data fetching uses
// the aggregate types in src/hooks/useAdmin.ts.

export type ReviewStatus = "Pending" | "Approved" | "Rejected";
export type ReviewRejectionReason = "spam" | "inappropriate" | "irrelevant" | "";

export interface AdminTechReview {
  id: number;
  reviewer: string;
  technicianName: string;
  rating: number;
  message: string;
  date: string;
  status: ReviewStatus;
  rejectionReason?: ReviewRejectionReason;
}

export interface AdminTechPool {
  address: string;
  homeowner: string;
  nextService: string;
  serviceType: string;
}

export interface AdminTechnician {
  id: number;
  name: string;
  rating: number;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
  assignedPools: number;
  completedServices: number;
  reviews: AdminTechReview[];
  pools: AdminTechPool[];
}

export interface AdminHomeownerPool {
  address: string;
  size: string;
  technician: string;
  nextService: string;
}

export interface AdminHomeownerService {
  date: string;
  type: string;
  technician: string;
  status: "Completed" | "Scheduled";
}

export interface AdminHomeowner {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  plan: string;
  startDate: string;
  pools: AdminHomeownerPool[];
  services: AdminHomeownerService[];
  manuallyAdded?: boolean;
  status?: "Active" | "Offline";
  frequency?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface AdminIssue {
  id: number;
  homeowner: string;
  type: string;
  message: string;
  serviceDate: string;
  email: string;
  phone: string;
  status: "Open" | "Resolved";
  relatedService: string;
}

export interface AdminApplicantCert {
  name: string;
  file: string;
}

export interface AdminApplicant {
  id: number;
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
