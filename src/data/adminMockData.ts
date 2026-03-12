// Admin Dashboard Mock Data

export interface AdminTechReview {
  reviewer: string;
  rating: number;
  message: string;
  date: string;
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

export const INIT_TECHNICIANS: AdminTechnician[] = [
  {
    id: 1, name: "Carlos M.", rating: 4.9, email: "carlos@oasis.com", phone: "(407) 555-1234", status: "Active", assignedPools: 3, completedServices: 12,
    reviews: [
      { reviewer: "John S.", rating: 5, message: "Great service. Pool looks perfect.", date: "Feb 25, 2026" },
      { reviewer: "Maria L.", rating: 5, message: "Always on time and very thorough.", date: "Feb 18, 2026" },
      { reviewer: "David K.", rating: 5, message: "Carlos is amazing. Highly recommend.", date: "Feb 10, 2026" },
      { reviewer: "Susan P.", rating: 4, message: "Good job overall, minor miss on tiles.", date: "Jan 28, 2026" },
      { reviewer: "Tom R.", rating: 5, message: "Excellent work as always!", date: "Jan 15, 2026" },
    ],
    pools: [
      { address: "742 Palm Grove Dr", homeowner: "John S.", nextService: "Mar 18, 2026", serviceType: "3-Hour Pool Service" },
      { address: "1100 Sunset Blvd", homeowner: "Maria L.", nextService: "Mar 20, 2026", serviceType: "Monthly Deep Clean" },
      { address: "58 Lakewood Ct", homeowner: "David K.", nextService: "Mar 22, 2026", serviceType: "3-Hour Pool Service" },
    ],
  },
  {
    id: 2, name: "Ana R.", rating: 4.7, email: "ana@oasis.com", phone: "(407) 555-5678", status: "Active", assignedPools: 2, completedServices: 8,
    reviews: [
      { reviewer: "Susan P.", rating: 5, message: "Very professional and detail-oriented.", date: "Feb 20, 2026" },
      { reviewer: "Tom R.", rating: 4, message: "Solid work, pool looks great.", date: "Feb 12, 2026" },
      { reviewer: "Lisa M.", rating: 5, message: "Ana is wonderful. So reliable!", date: "Jan 30, 2026" },
    ],
    pools: [
      { address: "320 Ocean View Rd", homeowner: "Susan P.", nextService: "Mar 19, 2026", serviceType: "3-Hour Pool Service" },
      { address: "87 Magnolia Ln", homeowner: "Tom R.", nextService: "Mar 21, 2026", serviceType: "Monthly Deep Clean" },
    ],
  },
  {
    id: 3, name: "James T.", rating: 4.5, email: "james@oasis.com", phone: "(407) 555-9012", status: "Active", assignedPools: 4, completedServices: 20,
    reviews: [
      { reviewer: "David K.", rating: 4, message: "Dependable and does quality work.", date: "Feb 22, 2026" },
      { reviewer: "Emily W.", rating: 5, message: "Our pool has never looked better!", date: "Feb 14, 2026" },
    ],
    pools: [
      { address: "455 Cypress Way", homeowner: "Emily W.", nextService: "Mar 17, 2026", serviceType: "3-Hour Pool Service" },
      { address: "12 Royal Palm Ave", homeowner: "Greg H.", nextService: "Mar 19, 2026", serviceType: "3-Hour Pool Service" },
      { address: "900 Hibiscus Dr", homeowner: "Nina F.", nextService: "Mar 23, 2026", serviceType: "Monthly Deep Clean" },
      { address: "234 Flamingo St", homeowner: "Kevin B.", nextService: "Mar 25, 2026", serviceType: "3-Hour Pool Service" },
    ],
  },
  {
    id: 4, name: "Priya S.", rating: 4.8, email: "priya@oasis.com", phone: "(407) 555-3456", status: "Inactive", assignedPools: 0, completedServices: 15,
    reviews: [
      { reviewer: "Lisa M.", rating: 5, message: "Priya was exceptional every visit.", date: "Jan 20, 2026" },
      { reviewer: "John S.", rating: 5, message: "Miss her service. Hope she returns!", date: "Jan 10, 2026" },
    ],
    pools: [],
  },
];

export const ADMIN_HOMEOWNERS: AdminHomeowner[] = [
  {
    id: 1, name: "John S.", email: "john@email.com", phone: "(407) 555-1111", address: "742 Palm Grove Dr, Orlando, FL", plan: "Premium Monthly", startDate: "Jan 01, 2025",
    pools: [{ address: "742 Palm Grove Dr", size: "15x30 ft", technician: "Carlos M.", nextService: "Mar 18, 2026" }],
    services: [
      { date: "Feb 25, 2026", type: "3-Hour Pool Service", technician: "Carlos M.", status: "Completed" },
      { date: "Mar 18, 2026", type: "3-Hour Pool Service", technician: "Carlos M.", status: "Scheduled" },
    ],
  },
  {
    id: 2, name: "Maria L.", email: "maria@email.com", phone: "(407) 555-2222", address: "1100 Sunset Blvd, Orlando, FL", plan: "Basic Monthly", startDate: "Mar 15, 2025",
    pools: [{ address: "1100 Sunset Blvd", size: "12x24 ft", technician: "Carlos M.", nextService: "Mar 20, 2026" }],
    services: [
      { date: "Feb 18, 2026", type: "Monthly Deep Clean", technician: "Carlos M.", status: "Completed" },
      { date: "Mar 20, 2026", type: "Monthly Deep Clean", technician: "Carlos M.", status: "Scheduled" },
    ],
  },
  {
    id: 3, name: "David K.", email: "david@email.com", phone: "(407) 555-3333", address: "58 Lakewood Ct, Orlando, FL", plan: "Premium Monthly", startDate: "Jun 01, 2025",
    pools: [
      { address: "58 Lakewood Ct", size: "20x40 ft", technician: "Carlos M.", nextService: "Mar 22, 2026" },
      { address: "455 Cypress Way", size: "10x20 ft", technician: "James T.", nextService: "Mar 17, 2026" },
    ],
    services: [
      { date: "Feb 22, 2026", type: "3-Hour Pool Service", technician: "James T.", status: "Completed" },
      { date: "Mar 22, 2026", type: "3-Hour Pool Service", technician: "Carlos M.", status: "Scheduled" },
    ],
  },
  {
    id: 4, name: "Susan P.", email: "susan@email.com", phone: "(407) 555-4444", address: "320 Ocean View Rd, Orlando, FL", plan: "Basic Monthly", startDate: "Sep 10, 2025",
    pools: [{ address: "320 Ocean View Rd", size: "14x28 ft", technician: "Ana R.", nextService: "Mar 19, 2026" }],
    services: [
      { date: "Feb 20, 2026", type: "3-Hour Pool Service", technician: "Ana R.", status: "Completed" },
      { date: "Mar 19, 2026", type: "3-Hour Pool Service", technician: "Ana R.", status: "Scheduled" },
    ],
  },
  {
    id: 5, name: "Tom R.", email: "tom@email.com", phone: "(407) 555-5555", address: "87 Magnolia Ln, Orlando, FL", plan: "Premium Monthly", startDate: "Feb 01, 2025",
    pools: [{ address: "87 Magnolia Ln", size: "18x36 ft", technician: "Ana R.", nextService: "Mar 21, 2026" }],
    services: [
      { date: "Feb 12, 2026", type: "Monthly Deep Clean", technician: "Ana R.", status: "Completed" },
      { date: "Mar 21, 2026", type: "Monthly Deep Clean", technician: "Ana R.", status: "Scheduled" },
    ],
  },
];

export const ADMIN_ISSUES: AdminIssue[] = [
  { id: 1, homeowner: "John S.", type: "Service Quality", message: "The pool still had debris after the visit.", serviceDate: "Feb 25, 2026", email: "john@email.com", phone: "(407) 555-1111", status: "Open", relatedService: "3-Hour Pool Service by Carlos M." },
  { id: 2, homeowner: "Susan P.", type: "Scheduling", message: "Technician arrived 2 hours late without notice.", serviceDate: "Feb 20, 2026", email: "susan@email.com", phone: "(407) 555-4444", status: "Open", relatedService: "3-Hour Pool Service by Ana R." },
  { id: 3, homeowner: "Maria L.", type: "Billing", message: "I was charged twice for the February service.", serviceDate: "Feb 18, 2026", email: "maria@email.com", phone: "(407) 555-2222", status: "Resolved", relatedService: "Monthly Deep Clean by Carlos M." },
  { id: 4, homeowner: "Tom R.", type: "Equipment", message: "The pool pump seems to be making a strange noise after the last cleaning.", serviceDate: "Feb 12, 2026", email: "tom@email.com", phone: "(407) 555-5555", status: "Open", relatedService: "Monthly Deep Clean by Ana R." },
];

export const INIT_APPLICANTS: AdminApplicant[] = [
  {
    id: 101, firstName: "John", lastName: "Doe", email: "john.doe@email.com", phone: "(407) 555-0100",
    city: "Orlando", state: "FL", zip: "32801", experience: "3–5 years", resume: "John_Doe_Resume.pdf",
    certifications: [{ name: "CPO Certified", file: "CPO_Certificate.pdf" }, { name: "AFO Certified", file: "AFO_Certificate.pdf" }],
    appliedDate: "Mar 12, 2026", status: "Pending",
  },
  {
    id: 102, firstName: "Sarah", lastName: "Kim", email: "sarah.kim@email.com", phone: "(321) 555-0200",
    city: "Kissimmee", state: "FL", zip: "34741", experience: "5–10 years", resume: "Sarah_Kim_Resume.pdf",
    certifications: [{ name: "CPO Certified", file: "CPO_Cert_SK.pdf" }, { name: "NSPF Pool Operator", file: "NSPF_Cert.pdf" }, { name: "First Aid / CPR", file: "FirstAid_CPR.pdf" }],
    appliedDate: "Mar 10, 2026", status: "Pending",
  },
  {
    id: 103, firstName: "Marcus", lastName: "Rivera", email: "marcus.r@email.com", phone: "(407) 555-0300",
    city: "Winter Park", state: "FL", zip: "32789", experience: "1–3 years", resume: "Marcus_Rivera_CV.pdf",
    certifications: [{ name: "CPO Certified", file: "CPO_MR.pdf" }],
    appliedDate: "Mar 08, 2026", status: "Pending",
  },
  {
    id: 104, firstName: "Emily", lastName: "Tran", email: "emily.tran@email.com", phone: "(689) 555-0400",
    city: "Lake Nona", state: "FL", zip: "32827", experience: "5–10 years", resume: "Emily_Tran_Resume.pdf",
    certifications: [{ name: "CPO Certified", file: "CPO_ET.pdf" }, { name: "Aquatic Facility Operator", file: "AFO_ET.pdf" }],
    appliedDate: "Mar 05, 2026", status: "Approved",
  },
  {
    id: 105, firstName: "Derek", lastName: "Owens", email: "derek.o@email.com", phone: "(407) 555-0500",
    city: "Sanford", state: "FL", zip: "32771", experience: "Less than 1 year", resume: "Derek_Owens_Resume.pdf",
    certifications: [],
    appliedDate: "Mar 02, 2026", status: "Rejected",
  },
];
