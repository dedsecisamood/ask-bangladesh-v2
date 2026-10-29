export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  app_private: {
    Tables: {
      admin_memberships: {
        Row: {
          auth_user_id: string;
          created_at: string;
          id: string;
          revision: number;
          role: string;
          status: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          auth_user_id: string;
          created_at?: string;
          id?: string;
          revision?: number;
          role: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          auth_user_id?: string;
          created_at?: string;
          id?: string;
          revision?: number;
          role?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agencies: {
        Row: {
          abbreviation: string | null;
          administrative_level: string | null;
          created_at: string;
          directory_created_by: string | null;
          directory_edited_by: string | null;
          id: string;
          is_synthetic: boolean;
          parent_agency_id: string | null;
          publication_status: string;
          revision: number;
          slug: string;
          status: string;
          updated_at: string;
          verification_evidence_ref: string | null;
          verification_method: string | null;
          verified_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          abbreviation?: string | null;
          administrative_level?: string | null;
          created_at?: string;
          directory_created_by?: string | null;
          directory_edited_by?: string | null;
          id?: string;
          is_synthetic?: boolean;
          parent_agency_id?: string | null;
          publication_status?: string;
          revision?: number;
          slug: string;
          status?: string;
          updated_at?: string;
          verification_evidence_ref?: string | null;
          verification_method?: string | null;
          verified_at?: string | null;
        };
        Update: {
          abbreviation?: string | null;
          administrative_level?: string | null;
          created_at?: string;
          directory_created_by?: string | null;
          directory_edited_by?: string | null;
          id?: string;
          is_synthetic?: boolean;
          parent_agency_id?: string | null;
          publication_status?: string;
          revision?: number;
          slug?: string;
          status?: string;
          updated_at?: string;
          verification_evidence_ref?: string | null;
          verification_method?: string | null;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "agencies_directory_created_by_fkey";
            columns: ["directory_created_by"];
            isOneToOne: false;
            referencedRelation: "admin_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agencies_directory_edited_by_fkey";
            columns: ["directory_edited_by"];
            isOneToOne: false;
            referencedRelation: "admin_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agencies_parent_agency_id_fkey";
            columns: ["parent_agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agencies_parent_agency_id_fkey";
            columns: ["parent_agency_id"];
            isOneToOne: false;
            referencedRelation: "public_agency_metadata";
            referencedColumns: ["id"];
          },
        ];
      };
      agency_translations: {
        Row: {
          agency_id: string;
          created_at: string;
          description: string | null;
          locale: string;
          name: string;
          review_state: string;
          revision: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          agency_id: string;
          created_at?: string;
          description?: string | null;
          locale: string;
          name: string;
          review_state?: string;
          revision?: number;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          created_at?: string;
          description?: string | null;
          locale?: string;
          name?: string;
          review_state?: string;
          revision?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agency_translations_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agency_translations_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "public_agency_metadata";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          created_at: string;
          directory_created_by: string | null;
          directory_edited_by: string | null;
          display_order: number;
          id: string;
          is_synthetic: boolean;
          parent_category_id: string | null;
          publication_status: string;
          revision: number;
          slug: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          directory_created_by?: string | null;
          directory_edited_by?: string | null;
          display_order?: number;
          id?: string;
          is_synthetic?: boolean;
          parent_category_id?: string | null;
          publication_status?: string;
          revision?: number;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          directory_created_by?: string | null;
          directory_edited_by?: string | null;
          display_order?: number;
          id?: string;
          is_synthetic?: boolean;
          parent_category_id?: string | null;
          publication_status?: string;
          revision?: number;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_directory_created_by_fkey";
            columns: ["directory_created_by"];
            isOneToOne: false;
            referencedRelation: "admin_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "categories_directory_edited_by_fkey";
            columns: ["directory_edited_by"];
            isOneToOne: false;
            referencedRelation: "admin_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "categories_parent_category_id_fkey";
            columns: ["parent_category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "categories_parent_category_id_fkey";
            columns: ["parent_category_id"];
            isOneToOne: false;
            referencedRelation: "public_category_metadata";
            referencedColumns: ["id"];
          },
        ];
      };
      category_translations: {
        Row: {
          category_id: string;
          created_at: string;
          description: string | null;
          locale: string;
          name: string;
          review_state: string;
          revision: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          category_id: string;
          created_at?: string;
          description?: string | null;
          locale: string;
          name: string;
          review_state?: string;
          revision?: number;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          description?: string | null;
          locale?: string;
          name?: string;
          review_state?: string;
          revision?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "category_translations_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "category_translations_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "public_category_metadata";
            referencedColumns: ["id"];
          },
        ];
      };
      claim_evidence: {
        Row: {
          claim_id: string;
          created_at: string;
          note: string | null;
          passage_id: string;
          reviewed_at: string;
          reviewed_by: string;
          support_type: string;
        };
        ComputedFields: never;
        Insert: {
          claim_id: string;
          created_at?: string;
          note?: string | null;
          passage_id: string;
          reviewed_at: string;
          reviewed_by: string;
          support_type: string;
        };
        Update: {
          claim_id?: string;
          created_at?: string;
          note?: string | null;
          passage_id?: string;
          reviewed_at?: string;
          reviewed_by?: string;
          support_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "claim_evidence_claim_id_fkey";
            columns: ["claim_id"];
            isOneToOne: false;
            referencedRelation: "service_claims";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "claim_evidence_passage_id_fkey";
            columns: ["passage_id"];
            isOneToOne: false;
            referencedRelation: "passages";
            referencedColumns: ["id"];
          },
        ];
      };
      conflict_evidence: {
        Row: {
          conflict_id: string;
          passage_id: string;
          position: string;
        };
        ComputedFields: never;
        Insert: {
          conflict_id: string;
          passage_id: string;
          position: string;
        };
        Update: {
          conflict_id?: string;
          passage_id?: string;
          position?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conflict_evidence_conflict_id_fkey";
            columns: ["conflict_id"];
            isOneToOne: false;
            referencedRelation: "source_conflicts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conflict_evidence_passage_id_fkey";
            columns: ["passage_id"];
            isOneToOne: false;
            referencedRelation: "passages";
            referencedColumns: ["id"];
          },
        ];
      };
      crawl_network_state: {
        Row: {
          leased_until: string | null;
          next_request_at: string;
          singleton: boolean;
          ticket: string | null;
        };
        ComputedFields: never;
        Insert: {
          leased_until?: string | null;
          next_request_at?: string;
          singleton?: boolean;
          ticket?: string | null;
        };
        Update: {
          leased_until?: string | null;
          next_request_at?: string;
          singleton?: boolean;
          ticket?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "crawl_network_state_ticket_fkey";
            columns: ["ticket"];
            isOneToOne: false;
            referencedRelation: "crawl_retrievals";
            referencedColumns: ["id"];
          },
        ];
      };
      crawl_policies: {
        Row: {
          approved_by: string;
          approved_urls: string[];
          created_at: string;
          daily_requests: number;
          domain_revision: number;
          expires_at: string;
          id: string;
          max_bytes: number;
          max_redirects: number;
          proof: NonNullable<Json>;
          reviewer_revision: number;
          source_id: string;
          source_revision: number;
          user_agent: string;
        };
        ComputedFields: never;
        Insert: {
          approved_by: string;
          approved_urls: string[];
          created_at?: string;
          daily_requests?: number;
          domain_revision: number;
          expires_at: string;
          id?: string;
          max_bytes?: number;
          max_redirects?: number;
          proof: NonNullable<Json>;
          reviewer_revision: number;
          source_id: string;
          source_revision: number;
          user_agent: string;
        };
        Update: {
          approved_by?: string;
          approved_urls?: string[];
          created_at?: string;
          daily_requests?: number;
          domain_revision?: number;
          expires_at?: string;
          id?: string;
          max_bytes?: number;
          max_redirects?: number;
          proof?: NonNullable<Json>;
          reviewer_revision?: number;
          source_id?: string;
          source_revision?: number;
          user_agent?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crawl_policies_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "admin_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crawl_policies_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crawl_policies_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_base";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crawl_policies_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_prehealth";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crawl_policies_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      crawl_retrievals: {
        Row: {
          attempted_at: string;
          completed_at: string | null;
          content_hash: string | null;
          content_type: string | null;
          error: string | null;
          etag: string | null;
          final_url: string | null;
          http_status: number | null;
          id: string;
          job_fence: string | null;
          job_id: string | null;
          last_modified: string | null;
          policy_id: string;
          requested_url: string;
          response_size: number;
          retrieved_at: string | null;
          retry_after_seconds: number | null;
          source_id: string;
        };
        ComputedFields: never;
        Insert: {
          attempted_at?: string;
          completed_at?: string | null;
          content_hash?: string | null;
          content_type?: string | null;
          error?: string | null;
          etag?: string | null;
          final_url?: string | null;
          http_status?: number | null;
          id?: string;
          job_fence?: string | null;
          job_id?: string | null;
          last_modified?: string | null;
          policy_id: string;
          requested_url: string;
          response_size?: number;
          retrieved_at?: string | null;
          retry_after_seconds?: number | null;
          source_id: string;
        };
        Update: {
          attempted_at?: string;
          completed_at?: string | null;
          content_hash?: string | null;
          content_type?: string | null;
          error?: string | null;
          etag?: string | null;
          final_url?: string | null;
          http_status?: number | null;
          id?: string;
          job_fence?: string | null;
          job_id?: string | null;
          last_modified?: string | null;
          policy_id?: string;
          requested_url?: string;
          response_size?: number;
          retrieved_at?: string | null;
          retry_after_seconds?: number | null;
          source_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crawl_retrievals_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "ingestion_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crawl_retrievals_policy_id_fkey";
            columns: ["policy_id"];
            isOneToOne: false;
            referencedRelation: "crawl_policies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crawl_retrievals_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crawl_retrievals_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_base";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crawl_retrievals_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_prehealth";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crawl_retrievals_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      document_versions: {
        Row: {
          content_hash: string;
          created_at: string;
          effective_from: string | null;
          effective_to: string | null;
          expires_at: string | null;
          extracted_backend: string | null;
          extracted_key: string | null;
          extraction_method: string;
          extraction_profile: string;
          extraction_status: string;
          id: string;
          metadata: NonNullable<Json>;
          published_at: string | null;
          released_at: string | null;
          retrieved_at: string;
          review_note: string | null;
          review_state: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          revision: number;
          snapshot_backend: string;
          snapshot_key: string;
          source_document_id: string;
          supersedes_id: string | null;
          updated_at: string;
          version_number: number;
        };
        ComputedFields: never;
        Insert: {
          content_hash: string;
          created_at?: string;
          effective_from?: string | null;
          effective_to?: string | null;
          expires_at?: string | null;
          extracted_backend?: string | null;
          extracted_key?: string | null;
          extraction_method: string;
          extraction_profile: string;
          extraction_status?: string;
          id?: string;
          metadata?: NonNullable<Json>;
          published_at?: string | null;
          released_at?: string | null;
          retrieved_at: string;
          review_note?: string | null;
          review_state?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          revision?: number;
          snapshot_backend: string;
          snapshot_key: string;
          source_document_id: string;
          supersedes_id?: string | null;
          updated_at?: string;
          version_number: number;
        };
        Update: {
          content_hash?: string;
          created_at?: string;
          effective_from?: string | null;
          effective_to?: string | null;
          expires_at?: string | null;
          extracted_backend?: string | null;
          extracted_key?: string | null;
          extraction_method?: string;
          extraction_profile?: string;
          extraction_status?: string;
          id?: string;
          metadata?: NonNullable<Json>;
          published_at?: string | null;
          released_at?: string | null;
          retrieved_at?: string;
          review_note?: string | null;
          review_state?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          revision?: number;
          snapshot_backend?: string;
          snapshot_key?: string;
          source_document_id?: string;
          supersedes_id?: string | null;
          updated_at?: string;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "document_versions_source_document_id_fkey";
            columns: ["source_document_id"];
            isOneToOne: false;
            referencedRelation: "source_documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_versions_supersedes_id_fkey";
            columns: ["supersedes_id"];
            isOneToOne: false;
            referencedRelation: "document_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      embedding_profile_approvals: {
        Row: {
          approved_at: string;
          approved_by: string;
          approver_revision: number;
          enabled: boolean;
          id: number;
          note: string;
          profile_id: string;
        };
        ComputedFields: never;
        Insert: {
          approved_at?: string;
          approved_by: string;
          approver_revision: number;
          enabled?: boolean;
          id?: never;
          note: string;
          profile_id: string;
        };
        Update: {
          approved_at?: string;
          approved_by?: string;
          approver_revision?: number;
          enabled?: boolean;
          id?: never;
          note?: string;
          profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "embedding_profile_approvals_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "admin_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "embedding_profile_approvals_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "embedding_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      embedding_profiles: {
        Row: {
          created_at: string;
          dimensions: number;
          id: string;
          metric: string;
          model_id: string;
          model_revision: string;
          normalization: string;
          provider_key: string;
          tokenizer_revision: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          dimensions: number;
          id?: string;
          metric?: string;
          model_id: string;
          model_revision: string;
          normalization?: string;
          provider_key: string;
          tokenizer_revision: string;
        };
        Update: {
          created_at?: string;
          dimensions?: number;
          id?: string;
          metric?: string;
          model_id?: string;
          model_revision?: string;
          normalization?: string;
          provider_key?: string;
          tokenizer_revision?: string;
        };
        Relationships: [];
      };
      evidence_review_events: {
        Row: {
          claim_id: string | null;
          conflict_id: string | null;
          document_id: string | null;
          id: string;
          new_state: NonNullable<Json>;
          old_state: Json | null;
          recorded_at: string;
          reviewer_id: string | null;
          source_id: string | null;
          version_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          claim_id?: string | null;
          conflict_id?: string | null;
          document_id?: string | null;
          id?: string;
          new_state: NonNullable<Json>;
          old_state?: Json | null;
          recorded_at?: string;
          reviewer_id?: string | null;
          source_id?: string | null;
          version_id?: string | null;
        };
        Update: {
          claim_id?: string | null;
          conflict_id?: string | null;
          document_id?: string | null;
          id?: string;
          new_state?: NonNullable<Json>;
          old_state?: Json | null;
          recorded_at?: string;
          reviewer_id?: string | null;
          source_id?: string | null;
          version_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "evidence_review_events_claim_id_fkey";
            columns: ["claim_id"];
            isOneToOne: false;
            referencedRelation: "service_claims";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evidence_review_events_conflict_id_fkey";
            columns: ["conflict_id"];
            isOneToOne: false;
            referencedRelation: "source_conflicts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evidence_review_events_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "source_documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evidence_review_events_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evidence_review_events_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_base";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evidence_review_events_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_prehealth";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evidence_review_events_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evidence_review_events_version_id_fkey";
            columns: ["version_id"];
            isOneToOne: false;
            referencedRelation: "document_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      feedback: {
        Row: {
          category: string;
          created_at: string;
          expires_at: string;
          id: string;
          locale: string;
          page: string | null;
          service_id: string | null;
          source_id: string | null;
          state: string;
        };
        ComputedFields: never;
        Insert: {
          category: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          locale: string;
          page?: string | null;
          service_id?: string | null;
          source_id?: string | null;
          state?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          locale?: string;
          page?: string | null;
          service_id?: string | null;
          source_id?: string | null;
          state?: string;
        };
        Relationships: [
          {
            foreignKeyName: "feedback_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "public_service_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feedback_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "public_service_metadata_base";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feedback_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feedback_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feedback_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_base";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feedback_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_prehealth";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feedback_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      ingestion_controls: {
        Row: {
          critical_interval_seconds: number;
          general_interval_seconds: number;
          paused: boolean;
          singleton: boolean;
        };
        ComputedFields: never;
        Insert: {
          critical_interval_seconds?: number;
          general_interval_seconds?: number;
          paused?: boolean;
          singleton?: boolean;
        };
        Update: {
          critical_interval_seconds?: number;
          general_interval_seconds?: number;
          paused?: boolean;
          singleton?: boolean;
        };
        Relationships: [];
      };
      ingestion_events: {
        Row: {
          error_code: string | null;
          generation: number;
          id: number;
          job_id: string;
          kind: string;
          recorded_at: string;
        };
        ComputedFields: never;
        Insert: {
          error_code?: string | null;
          generation: number;
          id?: never;
          job_id: string;
          kind: string;
          recorded_at?: string;
        };
        Update: {
          error_code?: string | null;
          generation?: number;
          id?: never;
          job_id?: string;
          kind?: string;
          recorded_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ingestion_events_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "ingestion_jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      ingestion_jobs: {
        Row: {
          attempts: number;
          available_at: string;
          created_at: string;
          error_code: string | null;
          finished_at: string | null;
          generation: number;
          heartbeat_at: string | null;
          id: string;
          kind: string;
          lease_token: string | null;
          leased_until: string | null;
          policy_id: string;
          request_key: string;
          source_id: string;
          started_at: string | null;
          state: string;
          url: string;
          version_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          attempts?: number;
          available_at?: string;
          created_at?: string;
          error_code?: string | null;
          finished_at?: string | null;
          generation?: number;
          heartbeat_at?: string | null;
          id?: string;
          kind: string;
          lease_token?: string | null;
          leased_until?: string | null;
          policy_id: string;
          request_key: string;
          source_id: string;
          started_at?: string | null;
          state?: string;
          url: string;
          version_id?: string | null;
        };
        Update: {
          attempts?: number;
          available_at?: string;
          created_at?: string;
          error_code?: string | null;
          finished_at?: string | null;
          generation?: number;
          heartbeat_at?: string | null;
          id?: string;
          kind?: string;
          lease_token?: string | null;
          leased_until?: string | null;
          policy_id?: string;
          request_key?: string;
          source_id?: string;
          started_at?: string | null;
          state?: string;
          url?: string;
          version_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ingestion_jobs_policy_id_fkey";
            columns: ["policy_id"];
            isOneToOne: false;
            referencedRelation: "crawl_policies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ingestion_jobs_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ingestion_jobs_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_base";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ingestion_jobs_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_prehealth";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ingestion_jobs_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ingestion_jobs_version_id_fkey";
            columns: ["version_id"];
            isOneToOne: false;
            referencedRelation: "document_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      ingestion_outbox: {
        Row: {
          created_at: string;
          id: string;
          profile: string;
          state: string;
          topic: string;
          version_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          profile: string;
          state?: string;
          topic?: string;
          version_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          profile?: string;
          state?: string;
          topic?: string;
          version_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ingestion_outbox_version_id_fkey";
            columns: ["version_id"];
            isOneToOne: false;
            referencedRelation: "document_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      ingestion_targets: {
        Row: {
          blocked: boolean;
          failure_streak: number;
          hold_code: string | null;
          last_success_at: string | null;
          next_due_at: string;
          source_id: string;
          url: string;
        };
        ComputedFields: never;
        Insert: {
          blocked?: boolean;
          failure_streak?: number;
          hold_code?: string | null;
          last_success_at?: string | null;
          next_due_at?: string;
          source_id: string;
          url: string;
        };
        Update: {
          blocked?: boolean;
          failure_streak?: number;
          hold_code?: string | null;
          last_success_at?: string | null;
          next_due_at?: string;
          source_id?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ingestion_targets_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ingestion_targets_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_base";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ingestion_targets_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_prehealth";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ingestion_targets_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      metadata_releases: {
        Row: {
          agency_id: string | null;
          category_id: string | null;
          created_by: string;
          expires_at: string;
          id: string;
          locale: string;
          record_revision: number;
          reviewed_at: string;
          reviewed_by: string;
          reviewer_revision: number;
          service_id: string | null;
          source_id: string | null;
          translation_revision: number | null;
          withdrawn_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          agency_id?: string | null;
          category_id?: string | null;
          created_by: string;
          expires_at: string;
          id?: string;
          locale: string;
          record_revision: number;
          reviewed_at: string;
          reviewed_by: string;
          reviewer_revision: number;
          service_id?: string | null;
          source_id?: string | null;
          translation_revision?: number | null;
          withdrawn_at?: string | null;
        };
        Update: {
          agency_id?: string | null;
          category_id?: string | null;
          created_by?: string;
          expires_at?: string;
          id?: string;
          locale?: string;
          record_revision?: number;
          reviewed_at?: string;
          reviewed_by?: string;
          reviewer_revision?: number;
          service_id?: string | null;
          source_id?: string | null;
          translation_revision?: number | null;
          withdrawn_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "metadata_releases_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "metadata_releases_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "public_agency_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "metadata_releases_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "metadata_releases_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "public_category_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "metadata_releases_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "admin_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "metadata_releases_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "admin_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "metadata_releases_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "public_service_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "metadata_releases_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "public_service_metadata_base";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "metadata_releases_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "metadata_releases_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "metadata_releases_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_base";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "metadata_releases_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_prehealth";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "metadata_releases_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      official_domains: {
        Row: {
          agency_id: string;
          authenticity_status: string;
          canonical_hostname: string | null;
          content_authority_status: string;
          crawl_permission_status: string;
          created_at: string;
          hostname: string;
          id: string;
          is_synthetic: boolean;
          notes: string | null;
          revision: number;
          updated_at: string;
          verification_evidence_ref: string | null;
          verification_method: string | null;
          verified_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          agency_id: string;
          authenticity_status?: string;
          canonical_hostname?: never;
          content_authority_status?: string;
          crawl_permission_status?: string;
          created_at?: string;
          hostname: string;
          id?: string;
          is_synthetic?: boolean;
          notes?: string | null;
          revision?: number;
          updated_at?: string;
          verification_evidence_ref?: string | null;
          verification_method?: string | null;
          verified_at?: string | null;
        };
        Update: {
          agency_id?: string;
          authenticity_status?: string;
          canonical_hostname?: never;
          content_authority_status?: string;
          crawl_permission_status?: string;
          created_at?: string;
          hostname?: string;
          id?: string;
          is_synthetic?: boolean;
          notes?: string | null;
          revision?: number;
          updated_at?: string;
          verification_evidence_ref?: string | null;
          verification_method?: string | null;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "official_domains_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "official_domains_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "public_agency_metadata";
            referencedColumns: ["id"];
          },
        ];
      };
      passage_embeddings: {
        Row: {
          created_at: string;
          embedding_dimension: number;
          indexing_status: string;
          passage_id: string;
          profile_id: string;
          vector_data: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          embedding_dimension: number;
          indexing_status?: string;
          passage_id: string;
          profile_id: string;
          vector_data: string;
        };
        Update: {
          created_at?: string;
          embedding_dimension?: number;
          indexing_status?: string;
          passage_id?: string;
          profile_id?: string;
          vector_data?: string;
        };
        Relationships: [
          {
            foreignKeyName: "passage_embeddings_passage_id_fkey";
            columns: ["passage_id"];
            isOneToOne: false;
            referencedRelation: "passages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "passage_embeddings_profile_id_embedding_dimension_fkey";
            columns: ["profile_id", "embedding_dimension"];
            isOneToOne: false;
            referencedRelation: "embedding_profiles";
            referencedColumns: ["id", "dimensions"];
          },
        ];
      };
      passage_reviews: {
        Row: {
          expires_at: string | null;
          id: string;
          passage_id: string;
          proof: Json | null;
          reason: string;
          reviewed_at: string;
          reviewer_id: string;
          reviewer_revision: number;
          status: string;
        };
        ComputedFields: never;
        Insert: {
          expires_at?: string | null;
          id?: string;
          passage_id: string;
          proof?: Json | null;
          reason: string;
          reviewed_at?: string;
          reviewer_id: string;
          reviewer_revision: number;
          status: string;
        };
        Update: {
          expires_at?: string | null;
          id?: string;
          passage_id?: string;
          proof?: Json | null;
          reason?: string;
          reviewed_at?: string;
          reviewer_id?: string;
          reviewer_revision?: number;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "passage_reviews_passage_id_fkey";
            columns: ["passage_id"];
            isOneToOne: false;
            referencedRelation: "passages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "passage_reviews_reviewer_id_fkey";
            columns: ["reviewer_id"];
            isOneToOne: false;
            referencedRelation: "admin_memberships";
            referencedColumns: ["id"];
          },
        ];
      };
      passages: {
        Row: {
          character_end: number | null;
          character_start: number | null;
          content_hash: string | null;
          created_at: string;
          document_version_id: string;
          extraction_quality_status: string;
          heading: string | null;
          id: string;
          language: string;
          locator: NonNullable<Json>;
          normalized_text: string;
          ordinal: number;
          page_label: string | null;
          page_number: number | null;
          passage_text: string;
          section_path: string[];
        };
        ComputedFields: never;
        Insert: {
          character_end?: number | null;
          character_start?: number | null;
          content_hash?: never;
          created_at?: string;
          document_version_id: string;
          extraction_quality_status?: string;
          heading?: string | null;
          id?: string;
          language: string;
          locator?: NonNullable<Json>;
          normalized_text: string;
          ordinal: number;
          page_label?: string | null;
          page_number?: number | null;
          passage_text: string;
          section_path?: string[];
        };
        Update: {
          character_end?: number | null;
          character_start?: number | null;
          content_hash?: never;
          created_at?: string;
          document_version_id?: string;
          extraction_quality_status?: string;
          heading?: string | null;
          id?: string;
          language?: string;
          locator?: NonNullable<Json>;
          normalized_text?: string;
          ordinal?: number;
          page_label?: string | null;
          page_number?: number | null;
          passage_text?: string;
          section_path?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "passages_document_version_id_fkey";
            columns: ["document_version_id"];
            isOneToOne: false;
            referencedRelation: "document_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      publication_state: {
        Row: {
          generation: number;
          singleton: boolean;
        };
        ComputedFields: never;
        Insert: {
          generation?: number;
          singleton?: boolean;
        };
        Update: {
          generation?: number;
          singleton?: boolean;
        };
        Relationships: [];
      };
      service_agencies: {
        Row: {
          agency_id: string;
          created_at: string;
          relationship: string;
          review_state: string;
          service_id: string;
        };
        ComputedFields: never;
        Insert: {
          agency_id: string;
          created_at?: string;
          relationship?: string;
          review_state?: string;
          service_id: string;
        };
        Update: {
          agency_id?: string;
          created_at?: string;
          relationship?: string;
          review_state?: string;
          service_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_agencies_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_agencies_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "public_agency_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_agencies_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "public_service_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_agencies_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "public_service_metadata_base";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_agencies_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      service_aliases: {
        Row: {
          alias: string;
          created_at: string;
          id: string;
          language: string;
          normalized_alias: string | null;
          review_state: string;
          service_id: string;
        };
        ComputedFields: never;
        Insert: {
          alias: string;
          created_at?: string;
          id?: string;
          language: string;
          normalized_alias?: never;
          review_state?: string;
          service_id: string;
        };
        Update: {
          alias?: string;
          created_at?: string;
          id?: string;
          language?: string;
          normalized_alias?: never;
          review_state?: string;
          service_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_aliases_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "public_service_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_aliases_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "public_service_metadata_base";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_aliases_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      service_categories: {
        Row: {
          category_id: string;
          created_at: string;
          service_id: string;
        };
        ComputedFields: never;
        Insert: {
          category_id: string;
          created_at?: string;
          service_id: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          service_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "public_category_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_categories_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "public_service_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_categories_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "public_service_metadata_base";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_categories_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      service_claims: {
        Row: {
          applicability: NonNullable<Json>;
          claim_text: string;
          claim_type: string;
          created_at: string;
          created_by: string | null;
          effective_from: string | null;
          effective_to: string | null;
          id: string;
          is_synthetic: boolean;
          language: string;
          publication_status: string;
          review_note: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          revision: number;
          service_id: string;
          updated_at: string;
          verification_status: string;
        };
        ComputedFields: never;
        Insert: {
          applicability?: NonNullable<Json>;
          claim_text: string;
          claim_type: string;
          created_at?: string;
          created_by?: string | null;
          effective_from?: string | null;
          effective_to?: string | null;
          id?: string;
          is_synthetic?: boolean;
          language: string;
          publication_status?: string;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          revision?: number;
          service_id: string;
          updated_at?: string;
          verification_status?: string;
        };
        Update: {
          applicability?: NonNullable<Json>;
          claim_text?: string;
          claim_type?: string;
          created_at?: string;
          created_by?: string | null;
          effective_from?: string | null;
          effective_to?: string | null;
          id?: string;
          is_synthetic?: boolean;
          language?: string;
          publication_status?: string;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          revision?: number;
          service_id?: string;
          updated_at?: string;
          verification_status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_claims_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "public_service_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_claims_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "public_service_metadata_base";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_claims_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      service_sources: {
        Row: {
          relationship: string;
          service_id: string;
          source_id: string;
        };
        ComputedFields: never;
        Insert: {
          relationship?: string;
          service_id: string;
          source_id: string;
        };
        Update: {
          relationship?: string;
          service_id?: string;
          source_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_sources_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "public_service_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_sources_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "public_service_metadata_base";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_sources_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_sources_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_sources_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_base";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_sources_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_prehealth";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_sources_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      service_translations: {
        Row: {
          created_at: string;
          locale: string;
          review_state: string;
          revision: number;
          service_id: string;
          summary: string | null;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          locale: string;
          review_state?: string;
          revision?: number;
          service_id: string;
          summary?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          locale?: string;
          review_state?: string;
          revision?: number;
          service_id?: string;
          summary?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_translations_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "public_service_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_translations_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "public_service_metadata_base";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_translations_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: {
          created_at: string;
          directory_created_by: string | null;
          directory_edited_by: string | null;
          id: string;
          is_synthetic: boolean;
          primary_category_id: string | null;
          publication_status: string;
          revision: number;
          slug: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          directory_created_by?: string | null;
          directory_edited_by?: string | null;
          id?: string;
          is_synthetic?: boolean;
          primary_category_id?: string | null;
          publication_status?: string;
          revision?: number;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          directory_created_by?: string | null;
          directory_edited_by?: string | null;
          id?: string;
          is_synthetic?: boolean;
          primary_category_id?: string | null;
          publication_status?: string;
          revision?: number;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "services_directory_created_by_fkey";
            columns: ["directory_created_by"];
            isOneToOne: false;
            referencedRelation: "admin_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "services_directory_edited_by_fkey";
            columns: ["directory_edited_by"];
            isOneToOne: false;
            referencedRelation: "admin_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "services_primary_category_id_fkey";
            columns: ["primary_category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "services_primary_category_id_fkey";
            columns: ["primary_category_id"];
            isOneToOne: false;
            referencedRelation: "public_category_metadata";
            referencedColumns: ["id"];
          },
        ];
      };
      source_checks: {
        Row: {
          attempted_at: string;
          content_checked_at: string | null;
          content_hash: string | null;
          created_at: string;
          document_id: string;
          document_version_id: string | null;
          error_code: string | null;
          final_url: string | null;
          http_status: number | null;
          id: string;
          mime_validated: boolean;
          origin_validated: boolean;
          outcome: string;
          prior_check_id: string | null;
          redirect_manifest: NonNullable<Json>;
          source_id: string;
        };
        ComputedFields: never;
        Insert: {
          attempted_at: string;
          content_checked_at?: string | null;
          content_hash?: string | null;
          created_at?: string;
          document_id: string;
          document_version_id?: string | null;
          error_code?: string | null;
          final_url?: string | null;
          http_status?: number | null;
          id?: string;
          mime_validated?: boolean;
          origin_validated?: boolean;
          outcome: string;
          prior_check_id?: string | null;
          redirect_manifest?: NonNullable<Json>;
          source_id: string;
        };
        Update: {
          attempted_at?: string;
          content_checked_at?: string | null;
          content_hash?: string | null;
          created_at?: string;
          document_id?: string;
          document_version_id?: string | null;
          error_code?: string | null;
          final_url?: string | null;
          http_status?: number | null;
          id?: string;
          mime_validated?: boolean;
          origin_validated?: boolean;
          outcome?: string;
          prior_check_id?: string | null;
          redirect_manifest?: NonNullable<Json>;
          source_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "source_checks_document_id_source_id_fkey";
            columns: ["document_id", "source_id"];
            isOneToOne: false;
            referencedRelation: "source_documents";
            referencedColumns: ["id", "source_id"];
          },
          {
            foreignKeyName: "source_checks_document_version_id_document_id_fkey";
            columns: ["document_version_id", "document_id"];
            isOneToOne: false;
            referencedRelation: "document_versions";
            referencedColumns: ["id", "source_document_id"];
          },
          {
            foreignKeyName: "source_checks_prior_check_id_fkey";
            columns: ["prior_check_id"];
            isOneToOne: false;
            referencedRelation: "source_checks";
            referencedColumns: ["id"];
          },
        ];
      };
      source_conflicts: {
        Row: {
          applicability: NonNullable<Json>;
          claim_id: string | null;
          conflict_key: string;
          conflict_type: string;
          created_at: string;
          detected_at: string;
          id: string;
          resolution: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          revision: number;
          service_id: string | null;
          state: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          applicability?: NonNullable<Json>;
          claim_id?: string | null;
          conflict_key: string;
          conflict_type: string;
          created_at?: string;
          detected_at?: string;
          id?: string;
          resolution?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          revision?: number;
          service_id?: string | null;
          state?: string;
          updated_at?: string;
        };
        Update: {
          applicability?: NonNullable<Json>;
          claim_id?: string | null;
          conflict_key?: string;
          conflict_type?: string;
          created_at?: string;
          detected_at?: string;
          id?: string;
          resolution?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          revision?: number;
          service_id?: string | null;
          state?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "source_conflicts_claim_id_fkey";
            columns: ["claim_id"];
            isOneToOne: false;
            referencedRelation: "service_claims";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_conflicts_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "public_service_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_conflicts_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "public_service_metadata_base";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_conflicts_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      source_documents: {
        Row: {
          approval_status: string;
          canonical_url: string;
          created_at: string;
          current_version_id: string | null;
          discovered_at: string;
          document_title: string;
          document_type: string;
          id: string;
          is_synthetic: boolean;
          language: string;
          revision: number;
          risk_class: string;
          source_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          approval_status?: string;
          canonical_url: string;
          created_at?: string;
          current_version_id?: string | null;
          discovered_at?: string;
          document_title: string;
          document_type: string;
          id?: string;
          is_synthetic?: boolean;
          language?: string;
          revision?: number;
          risk_class?: string;
          source_id: string;
          updated_at?: string;
        };
        Update: {
          approval_status?: string;
          canonical_url?: string;
          created_at?: string;
          current_version_id?: string | null;
          discovered_at?: string;
          document_title?: string;
          document_type?: string;
          id?: string;
          is_synthetic?: boolean;
          language?: string;
          revision?: number;
          risk_class?: string;
          source_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "current_version_same_document";
            columns: ["current_version_id", "id"];
            isOneToOne: false;
            referencedRelation: "document_versions";
            referencedColumns: ["id", "source_document_id"];
          },
          {
            foreignKeyName: "source_documents_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_documents_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_base";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_documents_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_prehealth";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_documents_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      source_link_checks: {
        Row: {
          checked_at: string | null;
          evidence_ref: string | null;
          failure_code: string | null;
          id: string;
          outcome: string;
          requested_at: string;
          requested_by: string;
          source_id: string;
        };
        ComputedFields: never;
        Insert: {
          checked_at?: string | null;
          evidence_ref?: string | null;
          failure_code?: string | null;
          id?: string;
          outcome: string;
          requested_at?: string;
          requested_by: string;
          source_id: string;
        };
        Update: {
          checked_at?: string | null;
          evidence_ref?: string | null;
          failure_code?: string | null;
          id?: string;
          outcome?: string;
          requested_at?: string;
          requested_by?: string;
          source_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "source_link_checks_requested_by_fkey";
            columns: ["requested_by"];
            isOneToOne: false;
            referencedRelation: "admin_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_link_checks_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_link_checks_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_base";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_link_checks_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_prehealth";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_link_checks_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      source_registry_events: {
        Row: {
          action: string;
          actor_id: string;
          id: string;
          new_state: string;
          old_state: string | null;
          outbox_topic: string;
          reason: string;
          recorded_at: string;
          source_id: string;
          source_revision: number;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id: string;
          id?: string;
          new_state: string;
          old_state?: string | null;
          outbox_topic?: string;
          reason: string;
          recorded_at?: string;
          source_id: string;
          source_revision: number;
        };
        Update: {
          action?: string;
          actor_id?: string;
          id?: string;
          new_state?: string;
          old_state?: string | null;
          outbox_topic?: string;
          reason?: string;
          recorded_at?: string;
          source_id?: string;
          source_revision?: number;
        };
        Relationships: [
          {
            foreignKeyName: "source_registry_events_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "admin_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_registry_events_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_registry_events_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_base";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_registry_events_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_prehealth";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_registry_events_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      source_registry_requests: {
        Row: {
          actor_id: string;
          created_at: string;
          expires_at: string;
          request_hash: string;
          request_key: string;
          response: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          actor_id: string;
          created_at?: string;
          expires_at?: string;
          request_hash: string;
          request_key: string;
          response: NonNullable<Json>;
        };
        Update: {
          actor_id?: string;
          created_at?: string;
          expires_at?: string;
          request_hash?: string;
          request_key?: string;
          response?: NonNullable<Json>;
        };
        Relationships: [
          {
            foreignKeyName: "source_registry_requests_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "admin_memberships";
            referencedColumns: ["id"];
          },
        ];
      };
      source_verifications: {
        Row: {
          created_at: string;
          document_version_id: string | null;
          evidence_excerpt: string | null;
          evidence_ref: string;
          expires_at: string | null;
          id: string;
          method: string;
          notes: string | null;
          registry_content_revision: number | null;
          reviewer_id: string | null;
          source_id: string;
          status: string;
          verification_type: string;
          verified_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          document_version_id?: string | null;
          evidence_excerpt?: string | null;
          evidence_ref: string;
          expires_at?: string | null;
          id?: string;
          method: string;
          notes?: string | null;
          registry_content_revision?: number | null;
          reviewer_id?: string | null;
          source_id: string;
          status?: string;
          verification_type: string;
          verified_at?: string | null;
        };
        Update: {
          created_at?: string;
          document_version_id?: string | null;
          evidence_excerpt?: string | null;
          evidence_ref?: string;
          expires_at?: string | null;
          id?: string;
          method?: string;
          notes?: string | null;
          registry_content_revision?: number | null;
          reviewer_id?: string | null;
          source_id?: string;
          status?: string;
          verification_type?: string;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "source_verifications_document_version_id_fkey";
            columns: ["document_version_id"];
            isOneToOne: false;
            referencedRelation: "document_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_verifications_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_verifications_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_base";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_verifications_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "public_source_metadata_prehealth";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_verifications_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      sources: {
        Row: {
          agency_id: string;
          availability_checked_at: string | null;
          availability_evidence_ref: string | null;
          availability_status: string;
          canonical_url: string;
          content_use_status: string;
          created_at: string;
          description: string | null;
          id: string;
          is_synthetic: boolean;
          language: string;
          official_domain_id: string;
          registry_activated_at: string | null;
          registry_activated_by: string | null;
          registry_activated_reviewer_revision: number | null;
          registry_approved_at: string | null;
          registry_approved_by: string | null;
          registry_approved_reviewer_revision: number | null;
          registry_content_revision: number;
          registry_created_by: string | null;
          registry_edited_by: string | null;
          registry_second_review_required: boolean;
          registry_status: string;
          registry_submitted_by: string | null;
          revision: number;
          risk_class: string;
          scope_path: string;
          source_name: string | null;
          source_type: string;
          status: string;
          submitted_url: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          agency_id: string;
          availability_checked_at?: string | null;
          availability_evidence_ref?: string | null;
          availability_status?: string;
          canonical_url: string;
          content_use_status?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_synthetic?: boolean;
          language?: string;
          official_domain_id: string;
          registry_activated_at?: string | null;
          registry_activated_by?: string | null;
          registry_activated_reviewer_revision?: number | null;
          registry_approved_at?: string | null;
          registry_approved_by?: string | null;
          registry_approved_reviewer_revision?: number | null;
          registry_content_revision?: number;
          registry_created_by?: string | null;
          registry_edited_by?: string | null;
          registry_second_review_required?: boolean;
          registry_status?: string;
          registry_submitted_by?: string | null;
          revision?: number;
          risk_class?: string;
          scope_path?: string;
          source_name?: string | null;
          source_type?: string;
          status?: string;
          submitted_url?: string | null;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          availability_checked_at?: string | null;
          availability_evidence_ref?: string | null;
          availability_status?: string;
          canonical_url?: string;
          content_use_status?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_synthetic?: boolean;
          language?: string;
          official_domain_id?: string;
          registry_activated_at?: string | null;
          registry_activated_by?: string | null;
          registry_activated_reviewer_revision?: number | null;
          registry_approved_at?: string | null;
          registry_approved_by?: string | null;
          registry_approved_reviewer_revision?: number | null;
          registry_content_revision?: number;
          registry_created_by?: string | null;
          registry_edited_by?: string | null;
          registry_second_review_required?: boolean;
          registry_status?: string;
          registry_submitted_by?: string | null;
          revision?: number;
          risk_class?: string;
          scope_path?: string;
          source_name?: string | null;
          source_type?: string;
          status?: string;
          submitted_url?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sources_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sources_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "public_agency_metadata";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sources_official_domain_id_agency_id_fkey";
            columns: ["official_domain_id", "agency_id"];
            isOneToOne: false;
            referencedRelation: "official_domains";
            referencedColumns: ["id", "agency_id"];
          },
          {
            foreignKeyName: "sources_registry_activated_by_fkey";
            columns: ["registry_activated_by"];
            isOneToOne: false;
            referencedRelation: "admin_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sources_registry_approved_by_fkey";
            columns: ["registry_approved_by"];
            isOneToOne: false;
            referencedRelation: "admin_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sources_registry_created_by_fkey";
            columns: ["registry_created_by"];
            isOneToOne: false;
            referencedRelation: "admin_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sources_registry_edited_by_fkey";
            columns: ["registry_edited_by"];
            isOneToOne: false;
            referencedRelation: "admin_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sources_registry_submitted_by_fkey";
            columns: ["registry_submitted_by"];
            isOneToOne: false;
            referencedRelation: "admin_memberships";
            referencedColumns: ["id"];
          },
        ];
      };
      staff_audit_events: {
        Row: {
          action: string;
          created_at: string;
          evidence: Json | null;
          evidence_ref: string | null;
          id: string;
          membership_id: string | null;
          outbox_topic: string | null;
          reason: string | null;
          record_id: string | null;
          record_kind: string | null;
          record_revision: number | null;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          created_at?: string;
          evidence?: Json | null;
          evidence_ref?: string | null;
          id?: string;
          membership_id?: string | null;
          outbox_topic?: string | null;
          reason?: string | null;
          record_id?: string | null;
          record_kind?: string | null;
          record_revision?: number | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          evidence?: Json | null;
          evidence_ref?: string | null;
          id?: string;
          membership_id?: string | null;
          outbox_topic?: string | null;
          reason?: string | null;
          record_id?: string | null;
          record_kind?: string | null;
          record_revision?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "staff_audit_events_membership_id_fkey";
            columns: ["membership_id"];
            isOneToOne: false;
            referencedRelation: "admin_memberships";
            referencedColumns: ["id"];
          },
        ];
      };
      staff_auth_budgets: {
        Row: {
          attempts: number;
          window_start: string;
        };
        ComputedFields: never;
        Insert: {
          attempts: number;
          window_start: string;
        };
        Update: {
          attempts?: number;
          window_start?: string;
        };
        Relationships: [];
      };
      staff_sessions: {
        Row: {
          auth_session_id: string;
          bff_token_hash: string | null;
          created_at: string;
          expires_at: string;
          last_seen_at: string;
          membership_id: string;
          membership_revision: number;
          revoked_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          auth_session_id: string;
          bff_token_hash?: string | null;
          created_at?: string;
          expires_at?: string;
          last_seen_at?: string;
          membership_id: string;
          membership_revision: number;
          revoked_at?: string | null;
        };
        Update: {
          auth_session_id?: string;
          bff_token_hash?: string | null;
          created_at?: string;
          expires_at?: string;
          last_seen_at?: string;
          membership_id?: string;
          membership_revision?: number;
          revoked_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "staff_sessions_membership_id_fkey";
            columns: ["membership_id"];
            isOneToOne: false;
            referencedRelation: "admin_memberships";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      public_agency_metadata: {
        Row: {
          data: Json | null;
          id: string | null;
          locale: string | null;
          slug: string | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
      public_category_metadata: {
        Row: {
          data: Json | null;
          id: string | null;
          locale: string | null;
          slug: string | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
      public_service_metadata: {
        Row: {
          data: Json | null;
          id: string | null;
          locale: string | null;
          slug: string | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
      public_service_metadata_base: {
        Row: {
          data: Json | null;
          id: string | null;
          locale: string | null;
          slug: string | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
      public_source_metadata: {
        Row: {
          data: Json | null;
          id: string | null;
          locale: string | null;
          slug: string | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
      public_source_metadata_base: {
        Row: {
          data: Json | null;
          id: string | null;
          locale: string | null;
          slug: string | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
      public_source_metadata_prehealth: {
        Row: {
          data: Json | null;
          id: string | null;
          locale: string | null;
          slug: string | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
    };
    Functions: {
      claim_is_eligible: { Args: { claim_id: string }; Returns: boolean };
      claim_support_is_eligible: {
        Args: { claim_id: string; claim_type: string; service_id: string };
        Returns: boolean;
      };
      crawl_url_allowed: {
        Args: { host: string; value: string };
        Returns: boolean;
      };
      directory_term: { Args: { value: string }; Returns: string };
      embedding_profile_enabled: {
        Args: { profile: string };
        Returns: boolean;
      };
      ingestion_lease: {
        Args: { job_id: string; token: string };
        Returns: boolean;
      };
      keyword_normalize: { Args: { value: string }; Returns: string };
      keyword_vector: {
        Args: { body: string; heading: string };
        Returns: unknown;
      };
      metadata_released: {
        Args: {
          kind: string;
          locale: string;
          record_id: string;
          revision: number;
          translation_revision: number;
        };
        Returns: boolean;
      };
      passage_is_eligible: { Args: { passage_id: string }; Returns: boolean };
      registry_proof_valid: { Args: { proof: Json }; Returns: boolean };
      registry_public_eligible: {
        Args: { source_id: string };
        Returns: boolean;
      };
      registry_safe_url: { Args: { value: string }; Returns: boolean };
      retrieval_candidates: {
        Args: {
          agency_filter?: string;
          language_filter?: string;
          locale: string;
          passage_ids?: string[];
          service_filter?: string;
          source_filter?: string;
        };
        Returns: {
          document_id: string;
          document_version_id: string;
          evidence: Json;
          passage_id: string;
          source_id: string;
        }[];
      };
      source_link_health: { Args: { source_id: string }; Returns: Json };
      version_is_eligible: { Args: { version_id: string }; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  app_private: {
    Enums: {},
  },
} as const;
