#!/usr/bin/env node

// Permit Site Ingester - Discovers and ingests regulatory websites that handle permits and licenses

import { WebFetch } from './web-fetch-service.js';

export class PermitSiteIngester {
  constructor(database, documentFetcher) {
    this.db = database;
    this.documentFetcher = documentFetcher;
    this.webFetch = new WebFetch();
    this.ingestedSites = new Set();
  }

  // Main method to discover and ingest permit sites for a jurisdiction
  async ingestPermitSitesForJurisdiction(jurisdiction, legalAreas = [], eventTracker = null) {
    this.log(eventTracker, `🏛️ Discovering permit sites for ${jurisdiction.toUpperCase()}`);
    
    try {
      // Get predefined sites for this jurisdiction
      const predefinedSites = await this.getPredefinedSites(jurisdiction);
      
      // Discover additional sites through web search
      const discoveredSites = await this.discoverPermitSites(jurisdiction, legalAreas);
      
      // Combine and deduplicate
      const allSites = [...new Set([...predefinedSites, ...discoveredSites])];
      
      this.log(eventTracker, `📋 Found ${allSites.length} potential permit sites`);
      
      // Ingest each site
      const ingestedSites = [];
      for (const siteUrl of allSites.slice(0, 10)) { // Limit to 10 sites per run
        try {
          if (this.ingestedSites.has(siteUrl)) {
            continue; // Skip already processed sites
          }
          
          const siteData = await this.ingestPermitSite(siteUrl, jurisdiction, eventTracker);
          if (siteData) {
            ingestedSites.push(siteData);
            this.ingestedSites.add(siteUrl);
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          this.log(eventTracker, `❌ Failed to ingest site ${siteUrl}: ${error.message}`);
        }
      }
      
      this.log(eventTracker, `✅ Successfully ingested ${ingestedSites.length} permit sites`);
      return ingestedSites;
      
    } catch (error) {
      this.log(eventTracker, `❌ Permit site ingestion failed: ${error.message}`);
      return [];
    }
  }

  // Get predefined regulatory sites for each jurisdiction
  async getPredefinedSites(jurisdiction) {
    const predefinedSites = {
      'qld': [
        'https://www.business.qld.gov.au/',
        'https://www.qld.gov.au/',
        'https://www.health.qld.gov.au/',
        'https://www.brisbane.qld.gov.au/',
        'https://www.goldcoast.qld.gov.au/',
        'https://www.cairns.qld.gov.au/',
        'https://www.tmr.qld.gov.au/', // Transport permits
        'https://www.daf.qld.gov.au/' // Agriculture and fisheries
      ],
      'nsw': [
        'https://www.nsw.gov.au/',
        'https://www.service.nsw.gov.au/',
        'https://www.health.nsw.gov.au/',
        'https://www.liquorandgaming.nsw.gov.au/',
        'https://www.sydney.nsw.gov.au/',
        'https://www.planning.nsw.gov.au/',
        'https://www.safework.nsw.gov.au/',
        'https://www.dpi.nsw.gov.au/' // Primary industries
      ],
      'vic': [
        'https://www.health.vic.gov.au/',
        'https://www.business.vic.gov.au/',
        'https://www.melbourne.vic.gov.au/',
        'https://www.planning.vic.gov.au/',
        'https://www.worksafe.vic.gov.au/',
        'https://www.vcglr.vic.gov.au/', // Liquor licensing
        'https://www.epa.vic.gov.au/', // Environmental permits
        'https://www.agriculture.vic.gov.au/' // Agriculture
      ],
      'wa': [
        'https://www.health.wa.gov.au/Articles/F_I/Food-businesses',
        'https://www.commerce.wa.gov.au/',
        'https://www.dmirs.wa.gov.au/', // Mining and resources
        'https://www.planning.wa.gov.au/',
        'https://www.worksafe.wa.gov.au/',
        'https://www.rgl.wa.gov.au/', // Racing gaming liquor
        'https://www.perth.wa.gov.au/live-and-work/health-and-safety/food-businesses'
      ],
      'sa': [
        'https://www.sahealth.sa.gov.au/wps/wcm/connect/public+content/sa+health+internet/protecting+public+health/food+safety',
        'https://www.sa.gov.au/topics/business-and-trade/permits-and-licences',
        'https://www.cbs.sa.gov.au/', // Consumer and business services
        'https://www.adelaidehills.sa.gov.au/business/food-businesses',
        'https://www.adelaide.sa.gov.au/your-business/permits-licences/food-business-registration',
        'https://www.planning.sa.gov.au/',
        'https://www.safework.sa.gov.au/'
      ],
      'tas': [
        'https://www.health.tas.gov.au/health-topics/environmental-health/food-safety',
        'https://www.business.tas.gov.au/',
        'https://www.planning.tas.gov.au/',
        'https://www.worksafe.tas.gov.au/',
        'https://www.hobartcity.com.au/Business/Food-businesses',
        'https://www.launceston.tas.gov.au/Residents/Health-and-Safety/Food-Safety'
      ],
      'nt': [
        'https://health.nt.gov.au/professionals/public-and-environmental-health/food-safety-standards',
        'https://business.nt.gov.au/',
        'https://nt.gov.au/industry/building-and-development',
        'https://worksafe.nt.gov.au/',
        'https://www.darwin.nt.gov.au/business-and-industry/food-business-registration'
      ],
      'act': [
        'https://www.health.act.gov.au/about-our-health-system/population-health/environmental-health/food-safety-and-regulation',
        'https://www.businessact.gov.au/',
        'https://www.planning.act.gov.au/',
        'https://www.worksafe.act.gov.au/',
        'https://www.cityservices.act.gov.au/business/food-businesses'
      ],
      'cth': [
        'https://www.abr.gov.au/', // Australian Business Register
        'https://www.accc.gov.au/', // Competition and Consumer
        'https://www.foodstandards.gov.au/', // Food Standards Australia New Zealand
        'https://www.agriculture.gov.au/', // Food exports/imports
        'https://www.worksafe.gov.au/', // Commonwealth workplace safety
        'https://www.aph.gov.au/', // Parliamentary information
        'https://www.legislation.gov.au/' // Commonwealth legislation
      ]
    };

    return predefinedSites[jurisdiction] || [];
  }

  // Discover additional permit sites through targeted web search
  async discoverPermitSites(jurisdiction, legalAreas) {
    const jurisdictionNames = {
      'qld': 'Queensland',
      'nsw': 'New South Wales',
      'vic': 'Victoria',
      'wa': 'Western Australia',
      'sa': 'South Australia',
      'tas': 'Tasmania',
      'nt': 'Northern Territory',
      'act': 'Australian Capital Territory',
      'cth': 'Australia Commonwealth'
    };

    const jurisdictionName = jurisdictionNames[jurisdiction] || 'Australia';
    const searchQueries = this.buildPermitSiteQueries(jurisdictionName, legalAreas);
    
    const discoveredSites = new Set();
    
    for (const query of searchQueries.slice(0, 3)) { // Limit search queries
      try {
        // Use existing web search functionality if available
        if (this.documentFetcher && this.documentFetcher.webSearch) {
          const results = await this.documentFetcher.webSearch(query);
          const sites = this.extractGovernmentSites(results);
          sites.forEach(site => discoveredSites.add(site));
        }
      } catch (error) {
        console.warn(`Web search failed for: ${query}`, error.message);
      }
    }
    
    return Array.from(discoveredSites);
  }

  // Build targeted search queries for permit sites
  buildPermitSiteQueries(jurisdictionName, legalAreas) {
    const baseTerms = ['permits', 'licenses', 'applications', 'business registration', 'regulatory'];
    const governmentTerms = ['gov.au', 'government', 'council', 'department'];
    
    const queries = [];
    
    // Basic jurisdiction queries
    queries.push(`site:*.gov.au ${jurisdictionName} business permits licenses`);
    queries.push(`site:*.gov.au ${jurisdictionName} applications forms`);
    
    // Legal area specific queries
    for (const area of legalAreas.slice(0, 2)) {
      queries.push(`site:*.gov.au ${jurisdictionName} "${area}" permits applications`);
    }
    
    // Local council queries
    queries.push(`site:*.gov.au ${jurisdictionName} council permits licenses`);
    
    return queries;
  }

  // Extract government site URLs from search results
  extractGovernmentSites(searchResults) {
    const sites = [];
    
    if (searchResults && searchResults.links) {
      for (const link of searchResults.links) {
        if (link.url && 
            (link.url.includes('.gov.au') || 
             link.url.includes('government') ||
             link.url.includes('council')) &&
            !link.url.includes('austlii.edu.au')) { // Exclude legal databases
          
          // Clean URL to domain level for main pages
          try {
            const url = new URL(link.url);
            const cleanUrl = `${url.protocol}//${url.host}${url.pathname}`;
            sites.push(cleanUrl);
          } catch (error) {
            // Skip malformed URLs
            continue;
          }
        }
      }
    }
    
    return [...new Set(sites)]; // Remove duplicates
  }

  // Ingest a specific permit site
  async ingestPermitSite(siteUrl, jurisdiction, eventTracker) {
    this.log(eventTracker, `📥 Ingesting permit site: ${siteUrl}`);
    
    try {
      // Check if already ingested
      const existing = await this.db.getDocument(siteUrl);
      if (existing && existing.document_type === 'permit_site') {
        return existing;
      }
      
      // Fetch the site content
      const siteData = await this.webFetch.fetchContent(siteUrl, 
        'Extract permit, license, and application information from this government website. Focus on business registration, regulatory compliance, and application processes.'
      );
      
      if (!siteData || !siteData.content || siteData.content.length < 500) {
        this.log(eventTracker, `⚠️ Insufficient content from ${siteUrl}`);
        return null;
      }
      
      // Extract permit/license information
      const permitInfo = await this.extractPermitInformation(siteData.content, siteUrl);
      
      // Create document record
      const document = {
        url: siteUrl,
        content: siteData.content,
        tags: this.generatePermitTags(permitInfo, jurisdiction),
        jurisdiction: jurisdiction,
        document_type: 'permit_site',
        synthetic: false,
        permit_types: permitInfo.permit_types,
        application_links: permitInfo.application_links,
        contact_info: permitInfo.contact_info
      };
      
      // Save to database
      const saved = await this.db.saveDocument(document);
      
      this.log(eventTracker, `✅ Ingested permit site: ${siteUrl} (${Math.round(siteData.content.length/1000)}kb)`);
      return saved;
      
    } catch (error) {
      this.log(eventTracker, `❌ Failed to ingest ${siteUrl}: ${error.message}`);
      return null;
    }
  }

  // Extract permit and license information from site content
  async extractPermitInformation(content, siteUrl) {
    const permitInfo = {
      permit_types: [],
      application_links: [],
      contact_info: {}
    };
    
    // Simple keyword-based extraction (can be enhanced with LLM analysis)
    const permitKeywords = [
      'food business license', 'liquor license', 'building permit', 'planning permit',
      'business registration', 'trade license', 'environmental permit', 'fire safety',
      'health permit', 'development application', 'council permit'
    ];
    
    const lowerContent = content.toLowerCase();
    
    for (const keyword of permitKeywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        permitInfo.permit_types.push(keyword);
      }
    }
    
    // Extract application links (basic pattern matching)
    const linkPatterns = [
      /href=["']([^"']*application[^"']*)["']/gi,
      /href=["']([^"']*apply[^"']*)["']/gi,
      /href=["']([^"']*form[^"']*)["']/gi,
      /href=["']([^"']*license[^"']*)["']/gi
    ];
    
    for (const pattern of linkPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        let link = match[1];
        if (link.startsWith('/')) {
          const baseUrl = new URL(siteUrl);
          link = `${baseUrl.protocol}//${baseUrl.host}${link}`;
        }
        if (link.startsWith('http')) {
          permitInfo.application_links.push(link);
        }
      }
    }
    
