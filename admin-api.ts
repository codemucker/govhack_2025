#!/usr/bin/env node

// Admin API - Database inspection and management
// Provides endpoints for viewing documents, tags, jurisdictions, and other database contents

import { PersistentDatabase, Document, Query, Authority, DatabaseStats } from './persistent-database.js';

interface DocumentFilter {
  jurisdiction?: string;
  document_type?: string;
  synthetic?: boolean;
  search?: string;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  pages: number;
}

interface DocumentWithMetadata {
  url: string;
  tags: string[];
  jurisdiction: string;
  document_type: string;
  synthetic: boolean;
  content_hash: string;
  created_at: string;
  updated_at: string;
  content_length: number;
}

interface DocumentsResponse {
  documents: DocumentWithMetadata[];
  pagination: PaginationInfo;
}

interface DocumentStats {
  total_documents: number;
  unique_jurisdictions: number;
  unique_document_types: number;
  synthetic_documents: number;
  avg_content_length: number;
  total_content_size: number;
}

interface JurisdictionInfo {
  jurisdiction: string;
  document_count: number;
  document_types: number;
}

interface DocumentTypeInfo {
  document_type: string;
  document_count: number;
  jurisdictions: number;
}

interface TagInfo {
  tag: string;
  count: number;
}

interface TagsResponse {
  tags: TagInfo[];
  total_unique_tags: number;
}

interface DocumentDetails extends DocumentWithMetadata {
  content_length: number;
  content_preview: string;
}

interface QueryInfo {
  id: string;
  question: string;
  answer: string;
  sources_used: string[];
  jurisdiction: string;
  confidence: number;
  execution_time: number;
  tokens_used: number;
  relevant: boolean;
  relevance_reason: string;
  events_count: number;
  created_at: string;
  sources_count: number;
}

interface DatabaseHealth {
  database_stats: any;
  cache_stats: any;
  health_status: 'healthy' | 'error';
  error?: string;
  last_updated: string;
}

export class AdminApi {
  private db: PersistentDatabase;

  constructor(db: PersistentDatabase) {
    this.db = db;
  }

