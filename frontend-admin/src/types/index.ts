export interface Document {
  url: string
  tags: string[]
  jurisdiction: string
  document_type: string
  synthetic: boolean
  content_hash: string
  created_at: string
  updated_at: string
  content_length: number
}

export interface DocumentDetails extends Document {
  content_preview?: string
  cached_content?: string
}

export interface DocumentsResponse {
  documents: Document[]
  pagination: {
    total: number
    limit: number
    offset: number
    pages: number
  }
}

export interface DocumentStats {
  total_documents: number
  unique_jurisdictions: number
  unique_document_types: number
  synthetic_documents: number
  avg_content_length: number
  total_content_size: number
}

export interface JurisdictionInfo {
  jurisdiction: string
  document_count: number
  document_types: number
}

export interface DocumentTypeInfo {
  document_type: string
  document_count: number
  jurisdictions: number
}

export interface TagInfo {
  tag: string
  count: number
}

export interface TagsResponse {
  tags: TagInfo[]
  total_unique_tags: number
}

export interface Query {
  id: string
  question: string
  answer: string
  sources_used: string[]
  jurisdiction: string
  confidence: number
  execution_time: number
  tokens_used: number
  relevant: boolean
  relevance_reason: string
  events_count: number
  created_at: string
  sources_count: number
}

export interface Authority {
  id: number
  name: string
  official_name: string
  jurisdiction: string
  jurisdiction_level: string
  website: string
  contact_phone: string
  contact_email: string
  contact_chatbot: string
  contact_hours: string
  postal_address: string
  last_updated: string
  created_at: string
}

export interface DatabaseHealth {
  database_stats: any
  cache_stats: any
  health_status: 'healthy' | 'error'
  error?: string
  last_updated: string
}