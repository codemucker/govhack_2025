#!/usr/bin/env node

// Standalone Node.js server to test the real data pipeline
// This bypasses Encore's cloud dependency issues

import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock database for testing (in a real setup this would be PostgreSQL)
const mockDB = {
  docs: [],
  queries: []
};

// AustLII Document Discovery System
class AustLIIDiscovery {
  constructor() {
    // AustLII URL patterns for different jurisdictions and document types
    this.urlPatterns = {
      // Commonwealth (Federal)
      cth: {
        acts: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/',
        regs: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_reg/'
      },
      // States
      nsw: {
        acts: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/',
        regs: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_reg/'
      },
      qld: {
        acts: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/',
        regs: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_reg/'
      },
      vic: {
        acts: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_act/',
        regs: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_reg/'
      },
      wa: {
        acts: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/wa/consol_act/'
      },
      sa: {
        acts: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/sa/consol_act/'
      }
    };

    // Legal topic mappings to likely document names/patterns
    this.topicMappings = {
      'fence': ['property', 'neighbour', 'boundary', 'dividing', 'fences', 'planning', 'environmental'],
      'neighbour': ['neighbour', 'neighbor', 'disputes', 'property', 'residential', 'planning'],
      'property': ['property', 'land', 'real', 'conveyancing', 'title', 'planning', 'environmental'],
      'business': ['corporations', 'business', 'company', 'partnership', 'trade', 'consumer'],
      'planning': ['planning', 'development', 'environmental', 'building', 'construction'],
      'food': ['food', 'safety', 'standards', 'health', 'hygiene'],
      'consumer': ['consumer', 'trade', 'practices', 'competition', 'fair'],
      'employment': ['employment', 'workplace', 'industrial', 'work', 'safety'],
      'liquor': ['liquor', 'alcohol', 'licensing', 'hospitality', 'gaming']
    };
  }

  // Intelligent document discovery based on question content and location
  async discoverRelevantDocuments(question, location) {
    const discoveries = [];
    
    // Extract jurisdiction from location
    const jurisdiction = this.extractJurisdiction(location);
    
    // Extract legal topics from question
    const topics = this.extractTopics(question);
    
    console.log(`🔍 Discovering documents for topics: ${topics.join(', ')} in jurisdiction: ${jurisdiction}`);
    
    for (const topic of topics) {
      const urls = this.generatePossibleUrls(jurisdiction, topic);
      for (const url of urls) {
        discoveries.push(url);
      }
    }
    
    return discoveries;
  }

  // NEW: LLM-powered document discovery using smart analysis
  async discoverRelevantDocumentsWithAnalysis(analysis) {
    const discoveries = [];
    const { jurisdiction, legal_areas, keywords, document_types, alternative_terms } = analysis;
    
    console.log(`🎯 Using LLM analysis: jurisdiction=${jurisdiction}, areas=${legal_areas.join(',')}, keywords=${keywords.join(',')}`);
    
    const patterns = this.urlPatterns[jurisdiction] || this.urlPatterns['cth'];
    
    // Generate URLs based on LLM-provided keywords and legal areas
    const allTerms = [...keywords, ...alternative_terms, ...legal_areas];
    
    for (const term of allTerms) {
      const cleanTerm = term.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
      
      // Generate possible document URLs based on AustLII patterns
      const possibleNames = [
        // Known working patterns
        `ca2001172`, // Corporations Act 2001
        `epaaa1979389`, // NSW Environmental Planning Act
        `fsanza1991472`, // Food Standards Act
        `la2007107`, // NSW Liquor Act
        `cca2010265`, // Competition and Consumer Act
        
        // Generated patterns based on LLM keywords
        `${cleanTerm}a1974`, `${cleanTerm}a1999`, `${cleanTerm}a2001`,
        `${cleanTerm}a2010`, `${cleanTerm}a2020`, `${cleanTerm}da1999`,
        `${cleanTerm}ra2010`, `pa${cleanTerm}1997`, `na${cleanTerm}1959`,
        
        // Document type specific patterns
        ...(document_types.includes('act') ? [`${cleanTerm}act`, `${cleanTerm}a`] : []),
        ...(document_types.includes('regulation') ? [`${cleanTerm}reg`, `${cleanTerm}r`] : []),
        
        // Legal area specific patterns  
        ...(legal_areas.includes('property') ? [`pa1974175`, `conveyancinga2001`] : []),
        ...(legal_areas.includes('corporate') ? [`ca2001172`, `businessnamesact`] : []),
        ...(legal_areas.includes('consumer') ? [`cca2010265`, `fairtrading`] : [])
      ];

      for (const docName of possibleNames) {
        if (patterns.acts) {
          discoveries.push(`${patterns.acts}${docName}/`);
        }
        if (patterns.regs && document_types.includes('regulation')) {
          discoveries.push(`${patterns.regs}${docName}/`);
        }
      }
    }
    
    // Remove duplicates and limit results
    const uniqueDiscoveries = [...new Set(discoveries)];
    return uniqueDiscoveries.slice(0, 50); // Limit to reasonable number
  }