  // Get all documents with metadata
  async getDocuments(limit: number = 50, offset: number = 0, filters: DocumentFilter = {}): Promise<DocumentsResponse> {
    try {
      let query = `
        SELECT 
          url,
          tags,
          jurisdiction,
          document_type,
          synthetic,
          content_hash,
          created_at,
          updated_at,
          LENGTH(content) as content_length
        FROM documents 
      `;
      
      const params = [];
      const conditions = [];

      // Add filters
      if (filters.jurisdiction) {
        conditions.push('jurisdiction = ?');
        params.push(filters.jurisdiction);
      }
      
      if (filters.document_type) {
        conditions.push('document_type = ?');
        params.push(filters.document_type);
      }
      
      if (filters.synthetic !== undefined) {
        conditions.push('synthetic = ?');
        params.push(filters.synthetic);
      }

      if (filters.search) {
        conditions.push('(url LIKE ? OR tags LIKE ? OR content LIKE ?)');
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const documents = await this.db.allQuery(query, params);
      
      // Parse tags for each document
      const processedDocs = documents.map(doc => ({
        ...doc,
        tags: doc.tags ? doc.tags.split(',').filter(t => t.length > 0) : [],
        content_length: doc.content_length || 0
      }));

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM documents';
      const countParams = [];
      
      if (conditions.length > 0) {
        countQuery += ' WHERE ' + conditions.join(' AND ');
        // Remove LIMIT and OFFSET params for count
        countParams.push(...params.slice(0, -2));
      }
      
      const countResult = await this.db.getQuery(countQuery, countParams);
      const total = countResult?.total || 0;

      return {
        documents: processedDocs,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }

  // Get document statistics
  async getDocumentStats(): Promise<DocumentStats> {
    try {
      const stats = await Promise.all([
        this.db.getQuery('SELECT COUNT(*) as total FROM documents'),
        this.db.getQuery('SELECT COUNT(DISTINCT jurisdiction) as jurisdictions FROM documents'),
        this.db.getQuery('SELECT COUNT(DISTINCT document_type) as document_types FROM documents'),
        this.db.getQuery('SELECT COUNT(*) as synthetic FROM documents WHERE synthetic = 1'),
        this.db.getQuery('SELECT AVG(LENGTH(content)) as avg_content_length FROM documents'),
        this.db.getQuery('SELECT SUM(LENGTH(content)) as total_content_size FROM documents')
      ]);

      return {
        total_documents: stats[0]?.total || 0,
        unique_jurisdictions: stats[1]?.jurisdictions || 0,
        unique_document_types: stats[2]?.document_types || 0,
        synthetic_documents: stats[3]?.synthetic || 0,
        avg_content_length: Math.round(stats[4]?.avg_content_length || 0),
        total_content_size: stats[5]?.total_content_size || 0
      };
    } catch (error) {
      console.error('Error fetching document stats:', error);
      throw error;
    }
  }

  // Get unique jurisdictions
  async getJurisdictions(): Promise<JurisdictionInfo[]> {
    try {
      const jurisdictions = await this.db.allQuery(`
        SELECT 
          jurisdiction,
          COUNT(*) as document_count,
          COUNT(DISTINCT document_type) as document_types
        FROM documents 
        WHERE jurisdiction IS NOT NULL 
        GROUP BY jurisdiction 
        ORDER BY document_count DESC
      `);
      return jurisdictions;
    } catch (error) {
      console.error('Error fetching jurisdictions:', error);
      throw error;
    }
  }

  // Get unique document types
  async getDocumentTypes(): Promise<DocumentTypeInfo[]> {
    try {
      const types = await this.db.allQuery(`
        SELECT 
          document_type,
          COUNT(*) as document_count,
          COUNT(DISTINCT jurisdiction) as jurisdictions
        FROM documents 
        WHERE document_type IS NOT NULL 
        GROUP BY document_type 
        ORDER BY document_count DESC
      `);
      return types;
    } catch (error) {
      console.error('Error fetching document types:', error);
      throw error;
    }
  }

  // Get all unique tags with counts
  async getTags(limit: number = 100): Promise<TagsResponse> {
    try {
      const documents = await this.db.allQuery('SELECT tags FROM documents WHERE tags IS NOT NULL AND tags != ""');
      
      const tagCounts = {};
      documents.forEach(doc => {
        const tags = doc.tags.split(',').filter(t => t.length > 0);
        tags.forEach(tag => {
          const trimmedTag = tag.trim();
          tagCounts[trimmedTag] = (tagCounts[trimmedTag] || 0) + 1;
        });
      });

      // Sort tags by count and return top N
      const sortedTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([tag, count]) => ({ tag, count }));

      return {
        tags: sortedTags,
        total_unique_tags: Object.keys(tagCounts).length
      };
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  }

  // Get specific document details
  async getDocument(url: string): Promise<DocumentDetails | null> {
    try {
      const document = await this.db.getDocument(url);
      if (!document) {
        return null;
      }

      return {
        ...document,
        content_length: document.content?.length || 0,
        content_preview: document.content?.substring(0, 1000) || ''
      };
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  }

  // Get recent queries for analysis
  async getRecentQueries(limit: number = 50): Promise<QueryInfo[]> {
    try {
      const queries = await this.db.getRecentQueries(limit);
      return queries.map(query => ({
        ...query,
        sources_count: query.sources_used?.length || 0
      }));
    } catch (error) {
      console.error('Error fetching recent queries:', error);
      throw error;
    }
  }

  // Get authorities data
  async getAuthorities(): Promise<any[]> {
    try {
      const authorities = await this.db.getAllAuthorities();
      return authorities;
    } catch (error) {
      console.error('Error fetching authorities:', error);
      throw error;
    }
  }

  // Get legal taxonomy data
  async getLegalTaxonomy(): Promise<any> {
    try {
      const taxonomy = await this.db.getLegalTaxonomy();
      
      // Add counts for each area
      const enrichedTaxonomy = {
        ...taxonomy,
        legal_areas_with_counts: {}
      };

      for (const [areaId, areaData] of Object.entries(taxonomy.legal_areas || {})) {
        // Count documents that might relate to this area based on keywords
        const keywords = areaData.keywords || [];
        let documentCount = 0;
        
        if (keywords.length > 0) {
          const keywordConditions = keywords.map(() => 'tags LIKE ? OR content LIKE ?').join(' OR ');
          const keywordParams = keywords.flatMap(keyword => [`%${keyword}%`, `%${keyword}%`]);
          
          try {
            const result = await this.db.getQuery(
              `SELECT COUNT(*) as count FROM documents WHERE ${keywordConditions}`,
              keywordParams
            );
            documentCount = result?.count || 0;
          } catch (e) {
            // If query fails, just use 0
            documentCount = 0;
          }
        }

        enrichedTaxonomy.legal_areas_with_counts[areaId] = {
          ...areaData,
          related_document_count: documentCount
        };
      }

      return enrichedTaxonomy;
    } catch (error) {
      console.error('Error fetching legal taxonomy:', error);
      throw error;
    }
  }

  // Search documents
  async searchDocuments(query: string, limit: number = 20): Promise<DocumentWithMetadata[]> {
    try {
      const searchTerm = `%${query}%`;
      const documents = await this.db.allQuery(`
        SELECT 
          url,
          tags,
          jurisdiction,
          document_type,
          created_at,
          LENGTH(content) as content_length,
          CASE 
            WHEN url LIKE ? THEN 3
            WHEN tags LIKE ? THEN 2
            WHEN content LIKE ? THEN 1
            ELSE 0
          END as relevance_score
        FROM documents 
        WHERE url LIKE ? OR tags LIKE ? OR content LIKE ?
        ORDER BY relevance_score DESC, created_at DESC
        LIMIT ?
      `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limit]);

      return documents.map(doc => ({
        ...doc,
        tags: doc.tags ? doc.tags.split(',').filter(t => t.length > 0) : []
      }));
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  // Get database health info
  async getDatabaseHealth(): Promise<DatabaseHealth> {
    try {
      const cacheStats = await this.db.getCacheStats();
      const dbStats = await this.db.getStats();
      
      return {
        database_stats: dbStats,
        cache_stats: cacheStats,
        health_status: 'healthy',
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching database health:', error);
      return {
        health_status: 'error',
        error: error.message,
        last_updated: new Date().toISOString()
      };
    }
  }

  // Document management operations
  async deleteDocument(url: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get document first to get cache file path
      const document = await this.db.getQuery('SELECT cache_path FROM documents WHERE url = ?', [url]);
      
      // Delete from database
      const result = await this.db.runQuery('DELETE FROM documents WHERE url = ?', [url]);
      
      if (result.changes === 0) {
        return { success: false, message: 'Document not found' };
      }

      // Clean up cache file if it exists
      if (document?.cache_path) {
        try {
          const fs = await import('fs/promises');
          await fs.unlink(document.cache_path);
        } catch (cacheError) {
          console.warn('Could not delete cache file:', cacheError);
        }
      }

      return { success: true, message: 'Document deleted successfully' };
    } catch (error) {
      console.error('Error deleting document:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Failed to delete document' };
    }
  }

  async deleteDocumentsBatch(urls: string[]): Promise<{ success: boolean; deleted: number; errors: string[] }> {
    const errors: string[] = [];
    let deleted = 0;

    for (const url of urls) {
      try {
        const result = await this.deleteDocument(url);
        if (result.success) {
          deleted++;
        } else {
          errors.push(`${url}: ${result.message}`);
        }
      } catch (error) {
        errors.push(`${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: deleted > 0,
      deleted,
      errors
    };
  }

  async purgeAllSyntheticDocuments(): Promise<{ success: boolean; deleted: number; message: string }> {
    try {
      // Get all synthetic documents first for cache cleanup
      const syntheticDocs = await this.db.allQuery('SELECT url, cache_path FROM documents WHERE synthetic = 1');
      
      // Delete from database
      const result = await this.db.runQuery('DELETE FROM documents WHERE synthetic = 1');
      
      // Clean up cache files
      let cacheFilesDeleted = 0;
      if (syntheticDocs.length > 0) {
        const fs = await import('fs/promises');
        for (const doc of syntheticDocs) {
          if (doc.cache_path) {
            try {
              await fs.unlink(doc.cache_path);
              cacheFilesDeleted++;
            } catch (cacheError) {
              console.warn('Could not delete cache file:', cacheError);
            }
          }
        }
      }

      return {
        success: true,
        deleted: result.changes || 0,
        message: `Deleted ${result.changes || 0} synthetic documents and ${cacheFilesDeleted} cache files`
      };
    } catch (error) {
      console.error('Error purging synthetic documents:', error);
      return {
        success: false,
        deleted: 0,
        message: error instanceof Error ? error.message : 'Failed to purge synthetic documents'
      };
    }
  }

  async purgeAllDocuments(): Promise<{ success: boolean; deleted: number; message: string }> {
    try {
      // Get all documents first for cache cleanup
      const allDocs = await this.db.allQuery('SELECT url, cache_path FROM documents');
      
      // Delete from database
      const result = await this.db.runQuery('DELETE FROM documents');
      
      // Clean up cache files
      let cacheFilesDeleted = 0;
      if (allDocs.length > 0) {
        const fs = await import('fs/promises');
        for (const doc of allDocs) {
          if (doc.cache_path) {
            try {
              await fs.unlink(doc.cache_path);
              cacheFilesDeleted++;
            } catch (cacheError) {
              console.warn('Could not delete cache file:', cacheError);
            }
          }
        }
      }

      return {
        success: true,
        deleted: result.changes || 0,
        message: `Deleted ${result.changes || 0} documents and ${cacheFilesDeleted} cache files`
      };
    } catch (error) {
      console.error('Error purging all documents:', error);
      return {
        success: false,
        deleted: 0,
        message: error instanceof Error ? error.message : 'Failed to purge all documents'
      };
    }
  }

  // Enhanced query analysis with complete flow tracking
  async getQueryFlow(queryId: string): Promise<any> {
    try {
      const query = await this.db.getQuery('SELECT * FROM queries WHERE id = ?', [queryId]);
      if (!query) {
        return null;
      }

      return {
        ...query,
        sources_used: JSON.parse(query.sources_used || '[]'),
        ai_response: query.ai_response ? JSON.parse(query.ai_response) : null,
        created_at: new Date(query.created_at),
        // Parse any additional flow data stored in the query
        flow_data: query.events_count ? {
          events_count: query.events_count,
          execution_time: query.execution_time,
          tokens_used: query.tokens_used,
          confidence: query.confidence,
          relevance_reason: query.relevance_reason
        } : null
      };
    } catch (error) {
      console.error('Error fetching query flow:', error);
      throw error;
    }
  }

  // Get all queries with enhanced filtering
  async getAllQueries(limit: number = 100, filters: {
    relevant?: boolean;
    jurisdiction?: string;
    minConfidence?: number;
    dateFrom?: string;
    dateTo?: string;
    hasTranslation?: boolean;
  } = {}): Promise<QueryInfo[]> {
    try {
      let query = `
        SELECT * FROM queries 
        WHERE 1=1
      `;
      const params: any[] = [];

      if (filters.relevant !== undefined) {
        query += ' AND relevant = ?';
        params.push(filters.relevant);
      }

      if (filters.jurisdiction) {
        query += ' AND jurisdiction = ?';
        params.push(filters.jurisdiction);
      }

      if (filters.minConfidence) {
        query += ' AND confidence >= ?';
        params.push(filters.minConfidence);
      }

      if (filters.dateFrom) {
        query += ' AND created_at >= ?';
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        query += ' AND created_at <= ?';
        params.push(filters.dateTo);
      }

      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);

      const rows = await this.db.allQuery(query, params);

      return rows.map(row => ({
        ...row,
        sources_used: JSON.parse(row.sources_used || '[]'),
        created_at: new Date(row.created_at),
        sources_count: JSON.parse(row.sources_used || '[]').length
      }));
    } catch (error) {
      console.error('Error fetching all queries:', error);
      throw error;
    }
  }

  // Get business intelligence generated queries (synthetic queries)
  async getBusinessIntelligenceQueries(limit: number = 50): Promise<any[]> {
    try {
      // Look for queries that might be BI-generated (synthetic or system-generated)
      const queries = await this.db.allQuery(`
        SELECT * FROM queries 
        WHERE 
          question LIKE '%synthetic%' OR
          question LIKE '%auto-generated%' OR
          question LIKE '%intelligence%' OR
          id LIKE '%_bi_%' OR
          id LIKE '%_auto_%' OR
          relevance_reason LIKE '%background%' OR
          relevance_reason LIKE '%intelligence%'
        ORDER BY created_at DESC 
        LIMIT ?
      `, [limit]);

      return queries.map(row => ({
        ...row,
        sources_used: JSON.parse(row.sources_used || '[]'),
        created_at: new Date(row.created_at),
        sources_count: JSON.parse(row.sources_used || '[]').length,
        is_business_intelligence: true
      }));
    } catch (error) {
      console.error('Error fetching BI queries:', error);
      throw error;
    }
  }

  // Query management operations
  async deleteQuery(queryId: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.db.runQuery('DELETE FROM queries WHERE id = ?', [queryId]);
      
      if (result.changes === 0) {
        return { success: false, message: 'Query not found' };
      }

      return { success: true, message: 'Query deleted successfully' };
    } catch (error) {
      console.error('Error deleting query:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Failed to delete query' };
    }
  }

  async purgeAllQueries(): Promise<{ success: boolean; deleted: number; message: string }> {
    try {
      const result = await this.db.runQuery('DELETE FROM queries');
      
      return {
        success: true,
        deleted: result.changes || 0,
        message: `Deleted ${result.changes || 0} queries`
      };
    } catch (error) {
      console.error('Error purging queries:', error);
      return {
        success: false,
        deleted: 0,
        message: error instanceof Error ? error.message : 'Failed to purge queries'
      };
    }
  }

  // Real-time monitoring methods
  async getLiveStats(): Promise<any> {
    try {
      const [
        totalQueries,
        totalDocuments,
        recentQueries,
        activeIngestion,
        queryStats
      ] = await Promise.all([
        this.db.getQuery('SELECT COUNT(*) as count FROM queries'),
        this.db.getQuery('SELECT COUNT(*) as count FROM documents'),
        this.db.getQuery('SELECT COUNT(*) as count FROM queries WHERE created_at > datetime("now", "-1 hour")'),
        this.db.getQuery('SELECT COUNT(*) as count FROM documents WHERE created_at > datetime("now", "-10 minutes")'),
        this.db.getQuery(`
          SELECT 
            AVG(execution_time) as avg_execution_time,
            AVG(tokens_used) as avg_tokens,
            AVG(confidence) as avg_confidence,
            COUNT(CASE WHEN relevant = 1 THEN 1 END) as relevant_count,
            COUNT(CASE WHEN relevant = 0 THEN 1 END) as irrelevant_count
          FROM queries 
          WHERE created_at > datetime("now", "-24 hours")
        `)
      ]);

      return {
        totals: {
          queries: totalQueries?.count || 0,
          documents: totalDocuments?.count || 0
        },
        recent: {
          queries_last_hour: recentQueries?.count || 0,
          documents_last_10min: activeIngestion?.count || 0
        },
        performance: {
          avg_execution_time: Math.round(queryStats?.avg_execution_time || 0),
          avg_tokens_used: Math.round(queryStats?.avg_tokens || 0),
          avg_confidence: parseFloat((queryStats?.avg_confidence || 0).toFixed(3)),
          relevant_queries: queryStats?.relevant_count || 0,
          irrelevant_queries: queryStats?.irrelevant_count || 0
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting live stats:', error);
      throw error;
    }
  }

  async getRecentActivity(limit: number = 20, since?: string): Promise<any[]> {
    try {
      let query = `
        SELECT 
          'query' as type,
          id,
          question as title,
          jurisdiction as location,
          execution_time,
          tokens_used,
          confidence,
          relevant,
          sources_used,
          created_at as timestamp
        FROM queries 
      `;
      
      const params: any[] = [];
      
      if (since) {
        query += ' WHERE created_at > ? ';
        params.push(since);
      }

      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);

      const activities = await this.db.allQuery(query, params);
      
      return activities.map(activity => ({
        ...activity,
        timestamp: new Date(activity.timestamp).toISOString(),
        execution_time: activity.execution_time || 0,
        tokens_used: activity.tokens_used || 0,
        confidence: parseFloat((activity.confidence || 0).toFixed(3)),
        sources_used: JSON.parse(activity.sources_used || '[]'),
        sources_count: JSON.parse(activity.sources_used || '[]').length
      }));
    } catch (error) {
      console.error('Error getting recent activity:', error);
      throw error;
    }
  }

  // Get detailed document information for query sources
  async getDocumentSources(sourcesList: any[]): Promise<any[]> {
    try {
      if (!sourcesList || sourcesList.length === 0) {
        return [];
      }

      // Extract document URLs from sources
      const documentUrls = sourcesList.map(source => source.url || source.document_url).filter(Boolean);
      
      if (documentUrls.length === 0) {
        return sourcesList.map(source => ({
          ...source,
          document_type: 'unknown',
          jurisdiction: source.jurisdiction || 'unknown'
        }));
      }

      // Query database for document details
      const placeholders = documentUrls.map(() => '?').join(',');
      const documents = await this.db.allQuery(
        `SELECT url, document_type, jurisdiction, tags, created_at FROM documents WHERE url IN (${placeholders})`,
        documentUrls
      );

      // Create a lookup map
      const docMap = new Map(documents.map(doc => [doc.url, doc]));

      // Enrich sources with document metadata
      return sourcesList.map(source => {
        const docUrl = source.url || source.document_url;
        const docInfo = docMap.get(docUrl);
        
        return {
          ...source,
          document_type: docInfo?.document_type || 'unknown',
          jurisdiction: docInfo?.jurisdiction || source.jurisdiction || 'unknown',
          tags: docInfo?.tags || '',
          document_created_at: docInfo?.created_at,
          is_from_ingested_data: !!docInfo // This confirms it's from our database
        };
      });
    } catch (error) {
      console.error('Error getting document sources:', error);
      return sourcesList || [];
    }
  }
}