export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      case_categories: {
        Row: {
          case_id: string;
          created_at: string;
          created_by: string;
          id: string;
          updated_at: string;
          updated_by: string | null;
          value: string;
        };
        Insert: {
          case_id: string;
          created_at?: string;
          created_by: string;
          id?: string;
          updated_at?: string;
          updated_by?: string | null;
          value: string;
        };
        Update: {
          case_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "case_categories_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: true;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_categories_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: true;
            referencedRelation: "cases_without_open_disputes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_categories_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_categories_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      case_comment_likes: {
        Row: {
          comment_id: string;
          created_at: string;
          id: string;
          user_id: string;
          vote_type: "up" | "down";
        };
        Insert: {
          comment_id: string;
          created_at?: string;
          id?: string;
          user_id: string;
          vote_type?: "up" | "down";
        };
        Update: {
          comment_id?: string;
          created_at?: string;
          id?: string;
          user_id?: string;
          vote_type?: "up" | "down";
        };
        Relationships: [
          {
            foreignKeyName: "case_comment_likes_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "case_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_comment_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      case_comment_moderations: {
        Row: {
          comment_id: string;
          id: string;
          moderated_at: string;
          moderated_by: string | null;
          reason: string;
        };
        Insert: {
          comment_id: string;
          id?: string;
          moderated_at?: string;
          moderated_by?: string | null;
          reason: string;
        };
        Update: {
          comment_id?: string;
          id?: string;
          moderated_at?: string;
          moderated_by?: string | null;
          reason?: string;
        };
        Relationships: [
          {
            foreignKeyName: "case_comment_moderations_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: true;
            referencedRelation: "case_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_comment_moderations_moderated_by_fkey";
            columns: ["moderated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      case_comment_reports: {
        Row: {
          comment_id: string;
          created_at: string;
          id: string;
          reason: string;
          reported_by: string;
        };
        Insert: {
          comment_id: string;
          created_at?: string;
          id?: string;
          reason: string;
          reported_by: string;
        };
        Update: {
          comment_id?: string;
          created_at?: string;
          id?: string;
          reason?: string;
          reported_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "case_comment_reports_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "case_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_comment_reports_reported_by_fkey";
            columns: ["reported_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      case_comments: {
        Row: {
          author_id: string;
          case_id: string;
          content: string;
          created_at: string;
          edited_at: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          case_id: string;
          content: string;
          created_at?: string;
          edited_at?: string | null;
          id?: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          case_id?: string;
          content?: string;
          created_at?: string;
          edited_at?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "case_comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_comments_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_comments_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases_without_open_disputes";
            referencedColumns: ["id"];
          },
        ];
      };
      case_keywords: {
        Row: {
          case_id: string;
          created_at: string;
          created_by: string;
          id: string;
          updated_at: string;
          values: string[];
        };
        Insert: {
          case_id: string;
          created_at?: string;
          created_by: string;
          id?: string;
          updated_at?: string;
          values: string[];
        };
        Update: {
          case_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          updated_at?: string;
          values?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "case_keywords_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_keywords_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases_without_open_disputes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_keywords_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      case_titles: {
        Row: {
          case_id: string;
          created_at: string;
          created_by: string;
          id: string;
          updated_at: string;
          updated_by: string | null;
          value: string;
        };
        Insert: {
          case_id: string;
          created_at?: string;
          created_by: string;
          id?: string;
          updated_at?: string;
          updated_by?: string | null;
          value: string;
        };
        Update: {
          case_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "case_titles_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: true;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_titles_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: true;
            referencedRelation: "cases_without_open_disputes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_titles_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_titles_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cases: {
        Row: {
          case_number: number;
          content: string;
          content_type: string;
          id: string;
          submitted_at: string;
          submitted_by: string;
          template_version: number;
        };
        Insert: {
          case_number?: number;
          content: string;
          content_type: string;
          id?: string;
          submitted_at?: string;
          submitted_by: string;
          template_version: number;
        };
        Update: {
          case_number?: number;
          content?: string;
          content_type?: string;
          id?: string;
          submitted_at?: string;
          submitted_by?: string;
          template_version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "cases_submitted_by_fkey";
            columns: ["submitted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cases_template_version_fkey";
            columns: ["template_version"];
            isOneToOne: false;
            referencedRelation: "review_templates";
            referencedColumns: ["version"];
          },
        ];
      };
      cases_metadata_disputes: {
        Row: {
          case_id: string;
          created_at: string | null;
          disputed_by: string;
          final_value: string | null;
          id: string;
          metadata_field: string;
          original_value: string;
          reason: string | null;
          resolution: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
        };
        Insert: {
          case_id: string;
          created_at?: string | null;
          disputed_by: string;
          final_value?: string | null;
          id?: string;
          metadata_field: string;
          original_value: string;
          reason?: string | null;
          resolution?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Update: {
          case_id?: string;
          created_at?: string | null;
          disputed_by?: string;
          final_value?: string | null;
          id?: string;
          metadata_field?: string;
          original_value?: string;
          reason?: string | null;
          resolution?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "review_disputes_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_disputes_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases_without_open_disputes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_disputes_disputed_by_fkey";
            columns: ["disputed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_disputes_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      open_graph_data: {
        Row: {
          case_id: string;
          created_at: string;
          fetch_error: string | null;
          fetch_status: string | null;
          http_status_code: number | null;
          last_fetched_at: string | null;
          og_description: string | null;
          og_image: string | null;
          og_image_alt: string | null;
          og_image_height: number | null;
          og_image_width: number | null;
          og_locale: string | null;
          og_site_name: string | null;
          og_title: string | null;
          og_type: string | null;
          og_url: string | null;
          raw_data: Json | null;
          updated_at: string;
        };
        Insert: {
          case_id: string;
          created_at?: string;
          fetch_error?: string | null;
          fetch_status?: string | null;
          http_status_code?: number | null;
          last_fetched_at?: string | null;
          og_description?: string | null;
          og_image?: string | null;
          og_image_alt?: string | null;
          og_image_height?: number | null;
          og_image_width?: number | null;
          og_locale?: string | null;
          og_site_name?: string | null;
          og_title?: string | null;
          og_type?: string | null;
          og_url?: string | null;
          raw_data?: Json | null;
          updated_at?: string;
        };
        Update: {
          case_id?: string;
          created_at?: string;
          fetch_error?: string | null;
          fetch_status?: string | null;
          http_status_code?: number | null;
          last_fetched_at?: string | null;
          og_description?: string | null;
          og_image?: string | null;
          og_image_alt?: string | null;
          og_image_height?: number | null;
          og_image_width?: number | null;
          og_locale?: string | null;
          og_site_name?: string | null;
          og_title?: string | null;
          og_type?: string | null;
          og_url?: string | null;
          raw_data?: Json | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "open_graph_data_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: true;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "open_graph_data_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: true;
            referencedRelation: "cases_without_open_disputes";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          get_notifications: boolean;
          id: string;
          is_admin: boolean;
          updated_at: string | null;
          username: string | null;
        };
        Insert: {
          get_notifications?: boolean;
          id: string;
          is_admin?: boolean;
          updated_at?: string | null;
          username?: string | null;
        };
        Update: {
          get_notifications?: boolean;
          id?: string;
          is_admin?: boolean;
          updated_at?: string | null;
          username?: string | null;
        };
        Relationships: [];
      };
      review_aggregations: {
        Row: {
          calculated_at: string;
          case_id: string;
          data: Json;
          result_score: number;
          reviewer_ids: string[];
        };
        Insert: {
          calculated_at?: string;
          case_id: string;
          data: Json;
          result_score: number;
          reviewer_ids: string[];
        };
        Update: {
          calculated_at?: string;
          case_id?: string;
          data?: Json;
          result_score?: number;
          reviewer_ids?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "review_aggregations_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: true;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_aggregations_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: true;
            referencedRelation: "cases_without_open_disputes";
            referencedColumns: ["id"];
          },
        ];
      };
      review_answers_in_progress: {
        Row: {
          case_id: string;
          created_at: string;
          data: Json;
          has_unpublished_changes: boolean;
          id: string;
          reviewed_by: string;
          submitted_review_answers_id: string | null;
          updated_at: string;
        };
        Insert: {
          case_id: string;
          created_at?: string;
          data: Json;
          has_unpublished_changes?: boolean;
          id?: string;
          reviewed_by: string;
          submitted_review_answers_id?: string | null;
          updated_at?: string;
        };
        Update: {
          case_id?: string;
          created_at?: string;
          data?: Json;
          has_unpublished_changes?: boolean;
          id?: string;
          reviewed_by?: string;
          submitted_review_answers_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_answers_in_progress_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_answers_in_progress_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases_without_open_disputes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_answers_in_progress_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "review_answers_in_progress_submitted_review_answers_id_fkey";
            columns: ["submitted_review_answers_id"];
            isOneToOne: false;
            referencedRelation: "review_answers_submitted";
            referencedColumns: ["id"];
          },
        ];
      };
      review_answers_submitted: {
        Row: {
          case_id: string;
          created_at: string;
          data: Json;
          id: string;
          reviewed_by: string;
          submitted_at: string;
          updated_at: string;
        };
        Insert: {
          case_id: string;
          created_at?: string;
          data: Json;
          id?: string;
          reviewed_by: string;
          submitted_at?: string;
          updated_at?: string;
        };
        Update: {
          case_id?: string;
          created_at?: string;
          data?: Json;
          id?: string;
          reviewed_by?: string;
          submitted_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_answers_submitted_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_answers_submitted_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases_without_open_disputes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_answers_submitted_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      review_templates: {
        Row: {
          created_at: string;
          created_by: string;
          template: Json;
          version: number;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          template: Json;
          version: number;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          template?: Json;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "review_templates_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      cases_without_open_disputes: {
        Row: {
          case_number: number | null;
          content: string | null;
          content_type: string | null;
          id: string | null;
          submitted_at: string | null;
          submitted_by: string | null;
          template_version: number | null;
        };
        Insert: {
          case_number?: number | null;
          content?: string | null;
          content_type?: string | null;
          id?: string | null;
          submitted_at?: string | null;
          submitted_by?: string | null;
          template_version?: number | null;
        };
        Update: {
          case_number?: number | null;
          content?: string | null;
          content_type?: string | null;
          id?: string | null;
          submitted_at?: string | null;
          submitted_by?: string | null;
          template_version?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "cases_submitted_by_fkey";
            columns: ["submitted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cases_template_version_fkey";
            columns: ["template_version"];
            isOneToOne: false;
            referencedRelation: "review_templates";
            referencedColumns: ["version"];
          },
        ];
      };
      review_aggregations_without_open_disputes: {
        Row: {
          calculated_at: string | null;
          case_id: string | null;
          data: Json | null;
          result_score: number | null;
          reviewer_ids: string[] | null;
        };
        Insert: {
          calculated_at?: string | null;
          case_id?: string | null;
          data?: Json | null;
          result_score?: number | null;
          reviewer_ids?: string[] | null;
        };
        Update: {
          calculated_at?: string | null;
          case_id?: string | null;
          data?: Json | null;
          result_score?: number | null;
          reviewer_ids?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "review_aggregations_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: true;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_aggregations_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: true;
            referencedRelation: "cases_without_open_disputes";
            referencedColumns: ["id"];
          },
        ];
      };
      review_answers_in_progress_without_open_disputes: {
        Row: {
          case_id: string | null;
          created_at: string | null;
          data: Json | null;
          has_unpublished_changes: boolean | null;
          id: string | null;
          reviewed_by: string | null;
          submitted_review_answers_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          case_id?: string | null;
          created_at?: string | null;
          data?: Json | null;
          has_unpublished_changes?: boolean | null;
          id?: string | null;
          reviewed_by?: string | null;
          submitted_review_answers_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          case_id?: string | null;
          created_at?: string | null;
          data?: Json | null;
          has_unpublished_changes?: boolean | null;
          id?: string | null;
          reviewed_by?: string | null;
          submitted_review_answers_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "review_answers_in_progress_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_answers_in_progress_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases_without_open_disputes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_answers_in_progress_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "review_answers_in_progress_submitted_review_answers_id_fkey";
            columns: ["submitted_review_answers_id"];
            isOneToOne: false;
            referencedRelation: "review_answers_submitted";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      get_project_url: { Args: never; Returns: string };
      get_user_leaderboard: {
        Args: { limit_count?: number };
        Returns: {
          cases_count: number;
          reviews_count: number;
          total_contributions: number;
          user_id: string;
          username: string;
        }[];
      };
      has_admin_resolution: {
        Args: { p_case_id: string; p_metadata_field: string };
        Returns: boolean;
      };
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

type DefaultSchema =
  DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  } ? keyof (
      & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
        "Tables"
      ]
      & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
        "Views"
      ]
    )
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? (
    & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
      "Tables"
    ]
    & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
      "Views"
    ]
  )[TableName] extends {
    Row: infer R;
  } ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (
    & DefaultSchema["Tables"]
    & DefaultSchema["Views"]
  ) ? (
      & DefaultSchema["Tables"]
      & DefaultSchema["Views"]
    )[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    } ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  } ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
      "Tables"
    ]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
    "Tables"
  ][TableName] extends {
    Insert: infer I;
  } ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    } ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  } ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
      "Tables"
    ]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
    "Tables"
  ][TableName] extends {
    Update: infer U;
  } ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    } ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  } ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]][
      "Enums"
    ]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][
    EnumName
  ]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  } ? keyof DatabaseWithoutInternals[
      PublicCompositeTypeNameOrOptions["schema"]
    ]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]][
    "CompositeTypes"
  ][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