  extractJurisdiction(location) {
    if (!location) return 'cth'; // Default to Commonwealth
    
    const loc = location.toLowerCase();
    if (loc.includes('qld') || loc.includes('queensland') || loc.includes('sunshine coast') || loc.includes('brisbane') || loc.includes('gold coast')) return 'qld';
    if (loc.includes('nsw') || loc.includes('new south wales') || loc.includes('sydney')) return 'nsw';
    if (loc.includes('vic') || loc.includes('victoria') || loc.includes('melbourne')) return 'vic';
    if (loc.includes('wa') || loc.includes('western australia') || loc.includes('perth')) return 'wa';
    if (loc.includes('sa') || loc.includes('south australia') || loc.includes('adelaide')) return 'sa';
    if (loc.includes('tas') || loc.includes('tasmania') || loc.includes('hobart')) return 'tas';
    if (loc.includes('nt') || loc.includes('northern territory') || loc.includes('darwin')) return 'nt';
    if (loc.includes('act') || loc.includes('australian capital territory') || loc.includes('canberra')) return 'act';
    
    return 'cth'; // Default to Commonwealth
  }

  extractTopics(question) {
    const topics = [];
    const questionLower = question.toLowerCase();
    
    for (const [topic, keywords] of Object.entries(this.topicMappings)) {
      if (keywords.some(keyword => questionLower.includes(keyword))) {
        topics.push(topic);
      }
    }
    
    // If no specific topics found, try to infer from common legal terms
    if (topics.length === 0) {
      if (questionLower.includes('law') || questionLower.includes('legal')) {
        topics.push('property'); // Default fallback
      }
    }
    
    return topics.length > 0 ? topics : ['property']; // Always return at least one topic
  }

  generatePossibleUrls(jurisdiction, topic) {
    const urls = [];
    const patterns = this.urlPatterns[jurisdiction];
    
    if (!patterns) return urls;

    const keywords = this.topicMappings[topic] || [topic];
    
    // Generate possible document URLs based on common AustLII naming patterns
    for (const keyword of keywords) {
      // Common patterns for AustLII URLs (including known working URLs)
      const possibleNames = [
        `ca2001172`, // Corporations Act 2001 (known working)
        `epaaa1979389`, // NSW Environmental Planning Act (known working) 
        `fsanza1991472`, // Food Standards Act (known working)
        `la2007107`, // NSW Liquor Act (known working)
        `cca2010265`, // Competition and Consumer Act (known working)
        // Generated patterns
        `${keyword}a1974`, // Property Act 1974
        `${keyword}a2001`, // Various 2001 acts
        `${keyword}a1999`, // Various 1999 acts
        `${keyword}da1999`, // Disputes Act 1999
        `${keyword}ra2010`, // Resolution Act 2010
        `na1959264`, // Neighbourhood specific
        `pa1997175`, // Property specific
      ];

      for (const docName of possibleNames) {
        if (patterns.acts) {
          urls.push(`${patterns.acts}${docName}/`);
        }
        if (patterns.regs) {
          urls.push(`${patterns.regs}${docName}/`);
        }
      }
    }
    
    return urls;
  }
}

// Enhanced document fetcher with lazy ingestion
class StandaloneDocumentFetcher {
  constructor() {
    this.discovery = new AustLIIDiscovery();
    this.queryAnalyzer = new QueryAnalyzer();
  }

  async fetchDocument(url) {
    console.log(`Fetching document from: ${url}`);
    
    // Check cache first
    const cached = mockDB.docs.find(doc => doc.url === url);
    if (cached) {
      return {
        content: cached.content,
        tags: cached.tags.split(',').filter(t => t.length > 0),
        url: cached.url
      };
    }

    // Simulate fetching from AustLII
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const html = await response.text();
      const content = this.extractTextFromHtml(html);
      const tags = this.extractTags(content, url);
      
      // Store in mock database
      const doc = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url,
        content,
        tags: tags.join(','),
        created_at: new Date()
      };
      mockDB.docs.push(doc);
      