    // Remove duplicates
    permitInfo.permit_types = [...new Set(permitInfo.permit_types)];
    permitInfo.application_links = [...new Set(permitInfo.application_links)];
    
    return permitInfo;
  }

  // Generate tags for permit sites
  generatePermitTags(permitInfo, jurisdiction) {
    const tags = [
      'permit_site',
      'government',
      'regulatory',
      jurisdiction,
      ...permitInfo.permit_types
    ];
    
    return tags;
  }

  // Preseed the database with essential permit sites
  async preseedDatabase(eventTracker = null) {
    this.log(eventTracker, '🌱 Preseeding database with essential permit sites...');
    
    const jurisdictions = ['qld', 'nsw', 'vic', 'wa', 'sa', 'tas', 'nt', 'act', 'cth'];
    let totalIngested = 0;
    
    for (const jurisdiction of jurisdictions) {
      this.log(eventTracker, `🏛️ Processing ${jurisdiction.toUpperCase()} permit sites...`);
      
      const predefinedSites = await this.getPredefinedSites(jurisdiction);
      let jurisdictionCount = 0;
      
      for (const siteUrl of predefinedSites.slice(0, 5)) { // Limit per jurisdiction
        try {
          const existing = await this.db.getDocument(siteUrl);
          if (existing && existing.document_type === 'permit_site') {
            continue; // Skip if already exists
          }
          
          const siteData = await this.ingestPermitSite(siteUrl, jurisdiction, eventTracker);
          if (siteData) {
            jurisdictionCount++;
            totalIngested++;
          }
          
          // Rate limiting - 3 second delay between sites
          await new Promise(resolve => setTimeout(resolve, 3000));
          
        } catch (error) {
          this.log(eventTracker, `❌ Failed to preseed ${siteUrl}: ${error.message}`);
        }
      }
      
      this.log(eventTracker, `✅ ${jurisdiction.toUpperCase()}: ${jurisdictionCount} sites ingested`);
    }
    
    this.log(eventTracker, `🎉 Preseeding complete: ${totalIngested} permit sites ingested across all jurisdictions`);
    return totalIngested;
  }

  // Helper to log with event tracker
  log(eventTracker, message) {
    console.log(message);
    if (eventTracker) {
      eventTracker.addEvent('permit_ingestion', message.replace(/[🏛️📋📥✅❌⚠️🌱🎉]/g, '').trim());
    }
  }
}