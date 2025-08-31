#!/usr/bin/env node

// Real-time document ingestion service that uses web search to discover and ingest legal documents

export class RealtimeDocumentIngester {
  constructor(database, documentFetcher) {
    this.db = database;
    this.documentFetcher = documentFetcher;
    this.inProgressIngests = new Map();
  }

  // Main ingestion method called from query processing
  async ingestDocumentsForQuery(analysis, eventTracker = null) {
    const { jurisdiction, legal_areas, keywords, alternative_terms } = analysis;
    
    this.log(eventTracker, `🔍 Starting document discovery from database and gov data for ${jurisdiction} ${legal_areas.join(',')}`);
    
    // Instead of web search, find documents from existing database and government sources
    const discoveredUrls = [];
    
    // Query database for existing relevant documents
    try {
      this.log(eventTracker, `📚 Searching database for existing ${jurisdiction} documents`);
      
      const existingDocs = await this.findExistingDocuments(jurisdiction, legal_areas, keywords);
      discoveredUrls.push(...existingDocs);
      
      this.log(eventTracker, `📄 Found ${existingDocs.length} existing documents in database`);
      
    } catch (error) {
      this.log(eventTracker, `⚠️ Database search failed: ${error.message}`);
    }

    // Deduplicate and limit
    const uniqueUrls = [...new Set(discoveredUrls)].slice(0, 5);
    
    // Fetch and ingest the documents
    const ingestedDocuments = [];
    for (const url of uniqueUrls) {
      try {
        // Check if already in database
        const existingDoc = await this.db.getDocument(url);
        if (existingDoc) {
          ingestedDocuments.push({
            id: existingDoc.id,
            url: existingDoc.url,
            content: existingDoc.content,
            tags: Array.isArray(existingDoc.tags) ? existingDoc.tags.join(',') : existingDoc.tags,
            created_at: existingDoc.created_at
          });
          continue;
        }

        // Fetch and store new document
        this.log(eventTracker, `📥 Ingesting: ${url}`);
        const docData = await this.documentFetcher.fetchDocument(url);
        
        if (docData && docData.content && docData.content.length > 500) { // Ensure substantial content
          const storedDoc = {
            id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url: docData.url,
            content: docData.content,
            tags: docData.tags?.join(',') || '',
            created_at: new Date()
          };
          
          ingestedDocuments.push(storedDoc);
          this.log(eventTracker, `✅ Successfully ingested: ${url} (${Math.round(docData.content.length/1000)}kb)`);
        }
        
      } catch (error) {
        this.log(eventTracker, `❌ Failed to ingest ${url}: ${error.message}`);
        continue;
      }
    }

    this.log(eventTracker, `🎉 Completed ingestion: ${ingestedDocuments.length} documents ready`);
    return ingestedDocuments;
  }

  // Build targeted web search queries for legal document discovery
  buildSearchQueries(jurisdiction, legal_areas, keywords, alternative_terms) {
    const queries = [];
    const jurisdictionNames = {
      'qld': 'Queensland',
      'nsw': 'New South Wales', 
      'vic': 'Victoria',
      'wa': 'Western Australia',
      'sa': 'South Australia',
      'tas': 'Tasmania',
      'nt': 'Northern Territory',
      'act': 'Australian Capital Territory',
      'cth': 'Commonwealth Australia'
    };
    
    const jurisdictionName = jurisdictionNames[jurisdiction] || 'Australia';
    
    // Build queries combining legal areas and keywords
    const primaryKeywords = keywords.slice(0, 3);
    const primaryAreas = legal_areas.slice(0, 2);
    
    // Query 1: Jurisdiction + Legal Area + Primary Keyword
    for (const area of primaryAreas) {
      for (const keyword of primaryKeywords.slice(0, 2)) {
        queries.push(`site:austlii.edu.au ${jurisdictionName} "${area}" "${keyword}" act legislation`);
      }
    }
    
    // Query 2: General jurisdiction query with year filters for recent legislation
    const keywordStr = primaryKeywords.join(' ');
    queries.push(`site:austlii.edu.au ${jurisdictionName} ${keywordStr} act 2000..2024`);
    
    return queries.slice(0, 4); // Limit to 4 queries
  }

  // Find existing documents in database by jurisdiction and legal areas with scoring
  async findExistingDocuments(jurisdiction, legal_areas, keywords) {
    try {
      // Use the main discovery system's scoring functionality
      if (this.documentFetcher && this.documentFetcher.discovery) {
        const scoredDocuments = await this.documentFetcher.discovery.getDocumentsByLegalArea(
          this.db, 
          jurisdiction, 
          legal_areas, 
          keywords
        );
        
        // Return URLs of scored documents (maintaining backward compatibility)
        return scoredDocuments.map(doc => doc.url);
      }
      
      // Fallback to simple query if scoring system unavailable
      const legalAreasQuery = legal_areas.map(area => `tags LIKE '%${area}%' OR content LIKE '%${area}%'`).join(' OR ');
      const keywordsQuery = keywords.map(keyword => `tags LIKE '%${keyword}%' OR content LIKE '%${keyword}%'`).join(' OR ');
      
      const query = `
        SELECT DISTINCT url FROM documents 
        WHERE (url LIKE '%/${jurisdiction}/%' OR tags LIKE '%${jurisdiction}%')
        AND (${legalAreasQuery})
        AND (${keywordsQuery})
        LIMIT 10
      `;
      
      const rows = await this.db.allQuery(query);
      
      return rows
        .filter(row => row.url && row.url.includes('austlii.edu.au'))
        .map(row => row.url);
      
    } catch (error) {
      console.error(`❌ Database query failed: ${error.message}`);
      return [];
    }
  }

  // Extract AustLII URLs from web search results
  extractAustLIIUrls(searchResults) {
    const urls = [];
    
    if (searchResults && searchResults.links) {
      for (const link of searchResults.links) {
        if (link.url && link.url.includes('austlii.edu.au') && 
            (link.url.includes('consol_act') || link.url.includes('consol_reg'))) {
          
          // Clean up the URL to standard format
          let cleanUrl = link.url;
          if (!cleanUrl.endsWith('/')) {
            cleanUrl += '/';
          }
          
          urls.push(cleanUrl);
        }
      }
    }
    
    return [...new Set(urls)]; // Remove duplicates
  }

  // Helper to log with event tracker
  log(eventTracker, message) {
    console.log(message);
    if (eventTracker) {
      eventTracker.addEvent('document_ingestion', message.replace(/[🔍📄🌐📥✅❌⚠️🎉]/g, '').trim());
    }
  }
}