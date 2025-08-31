#!/usr/bin/env node

// Persistent SQLite Database with Disk Caching
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database and cache directories
const DB_PATH = join(__dirname, 'data');
const CACHE_PATH = join(__dirname, 'cache');
const DATABASE_FILE = join(DB_PATH, 'legalease.db');

export class PersistentDatabase {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    // Ensure directories exist
    await fs.mkdir(DB_PATH, { recursive: true });
    await fs.mkdir(CACHE_PATH, { recursive: true });

    // Open database
    this.db = new sqlite3.Database(DATABASE_FILE);
    
    // Enable WAL mode for better performance
    await this.runQuery('PRAGMA journal_mode=WAL');
    await this.runQuery('PRAGMA synchronous=NORMAL');
    await this.runQuery('PRAGMA cache_size=1000');
    await this.runQuery('PRAGMA foreign_keys=ON');
    
    // Create tables
    await this.createTables();
    
    // Run migrations for existing databases
    await this.runMigrations();
    
    this.isInitialized = true;
    console.log(`📊 SQLite database initialized: ${DATABASE_FILE}`);
  }

  async createTables() {
    // Authorities table for contact information
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS authorities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        official_name TEXT,
        jurisdiction TEXT,
        jurisdiction_level TEXT, -- federal, state, council
        website TEXT,
        contact_phone TEXT,
        contact_email TEXT,
        contact_chatbot TEXT,
        contact_hours TEXT,
        postal_address TEXT,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, jurisdiction)
      )
    `);

    // Documents table
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS documents (
        url TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        tags TEXT,
        jurisdiction TEXT,
        document_type TEXT,
        synthetic BOOLEAN DEFAULT FALSE,
        content_hash TEXT,
        cache_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Queries table
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS queries (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        translated_question TEXT, -- English version if translated
        detected_language TEXT, -- Language detected by LLM
        original_language TEXT, -- Assumed language from user
        answer TEXT,
        ai_response TEXT, -- Raw LLM response before processing
        sources_used TEXT, -- JSON array
        jurisdiction TEXT,
        confidence REAL,
        execution_time INTEGER,
        tokens_used INTEGER,
        relevant BOOLEAN DEFAULT TRUE,
        relevance_reason TEXT,
        events_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Legal taxonomy tables
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS legal_areas (
        id TEXT PRIMARY KEY,
        keywords TEXT NOT NULL, -- JSON array
        patterns TEXT NOT NULL, -- JSON array
        authorities TEXT NOT NULL, -- JSON array
        description TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS authority_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        contact_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS jurisdiction_legislation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jurisdiction TEXT NOT NULL,
        legal_area TEXT NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(jurisdiction, legal_area)
      )
    `);

    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS jurisdiction_authorities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jurisdiction TEXT NOT NULL,
        authority_type TEXT NOT NULL,
        title TEXT NOT NULL,
        url TEXT,
        phone TEXT,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(jurisdiction, authority_type)
      )
    `);

    // Create indexes for performance
    await this.runQuery(`CREATE INDEX IF NOT EXISTS idx_documents_jurisdiction ON documents(jurisdiction)`);
    await this.runQuery(`CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type)`);
    await this.runQuery(`CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at)`);
    await this.runQuery(`CREATE INDEX IF NOT EXISTS idx_queries_created ON queries(created_at)`);
    await this.runQuery(`CREATE INDEX IF NOT EXISTS idx_queries_relevant ON queries(relevant)`);
    await this.runQuery(`CREATE INDEX IF NOT EXISTS idx_legal_areas_id ON legal_areas(id)`);
    await this.runQuery(`CREATE INDEX IF NOT EXISTS idx_authority_types_id ON authority_types(id)`);
    await this.runQuery(`CREATE INDEX IF NOT EXISTS idx_jurisdiction_legislation_jurisdiction ON jurisdiction_legislation(jurisdiction)`);
    await this.runQuery(`CREATE INDEX IF NOT EXISTS idx_jurisdiction_legislation_area ON jurisdiction_legislation(legal_area)`);
    await this.runQuery(`CREATE INDEX IF NOT EXISTS idx_jurisdiction_authorities_jurisdiction ON jurisdiction_authorities(jurisdiction)`);
    await this.runQuery(`CREATE INDEX IF NOT EXISTS idx_jurisdiction_authorities_type ON jurisdiction_authorities(authority_type)`);
  }

  // Database migrations for existing databases
  async runMigrations() {
    try {
      // Migration 1: Add translation flow columns to queries table
      await this.runQuery(`ALTER TABLE queries ADD COLUMN translated_question TEXT`);
      console.log('✅ Added translated_question column');
    } catch (error) {
      // Column already exists, ignore
      if (!error.message.includes('duplicate column name')) {
        console.error('Migration error for translated_question:', error.message);
      }
    }

    try {
      await this.runQuery(`ALTER TABLE queries ADD COLUMN detected_language TEXT`);
      console.log('✅ Added detected_language column');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.error('Migration error for detected_language:', error.message);
      }
    }

    try {
      await this.runQuery(`ALTER TABLE queries ADD COLUMN original_language TEXT`);
      console.log('✅ Added original_language column');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.error('Migration error for original_language:', error.message);
      }
    }

    try {
      await this.runQuery(`ALTER TABLE queries ADD COLUMN ai_response TEXT`);
      console.log('✅ Added ai_response column');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.error('Migration error for ai_response:', error.message);
      }
    }

    console.log('🔄 Database migrations completed');
  }

  // Helper method to run queries with promise interface
  runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(error) {
        if (error) {
          reject(error);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Helper method to get single row
  getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (error, row) => {
        if (error) {
          reject(error);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Helper method to get all rows
  allQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (error, rows) => {
        if (error) {
          reject(error);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Document operations with disk caching
  async saveDocument(doc) {
    if (!doc.url) throw new Error('Document must have URL');
    
    const contentHash = crypto.createHash('md5').update(doc.content).digest('hex');
    const cacheFileName = `${contentHash}.txt`;
    const cachePath = join(CACHE_PATH, cacheFileName);
    
    // Write content to disk cache
    await fs.writeFile(cachePath, doc.content, 'utf-8');
    
    const tags = Array.isArray(doc.tags) ? doc.tags.join(',') : doc.tags || '';
    
    await this.runQuery(`
      INSERT OR REPLACE INTO documents 
      (url, content, tags, jurisdiction, document_type, synthetic, content_hash, cache_path, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      doc.url,
      doc.content.substring(0, 10000), // Store truncated content in DB for search
      tags,
      doc.jurisdiction || 'Australia',
      doc.document_type || 'legal',
      doc.synthetic || false,
      contentHash,
      cachePath
    ]);
    
    console.log(`💾 Cached document: ${doc.url} -> ${cacheFileName}`);
    
    return {
      url: doc.url,
      content: doc.content,
      tags: Array.isArray(doc.tags) ? doc.tags : tags.split(',').filter(t => t.length > 0),
      jurisdiction: doc.jurisdiction || 'Australia',
      synthetic: doc.synthetic || false,
      cached: true
    };
  }

  async getDocument(url) {
    const row = await this.getQuery('SELECT * FROM documents WHERE url = ?', [url]);
    
    if (!row) return null;

    // Load full content from disk cache
    let fullContent = row.content;
    if (row.cache_path) {
      try {
        fullContent = await fs.readFile(row.cache_path, 'utf-8');
      } catch (error) {
        console.warn(`⚠️ Cache file missing: ${row.cache_path}, using DB content`);
        fullContent = row.content;
      }
    }

    return {
      url: row.url,
      content: fullContent,
      tags: row.tags ? row.tags.split(',').filter(t => t.length > 0) : [],
      jurisdiction: row.jurisdiction,
      document_type: row.document_type,
      synthetic: row.synthetic,
      created_at: new Date(row.created_at),
      cached: true
    };
  }

  async findDocuments(searchTerm) {
    if (!searchTerm) return [];
    
    const rows = await this.allQuery(`
      SELECT * FROM documents 
      WHERE content LIKE ? OR tags LIKE ? OR url LIKE ?
      ORDER BY created_at DESC
      LIMIT 20
    `, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);

    const results = [];
    for (const row of rows) {
      const doc = await this.getDocument(row.url);
      if (doc) results.push(doc);
    }
    
    return results;
  }

  async getAllDocuments() {
    const rows = await this.allQuery('SELECT url FROM documents ORDER BY created_at DESC');
    const results = [];
    
    for (const row of rows) {
      const doc = await this.getDocument(row.url);
      if (doc) results.push(doc);
    }
    
    return results;
  }

  getDocumentCount() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT COUNT(*) as count FROM documents', (error, row) => {
        if (error) reject(error);
        else resolve(row.count);
      });
    });
  }

  // Query operations
  async saveQuery(query) {
    if (!query.id) throw new Error('Query must have ID');
    
    await this.runQuery(`
      INSERT OR REPLACE INTO queries 
      (id, question, translated_question, detected_language, original_language, answer, ai_response, 
       sources_used, jurisdiction, confidence, execution_time, tokens_used, relevant, relevance_reason, events_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      query.id,
      query.question,
      query.translated_question,
      query.detected_language,
      query.original_language,
      query.answer,
      query.ai_response,
      JSON.stringify(query.sources_used || []),
      query.jurisdiction,
      query.confidence,
      query.execution_time,
      query.tokens_used,
      query.relevant !== false,
      query.relevance_reason,
      query.events_count || 0
    ]);

    return query;
  }

  async getQueryById(id) {
    const row = await this.getQuery('SELECT * FROM queries WHERE id = ?', [id]);
    if (!row) return null;

    return {
      ...row,
      sources_used: JSON.parse(row.sources_used || '[]'),
      created_at: new Date(row.created_at)
    };
  }

  async getRecentQueries(limit = 10) {
    const rows = await this.allQuery(`
      SELECT * FROM queries 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [limit]);

    return rows.map(row => ({
      ...row,
      sources_used: JSON.parse(row.sources_used || '[]'),
      created_at: new Date(row.created_at)
    }));
  }

  getQueryCount() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT COUNT(*) as count FROM queries', (error, row) => {
        if (error) reject(error);
        else resolve(row.count);
      });
    });
  }

  // Database statistics
  async getStats() {
    const [docCount, queryCount, cacheStats] = await Promise.all([
      this.getDocumentCount(),
      this.getQueryCount(),
      this.getCacheStats()
    ]);

    return {
      documents: docCount,
      queries: queryCount,
      cache: cacheStats,
      database_type: 'SQLite (Persistent)',
      database_path: DATABASE_FILE,
      cache_path: CACHE_PATH,
      last_updated: new Date()
    };
  }

  async getCacheStats() {
    try {
      const files = await fs.readdir(CACHE_PATH);
      const cacheFiles = files.filter(f => f.endsWith('.txt'));
      
      let totalSize = 0;
      for (const file of cacheFiles) {
        const stats = await fs.stat(join(CACHE_PATH, file));
        totalSize += stats.size;
      }

      return {
        files: cacheFiles.length,
        totalSize: Math.round(totalSize / 1024), // KB
        path: CACHE_PATH
      };
    } catch (error) {
      return {
        files: 0,
        totalSize: 0,
        path: CACHE_PATH,
        error: error.message
      };
    }
  }

  // Clear data (for testing)
  async clear() {
    await this.runQuery('DELETE FROM documents');
    await this.runQuery('DELETE FROM queries');
    
    // Clear cache files
    try {
      const files = await fs.readdir(CACHE_PATH);
      for (const file of files) {
        if (file.endsWith('.txt')) {
          await fs.unlink(join(CACHE_PATH, file));
        }
      }
    } catch (error) {
      console.warn('Error clearing cache:', error.message);
    }

    console.log('🧹 Database and cache cleared');
  }

  // Authority management methods
  async saveAuthority(authorityData) {
    const {
      name,
      official_name,
      jurisdiction,
      jurisdiction_level,
      website,
      contact_phone,
      contact_email,
      contact_chatbot,
      contact_hours,
      postal_address
    } = authorityData;

    await this.runQuery(`
      INSERT OR REPLACE INTO authorities (
        name, official_name, jurisdiction, jurisdiction_level, website,
        contact_phone, contact_email, contact_chatbot, contact_hours, postal_address,
        last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      name, official_name, jurisdiction, jurisdiction_level, website,
      contact_phone, contact_email, contact_chatbot, contact_hours, postal_address
    ]);
  }

  async getAuthority(name, jurisdiction = null) {
    let query = 'SELECT * FROM authorities WHERE name = ?';
    let params = [name];
    
    if (jurisdiction) {
      query += ' AND jurisdiction = ?';
      params.push(jurisdiction);
    }
    
    query += ' ORDER BY last_updated DESC LIMIT 1';
    
    return await this.getQuery(query, params);
  }

  async findAuthorities(searchTerm) {
    const rows = await this.allQuery(`
      SELECT * FROM authorities 
      WHERE name LIKE ? OR official_name LIKE ? OR jurisdiction LIKE ?
      ORDER BY name ASC
    `, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
    
    return rows;
  }

  async getAllAuthorities() {
    return await this.allQuery('SELECT * FROM authorities ORDER BY name ASC');
  }

  async getAuthorityCount() {
    const row = await this.getQuery('SELECT COUNT(*) as count FROM authorities');
    return row ? row.count : 0;
  }

  // Legal taxonomy operations
  async seedLegalTaxonomy(taxonomyData) {
    // Clear existing data
    await this.runQuery('DELETE FROM legal_areas');
    await this.runQuery('DELETE FROM authority_types');
    await this.runQuery('DELETE FROM jurisdiction_legislation');
    await this.runQuery('DELETE FROM jurisdiction_authorities');

    // Seed legal areas
    for (const [areaId, areaData] of Object.entries(taxonomyData.legal_areas)) {
      await this.runQuery(`
        INSERT INTO legal_areas (id, keywords, patterns, authorities, description)
        VALUES (?, ?, ?, ?, ?)
      `, [
        areaId,
        JSON.stringify(areaData.keywords),
        JSON.stringify(areaData.patterns),
        JSON.stringify(areaData.authorities),
        areaData.description
      ]);
    }

    // Seed authority types
    for (const [typeId, typeData] of Object.entries(taxonomyData.authority_types)) {
      await this.runQuery(`
        INSERT INTO authority_types (id, name, description, contact_type)
        VALUES (?, ?, ?, ?)
      `, [
        typeId,
        typeData.name,
        typeData.description,
        typeData.contact_type
      ]);
    }

    // Seed jurisdiction legislation
    for (const [jurisdiction, jurisdictionData] of Object.entries(taxonomyData.jurisdiction_legislation)) {
      for (const [legalArea, legislationData] of Object.entries(jurisdictionData)) {
        await this.runQuery(`
          INSERT INTO jurisdiction_legislation (jurisdiction, legal_area, title, url)
          VALUES (?, ?, ?, ?)
        `, [
          jurisdiction,
          legalArea,
          legislationData.title,
          legislationData.url
        ]);
      }
    }

    // Seed jurisdiction authorities
    for (const [jurisdiction, jurisdictionData] of Object.entries(taxonomyData.jurisdiction_authorities)) {
      for (const [authorityType, authorityData] of Object.entries(jurisdictionData)) {
        await this.runQuery(`
          INSERT INTO jurisdiction_authorities (jurisdiction, authority_type, title, url, phone, email)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          jurisdiction,
          authorityType,
          authorityData.title,
          authorityData.url,
          authorityData.phone,
          authorityData.email
        ]);
      }
    }

    console.log('🏛️ Legal taxonomy data seeded to database');
  }

  async getLegalAreas() {
    const rows = await this.allQuery('SELECT * FROM legal_areas');
    const result = {};
    for (const row of rows) {
      result[row.id] = {
        keywords: JSON.parse(row.keywords),
        patterns: JSON.parse(row.patterns),
        authorities: JSON.parse(row.authorities),
        description: row.description
      };
    }
    return result;
  }

  async getAuthorityTypes() {
    const rows = await this.allQuery('SELECT * FROM authority_types');
    const result = {};
    for (const row of rows) {
      result[row.id] = {
        name: row.name,
        description: row.description,
        contact_type: row.contact_type
      };
    }
    return result;
  }

  async getJurisdictionLegislation() {
    const rows = await this.allQuery('SELECT * FROM jurisdiction_legislation');
    const result = {};
    for (const row of rows) {
      if (!result[row.jurisdiction]) {
        result[row.jurisdiction] = {};
      }
      result[row.jurisdiction][row.legal_area] = {
        title: row.title,
        url: row.url
      };
    }
    return result;
  }

  async getJurisdictionAuthorities() {
    const rows = await this.allQuery('SELECT * FROM jurisdiction_authorities');
    const result = {};
    for (const row of rows) {
      if (!result[row.jurisdiction]) {
        result[row.jurisdiction] = {};
      }
      result[row.jurisdiction][row.authority_type] = {
        title: row.title,
        url: row.url,
        phone: row.phone,
        email: row.email
      };
    }
    return result;
  }

  async getLegalTaxonomy() {
    const [legal_areas, authority_types, jurisdiction_legislation, jurisdiction_authorities] = await Promise.all([
      this.getLegalAreas(),
      this.getAuthorityTypes(),
      this.getJurisdictionLegislation(),
      this.getJurisdictionAuthorities()
    ]);

    return {
      legal_areas,
      authority_types,
      jurisdiction_legislation,
      jurisdiction_authorities
    };
  }

  // Graceful shutdown
  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) console.error('Error closing database:', err);
          else console.log('📊 Database connection closed');
          resolve();
        });
      });
    }
  }
}