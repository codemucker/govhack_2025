#!/usr/bin/env node

// AustLII Web Scraper - Intelligent Document Discovery
// Scrapes AustLII databases to automatically discover legal documents

export class AustLIIScraper {
  constructor() {
    this.baseUrl = 'https://www.austlii.edu.au';
    this.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    
    // Rate limiting and retry configuration
    this.isBlocked = false;
    this.maxRetries = 3;
    this.baseDelay = 1000; // Start with 1 second
    this.maxDelay = 30000; // Maximum 30 seconds
    this.backoffMultiplier = 2;
    
    // Database endpoints extracted from AustLII databases page
    this.jurisdictionDatabases = {
      'cth': [
        '/cgi-bin/viewdb/au/legis/cth/consol_act/', // Commonwealth Consolidated Acts
        '/cgi-bin/viewdb/au/legis/cth/consol_reg/', // Commonwealth Consolidated Regulations
        '/cgi-bin/viewdb/au/legis/cth/num_act/',    // Commonwealth Numbered Acts
        '/cgi-bin/viewdb/au/legis/cth/num_reg/'     // Commonwealth Numbered Regulations
      ],
      'nsw': [
        '/cgi-bin/viewdb/au/legis/nsw/consol_act/', // NSW Consolidated Acts
        '/cgi-bin/viewdb/au/legis/nsw/consol_reg/', // NSW Consolidated Regulations
        '/cgi-bin/viewdb/au/legis/nsw/num_act/',    // NSW Numbered Acts
        '/cgi-bin/viewdb/au/legis/nsw/num_reg/'     // NSW Numbered Regulations
      ],
      'vic': [
        '/cgi-bin/viewdb/au/legis/vic/consol_act/', // VIC Consolidated Acts
        '/cgi-bin/viewdb/au/legis/vic/consol_reg/', // VIC Consolidated Regulations
        '/cgi-bin/viewdb/au/legis/vic/num_act/',    // VIC Numbered Acts
        '/cgi-bin/viewdb/au/legis/vic/num_reg/'     // VIC Numbered Regulations
      ],
      'qld': [
        '/cgi-bin/viewdb/au/legis/qld/consol_act/', // QLD Consolidated Acts
        '/cgi-bin/viewdb/au/legis/qld/consol_reg/', // QLD Consolidated Regulations
        '/cgi-bin/viewdb/au/legis/qld/num_act/',    // QLD Numbered Acts
        '/cgi-bin/viewdb/au/legis/qld/num_reg/'     // QLD Numbered Regulations
      ],
      'wa': [
        '/cgi-bin/viewdb/au/legis/wa/consol_act/',  // WA Consolidated Acts
        '/cgi-bin/viewdb/au/legis/wa/consol_reg/',  // WA Consolidated Regulations
        '/cgi-bin/viewdb/au/legis/wa/num_act/'      // WA Numbered Acts
      ],
      'sa': [
        '/cgi-bin/viewdb/au/legis/sa/consol_act/',  // SA Consolidated Acts
        '/cgi-bin/viewdb/au/legis/sa/consol_reg/',  // SA Consolidated Regulations
        '/cgi-bin/viewdb/au/legis/sa/num_act/',     // SA Numbered Acts
        '/cgi-bin/viewdb/au/legis/sa/num_reg/'      // SA Numbered Regulations
      ],
      'tas': [
        '/cgi-bin/viewdb/au/legis/tas/consol_act/', // TAS Consolidated Acts
        '/cgi-bin/viewdb/au/legis/tas/consol_reg/', // TAS Consolidated Regulations
        '/cgi-bin/viewdb/au/legis/tas/num_act/',    // TAS Numbered Acts
        '/cgi-bin/viewdb/au/legis/tas/num_reg/'     // TAS Numbered Regulations
      ],
      'nt': [
        '/cgi-bin/viewdb/au/legis/nt/consol_act/',  // NT Consolidated Acts
        '/cgi-bin/viewdb/au/legis/nt/consol_reg/',  // NT Consolidated Regulations
        '/cgi-bin/viewdb/au/legis/nt/num_act/',     // NT Numbered Acts
        '/cgi-bin/viewdb/au/legis/nt/num_reg/'      // NT Numbered Regulations
      ],
      'act': [
        '/cgi-bin/viewdb/au/legis/act/consol_act/', // ACT Consolidated Acts
        '/cgi-bin/viewdb/au/legis/act/consol_reg/', // ACT Consolidated Regulations
        '/cgi-bin/viewdb/au/legis/act/num_act/',    // ACT Numbered Acts
        '/cgi-bin/viewdb/au/legis/act/num_reg/'     // ACT Numbered Regulations
      ]
    };
    
    this.jurisdictionNames = {
      'cth': 'Commonwealth',
      'nsw': 'New South Wales',
      'vic': 'Victoria',
      'qld': 'Queensland',
      'wa': 'Western Australia',
      'sa': 'South Australia',
      'tas': 'Tasmania',
      'nt': 'Northern Territory',
      'act': 'Australian Capital Territory'
    };
    
    this.discoveredDocuments = [];
  }

