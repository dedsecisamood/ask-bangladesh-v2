// Hand-authored selected-row contracts, NOT generated database schema types.
// SQL migrations remain authoritative; full generated types are in database/generated.types.ts.
export type PublicationStatus =
  "draft" | "in_review" | "published" | "withdrawn";
export type IdentityStatus = "candidate" | "verified" | "suspended" | "retired";
export interface ServiceIdentityRow {
  id: string;
  slug: string;
  publication_status: PublicationStatus;
  is_synthetic: boolean;
  revision: string; // pg returns bigint as a string, not an unsafe JS number.
}
export interface AgencyIdentityRow extends ServiceIdentityRow {
  status: IdentityStatus;
  parent_agency_id: string | null;
}
export interface DomainIdentityRow {
  id: string;
  agency_id: string;
  hostname: string;
  canonical_hostname: string;
  authenticity_status: IdentityStatus;
  content_authority_status: "unknown" | "in_review" | "approved" | "rejected";
  crawl_permission_status: "unknown" | "allowed" | "denied" | "restricted";
  verified_at: Date | null;
}
