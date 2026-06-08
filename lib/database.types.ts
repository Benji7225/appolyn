export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      apps: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          bundle_id: string;
          platform: string;
          icon_url: string;
          store_url: string;
          asc_app_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          bundle_id: string;
          platform?: string;
          icon_url?: string;
          store_url?: string;
          asc_app_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          bundle_id?: string;
          platform?: string;
          icon_url?: string;
          store_url?: string;
          asc_app_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      aso_metrics: {
        Row: {
          id: string;
          app_id: string;
          date: string;
          downloads: number;
          revenue: number;
          rating: number;
          review_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          app_id: string;
          date: string;
          downloads?: number;
          revenue?: number;
          rating?: number;
          review_count?: number;
          created_at?: string;
        };
        Update: {
          downloads?: number;
          revenue?: number;
          rating?: number;
          review_count?: number;
        };
        Relationships: [];
      };
      app_metadata: {
        Row: {
          id: string;
          app_id: string;
          title: string;
          subtitle: string;
          keywords: string;
          description: string;
          version: string;
          is_current: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          app_id: string;
          title?: string;
          subtitle?: string;
          keywords?: string;
          description?: string;
          version?: string;
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          subtitle?: string;
          keywords?: string;
          description?: string;
          version?: string;
          is_current?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      app_localizations: {
        Row: {
          id: string;
          app_id: string;
          country_code: string;
          title: string;
          subtitle: string;
          keywords: string;
          description: string;
          promotional_text: string;
          version: string;
          is_current: boolean;
          last_published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          app_id: string;
          country_code?: string;
          title?: string;
          subtitle?: string;
          keywords?: string;
          description?: string;
          promotional_text?: string;
          version?: string;
          is_current?: boolean;
          last_published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          subtitle?: string;
          keywords?: string;
          description?: string;
          promotional_text?: string;
          version?: string;
          is_current?: boolean;
          last_published_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      keyword_searches: {
        Row: {
          id: string;
          user_id: string;
          app_id: string | null;
          keyword: string;
          country_code: string;
          popularity_score: number;
          difficulty_score: number;
          app_ranking: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          app_id?: string | null;
          keyword: string;
          country_code?: string;
          popularity_score?: number;
          difficulty_score?: number;
          app_ranking?: number | null;
          created_at?: string;
        };
        Update: {
          app_id?: string | null;
          country_code?: string;
          popularity_score?: number;
          difficulty_score?: number;
          app_ranking?: number | null;
        };
        Relationships: [];
      };
      asc_credentials: {
        Row: {
          id: string;
          user_id: string;
          key_id: string;
          issuer_id: string;
          private_key: string;
          team_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          key_id: string;
          issuer_id: string;
          private_key: string;
          team_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          key_id?: string;
          issuer_id?: string;
          private_key?: string;
          team_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type App = Database['public']['Tables']['apps']['Row'];
export type AsoMetrics = Database['public']['Tables']['aso_metrics']['Row'];
export type AppMetadata = Database['public']['Tables']['app_metadata']['Row'];
export type AppLocalization = Database['public']['Tables']['app_localizations']['Row'];
export type KeywordSearch = Database['public']['Tables']['keyword_searches']['Row'];
export type AscCredentials = Database['public']['Tables']['asc_credentials']['Row'];
