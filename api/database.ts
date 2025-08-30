import { SQLDatabase } from "encore.dev/storage/sqldb";

// Database schema for the hackathon MVP
export const db = new SQLDatabase("legalease", {
  migrations: "./migrations",
});

// Simple document interface for cached AustLII documents
export interface Doc {
  id: string;
  url: string;
  content: string;
  tags: string; // comma-separated tags like "business,nsw,planning"
  created_at: Date;
}

// Query log interface for tracking user interactions
export interface Query {
  id: string;
  question: string;
  answer: string;
  docs_used: string; // comma-separated doc IDs
  created_at: Date;
}

// Reference data interfaces for dynamic data management

export interface Jurisdiction {
  id: string;
  name: string;
  official_name?: string;
  type: 'federal' | 'state' | 'territory' | 'council' | 'region';
  parent_jurisdiction_id?: string;
  state_code?: string;
  council_code?: string;
  abn?: string;
  website_url?: string;
  api_endpoint?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AuthorityContact {
  id: string;
  jurisdiction_id: string;
  authority_name: string;
  contact_type: string;
  phone?: string;
  email?: string;
  website_url: string;
  physical_address?: string;
  postal_address?: string;
  operating_hours?: string;
  services?: string; // JSON array
  last_verified: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface LocationMapping {
  id: string;
  location_name: string;
  location_type: 'suburb' | 'city' | 'postcode' | 'region';
  state_code: string;
  council_id: string;
  postcode_range?: string;
  latitude?: number;
  longitude?: number;
  created_at: Date;
  updated_at: Date;
}

export interface FeeSchedule {
  id: string;
  jurisdiction_id: string;
  fee_category: string;
  fee_type: string;
  description: string;
  min_cost?: number;
  max_cost?: number;
  currency: string;
  unit?: string;
  conditions?: string; // JSON array
  source_url?: string;
  effective_date?: Date;
  expiry_date?: Date;
  last_updated: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RequirementTemplate {
  id: string;
  jurisdiction_id: string;
  activity_type: string;
  requirement_category: string;
  title: string;
  description: string;
  is_mandatory: boolean;
  estimated_timeframe?: string;
  steps: string; // JSON array
  prerequisites?: string; // JSON array
  source_url?: string;
  last_updated: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ExternalDataCache {
  id: string;
  cache_key: string;
  data_source: string;
  response_data: string; // JSON
  request_params?: string; // JSON
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface DataSource {
  id: string;
  source_name: string;
  source_type: 'api' | 'scraper' | 'manual';
  base_url?: string;
  api_key_required: boolean;
  rate_limit_per_hour: number;
  cache_duration_minutes: number;
  is_active: boolean;
  config?: string; // JSON
  created_at: Date;
  updated_at: Date;
}

// Helper function to generate simple IDs
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}