      return {
        content,
        tags,
        url
      };
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message);
      throw error;
    }
  }

  extractTextFromHtml(html) {
    // Basic HTML to text conversion
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/\s+/g, ' ').trim();
    return text;
  }

  extractTags(content, url) {
    const tags = [];
    
    // Jurisdiction from URL
    if (url.includes('/cth/')) tags.push('commonwealth');
    if (url.includes('/nsw/')) tags.push('nsw');
    if (url.includes('/qld/')) tags.push('qld');
    if (url.includes('/vic/')) tags.push('vic');
    
    // Domain from content
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('fence') || lowerContent.includes('boundary')) tags.push('property');
    if (lowerContent.includes('neighbour') || lowerContent.includes('neighbor')) tags.push('neighbour-disputes');
    if (lowerContent.includes('business') || lowerContent.includes('corporation')) tags.push('business');
    if (lowerContent.includes('planning') || lowerContent.includes('development')) tags.push('planning');
    
    return tags;
  }

  async findDocuments(searchTerm) {
    return mockDB.docs.filter(doc => 
      doc.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // NEW: Lazy ingestion with LLM-powered discovery - discover and fetch relevant documents on-the-fly
  async findOrDiscoverDocuments(question, location, maxAttempts = 3, eventTracker = null) {
    const log = (msg) => {
      console.log(msg);
      if (eventTracker) eventTracker.addEvent('document_search', msg.replace(/[🔍📥🧠🎯📄✅❌⚡😞🎉]/g, '').trim());
    };
    
    log(`🔍 Finding or discovering documents for: "${question}" in ${location || 'Australia'}`);
    if (eventTracker) eventTracker.addEvent('search_started', 'Starting document search and discovery', { question, location });
    
    // First, check if we have any relevant cached documents
    const cachedDocs = await this.findDocuments(question);
    
    if (cachedDocs.length > 0) {
      log(`✅ Found ${cachedDocs.length} cached documents`);
      if (eventTracker) eventTracker.addEvent('cache_hit', `Found ${cachedDocs.length} cached documents`, { documentsFound: cachedDocs.length });
      return cachedDocs;
    }
    
    log(`📥 No cached documents found. Using LLM analysis for smart discovery...`);
    if (eventTracker) eventTracker.addEvent('cache_miss', 'No cached documents found, starting intelligent discovery');
    
    // Multi-attempt discovery with LLM-powered keyword refinement
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      log(`🧠 Discovery attempt ${attempt}/${maxAttempts}`);
      if (eventTracker) eventTracker.addEvent('llm_analysis_start', `Starting LLM analysis attempt ${attempt}/${maxAttempts}`, { attempt, maxAttempts });
      
      // Use LLM to analyze query and generate smart keywords
      const analysis = await this.queryAnalyzer.analyzeQuery(question, location, attempt);
      if (eventTracker) eventTracker.addEvent('llm_analysis_complete', `LLM analysis completed`, { analysis });
      
      // Discover potentially relevant documents using LLM analysis
      const discoveredUrls = await this.discovery.discoverRelevantDocumentsWithAnalysis(analysis);
      log(`🔍 Discovered ${discoveredUrls.length} potential document URLs using LLM analysis`);
      if (eventTracker) eventTracker.addEvent('urls_discovered', `Discovered ${discoveredUrls.length} potential document URLs`, { urlCount: discoveredUrls.length });
      
      // Try to fetch the most promising documents (limit to avoid overload)
      const maxDocsToFetch = 3;
      const successfullyFetched = [];
      if (eventTracker) eventTracker.addEvent('document_fetch_start', `Attempting to fetch up to ${maxDocsToFetch} documents`, { maxDocsToFetch });
      
      for (let i = 0; i < Math.min(discoveredUrls.length, maxDocsToFetch); i++) {
        const url = discoveredUrls[i];
        try {
          log(`📄 Attempting to fetch: ${url}`);
          if (eventTracker) eventTracker.addEvent('document_fetch_attempt', `Fetching document from ${url}`, { url, documentNumber: i + 1 });
          
          const doc = await this.fetchDocument(url);
          
          // Check if the fetched document is actually relevant
          if (this.isDocumentRelevant(doc.content, question)) {
            successfullyFetched.push({
              id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              url: doc.url,
              content: doc.content,
              tags: doc.tags.join(','),
              created_at: new Date()
            });
            log(`✅ Successfully fetched and validated: ${url}`);
            if (eventTracker) eventTracker.addEvent('document_fetch_success', `Successfully fetched and validated document`, { url });
          } else {
            log(`⚠️ Document not relevant for question: ${url}`);
            if (eventTracker) eventTracker.addEvent('document_rejected', `Document not relevant to question`, { url });
          }
        } catch (error) {
          log(`❌ Failed to fetch ${url}: ${error.message}`);
          if (eventTracker) eventTracker.addEvent('document_fetch_error', `Failed to fetch document: ${error.message}`, { url, error: error.message });
          continue; // Try next URL
        }
      }
      
      // If we found documents, return them immediately
      if (successfullyFetched.length > 0) {
        log(`🎉 Successfully discovered and ingested ${successfullyFetched.length} new documents on attempt ${attempt}!`);
        if (eventTracker) eventTracker.addEvent('discovery_success', `Successfully ingested ${successfullyFetched.length} documents on attempt ${attempt}`, { 
          documentsIngested: successfullyFetched.length, 
          attempt,
          documents: successfullyFetched.map(d => ({ url: d.url, id: d.id }))
        });
        return successfullyFetched;
      }
      
      // If this isn't the last attempt, continue with refined keywords
      if (attempt < maxAttempts) {
        log(`⚡ Attempt ${attempt} found no documents. Refining search terms for attempt ${attempt + 1}...`);
        if (eventTracker) eventTracker.addEvent('refinement_needed', `No documents found, refining keywords for attempt ${attempt + 1}`, { attempt, nextAttempt: attempt + 1 });
        continue;
      }
    }
    
    log(`😞 No relevant documents could be discovered after ${maxAttempts} attempts with refined keywords`);
    if (eventTracker) eventTracker.addEvent('discovery_failed', `No relevant documents found after ${maxAttempts} attempts`, { maxAttempts });
    return [];
  }

  // Check if a document is actually relevant to the question
  isDocumentRelevant(content, question) {
    const questionWords = question.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const contentLower = content.toLowerCase();
    
    // Count how many question words appear in the document
    const matchingWords = questionWords.filter(word => contentLower.includes(word));
    
    // Consider relevant if at least 20% of meaningful words match, or if it's a legal document
    const relevanceThreshold = Math.max(1, Math.floor(questionWords.length * 0.2));
    const hasLegalIndicators = contentLower.includes('act') || contentLower.includes('section') || contentLower.includes('regulation');
    
    return matchingWords.length >= relevanceThreshold || hasLegalIndicators;
  }
}