  // Check if site is currently blocking requests
  checkBlocked() {
    if (this.isBlocked) {
      throw new Error('Scraper is currently blocked by the site. Stopping all requests.');
    }
  }

  // Calculate exponential backoff delay
  calculateDelay(attempt) {
    const delay = this.baseDelay * Math.pow(this.backoffMultiplier, attempt);
    return Math.min(delay, this.maxDelay);
  }

  // Sleep for specified milliseconds
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Fetch HTML content with exponential backoff and retry
  async fetchWithHeaders(url, retryAttempt = 0) {
    this.checkBlocked();

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });
      
      // Handle rate limiting
      if (response.status === 429 || response.status === 503) {
        console.warn(`⚠️  Rate limited (${response.status}) - marking site as blocked`);
        this.isBlocked = true;
        throw new Error(`Site blocked scraper with status ${response.status}`);
      }

      // Handle other 4xx/5xx errors with retry
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        throw error;
      }
      
      return await response.text();
      
    } catch (error) {
      // If we've been blocked, don't retry
      if (this.isBlocked) {
        throw error;
      }

      // Retry on network errors or server errors (5xx)
      const shouldRetry = retryAttempt < this.maxRetries && (
        !error.status || // Network error
        error.status >= 500 // Server error
      );

      if (shouldRetry) {
        const delay = this.calculateDelay(retryAttempt);
        console.warn(`❗ Request failed (attempt ${retryAttempt + 1}/${this.maxRetries + 1}). Retrying in ${delay}ms...`);
        console.warn(`   Error: ${error.message}`);
        
        await this.sleep(delay);
        return this.fetchWithHeaders(url, retryAttempt + 1);
      }

      console.error(`❌ Failed to fetch ${url} after ${retryAttempt + 1} attempts:`, error.message);
      throw error;
    }
  }

  // Parse database index page to extract document links
  parseDocumentLinks(html, baseDbUrl) {
    const documents = [];
    
    // Look for links to individual documents
    // AustLII uses patterns like: href="/cgi-bin/viewdoc/au/legis/cth/consol_act/ca2001172/"
    const docPattern = /href="(\/cgi-bin\/viewdoc\/au\/legis\/[^"]+)"/gi;
    let match;
    
    while ((match = docPattern.exec(html)) !== null) {
      const docUrl = this.baseUrl + match[1];
      documents.push(docUrl);
    }
    
    // Also look for table rows with document information
    const tableRowPattern = /<tr[^>]*>.*?<a[^>]*href="([^"]*viewdoc[^"]*)"[^>]*>([^<]+)<\/a>.*?<\/tr>/gis;
    let tableMatch;
    
    while ((tableMatch = tableRowPattern.exec(html)) !== null) {
      const docUrl = tableMatch[1].startsWith('http') ? tableMatch[1] : this.baseUrl + tableMatch[1];
      const title = tableMatch[2].trim();
      
      if (docUrl.includes('/au/legis/')) {
        documents.push({ url: docUrl, title });
      }
    }
    
    return documents;
  }

  // Scrape a specific database for documents
  async scrapeDatabase(jurisdiction, dbPath, options = {}) {
    const { maxDocuments = 20, priority = 5, delayMs = 500 } = options;
    
    try {
      // Check if we're blocked before attempting
      this.checkBlocked();
      
      const dbUrl = this.baseUrl + dbPath;
      console.log(`📂 Scraping database: ${dbUrl}`);
      
      const html = await this.fetchWithHeaders(dbUrl);
      const documentLinks = this.parseDocumentLinks(html, dbUrl);
      
      console.log(`Found ${documentLinks.length} potential documents in ${dbPath}`);
      
      // Process found documents
      const processedDocs = documentLinks.slice(0, maxDocuments).map(doc => {
        const docData = typeof doc === 'string' ? { url: doc, title: null } : doc;
        
        return {
          url: docData.url,
          title: docData.title || this.extractTitleFromUrl(docData.url),
          jurisdiction: this.jurisdictionNames[jurisdiction],
          jurisdictionCode: jurisdiction,
          docType: this.getDocTypeFromPath(dbPath),
          priority: priority,
          discoveredFrom: dbUrl,
          tags: this.generateTagsFromUrl(docData.url)
        };
      });
      
      this.discoveredDocuments.push(...processedDocs);
      
      // Add delay after successful scrape
      if (delayMs > 0) {
        await this.sleep(delayMs);
      }
      
      return processedDocs;
      
    } catch (error) {
      if (this.isBlocked) {
        console.error(`🚫 Scraping blocked, stopping all requests: ${error.message}`);
        throw error; // Re-throw to stop parent operations
      }
      console.error(`❌ Failed to scrape ${dbPath}:`, error.message);
      return [];
    }
  }

  // Extract document title from URL pattern
  extractTitleFromUrl(url) {
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 2] || urlParts[urlParts.length - 1];
    
    // Try to make a readable title from the URL slug
    return lastPart.replace(/([a-z])(\d{4})/, '$1 $2')
                   .replace(/([a-z])([A-Z])/g, '$1 $2')
                   .replace(/_/g, ' ')
                   .replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown Document';
  }

  // Determine document type from database path
  getDocTypeFromPath(dbPath) {
    if (dbPath.includes('consol_act')) return 'Consolidated Act';
    if (dbPath.includes('consol_reg')) return 'Consolidated Regulation';
    if (dbPath.includes('num_act')) return 'Numbered Act';
    if (dbPath.includes('num_reg')) return 'Numbered Regulation';
    return 'Legal Document';
  }

  // Generate relevant tags from URL
  generateTagsFromUrl(url) {
    const tags = [];
    const urlLower = url.toLowerCase();
    
    // Add tags based on URL content
    const topicPatterns = {
      'planning': ['plan', 'develop', 'environment', 'land', 'building'],
      'business': ['corp', 'company', 'business', 'trade', 'commercial'],
      'food': ['food', 'health', 'safety', 'public'],
      'employment': ['work', 'employ', 'labour', 'industrial', 'wage'],
      'local': ['local', 'council', 'municipal'],
      'licensing': ['licen', 'permit', 'registr', 'approval']
    };
    
    for (const [topic, patterns] of Object.entries(topicPatterns)) {
      if (patterns.some(pattern => urlLower.includes(pattern))) {
        tags.push(topic);
      }
    }
    
    // Add document type tags
    if (url.includes('consol_act') || url.includes('num_act')) {
      tags.push('act', 'legislation');
    } else if (url.includes('reg')) {
      tags.push('regulation', 'rules');
    }
    
    return tags.length > 0 ? tags : ['legislation'];
  }

  // Scrape all databases for a specific jurisdiction
  async scrapeJurisdiction(jurisdiction, options = {}) {
    const { maxDocsPerDatabase = 10, delayBetweenDatabases = 1000 } = options;
    
    if (!this.jurisdictionDatabases[jurisdiction]) {
      throw new Error(`Unknown jurisdiction: ${jurisdiction}`);
    }
    
    console.log(`🇦🇺 Scraping all databases for ${this.jurisdictionNames[jurisdiction]}...`);
    
    const jurisdictionDocs = [];
    const databases = this.jurisdictionDatabases[jurisdiction];
    
    for (let i = 0; i < databases.length; i++) {
      const dbPath = databases[i];
      const priority = databases.length - i; // Higher priority for first databases
      
      try {
        // Check if we're blocked before continuing
        this.checkBlocked();
        
        const docs = await this.scrapeDatabase(jurisdiction, dbPath, {
          maxDocuments: maxDocsPerDatabase,
          priority: priority + 5,
          delayMs: 800 // Delay after each database
        });
        
        jurisdictionDocs.push(...docs);
        
        // Brief pause between database scrapes
        if (i < databases.length - 1 && delayBetweenDatabases > 0) {
          console.log(`⏸️  Pausing ${delayBetweenDatabases}ms between databases...`);
          await this.sleep(delayBetweenDatabases);
        }
        
      } catch (error) {
        if (this.isBlocked) {
          console.error(`🚫 Jurisdiction scraping stopped due to blocking: ${error.message}`);
          break; // Stop processing this jurisdiction
        }
        console.error(`Failed to scrape database ${dbPath}:`, error.message);
      }
    }
    
    console.log(`📋 Found ${jurisdictionDocs.length} documents for ${this.jurisdictionNames[jurisdiction]}`);
    return jurisdictionDocs;
  }

  // Scrape all jurisdictions
  async scrapeAllJurisdictions(options = {}) {
    const { maxDocsPerJurisdiction = 15, delayBetweenJurisdictions = 2000 } = options;
    
    const allDocs = [];
    const jurisdictions = Object.keys(this.jurisdictionDatabases);
    
    for (let i = 0; i < jurisdictions.length; i++) {
      const jurisdiction = jurisdictions[i];
      
      try {
        // Check if we're blocked before processing each jurisdiction
        this.checkBlocked();
        
        console.log(`\n🏛️  Processing jurisdiction ${i + 1}/${jurisdictions.length}: ${this.jurisdictionNames[jurisdiction]}`);
        
        const docs = await this.scrapeJurisdiction(jurisdiction, {
          maxDocsPerDatabase: Math.ceil(maxDocsPerJurisdiction / 4), // Spread across databases
          delayBetweenDatabases: 1500 // Longer delays for comprehensive scraping
        });
        
        allDocs.push(...docs);
        console.log(`✅ Completed ${jurisdiction}: ${docs.length} documents`);
        
        // Pause between jurisdictions (longer delays to be respectful)
        if (i < jurisdictions.length - 1 && delayBetweenJurisdictions > 0) {
          console.log(`⏸️  Pausing ${delayBetweenJurisdictions}ms between jurisdictions...`);
          await this.sleep(delayBetweenJurisdictions);
        }
        
      } catch (error) {
        if (this.isBlocked) {
          console.error(`🚫 All scraping stopped due to blocking after ${i + 1} jurisdictions`);
          break; // Stop all processing
        }
        console.error(`❌ Failed to scrape jurisdiction ${jurisdiction}:`, error.message);
      }
    }
    
    console.log(`\n🏆 Total discovery complete: ${allDocs.length} documents from ${Object.keys(this.jurisdictionDatabases).length} jurisdictions`);
    return allDocs;
  }

  // Convert discovered documents to seeder format
  convertToSeederFormat(documents) {
    return documents.map(doc => ({
      url: doc.url,
      title: doc.title,
      description: `${doc.docType} from ${doc.jurisdiction}`,
      priority: doc.priority,
      tags: doc.tags,
      jurisdiction: doc.jurisdiction,
      document_type: doc.docType.toLowerCase().includes('act') ? 'act' : 'regulation'
    }));
  }

  // Get summary of discoveries
  getDiscoverySummary() {
    const summary = {
      totalDocuments: this.discoveredDocuments.length,
      byJurisdiction: {},
      byDocType: {},
      topPriority: this.discoveredDocuments
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 10)
    };
    
    // Group by jurisdiction
    this.discoveredDocuments.forEach(doc => {
      summary.byJurisdiction[doc.jurisdiction] = (summary.byJurisdiction[doc.jurisdiction] || 0) + 1;
      summary.byDocType[doc.docType] = (summary.byDocType[doc.docType] || 0) + 1;
    });
    
    return summary;
  }
}

