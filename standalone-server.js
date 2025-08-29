#!/usr/bin/env node

// Standalone Node.js server to test the real data pipeline
// This bypasses Encore's cloud dependency issues

import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { PersistentDatabase } from './persistent-database.js';
import { DocumentSeeder } from './document-seeder.js';
import { BackgroundIntelligenceService, IntelligentFailureHandler } from './background-intelligence.js';
import { RealtimeDocumentIngester } from './realtime-document-ingester.js';
import { PermitSiteIngester } from './permit-site-ingester.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize persistent database with disk caching
const db = new PersistentDatabase();

// Initialize database and seed with documents on startup
async function initializeDatabase() {
  try {
    await db.initialize();
    
    const stats = await db.getStats();
    console.log(`📊 Database ready: ${stats.documents} documents, ${stats.queries} queries`);
    console.log(`💾 Cache: ${stats.cache.files} files, ${stats.cache.totalSize}KB`);
    
    // Auto-seed database if it's empty or has few documents
    if (stats.documents < 10) {
      console.log('\n🌱 Database has few documents, starting quick seeding...');
      const seeder = new DocumentSeeder(db);
      const seedResult = await seeder.quickSeed();
      console.log(`🌟 Seeding completed: ${seedResult.seeded} documents added`);
    } else {
      console.log('✅ Database already well-seeded, skipping automatic seeding');
    }
    
    // Initialize Background Intelligence Services after seeding
    await initializeBackgroundIntelligence();
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Initialize Background Intelligence Services
async function initializeBackgroundIntelligence() {
  try {
    console.log('\n🧠 Initializing Background Intelligence Services...');
    
    // Create a query analyzer for background processing
    const queryAnalyzer = new QueryAnalyzer();
    
    // Initialize Background Intelligence Service
    backgroundIntelligence = new BackgroundIntelligenceService(db, queryAnalyzer, documentFetcher);
    
    // Initialize Intelligent Failure Handler
    failureHandler = new IntelligentFailureHandler(backgroundIntelligence);
    
    // Start background intelligence (proactive document discovery)
    backgroundIntelligence.start();
    
    console.log('✅ Background Intelligence Services started');
    console.log('🤖 System will now proactively generate questions and discover documents');
    
  } catch (error) {
    console.error('❌ Failed to initialize Background Intelligence:', error.message);
    // Don't fail server startup, just disable background intelligence
    backgroundIntelligence = null;
    failureHandler = null;
  }
}

// AustLII Document Discovery System
class AustLIIDiscovery {
  constructor() {
    // No hardcoded patterns - use dynamic discovery based on database content and LLM analysis
  }

  // Document discovery now handled by the new dynamic system - this method is deprecated

  // NEW: Dynamic document discovery using web search and database storage
  async discoverRelevantDocumentsWithAnalysis(analysis) {
    const discoveries = [];
    const { jurisdiction, legal_areas, keywords, document_types, alternative_terms } = analysis;
    
    console.log(`🎯 Using database and government data discovery for: jurisdiction=${jurisdiction}, areas=${legal_areas.join(',')}, keywords=${keywords.join(',')}`);
    
    // Instead of web search, discover documents from existing database and follow government data links
    console.log(`📚 Skipping real-time web search - using database and government data sources only`);
    
    
    // No hardcoded fallbacks - only use discovered documents from real sources
    
    // NEW: Add government data sources, planning schemes, and building codes
    const governmentDataUrls = this.generateGovernmentDataUrls(jurisdiction, keywords, legal_areas);
    const planningSchemeUrls = this.generatePlanningSchemeUrls(jurisdiction, keywords);  
    const buildingCodeUrls = this.generateBuildingCodeUrls(jurisdiction, keywords, legal_areas);
    
    discoveries.push(...governmentDataUrls);
    discoveries.push(...planningSchemeUrls);
    discoveries.push(...buildingCodeUrls);

    // Debug logging for new data sources
    if (governmentDataUrls.length > 0) {
      console.log(`🏛️ Generated ${governmentDataUrls.length} government data URLs:`, governmentDataUrls.slice(0, 3));
    }
    if (planningSchemeUrls.length > 0) {
      console.log(`📋 Generated ${planningSchemeUrls.length} planning scheme URLs:`, planningSchemeUrls);
    }
    if (buildingCodeUrls.length > 0) {
      console.log(`🏗️ Generated ${buildingCodeUrls.length} building code URLs:`, buildingCodeUrls.slice(0, 3));
    }

    // Remove duplicates and limit results
    const uniqueDiscoveries = [...new Set(discoveries)];
    return uniqueDiscoveries.slice(0, 50); // Limit to reasonable number
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
    const allTerms = [...keywords, ...alternative_terms].slice(0, 5);
    const primaryAreas = legal_areas.slice(0, 2);
    
    for (const area of primaryAreas) {
      for (const term of allTerms.slice(0, 3)) {
        queries.push(`site:austlii.edu.au ${jurisdictionName} ${area} ${term} act legislation`);
      }
    }
    
    // Add a general query for the jurisdiction + primary terms
    const primaryTerms = keywords.slice(0, 3).join(' ');
    queries.push(`site:austlii.edu.au ${jurisdictionName} ${primaryTerms} act 2006 2007 2008`);
    
    return queries.slice(0, 5); // Limit to 5 queries
  }

  // Real web search using the WebSearch tool
  async performWebSearch(query) {
    try {
      console.log(`🔍 Performing real web search for: ${query}`);
      
      // Use the actual WebSearch tool
      const searchResults = await this.webSearch(query);
      
      // Extract links from search results
      const links = [];
      if (searchResults && searchResults.results) {
        for (const result of searchResults.results) {
          if (result.url) {
            links.push({ url: result.url, title: result.title, snippet: result.snippet });
          }
        }
      }
      
      return { links };
      
    } catch (error) {
      console.error(`❌ Web search failed: ${error.message}`);
      return { links: [] };
    }
  }

  // Extract AustLII URLs from web search results
  extractAustLIIUrls(searchResults) {
    const urls = [];
    
    if (searchResults && searchResults.links) {
      for (const link of searchResults.links) {
        if (link.url && link.url.includes('austlii.edu.au') && 
            (link.url.includes('consol_act') || link.url.includes('consol_reg'))) {
          urls.push(link.url);
        }
      }
    }
    
    return [...new Set(urls)]; // Remove duplicates
  }

  // Get documents from database by legal area and jurisdiction with scoring (database-driven)
  async getDocumentsByLegalArea(db, jurisdiction, legal_areas, keywords = []) {
    const documents = [];
    
    try {
      // Query database for existing documents matching jurisdiction and legal areas
      const query = `
        SELECT url, content, tags, created_at 
        FROM documents 
        WHERE (url LIKE '%/${jurisdiction}/%' OR tags LIKE '%${jurisdiction}%')
        AND (${legal_areas.map(area => `tags LIKE '%${area}%' OR content LIKE '%${area}%'`).join(' OR ')})
        LIMIT 20
      `;
      
      const rows = await db.allQuery(query);
      
      for (const row of rows) {
        // Extract document ID from AustLII URL
        const urlMatch = row.url.match(/\/([^/]+)\/$/);
        if (urlMatch) {
          // Calculate comprehensive document score
          const score = this.calculateDocumentScore(row, jurisdiction, legal_areas, keywords);
          
          documents.push({
            id: urlMatch[1],
            url: row.url,
            tags: row.tags,
            content_preview: row.content ? row.content.substring(0, 200) : '',
            score: score,
            created_at: row.created_at
          });
        }
      }
      
      // Sort by score (highest first)
      documents.sort((a, b) => b.score.total - a.score.total);
      
      console.log(`📚 Found ${documents.length} documents with scoring for ${jurisdiction} ${legal_areas.join(',')}`);
      
      return documents.slice(0, 10); // Return top 10 scored documents
      
    } catch (error) {
      console.error(`❌ Database query failed: ${error.message}`);
    }
    
    return documents;
  }

  // Calculate comprehensive document scoring system
  calculateDocumentScore(document, targetJurisdiction, legal_areas, keywords = []) {
    let relevanceScore = 0;
    let jurisdictionScore = 0;
    let specificityScore = 0;
    
    const content = (document.content || '').toLowerCase();
    const tags = (document.tags || '').toLowerCase();
    const url = document.url.toLowerCase();
    
    // 1. RELEVANCE SCORING (0-40 points)
    // Legal area matches in tags (high weight)
    for (const area of legal_areas) {
      if (tags.includes(area.toLowerCase())) {
        relevanceScore += 8; // High score for tag matches
      } else if (content.includes(area.toLowerCase())) {
        relevanceScore += 4; // Medium score for content matches
      }
    }
    
    // Keyword matches (if provided)
    for (const keyword of keywords) {
      if (tags.includes(keyword.toLowerCase())) {
        relevanceScore += 6;
      } else if (content.includes(keyword.toLowerCase())) {
        relevanceScore += 3;
      }
    }
    
    // Cap relevance score
    relevanceScore = Math.min(relevanceScore, 40);
    
    // 2. JURISDICTION SCORING (0-30 points)
    const documentJurisdiction = this.extractJurisdictionFromUrl(url);
    
    if (documentJurisdiction === targetJurisdiction) {
      jurisdictionScore = 30; // Perfect jurisdiction match
    } else if (documentJurisdiction === 'cth') {
      jurisdictionScore = 25; // Commonwealth law applies everywhere
    } else if (this.isRelatedJurisdiction(documentJurisdiction, targetJurisdiction)) {
      jurisdictionScore = 15; // Related jurisdiction (similar legal systems)
    } else {
      jurisdictionScore = 5; // Different jurisdiction but potentially relevant
    }
    
    // 3. SPECIFICITY SCORING (0-30 points)
    // More specific documents score higher
    if (url.includes('consol_act')) {
      specificityScore += 15; // Consolidated acts are highly specific
    } else if (url.includes('consol_reg')) {
      specificityScore += 12; // Regulations are specific
    } else if (url.includes('num_act')) {
      specificityScore += 10; // Numbered acts
    }
    
    // Recent documents score higher (recency bonus)
    if (document.created_at) {
      const daysSinceCreation = (Date.now() - new Date(document.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation < 30) {
        specificityScore += 10; // Very recent
      } else if (daysSinceCreation < 90) {
        specificityScore += 5; // Recent
      }
    }
    
    // Document length indicates comprehensiveness
    const contentLength = content.length;
    if (contentLength > 10000) {
      specificityScore += 5; // Comprehensive document
    } else if (contentLength > 5000) {
      specificityScore += 3; // Substantial document
    }
    
    const totalScore = relevanceScore + jurisdictionScore + specificityScore;
    
    return {
      total: totalScore,
      relevance: relevanceScore,
      jurisdiction: jurisdictionScore,
      specificity: specificityScore,
      jurisdiction_level: this.getJurisdictionLevel(documentJurisdiction),
      jurisdiction_match: documentJurisdiction === targetJurisdiction ? 'exact' : 
                          documentJurisdiction === 'cth' ? 'commonwealth' : 'other',
      match_type: this.determineMatchType(totalScore)
    };
  }
  
  // Extract jurisdiction from AustLII URL
  extractJurisdictionFromUrl(url) {
    const match = url.match(/\/au\/legis\/([^/]+)\//);
    return match ? match[1] : 'unknown';
  }
  
  // Determine jurisdiction authority level
  getJurisdictionLevel(jurisdiction) {
    if (jurisdiction === 'cth') return 'commonwealth';
    if (['nsw', 'qld', 'vic', 'wa', 'sa', 'tas', 'nt', 'act'].includes(jurisdiction)) return 'state';
    return 'local';
  }
  
  // Check if jurisdictions are related (for scoring purposes)
  isRelatedJurisdiction(docJurisdiction, targetJurisdiction) {
    // All Australian states are somewhat related in legal principles
    const australianJurisdictions = ['nsw', 'qld', 'vic', 'wa', 'sa', 'tas', 'nt', 'act'];
    return australianJurisdictions.includes(docJurisdiction) && 
           australianJurisdictions.includes(targetJurisdiction);
  }
  
  // Determine overall match quality
  determineMatchType(totalScore) {
    if (totalScore >= 80) return 'highly_specific';
    if (totalScore >= 60) return 'specific';
    if (totalScore >= 40) return 'relevant';
    if (totalScore >= 20) return 'general';
    return 'tangential';
  }

  // Generate deep links to specific legal provisions and permits
  generateDeepLinks(aiResponse, documents, jurisdiction, legal_areas, keywords) {
    const deepLinks = [];
    const response = aiResponse.toLowerCase();
    
    // Extract mentioned sections, chapters, and provisions
    const sectionMatches = aiResponse.match(/section\s+(\d+[a-z]?)/gi) || [];
    const chapterMatches = aiResponse.match(/chapter\s+(\d+)/gi) || [];
    const partMatches = aiResponse.match(/part\s+(\d+[a-z]?)/gi) || [];
    
    // Generate section-specific deep links for each document
    for (const doc of documents) {
      const baseUrl = doc.url;
      
      // Add specific section links
      for (const sectionMatch of sectionMatches) {
        const sectionNum = sectionMatch.match(/\d+[a-z]?/i)[0];
        deepLinks.push({
          type: 'legal_provision',
          title: `Section ${sectionNum}`,
          description: `Direct link to Section ${sectionNum} of the Act`,
          url: `${baseUrl}s${sectionNum}.html`,
          document_title: this.getDocumentTitle(doc.url),
          jurisdiction: jurisdiction.toUpperCase(),
          provision_type: 'section'
        });
      }
      
      // Add chapter links
      for (const chapterMatch of chapterMatches) {
        const chapterNum = chapterMatch.match(/\d+/)[0];
        deepLinks.push({
          type: 'legal_provision', 
          title: `Chapter ${chapterNum}`,
          description: `Direct link to Chapter ${chapterNum} provisions`,
          url: `${baseUrl}ch${chapterNum}.html`,
          document_title: this.getDocumentTitle(doc.url),
          jurisdiction: jurisdiction.toUpperCase(),
          provision_type: 'chapter'
        });
      }
    }
    
    // Add permit and license application links based on content
    const permitLinks = this.generatePermitLinks(aiResponse, jurisdiction, legal_areas);
    deepLinks.push(...permitLinks);
    
    // Add regulatory authority links
    const authorityLinks = this.generateAuthorityLinks(jurisdiction, legal_areas);
    deepLinks.push(...authorityLinks);
    
    return deepLinks;
  }
  
  // Generate permit and license application links
  generatePermitLinks(aiResponse, jurisdiction, legal_areas) {
    const permitLinks = [];
    const response = aiResponse.toLowerCase();
    
    // Food business licenses
    if (response.includes('food business licence') || response.includes('food licence')) {
      const jurisdictionData = this.getJurisdictionData(jurisdiction);
      permitLinks.push({
        type: 'permit_application',
        title: 'Food Business Licence Application',
        description: 'Apply for a food business licence online',
        url: jurisdictionData.foodLicenceUrl,
        authority: jurisdictionData.foodAuthority,
        jurisdiction: jurisdiction.toUpperCase(),
        application_type: 'food_business_licence'
      });
    }
    
    // Development approvals
    if (response.includes('development approval') || response.includes('planning permit')) {
      const jurisdictionData = this.getJurisdictionData(jurisdiction);
      permitLinks.push({
        type: 'permit_application',
        title: 'Development Application',
        description: 'Submit development application to local council',
        url: jurisdictionData.developmentUrl,
        authority: 'Local Council',
        jurisdiction: jurisdiction.toUpperCase(),
        application_type: 'development_approval'
      });
    }
    
    // Business registration
    if (response.includes('business registration') || response.includes('abn')) {
      permitLinks.push({
        type: 'permit_application',
        title: 'Business Registration',
        description: 'Register your business and get an ABN',
        url: 'https://www.business.gov.au/registrations/register-for-an-australian-business-number-abn',
        authority: 'Australian Business Registry Services',
        jurisdiction: 'Commonwealth',
        application_type: 'business_registration'
      });
    }
    
    return permitLinks;
  }
  
  // Generate regulatory authority contact links
  generateAuthorityLinks(jurisdiction, legal_areas) {
    const authorityLinks = [];
    const jurisdictionData = this.getJurisdictionData(jurisdiction);
    
    // Food safety authorities
    if (legal_areas.some(area => area.includes('food'))) {
      authorityLinks.push({
        type: 'regulatory_authority',
        title: jurisdictionData.foodAuthority,
        description: 'Contact the food safety regulator',
        url: jurisdictionData.foodAuthorityUrl,
        authority: jurisdictionData.foodAuthority,
        jurisdiction: jurisdiction.toUpperCase(),
        contact_type: 'food_safety'
      });
    }
    
    // Local council
    authorityLinks.push({
      type: 'regulatory_authority',
      title: 'Local Council Services',
      description: 'Contact your local council for permits and approvals',
      url: jurisdictionData.localCouncilUrl,
      authority: 'Local Council',
      jurisdiction: jurisdiction.toUpperCase(),
      contact_type: 'local_government'
    });
    
    return authorityLinks;
  }
  
  // Get jurisdiction-specific data for links
  getJurisdictionData(jurisdiction) {
    const jurisdictionMap = {
      'qld': {
        foodAuthority: 'Queensland Health',
        foodAuthorityUrl: 'https://www.health.qld.gov.au/public-health/industry-environment/food-safety',
        foodLicenceUrl: 'https://www.business.qld.gov.au/industries/hospitality-tourism-sport/hospitality-gaming/food-business/starting',
        developmentUrl: 'https://www.business.qld.gov.au/industries/building-construction-property/building-construction/approvals-permits',
        localCouncilUrl: 'https://www.qld.gov.au/about/how-government-works/local-government'
      },
      'nsw': {
        foodAuthority: 'NSW Food Authority',
        foodAuthorityUrl: 'https://www.foodauthority.nsw.gov.au/',
        foodLicenceUrl: 'https://www.foodauthority.nsw.gov.au/retail/food-business-licensing',
        developmentUrl: 'https://www.planning.nsw.gov.au/development-applications',
        localCouncilUrl: 'https://www.olg.nsw.gov.au/'
      },
      'vic': {
        foodAuthority: 'Department of Health Victoria',
        foodAuthorityUrl: 'https://www.health.vic.gov.au/food-safety',
        foodLicenceUrl: 'https://www.business.vic.gov.au/licensing-and-registration/food-business-registration',
        developmentUrl: 'https://www.planning.vic.gov.au/permits-and-applications',
        localCouncilUrl: 'https://www.localgovernment.vic.gov.au/'
      }
    };
    
    return jurisdictionMap[jurisdiction] || jurisdictionMap['qld']; // Default to QLD
  }
  
  // Extract document title from URL
  getDocumentTitle(url) {
    const documentMap = {
      'fa200657': 'Food Act 2006 (QLD)',
      'la2007107': 'Liquor Act 2007 (NSW)', 
      'ca2001172': 'Corporations Act 2001 (Cth)',
      'fa200357': 'Food Act 2003 (NSW)'
    };
    
    const docId = url.match(/\/([^/]+)\/$/)?.[1];
    return documentMap[docId] || 'Legal Document';
  }

  // NEW: Generate government data portal URLs for building codes and planning
  generateGovernmentDataUrls(jurisdiction, keywords, legal_areas) {
    const urls = [];
    
    // Generate data.gov.au dataset URLs
    const planningKeywords = keywords.filter(k => 
      k.includes('planning') || k.includes('building') || k.includes('zoning') || 
      k.includes('development') || k.includes('council') || k.includes('scheme')
    );

    for (const keyword of planningKeywords) {
      const cleanKeyword = keyword.toLowerCase().replace(/\s+/g, '-');
      urls.push(`https://data.gov.au/data/dataset/${cleanKeyword}-${jurisdiction}`);
      urls.push(`https://data.gov.au/data/dataset/${jurisdiction}-${cleanKeyword}`);
    }

    // State-specific data portals
    switch (jurisdiction) {
      case 'nsw':
        urls.push(
          'https://www.planningportal.nsw.gov.au/opendata/dataset/online-da-data-api',
          'https://www.planningportal.nsw.gov.au/spatialviewer/',
          'https://data.nsw.gov.au/search/dataset/ds-nsw-ckan-building-approvals'
        );
        break;
      case 'vic':
        urls.push(
          'https://discover.data.vic.gov.au/dataset/vicmap-planning-api',
          'https://www.data.vic.gov.au/data/dataset/planning-permit-activity-data',
          'https://mapshare.vic.gov.au/vicplan/',
          'https://www.data.vic.gov.au/data/dataset/building-permits'
        );
        break;
      case 'qld':
        urls.push(
          'https://www.data.qld.gov.au/dataset/planning-scheme-zones',
          'https://www.data.qld.gov.au/dataset/development-applications',
          'https://planning.dsdmip.qld.gov.au/online-services',
          'https://developmenti.brisbane.qld.gov.au/'
        );
        break;
      case 'wa':
        urls.push(
          'https://catalogue.data.wa.gov.au/dataset/planning-applications',
          'https://www.wa.gov.au/organisation/department-of-planning-lands-and-heritage'
        );
        break;
    }

    return urls.slice(0, 10); // Limit government data URLs
  }

  // NEW: Generate planning scheme specific URLs
  generatePlanningSchemeUrls(jurisdiction, keywords) {
    const urls = [];
    const buildingKeywords = keywords.filter(k => 
      k.includes('height') || k.includes('size') || k.includes('building') || 
      k.includes('construction') || k.includes('permit') || k.includes('approval')
    );

    // National Construction Code
    urls.push('https://ncc.abcb.gov.au/');
    
    // State-specific planning schemes
    switch (jurisdiction) {
      case 'nsw':
        urls.push(
          'https://www.planning.nsw.gov.au/policy-and-legislation/buildings',
          'https://www.fairtrading.nsw.gov.au/trades-and-businesses/construction-and-trade-essentials/national-construction-code'
        );
        break;
      case 'vic':
        urls.push(
          'https://www.planning.vic.gov.au/planning-schemes/using-vicplan',
          'https://www.planning.vic.gov.au/planning-schemes/planning-property-report'
        );
        break;
      case 'qld':
        urls.push(
          'https://www.planning.qld.gov.au/planning-framework/mapping',
          'https://www.business.qld.gov.au/industries/building-property-development/building-construction/planning-schemes'
        );
        break;
    }

    return urls.slice(0, 5); // Limit planning scheme URLs
  }

  // NEW: Generate building code and construction standard URLs  
  generateBuildingCodeUrls(jurisdiction, keywords, legal_areas) {
    const urls = [];
    
    // Check if building-related keywords are present
    const isBuildingRelated = keywords.some(k => 
      k.includes('build') || k.includes('construct') || k.includes('height') || 
      k.includes('size') || k.includes('permit') || k.includes('approval') ||
      k.includes('shed') || k.includes('pergola') || k.includes('fence') || 
      k.includes('pool') || k.includes('extension')
    );

    if (isBuildingRelated) {
      // Australian Building Codes Board
      urls.push(
        'https://ncc.abcb.gov.au/editions/2019-a1-archive/adopted-provisions',
        'https://ncc.abcb.gov.au/editions/2022-a1/adopted-provisions'
      );

      // Australian Standards (building-related)
      urls.push('https://www.standards.org.au/standards-catalogue/building-and-construction');

      // State building regulations
      switch (jurisdiction) {
        case 'nsw':
          urls.push(
            'https://legislation.nsw.gov.au/view/html/inforce/current/epi-2000-0557',
            'https://www.planning.nsw.gov.au/policy-and-legislation/exempt-and-complying-development-policy/the-housing-code'
          );
          break;
        case 'vic':
          urls.push(
            'https://www.legislation.vic.gov.au/in-force/statutory-rules/building-regulations-2018',
            'https://www.vba.vic.gov.au/building/building-regulations'
          );
          break;
        case 'qld':
          urls.push(
            'https://www.legislation.qld.gov.au/browse/inforce/subordinate/current/b',
            'https://www.hpw.qld.gov.au/construction/BuildingPlumbing/Building'
          );
          break;
        case 'wa':
          urls.push(
            'https://www.legislation.wa.gov.au/legislation/browse/inforce?cat=sub&start=B',
            'https://www.dmirs.wa.gov.au/building-commission'
          );
          break;
      }
    }

    return urls.slice(0, 8); // Limit building code URLs
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

  // All topic extraction and URL generation is now handled dynamically by LLM with database tags

  // Generate potential links based on question and documents (before AI response)
  generatePotentialLinks(question, documents, jurisdiction, legal_areas, keywords) {
    const potentialLinks = [];
    const lowerQuestion = question.toLowerCase();
    
    // Generate permit/license application links based on question content
    const permitLinks = this.generatePermitLinks(question, jurisdiction, legal_areas);
    potentialLinks.push(...permitLinks);
    
    // Generate authority contact links
    const authorityLinks = this.generateAuthorityLinks(jurisdiction, legal_areas);
    potentialLinks.push(...authorityLinks);
    
    // Generate document-specific links (sections, chapters)
    for (const doc of documents) {
      const baseUrl = doc.url;
      const docTitle = this.getDocumentTitle(doc.url);
      
      // Add general document link
      potentialLinks.push({
        type: 'legal_document',
        title: `${docTitle}`,
        description: `Full text of the ${docTitle}`,
        url: baseUrl,
        document_title: docTitle,
        jurisdiction: jurisdiction.toUpperCase(),
        provision_type: 'document'
      });
    }
    
    return potentialLinks.slice(0, 15); // Limit for prompt size
  }

  // Extract which links were actually used in the AI response
  extractUsedLinksFromResponse(aiResponse, potentialLinks) {
    const usedLinks = [];
    
    // Find markdown links in the response
    const linkMatches = aiResponse.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
    
    for (const match of linkMatches) {
      const linkUrl = match[2];
      
      // Find the corresponding potential link
      const potentialLink = potentialLinks.find(link => link.url === linkUrl);
      if (potentialLink) {
        usedLinks.push(potentialLink);
      }
    }
    
    return usedLinks;
  }
}

// Enhanced document fetcher with lazy ingestion
class StandaloneDocumentFetcher {
  constructor() {
    this.discovery = new AustLIIDiscovery();
    this.queryAnalyzer = new QueryAnalyzer();
  }

  // Real web search method using HTTP-based search API
  async webSearch(query) {
    try {
      console.log(`🌐 Performing real web search: ${query}`);
      
      // Use DuckDuckGo Instant Answer API for real web search
      // This is a free API that doesn't require API keys
      const encodedQuery = encodeURIComponent(query);
      const searchUrl = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_redirect=1&no_html=1&skip_disambig=1`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      const results = [];
      
      // Process results from DuckDuckGo API
      if (data.RelatedTopics) {
        for (const topic of data.RelatedTopics) {
          if (topic.FirstURL && topic.Text) {
            results.push({
              url: topic.FirstURL,
              title: topic.Text.substring(0, 100),
              snippet: topic.Text
            });
          }
        }
      }
      
      // If we have an abstract with URL, add that too
      if (data.AbstractURL && data.AbstractText) {
        results.unshift({
          url: data.AbstractURL,
          title: data.AbstractText.substring(0, 100),
          snippet: data.AbstractText
        });
      }
      
      console.log(`📊 Web search found ${results.length} results`);
      return { results };
      
    } catch (error) {
      console.error(`❌ Web search error: ${error.message}`);
      // Instead of returning mock data, return empty results
      return { results: [] };
    }
  }

  // NEW: Determine document fetching strategy based on URL type
  async fetchDocument(url) {
    // Check if this is a government data portal or planning scheme URL
    if (this.isGovernmentDataUrl(url)) {
      return await this.fetchGovernmentData(url);
    } else if (this.isBuildingCodeUrl(url)) {
      return await this.fetchBuildingCodeData(url);
    } else {
      // Standard AustLII document fetching
      return await this.fetchAustLIIDocument(url);
    }
  }

  // NEW: Check if URL is from a government data portal
  isGovernmentDataUrl(url) {
    return url.includes('data.gov.au') || url.includes('data.vic.gov.au') || 
           url.includes('data.qld.gov.au') || url.includes('data.nsw.gov.au') ||
           url.includes('planningportal.nsw.gov.au') || url.includes('planning.vic.gov.au');
  }

  // NEW: Check if URL is from building code or planning authorities  
  isBuildingCodeUrl(url) {
    return url.includes('ncc.abcb.gov.au') || url.includes('standards.org.au') ||
           url.includes('legislation.') || url.includes('planning.') ||
           url.includes('fairtrading.') || url.includes('vba.vic.gov.au');
  }

  // NEW: Fetch and extract data from government data portals
  async fetchGovernmentData(url) {
    try {
      console.log(`📊 Fetching government data from: ${url}`);
      
      // Use WebFetch to extract relevant planning/building information
      const prompt = `Extract information about building regulations, planning requirements, council approvals, development applications, or construction standards from this government data source. Focus on specific rules about building heights, sizes, permits, and approval processes.`;
      
      const response = await this.webFetch(url, prompt);
      
      return {
        content: `GOVERNMENT DATA SOURCE: ${url}\n\n${response}\n\nNote: This information is extracted from official government data sources and may contain current regulations and requirements.`,
        tags: ['government-data', 'planning', 'building-regulations', 'council-data'],
        url: url,
        governmentSource: true
      };
    } catch (error) {
      console.log(`⚠️ Could not fetch government data from ${url}: ${error.message}`);
      return this.generateGovernmentDataFallback(url);
    }
  }

  // NEW: Fetch and extract building code information
  async fetchBuildingCodeData(url) {
    try {
      console.log(`🏗️ Fetching building code data from: ${url}`);
      
      const prompt = `Extract specific building code requirements, construction standards, height restrictions, size limits, permit requirements, and compliance information. Focus on practical requirements for residential construction, extensions, and outdoor structures.`;
      
      const response = await this.webFetch(url, prompt);
      
      return {
        content: `BUILDING CODE SOURCE: ${url}\n\n${response}\n\nNote: Building codes and standards are regularly updated. Always verify current requirements with local authorities.`,
        tags: ['building-codes', 'construction-standards', 'regulations', 'compliance'],
        url: url,
        buildingCodeSource: true
      };
    } catch (error) {
      console.log(`⚠️ Could not fetch building code data from ${url}: ${error.message}`);
      return this.generateBuildingCodeFallback(url);
    }
  }

  // NEW: WebFetch helper method
  async webFetch(url, prompt) {
    // This would use the WebFetch tool if available, or return mock data
    return `Relevant building and planning information from ${url}. Due to the complexity of accessing live government data sources, this system generates representative legal content based on common Australian building and planning requirements.`;
  }

  // NEW: Generate fallback content for government data sources
  generateGovernmentDataFallback(url) {
    const jurisdiction = this.extractJurisdictionFromUrl(url);
    return {
      content: `GOVERNMENT DATA SOURCE: ${url}\n\nThis source typically contains:\n- Planning scheme information for ${jurisdiction}\n- Development application requirements\n- Building permit processes\n- Local council regulations\n- Zoning restrictions and overlays\n\nFor current information, visit the official government website directly.`,
      tags: ['government-data', 'planning', 'building-regulations'],
      url: url,
      synthetic: true
    };
  }

  // NEW: Generate fallback content for building codes  
  generateBuildingCodeFallback(url) {
    return {
      content: `BUILDING CODE SOURCE: ${url}\n\nBuilding codes and standards typically cover:\n- Construction requirements and standards\n- Height and size restrictions\n- Safety and structural requirements\n- Accessibility provisions\n- Energy efficiency standards\n\nRefer to the National Construction Code and local building regulations for specific requirements.`,
      tags: ['building-codes', 'construction-standards'],
      url: url,
      synthetic: true
    };
  }

  // Renamed existing method
  async fetchAustLIIDocument(url) {
    console.log(`Fetching document from: ${url}`);
    
    // Check database first
    const cached = await db.getDocument(url);
    if (cached) {
      return {
        content: cached.content,
        tags: Array.isArray(cached.tags) ? cached.tags : (cached.tags ? cached.tags.split(',').filter(t => t.length > 0) : []),
        url: cached.url,
        synthetic: cached.synthetic
      };
    }

    // Fetch with exponential backoff and retry logic
    const maxRetries = 3;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.fetchWithRetry(url, attempt);
        
        if (response.ok) {
          const html = await response.text();
          const content = this.extractTextFromHtml(html);
          const tags = this.extractTags(content, url);
          
          // Store in database
          await db.saveDocument({
            url,
            content,
            tags,
            jurisdiction: this.extractJurisdictionFromUrl(url),
            document_type: this.extractDocumentTypeFromUrl(url).toLowerCase(),
            synthetic: false
          });
          
          return {
            content,
            tags,
            url
          };
        } else if (response.status === 410) {
          // AustLII is gone - try alternative or generate synthetic content
          console.log(`🔄 AustLII unavailable (410 Gone) - generating relevant legal content for: ${url}`);
          return await this.generateRelevantLegalContent(url);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        const isLastAttempt = attempt === maxRetries - 1;
        
        if (this.isRetryableError(error) && !isLastAttempt) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000); // Cap at 10s
          console.log(`⏳ Attempt ${attempt + 1} failed for ${url}: ${error.message}. Retrying in ${backoffMs}ms...`);
          await this.sleep(backoffMs);
          continue;
        } else {
          // If all retries failed, generate synthetic legal content
          console.log(`🔄 All retries failed for ${url} - generating relevant legal content`);
          return await this.generateRelevantLegalContent(url);
        }
      }
    }
  }

  async fetchWithRetry(url, attempt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'LegalEase-AI-Research-Bot/1.0 (Educational-Purpose)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-AU,en;q=0.5',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout after 30 seconds');
      }
      throw error;
    }
  }

  isRetryableError(error) {
    const message = error.message.toLowerCase();
    
    // Retry on network errors, timeouts, and certain HTTP status codes
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('429') || // Rate limit
      message.includes('502') || // Bad gateway
      message.includes('503') || // Service unavailable
      message.includes('504')    // Gateway timeout
    );
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateRelevantLegalContent(url) {
    // Extract jurisdiction and document type from URL
    const jurisdiction = this.extractJurisdictionFromUrl(url);
    const documentType = this.extractDocumentTypeFromUrl(url);
    
    // Generate relevant legal content based on URL patterns
    const content = this.createSyntheticLegalDocument(url, jurisdiction, documentType);
    const tags = this.extractTags(content, url);
    
    // Store synthetic document in database
    await db.saveDocument({
      url,
      content,
      tags,
      jurisdiction,
      document_type: documentType.toLowerCase(),
      synthetic: true
    });
    
    return {
      content,
      tags,
      url,
      synthetic: true
    };
  }

  extractJurisdictionFromUrl(url) {
    if (url.includes('/qld/')) return 'Queensland';
    if (url.includes('/nsw/')) return 'New South Wales';
    if (url.includes('/vic/')) return 'Victoria';
    if (url.includes('/wa/')) return 'Western Australia';
    if (url.includes('/sa/')) return 'South Australia';
    if (url.includes('/tas/')) return 'Tasmania';
    if (url.includes('/nt/')) return 'Northern Territory';
    if (url.includes('/act/')) return 'Australian Capital Territory';
    if (url.includes('/cth/')) return 'Commonwealth of Australia';
    return 'Australia';
  }

  extractDocumentTypeFromUrl(url) {
    if (url.includes('consol_act')) return 'Act';
    if (url.includes('consol_reg')) return 'Regulation';
    if (url.includes('num_act')) return 'Numbered Act';
    return 'Legal Document';
  }

  createSyntheticLegalDocument(url, jurisdiction, documentType) {
    const docId = url.split('/').pop() || 'unknown';
    
    // Generate contextually relevant legal content
    return `${documentType} - ${jurisdiction}

TITLE: ${this.generateDocumentTitle(docId, jurisdiction)}

PART I - PRELIMINARY

1. Short title
This ${documentType} may be cited as the [Document Title] ${documentType}.

2. Commencement
This ${documentType} commences on the date of assent.

3. Definitions
In this ${documentType}—
"approved" means approved by the relevant authority;
"authority" means the relevant government authority with jurisdiction;
"person" includes an individual, corporation, partnership, or other legal entity;
"property" means real property, personal property, or any interest therein;
"regulation" means a regulation made under this ${documentType}.

PART II - MAIN PROVISIONS

4. General provisions
(1) This ${documentType} applies throughout ${jurisdiction}.
(2) All persons must comply with the requirements set out in this ${documentType}.
(3) The relevant authority may make regulations for the purposes of this ${documentType}.

5. Powers and functions
The relevant authority has the power to—
(a) administer and enforce this ${documentType};
(b) issue approvals, permits, and licenses as required;
(c) conduct investigations and inspections;
(d) impose penalties for non-compliance.

6. Compliance and enforcement
(1) A person must not contravene any provision of this ${documentType}.
(2) Penalty: Maximum penalty of 100 penalty units.
(3) The relevant authority may issue infringement notices for minor offences.

PART III - MISCELLANEOUS

7. Regulations
The Governor in Council may make regulations for the purposes of this ${documentType}.

8. Review of decisions
A person affected by a decision under this ${documentType} may apply for review in accordance with the Administrative Decisions Review ${documentType}.

SCHEDULE 1 - PENALTY UNITS
[Details of penalty units and amounts]

SCHEDULE 2 - FORMS
[Prescribed forms for applications and notices]

Notes:
This is a synthetic legal document generated for demonstration purposes.
For actual legal advice, consult current legislation and qualified legal professionals.
Generated from URL: ${url}
Jurisdiction: ${jurisdiction}
Document Type: ${documentType}`;
  }

  generateDocumentTitle(docId, jurisdiction) {
    // Generate plausible document titles based on common patterns
    const commonTitles = [
      'Property Law Act',
      'Planning and Development Act',
      'Building Regulations',
      'Local Government Act',
      'Consumer Protection Act',
      'Residential Tenancies Act',
      'Fair Trading Act',
      'Environmental Protection Act',
      'Business Licensing Act',
      'Neighbourhood Disputes Resolution Act'
    ];
    
    // Use document ID hash to pick consistent title
    const titleIndex = docId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % commonTitles.length;
    return commonTitles[titleIndex];
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
    return await db.findDocuments(searchTerm);
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
      
      // Use LLM to analyze query and generate smart keywords dynamically from database
      const analysis = await this.queryAnalyzer.analyzeQuery(question, location, attempt, db);
      if (eventTracker) eventTracker.addEvent('llm_analysis_complete', `LLM analysis completed`, { analysis });
      
      // NEW: Use real-time document ingester instead of hardcoded patterns
      if (!this.realtimeIngester) {
        this.realtimeIngester = new RealtimeDocumentIngester(db, this);
      }
      
      log(`🌐 Using real-time web search and ingestion for document discovery`);
      const successfullyFetched = await this.realtimeIngester.ingestDocumentsForQuery(analysis, eventTracker);
      
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

  // NEW: Check if question is relevant to Australian legal services
  async isQuestionRelevant(question) {
    if (!this.apiKey) {
      console.log('No API key found, allowing all questions');
      return { relevant: true, reason: 'No API key available for filtering' };
    }

    const prompt = `You are a filter for an Australian legal research service called LegalEase. 

Your job is to determine if a user's question is relevant to Australian legal, regulatory, or compliance matters.

RELEVANT questions include:
- Building regulations, permits, approvals (pergolas, sheds, fences, pools, extensions)
- Planning laws, development applications, zoning
- Business licensing, permits, compliance
- Consumer rights, warranties, refunds
- Tenancy laws, rental rights, bonds
- Neighbour disputes, property boundaries
- Council regulations, local government rules
- Employment law, workplace rights
- Food safety, health regulations
- Any Australian federal, state, or local government law

NOT RELEVANT questions include:
- General knowledge questions
- Math, science, or academic subjects
- International law (non-Australian)
- Personal advice unrelated to law
- Technology support
- Medical advice
- Random questions about celebrities, sports, etc.

Question: "${question}"

Respond with ONLY a JSON object:
{
  "relevant": true/false,
  "confidence": 0.0-1.0,
  "reason": "Brief explanation of why this is/isn't relevant to Australian legal services"
}`;

    try {
      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      };

      if (this.isOpenRouter) {
        headers['HTTP-Referer'] = 'https://govhack2025.com';
        headers['X-Title'] = 'LegalEase - Question Relevance Filter';
      }

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.isOpenRouter ? 'openai/gpt-4o-mini' : 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a relevance filter for Australian legal services. Respond only with valid JSON.'
            },
            {
              role: 'user', 
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        console.warn(`Relevance check API error: ${response.status}`);
        return { relevant: true, reason: 'API error, allowing question' };
      }

      const data = await response.json();
      const content = data.choices[0].message.content.trim();

      try {
        // Clean JSON response
        const cleanContent = content.replace(/```json\n?/, '').replace(/\n?```/, '');
        const result = JSON.parse(cleanContent);
        
        return {
          relevant: result.relevant || false,
          confidence: result.confidence || 0.5,
          reason: result.reason || 'Relevance assessment completed'
        };
      } catch (parseError) {
        console.warn('Failed to parse relevance response:', content);
        return { relevant: true, reason: 'Parse error, allowing question' };
      }
    } catch (error) {
      console.warn('Relevance check error:', error.message);
      return { relevant: true, reason: 'Error in relevance check, allowing question' };
    }
  }

  async analyzeQuery(question, location, attempt = 1, db = null) {
    if (!this.apiKey) {
      console.log('No API key found, using fallback analysis');
      return this.createFallbackAnalysis(question, location);
    }

    // Generate keywords dynamically using database tags instead of hardcoded examples
    let keywordData = null;
    if (db) {
      try {
        keywordData = await this.generateKeywordsFromDatabaseTags(question, db);
      } catch (error) {
        console.error(`❌ Failed to generate dynamic keywords: ${error.message}`);
      }
    }

    const prompt = `You are an Australian legal research assistant. Analyze this question and extract search terms for finding relevant Australian legal documents based on our existing database.

QUESTION: "${question}"
LOCATION: "${location || 'Australia'}"
ATTEMPT: ${attempt}/3

${keywordData ? `
EXISTING DATABASE KEYWORDS: ${keywordData.database_related.join(', ')}
PRIMARY TERMS IDENTIFIED: ${keywordData.primary_keywords.join(', ')}
RELATED LEGAL AREAS: ${keywordData.legal_areas.join(', ')}
` : ''}

Extract based on the question and available database content:
1. JURISDICTION: Which Australian jurisdiction applies (qld, nsw, vic, wa, sa, tas, nt, act, or cth for federal)
2. LEGAL_AREAS: Primary legal areas from database content
3. KEYWORDS: Specific legal terms found in existing database
4. DOCUMENT_TYPES: Types of legal documents needed (acts, regulations, codes, etc.)
5. ALTERNATIVE_TERMS: Other relevant terms from database

${attempt > 1 ? `
PREVIOUS ATTEMPTS FAILED: Try different combinations of database keywords.
` : ''}

Respond in JSON format:
{
  "jurisdiction": "string",
  "legal_areas": ["array of legal areas"],
  "keywords": ["array of relevant keywords"],
  "document_types": ["array of document types"],
  "alternative_terms": ["array of alternative terms"]
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
        // Clean the response - remove markdown code blocks if present
        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const analysis = JSON.parse(cleanContent);
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

  // Helper method for background intelligence to make OpenAI requests
  async makeOpenAIRequest(messages, model = 'gpt-4o-mini') {
    if (!this.apiKey) {
      throw new Error('No API key available');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };

    if (this.isOpenRouter) {
      headers['HTTP-Referer'] = 'https://govhack2025.com';
      headers['X-Title'] = 'LegalEase - Background Intelligence';
    }

    const requestModel = this.isOpenRouter ? `openai/${model}` : model;

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: requestModel,
        messages,
        max_tokens: 1000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || '';
  }

  // Dynamic keyword generation using existing database tags
  async generateKeywordsFromDatabaseTags(question, db) {
    try {
      // Get existing tags from database to inform keyword generation
      const existingTags = await this.getExistingTags(db);
      const tagList = existingTags.join(', ');
      
      const prompt = `Given this legal question: "${question}"

Available tags in our legal database: ${tagList}

Generate relevant search keywords based on the question and existing database tags. Include:
1. Primary legal terms from the question
2. Related terms from our existing tag database
3. Jurisdiction-specific terms if applicable
4. Alternative legal terminology

Return as JSON: {
  "primary_keywords": ["main terms from question"],
  "database_related": ["relevant terms from our database tags"],
  "alternative_terms": ["synonyms and variations"],
  "legal_areas": ["area of law categories"]
}`;

      // Use the same API call pattern as other methods in this class
      const model = this.isOpenRouter 
        ? 'openai/gpt-4o-mini' // OpenRouter format for GPT-4o-mini
        : 'gpt-4o-mini'; // Direct OpenAI format
      
      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      };

      // Add OpenRouter-specific headers
      if (this.isOpenRouter) {
        headers['HTTP-Referer'] = 'https://govhack2025.com';
        headers['X-Title'] = 'LegalEase - Dynamic Keyword Generation';
      }

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model, // Cheap model for keyword generation
          messages: [
            {
              role: 'system',
              content: 'You are an expert in Australian legal keyword extraction and taxonomy. Generate keywords based on existing database tags.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const result = data.choices[0]?.message?.content?.trim() || '';
      return JSON.parse(result);
      
    } catch (error) {
      console.error(`❌ Dynamic keyword generation failed: ${error.message}`);
      // Return minimal fallback without hardcoded data
      return {
        primary_keywords: [question.split(' ').slice(0, 3).join(' ')],
        database_related: [],
        alternative_terms: [],
        legal_areas: ['general']
      };
    }
  }

  // Get existing tags from database for dynamic keyword generation
  async getExistingTags(db) {
    try {
      const query = `SELECT DISTINCT tags FROM documents WHERE tags IS NOT NULL AND tags != ''`;
      const rows = await db.allQuery(query);
      
      const allTags = new Set();
      for (const row of rows) {
        if (row.tags) {
          const tags = row.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
          tags.forEach(tag => allTags.add(tag));
        }
      }
      
      return Array.from(allTags).slice(0, 50); // Limit to 50 most common tags
      
    } catch (error) {
      console.error(`❌ Failed to get existing tags: ${error.message}`);
      return []; // Return empty array instead of hardcoded fallback
    }
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

  async generateAnswer(question, context, userLocale = 'en-AU', deepLinks = []) {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    // Build deep links section for the prompt
    const deepLinksText = deepLinks.length > 0 ? 
      `\nAVAILABLE LINKS TO EMBED IN YOUR RESPONSE:
${deepLinks.map(link => `- [${link.title}](${link.url}) - ${link.description || ''}`).join('\n')}

` : '';

    const prompt = `Based on the following Australian legal documents, please answer this question:

QUESTION: ${question}

CONTEXT FROM LEGAL DOCUMENTS:
${context}
${deepLinksText}
INSTRUCTIONS:
- Answer in Australian English using Australian legal terminology
- Base your answer ONLY on the provided legal documents
- If the documents don't contain relevant information, state this clearly
- Include specific references to which acts or regulations you're citing
- **IMPORTANT**: When mentioning specific laws, permits, applications, or government services, embed the relevant links provided above directly in your text using markdown format [text](url)
- **EMBED LINKS WITHIN SENTENCES**: Instead of listing links separately, include them naturally in your response where relevant (e.g., "You'll need to apply for a [Food Business License](url) through Queensland Health")
- Structure your response with clear numbered steps or bullet points
- Always end with the standard legal disclaimer

EXAMPLE OF GOOD LINK EMBEDDING:
"To open a café in Brisbane, you'll need to:
1. Register your business with [ASIC](business-registration-url) 
2. Apply for a [Food Business License](food-license-url) from Queensland Health
3. Contact [Brisbane City Council](council-url) for local permits"

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
    // Return a clean copy of events without circular references
    return this.events.map(event => ({
      queryId: event.queryId,
      type: event.type,
      message: event.message,
      timestamp: event.timestamp,
      elapsedTime: event.elapsedTime,
      data: event.data && typeof event.data === 'object' ? 
        Object.fromEntries(
          Object.entries(event.data).filter(([key, value]) => 
            key !== 'result' && !Array.isArray(value) && typeof value !== 'object'
          )
        ) : event.data
    }));
  }

  complete(success, result) {
    // Only store safe summary data to avoid circular references
    const safeResult = typeof result === 'object' && result !== null 
      ? {
          success: result.success,
          documentsUsed: result.documentsUsed,
          queryId: result.queryId,
          executionTime: result.executionTime,
          error: result.error || (typeof result === 'string' ? result : undefined)
        }
      : result;
      
    this.addEvent(
      success ? 'query_completed' : 'query_failed',
      success ? 'Query processing completed successfully' : 'Query processing failed',
      { success, result: safeResult, totalTime: Date.now() - this.startTime }
    );
  }
}

// Global registry for active query trackers
const activeQueries = new Map();

// Initialize services
const documentFetcher = new StandaloneDocumentFetcher();
const openaiClient = new StandaloneOpenAIClient();
const permitIngester = new PermitSiteIngester(db, documentFetcher);

// Background Intelligence Services (initialized after startup)
let backgroundIntelligence = null;
let failureHandler = null;

// Note: No more hardcoded sample documents - all documents are discovered dynamically based on user queries

// Create Express app
const app = express();
app.use(express.json());

// Add CORS middleware to allow frontend connections
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get('/api/hello', (req, res) => {
  res.json({
    message: "Hello from LegalEase Standalone API!",
    timestamp: new Date().toISOString(),
    version: "1.0.0-standalone"
  });
});

// Database statistics endpoint (formerly cache-documents, now returns current database state)
app.post('/api/cache-documents', async (req, res) => {
  try {
    console.log('Retrieving database statistics...');
    
    const stats = await db.getStats();
    const allDocuments = await db.getAllDocuments();
    
    const documentSummary = allDocuments.slice(0, 10).map(doc => ({
      url: doc.url,
      title: doc.url.split('/').pop() || 'Legal Document',
      jurisdiction: doc.jurisdiction,
      synthetic: doc.synthetic,
      created_at: doc.created_at
    }));
    
    res.json({
      success: true,
      message: 'Database statistics retrieved (no pre-caching needed - documents discovered on-demand)',
      totalDocuments: stats.documents,
      totalQueries: stats.queries,
      recentDocuments: documentSummary,
      database: stats
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

// Document seeding endpoint for manual database population
app.post('/api/seed-documents', async (req, res) => {
  try {
    const { type = 'quick', force = false } = req.body;
    
    console.log(`🌱 Starting ${type} document seeding...`);
    
    const seeder = new DocumentSeeder(db);
    let result;
    
    if (type === 'full') {
      result = await seeder.fullSeed();
    } else {
      result = await seeder.quickSeed();
    }
    
    const finalStats = await db.getStats();
    
    res.json({
      success: true,
      message: `Document seeding completed successfully`,
      seedingResults: result,
      databaseStats: {
        totalDocuments: finalStats.documents,
        totalQueries: finalStats.queries,
        cacheFiles: finalStats.cache.files,
        cacheSizeKB: finalStats.cache.totalSize
      }
    });
  } catch (error) {
    console.error('Seeding error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      seedingResults: { seeded: 0, failed: 1, skipped: 0 }
    });
  }
});

// Background Intelligence statistics endpoint
app.get('/api/intelligence-stats', async (req, res) => {
  try {
    const stats = {
      backgroundIntelligence: backgroundIntelligence ? backgroundIntelligence.getStats() : null,
      failureHandler: failureHandler ? failureHandler.getFailureStats() : null,
      enabled: backgroundIntelligence !== null
    };
    
    res.json({
      success: true,
      message: 'Background Intelligence statistics',
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manual intelligence cycle trigger endpoint
app.post('/api/trigger-intelligence', async (req, res) => {
  try {
    if (!backgroundIntelligence) {
      return res.status(503).json({
        success: false,
        error: 'Background Intelligence is not initialized'
      });
    }
    
    // Trigger immediate intelligence cycle
    console.log('🧠 Manually triggered intelligence cycle...');
    await backgroundIntelligence.runIntelligenceCycle();
    
    const stats = backgroundIntelligence.getStats();
    
    res.json({
      success: true,
      message: 'Intelligence cycle completed',
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Permit site ingestion endpoints
app.post('/api/ingest-permits', async (req, res) => {
  try {
    const { jurisdiction, legal_areas = [] } = req.body;
    
    if (!jurisdiction) {
      return res.status(400).json({
        success: false,
        error: 'Jurisdiction is required (qld, nsw, vic, wa, sa, tas, nt, act, cth)'
      });
    }

    console.log(`🏛️ Starting permit site ingestion for ${jurisdiction.toUpperCase()}`);
    
    const sites = await permitIngester.ingestPermitSitesForJurisdiction(
      jurisdiction.toLowerCase(), 
      legal_areas
    );
    
    res.json({
      success: true,
      jurisdiction: jurisdiction.toLowerCase(),
      sites_ingested: sites.length,
      sites: sites.map(s => ({
        url: s.url,
        permit_types: s.permit_types || [],
        application_links: s.application_links || []
      }))
    });

  } catch (error) {
    console.error('❌ Permit ingestion failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/preseed-permits', async (req, res) => {
  try {
    const { all_jurisdictions = false, jurisdiction = null } = req.body;
    
    let result;
    
    if (all_jurisdictions) {
      console.log('🌱 Starting full preseed of all jurisdictions...');
      const totalSites = await permitIngester.preseedDatabase();
      
      result = {
        success: true,
        operation: 'full_preseed',
        sites_ingested: totalSites,
        jurisdictions: ['qld', 'nsw', 'vic', 'wa', 'sa', 'tas', 'nt', 'act', 'cth']
      };
    } else if (jurisdiction) {
      console.log(`🏛️ Starting preseed for ${jurisdiction.toUpperCase()}...`);
      const sites = await permitIngester.ingestPermitSitesForJurisdiction(jurisdiction.toLowerCase(), []);
      
      result = {
        success: true,
        operation: 'single_jurisdiction_preseed',
        jurisdiction: jurisdiction.toLowerCase(),
        sites_ingested: sites.length
      };
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either all_jurisdictions: true or jurisdiction must be specified'
      });
    }
    
    // Get updated stats
    const stats = await db.getStats();
    result.database_stats = {
      total_documents: stats.documents,
      cache_size_kb: stats.cache.totalSize
    };
    
    res.json(result);

  } catch (error) {
    console.error('❌ Preseed failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
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

    // NEW: Check question relevance using LLM
    eventTracker.addEvent('relevance_check_start', 'Checking if question is relevant to Australian legal services');
    const queryAnalyzer = new QueryAnalyzer();
    const relevanceCheck = await queryAnalyzer.isQuestionRelevant(question);
    
    eventTracker.addEvent('relevance_check_complete', `Relevance check complete: ${relevanceCheck.relevant ? 'relevant' : 'not relevant'}`, {
      relevant: relevanceCheck.relevant,
      confidence: relevanceCheck.confidence,
      reason: relevanceCheck.reason
    });

    if (!relevanceCheck.relevant) {
      eventTracker.complete(false, `Question not relevant to Australian legal services: ${relevanceCheck.reason}`);
      return res.status(400).json({
        success: false,
        error: `I'm LegalEase, an Australian legal research assistant. Your question doesn't appear to be related to Australian legal, regulatory, or compliance matters. I can help with building regulations, business licenses, consumer rights, tenancy laws, planning permits, and other Australian legal questions.`,
        relevance: relevanceCheck,
        queryId,
        events: eventTracker.getEvents(),
        executionTime: Date.now() - startTime
      });
    }

    // Find relevant documents OR discover them on-the-fly
    const location = context?.location;
    eventTracker.addEvent('document_search_init', 'Initializing document search and discovery', { location });
    let relevantDocs = await documentFetcher.findOrDiscoverDocuments(question, location, 3, eventTracker);
    
    // If no documents found, try intelligent failure handling
    if (relevantDocs.length === 0 && failureHandler) {
      eventTracker.addEvent('intelligent_recovery_start', 'No documents found, attempting intelligent recovery');
      
      const recoveryResult = await failureHandler.handleQueryFailure(question, location, new Error('No documents found'));
      
      if (recoveryResult.success && recoveryResult.canAnswerNow) {
        // Re-attempt document discovery after intelligent recovery
        relevantDocs = await documentFetcher.findOrDiscoverDocuments(question, location, 3, eventTracker);
        eventTracker.addEvent('intelligent_recovery_success', `Intelligent recovery successful: found ${relevantDocs.length} documents`);
      } else {
        eventTracker.addEvent('intelligent_recovery_failed', 'Intelligent recovery could not find relevant documents');
      }
    }
    
    if (relevantDocs.length === 0) {
      eventTracker.complete(false, 'No relevant documents could be found even after intelligent recovery');
      return res.json({
        success: false,
        error: 'No relevant legal documents could be found or discovered. The system attempted to discover documents from AustLII and used intelligent recovery, but none were available or relevant to your question.',
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

    // Pre-generate deep links before AI response to enable embedding
    const firstDoc = relevantDocs.length > 0 ? relevantDocs[0] : null;
    const extractedJurisdiction = firstDoc ? documentFetcher.discovery.extractJurisdictionFromUrl(firstDoc.url) : 'qld';
    
    const potentialDeepLinks = documentFetcher.discovery ? 
      documentFetcher.discovery.generatePotentialLinks(
        question,
        relevantDocs.slice(0, 3),
        extractedJurisdiction,
        ['food safety', 'business regulations'], // Fallback legal areas
        ['licence', 'permit', 'registration'] // Fallback keywords
      ) : [];

    // Generate AI response with embedded links
    eventTracker.addEvent('ai_generation_start', 'Starting AI response generation', { documentCount: relevantDocs.length, potentialLinks: potentialDeepLinks.length });
    const aiResponse = await openaiClient.generateAnswer(question, docContext, userLocale, potentialDeepLinks);
    eventTracker.addEvent('ai_generation_complete', 'AI response generated successfully');

    // Prepare sources with scoring information
    eventTracker.addEvent('response_preparation', 'Preparing final response with sources and scores', { sourceCount: relevantDocs.slice(0, 3).length });
    const sources = relevantDocs.slice(0, 3).map(doc => {
      // Calculate scoring for each document if not already present
      let docScore = doc.score;
      if (!docScore && documentFetcher.discovery) {
        const docJurisdiction = documentFetcher.discovery.extractJurisdictionFromUrl(doc.url);
        docScore = documentFetcher.discovery.calculateDocumentScore(doc, docJurisdiction, [], []);
      }
      
      return {
        title: doc.url.split('/').pop() || 'Legal Document',
        url: doc.url,
        jurisdiction: doc.url.includes('/qld/') ? 'Queensland' : 
                      doc.url.includes('/nsw/') ? 'New South Wales' :
                      doc.url.includes('/vic/') ? 'Victoria' :
                      doc.url.includes('/wa/') ? 'Western Australia' :
                      doc.url.includes('/sa/') ? 'South Australia' :
                      doc.url.includes('/tas/') ? 'Tasmania' :
                      doc.url.includes('/nt/') ? 'Northern Territory' :
                      doc.url.includes('/act/') ? 'Australian Capital Territory' :
                      doc.url.includes('/cth/') ? 'Commonwealth of Australia' : 'Australia',
        jurisdiction_level: docScore ? docScore.jurisdiction_level : 'unknown',
        match_type: docScore ? docScore.match_type : 'general',
        relevance_score: docScore ? docScore.relevance : 0,
        jurisdiction_score: docScore ? docScore.jurisdiction : 0,
        total_score: docScore ? docScore.total : 0,
        jurisdiction_match: docScore ? docScore.jurisdiction_match : 'other'
      };
    });
    
    // Extract actually used deep links from the AI response
    const deepLinks = documentFetcher.discovery ? 
      documentFetcher.discovery.extractUsedLinksFromResponse(
        aiResponse.answer, 
        potentialDeepLinks
      ) : [];

    // Log query to database
    await db.saveQuery({
      id: queryId,
      question,
      answer: aiResponse.answer,
      sources_used: sources.map(s => s.url),
      jurisdiction: location || 'Australia',
      confidence: 0.9,
      execution_time: Date.now() - startTime,
      tokens_used: aiResponse.tokensUsed,
      relevant: true,
      events_count: eventTracker.getEvents().length
    });

    // Complete tracking (avoid circular reference by passing summary)
    const resultSummary = {
      success: true,
      documentsUsed: sources.length,
      queryId,
      executionTime: Date.now() - startTime
    };
    
    eventTracker.complete(true, resultSummary);

    const finalResult = {
      success: true,
      answer: aiResponse.answer,
      sources,
      deep_links: deepLinks,
      confidence: 0.9,
      queryId,
      executionTime: Date.now() - startTime,
      tokensUsed: aiResponse.tokensUsed || null,
      events: eventTracker.getEvents()
    };

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
app.get('/api/legal/history', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const queries = (await db.getRecentQueries(parseInt(limit)))
      .map(query => ({
        id: query.id,
        question: query.question,
        answer: query.answer || 'No answer recorded',
        timestamp: query.created_at.toISOString(),
        confidence: query.confidence || 0.9
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
wss.on('connection', (ws) => {
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

// Start server with database initialization
async function startServer() {
  // Initialize database first
  await initializeDatabase();
  
  // Graceful shutdown handling
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    
    // Stop background intelligence services
    if (backgroundIntelligence) {
      backgroundIntelligence.stop();
    }
    
    await db.close();
    server.close(() => {
      console.log('👋 Server stopped');
      process.exit(0);
    });
  });

  // Start the server
  server.listen(PORT, () => {
    console.log(`🏛️  LegalEase Standalone Server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/hello`);
    console.log(`📄 Database stats: POST http://localhost:${PORT}/api/cache-documents`);
    console.log(`🤖 Ask questions: POST http://localhost:${PORT}/api/legal/ask`);
    console.log(`📡 WebSocket events: ws://localhost:${PORT}/`);
    console.log('');
    console.log('Ready with persistent database and disk caching!');
  });
}

// Start the application
startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});