// Intelligent Query Analyzer using cheap LLM
class QueryAnalyzer {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.isOpenRouter = this.apiKey && this.apiKey.startsWith('sk-or-v1-');
    this.baseURL = this.isOpenRouter 
      ? 'https://openrouter.ai/api/v1'
      : 'https://api.openai.com/v1';
  }

  async analyzeQuery(question, location, attempt = 1) {
    if (!this.apiKey) {
      console.log('No API key found, using fallback analysis');
      return this.createFallbackAnalysis(question, location);
    }

    const prompt = `You are an Australian legal research assistant. Analyze this legal question and extract relevant search terms for finding Australian legal documents.

QUESTION: "${question}"
LOCATION: "${location || 'Australia'}"
ATTEMPT: ${attempt}/3

Extract:
1. JURISDICTION: Which Australian jurisdiction applies (qld, nsw, vic, wa, sa, tas, nt, act, or cth for federal)
2. LEGAL_AREAS: Primary legal areas (e.g., property law, corporate law, consumer law, planning law, etc.)
3. KEYWORDS: Specific legal terms and concepts to search for
4. DOCUMENT_TYPES: Types of legal documents needed (acts, regulations, codes, etc.)
5. ALTERNATIVE_TERMS: Other ways to describe the same legal concepts

${attempt > 1 ? `
PREVIOUS ATTEMPTS FAILED: The previous keywords didn't find relevant documents. 
Try broader, more general legal terms or alternative ways to describe the legal issue.
` : ''}

Respond in JSON format:
{
  "jurisdiction": "qld",
  "legal_areas": ["property law", "neighbour disputes"],  
  "keywords": ["fence", "boundary", "dividing fence", "neighbour disputes", "property boundaries"],
  "document_types": ["act", "regulation"],
  "alternative_terms": ["fencing", "boundary disputes", "adjoining properties", "residential property"]
}`;

    // Choose model based on provider
    const model = this.isOpenRouter 
      ? 'openai/gpt-4o-mini' // OpenRouter format for GPT-4o-mini
      : 'gpt-4o-mini';       // Direct OpenAI format

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };

    // Add OpenRouter-specific headers
    if (this.isOpenRouter) {
      headers['HTTP-Referer'] = 'https://govhack2025.com';
      headers['X-Title'] = 'LegalEase - Legal Query Analysis';
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model, // Cheap model for analysis
          messages: [
            {
              role: 'system',
              content: 'You are an expert in Australian legal taxonomy. Extract precise search terms for legal document discovery.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 400
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        const analysis = JSON.parse(content);
        console.log(`🧠 LLM Analysis (attempt ${attempt}):`, analysis);
        return analysis;
      } catch (parseError) {
        console.error('Failed to parse LLM analysis:', content);
        // Fallback to basic analysis
        return this.createFallbackAnalysis(question, location);
      }

    } catch (error) {
      console.error('Query analysis error:', error);
      return this.createFallbackAnalysis(question, location);
    }
  }

  createFallbackAnalysis(question, location) {
    const questionLower = question.toLowerCase();
    
    // Basic jurisdiction detection
    let jurisdiction = 'cth';
    if (location) {
      const loc = location.toLowerCase();
      if (loc.includes('qld') || loc.includes('queensland') || loc.includes('sunshine coast')) jurisdiction = 'qld';
      else if (loc.includes('nsw') || loc.includes('sydney')) jurisdiction = 'nsw';
      else if (loc.includes('vic') || loc.includes('melbourne')) jurisdiction = 'vic';
    }

    // Basic keyword extraction
    const keywords = [];
    if (questionLower.includes('fence')) keywords.push('fence', 'boundary', 'dividing fence');
    if (questionLower.includes('business')) keywords.push('business', 'corporation', 'company');
    if (questionLower.includes('property')) keywords.push('property', 'land', 'real estate');

    return {
      jurisdiction,
      legal_areas: ['general law'],
      keywords: keywords.length > 0 ? keywords : ['law'],
      document_types: ['act', 'regulation'],
      alternative_terms: keywords.length > 0 ? keywords : ['legal']
    };
  }
}