// CLI interface for standalone usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new AustLIIScraper();
  
  const args = process.argv.slice(2);
  const jurisdiction = args[0] || 'all';
  const maxDocs = parseInt(args[1]) || 10;
  
  try {
    console.log('🔍 Starting AustLII document discovery...');
    let discoveries;
    
    if (jurisdiction === 'all') {
      discoveries = await scraper.scrapeAllJurisdictions({ maxDocsPerJurisdiction: maxDocs });
    } else {
      discoveries = await scraper.scrapeJurisdiction(jurisdiction, { maxDocsPerDatabase: maxDocs });
    }
    
    console.log('\n📊 Discovery Summary:');
    const summary = scraper.getDiscoverySummary();
    console.log(`Total documents discovered: ${summary.totalDocuments}`);
    console.log(`By jurisdiction:`, summary.byJurisdiction);
    console.log(`By document type:`, summary.byDocType);
    
    if (discoveries.length > 0) {
      console.log('\n📑 Sample Discovered Documents:');
      discoveries.slice(0, 5).forEach((doc, index) => {
        console.log(`${index + 1}. ${doc.title}`);
        console.log(`   ${doc.url}`);
        console.log(`   ${doc.jurisdiction} - ${doc.docType}`);
        console.log(`   Priority: ${doc.priority} | Tags: ${doc.tags.join(', ')}\n`);
      });
      
      // Convert to seeder format
      const seederFormat = scraper.convertToSeederFormat(discoveries);
      console.log('💾 Ready for seeder integration!');
      console.log(`Run: node document-seeder.js --discovered-docs='${JSON.stringify(seederFormat.slice(0, 3))}'`);
    }
    
  } catch (error) {
    console.error('💥 Scraping failed:', error);
    process.exit(1);
  }
}