// Enhanced OpenAI/OpenRouter client with two-tier LLM system
class StandaloneOpenAIClient {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.isOpenRouter = this.apiKey && this.apiKey.startsWith('sk-or-v1-');
    this.baseURL = this.isOpenRouter 
      ? 'https://openrouter.ai/api/v1'
      : 'https://api.openai.com/v1';
    
    console.log(`🔑 Using ${this.isOpenRouter ? 'OpenRouter' : 'OpenAI'} API`);
  }

  async generateAnswer(question, context, userLocale = 'en-AU') {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    const prompt = `Based on the following Australian legal documents, please answer this question:

QUESTION: ${question}

CONTEXT FROM LEGAL DOCUMENTS:
${context}

INSTRUCTIONS:
- Answer in Australian English using Australian legal terminology
- Base your answer ONLY on the provided legal documents
- If the documents don't contain relevant information, state this clearly
- Include specific references to which acts or regulations you're citing
- Always end with the standard legal disclaimer

LEGAL DISCLAIMER TO INCLUDE:
"⚠️ IMPORTANT: This information is general in nature and should not be considered legal advice. Australian laws can be complex and may vary by jurisdiction. For specific legal matters, please consult with a qualified legal professional or contact the relevant government department."

Please provide a clear, practical answer that helps the user understand their obligations or options under Australian law.`;

    // Choose model based on provider
    const model = this.isOpenRouter 
      ? 'openai/gpt-4o' // OpenRouter format for GPT-4o
      : 'gpt-4o';       // Direct OpenAI format

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };

    // Add OpenRouter-specific headers
    if (this.isOpenRouter) {
      headers['HTTP-Referer'] = 'https://govhack2025.com';
      headers['X-Title'] = 'LegalEase - Australian Legal AI Assistant';
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are an Australian legal research assistant. Provide accurate, helpful information based solely on the provided legal documents. Always include appropriate disclaimers about seeking professional legal advice.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response generated from OpenAI');
      }

      return {
        answer: data.choices[0].message.content,
        tokensUsed: data.usage?.total_tokens
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }
}

// Event tracking system for real-time query processing feedback
class QueryEventTracker {
  constructor(queryId) {
    this.queryId = queryId;
    this.events = [];
    this.startTime = Date.now();
    this.clients = new Set(); // WebSocket clients subscribed to this query
  }

  addEvent(type, message, data = {}) {
    const event = {
      queryId: this.queryId,
      type,
      message,
      timestamp: Date.now(),
      elapsedTime: Date.now() - this.startTime,
      data
    };
    
    this.events.push(event);
    console.log(`📡 [${this.queryId}] ${type}: ${message}`);
    
    // Broadcast to subscribed clients
    this.broadcast(event);
    
    return event;
  }

  broadcast(event) {
    // Broadcast event to all subscribed WebSocket clients
    for (const client of this.clients) {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(event));
      }
    }
  }

  subscribe(client) {
    this.clients.add(client);
    // Send existing events to new subscriber
    for (const event of this.events) {
      if (client.readyState === 1) {
        client.send(JSON.stringify(event));
      }
    }
  }

  unsubscribe(client) {
    this.clients.delete(client);
  }

  getEvents() {
    return this.events;
  }

  complete(success, result) {
    this.addEvent(
      success ? 'query_completed' : 'query_failed',
      success ? 'Query processing completed successfully' : 'Query processing failed',
      { success, result, totalTime: Date.now() - this.startTime }
    );
  }
}

// Global registry for active query trackers
const activeQueries = new Map();

// Initialize services
const documentFetcher = new StandaloneDocumentFetcher();
const openaiClient = new StandaloneOpenAIClient();

// Sample AustLII documents - including QLD property/neighbour law
const SAMPLE_DOCUMENTS = [
  'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/pa1997175/', // QLD Property Law Act - for boundary/fence disputes
  'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/nd1959264/', // QLD Neighbourhood Disputes Act
  'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/ca2001172/', // Corporations Act
];

// Create Express app
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/api/hello', (req, res) => {
  res.json({
    message: "Hello from LegalEase Standalone API!",
    timestamp: new Date().toISOString(),
    version: "1.0.0-standalone"
  });
});

// Cache documents endpoint
app.post('/api/cache-documents', async (req, res) => {
  try {
    console.log('Caching sample documents...');
    const results = [];
    
    for (const url of SAMPLE_DOCUMENTS) {
      try {
        const doc = await documentFetcher.fetchDocument(url);
        results.push({
          url: doc.url,
          title: url.split('/').pop() || 'Legal Document',
          tags: doc.tags
        });
        console.log(`✅ Cached: ${url}`);
      } catch (error) {
        console.error(`❌ Failed to cache: ${url}`, error.message);
      }
    }
    
    res.json({
      success: true,
      documentsAdded: results.length,
      totalDocuments: mockDB.docs.length,
      cachedDocuments: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      documentsAdded: 0,
      totalDocuments: 0,
      cachedDocuments: []
    });
  }
});

// Ask question endpoint with real-time event tracking
app.post('/api/legal/ask', async (req, res) => {
  const startTime = Date.now();
  const queryId = `query_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  // Create event tracker for this query
  const eventTracker = new QueryEventTracker(queryId);
  activeQueries.set(queryId, eventTracker);

  try {
    const { question, sessionId, userLocale, context } = req.body;
    
    eventTracker.addEvent('query_received', 'Query received and processing started', { question, sessionId, userLocale, context });
    
    if (!question) {
      eventTracker.complete(false, 'Question is required');
      return res.status(400).json({
        success: false,
        error: 'Question is required',
        queryId,
        events: eventTracker.getEvents(),
        executionTime: Date.now() - startTime
      });
    }

    // Find relevant documents OR discover them on-the-fly
    const location = context?.location;
    eventTracker.addEvent('document_search_init', 'Initializing document search and discovery', { location });
    const relevantDocs = await documentFetcher.findOrDiscoverDocuments(question, location, 3, eventTracker);
    
    if (relevantDocs.length === 0) {
      eventTracker.complete(false, 'No relevant documents could be found');
      return res.json({
        success: false,
        error: 'No relevant legal documents could be found or discovered. The system attempted to discover documents from AustLII but none were available or relevant to your question.',
        queryId,
        events: eventTracker.getEvents(),
        executionTime: Date.now() - startTime
      });
    }

    // Prepare context
    eventTracker.addEvent('context_preparation', `Preparing context from ${relevantDocs.length} documents`, { documentCount: relevantDocs.length });
    const docContext = relevantDocs
      .slice(0, 3)
      .map(doc => `DOCUMENT: ${doc.url}\nCONTENT: ${doc.content.substring(0, 2000)}...\n`)
      .join('\n\n');

    // Generate AI response
    eventTracker.addEvent('ai_generation_start', 'Starting AI response generation', { documentCount: relevantDocs.length });
    const aiResponse = await openaiClient.generateAnswer(question, docContext, userLocale);
    eventTracker.addEvent('ai_generation_complete', 'AI response generated successfully');

    // Prepare sources
    eventTracker.addEvent('response_preparation', 'Preparing final response with sources', { sourceCount: relevantDocs.slice(0, 3).length });
    const sources = relevantDocs.slice(0, 3).map(doc => ({
      title: doc.url.split('/').pop() || 'Legal Document',
      url: doc.url,
      jurisdiction: doc.url.includes('/qld/') ? 'Queensland' : 
                    doc.url.includes('/nsw/') ? 'New South Wales' :
                    doc.url.includes('/cth/') ? 'Commonwealth of Australia' : 'Australia'
    }));

    // Log query
    mockDB.queries.push({
      id: queryId,
      question,
      answer: aiResponse.answer,
      docs_used: relevantDocs.slice(0, 3).map(doc => doc.id).join(','),
      created_at: new Date()
    });

    // Complete tracking
    const finalResult = {
      success: true,
      answer: aiResponse.answer,
      sources,
      confidence: 0.9,
      queryId,
      executionTime: Date.now() - startTime,
      tokensUsed: aiResponse.tokensUsed || null,
      events: eventTracker.getEvents()
    };
    
    eventTracker.complete(true, finalResult);

    res.json(finalResult);

  } catch (error) {
    console.error('Error in askQuestion:', error);
    eventTracker.complete(false, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      queryId,
      events: eventTracker.getEvents(),
      executionTime: Date.now() - startTime
    });
  }

  // Clean up old query trackers after response
  setTimeout(() => {
    activeQueries.delete(queryId);
  }, 300000); // Keep for 5 minutes for WebSocket clients
});

// Get query events endpoint
app.get('/api/legal/query/:queryId/events', (req, res) => {
  try {
    const { queryId } = req.params;
    const tracker = activeQueries.get(queryId);
    
    if (!tracker) {
      return res.status(404).json({
        success: false,
        error: `Query ${queryId} not found or has expired`
      });
    }
    
    res.json({
      success: true,
      queryId,
      events: tracker.getEvents()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get history endpoint
app.get('/api/legal/history', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const queries = mockDB.queries
      .slice(-limit)
      .reverse()
      .map(query => ({
        id: query.id,
        question: query.question,
        answer: query.answer || 'No answer recorded',
        timestamp: query.created_at.toISOString(),
        confidence: 0.9
      }));

    res.json({
      success: true,
      queries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server with WebSocket support
const PORT = process.env.PORT || 4000;
const server = createServer(app);
const wss = new WebSocketServer({ server });

// WebSocket connection handling for real-time query events
wss.on('connection', (ws, req) => {
  console.log('📡 New WebSocket connection established');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'subscribe' && data.queryId) {
        // Subscribe to query events
        const tracker = activeQueries.get(data.queryId);
        if (tracker) {
          tracker.subscribe(ws);
          ws.send(JSON.stringify({
            type: 'subscribed',
            queryId: data.queryId,
            message: 'Successfully subscribed to query events'
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            message: `Query ${data.queryId} not found`
          }));
        }
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('📡 WebSocket connection closed');
    // Unsubscribe from all query trackers
    for (const tracker of activeQueries.values()) {
      tracker.unsubscribe(ws);
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

server.listen(PORT, () => {
  console.log(`🏛️  LegalEase Standalone Server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/hello`);
  console.log(`📄 Cache documents: POST http://localhost:${PORT}/api/cache-documents`);
  console.log(`🤖 Ask questions: POST http://localhost:${PORT}/api/legal/ask`);
  console.log(`📡 WebSocket events: ws://localhost:${PORT}/`);
  console.log('');
  console.log('Ready to test the real data pipeline with real-time events!');
});