#!/usr/bin/env node

// Intelligent Legal Document Discovery System
// Automatically discovers legal documents using pattern matching and intelligent exploration

export class IntelligentDocumentDiscovery {
  constructor() {
    this.baseUrl = 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis';
    this.jurisdictionCodes = {
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
    
    this.documentTypes = {
      'consol_act': 'Consolidated Act',
      'consol_reg': 'Consolidated Regulation',
      'num_act': 'Numbered Act',
      'num_reg': 'Numbered Regulation',
      'consol_sub': 'Consolidated Subordinate Legislation',
      'repealed_act': 'Repealed Act'
    };
    
    // Common legal document patterns to search for
    this.legalTopics = {
      planning: [
        'planning', 'development', 'environment', 'land', 'building',
        'construction', 'urban', 'rural', 'zoning'
      ],
      business: [
        'corporation', 'business', 'company', 'fair', 'trade', 'consumer',
        'competition', 'commercial', 'partnership'
      ],
      food: [
        'food', 'health', 'safety', 'public', 'restaurant', 'hospitality'
      ],
      employment: [
        'work', 'employment', 'labour', 'industrial', 'wage', 'workplace',
        'safety', 'relations'
      ],
      local: [
        'local', 'government', 'council', 'municipal', 'city', 'town'
      ],
      licensing: [
        'licence', 'license', 'permit', 'registration', 'approval'
      ]
    };
    
    this.knownDocuments = new Set(); // Track discovered documents
    this.successfulPatterns = new Map(); // Track working URL patterns
    
    // Rate limiting and retry configuration
    this.isBlocked = false;
    this.maxRetries = 3;
    this.baseDelay = 1000; // Start with 1 second
    this.maxDelay = 30000; // Maximum 30 seconds
    this.backoffMultiplier = 2;
  }

  // Generate potential URLs based on jurisdiction and topic
  generatePotentialUrls(jurisdiction, topic, maxUrls = 50) {
    const urls = [];
    const jurisdictionCode = jurisdiction.toLowerCase();
    
    if (!this.jurisdictionCodes[jurisdictionCode]) {
      console.warn(`Unknown jurisdiction: ${jurisdiction}`);
      return urls;
    }

    // Try different document types
    for (const [docType, docDescription] of Object.entries(this.documentTypes)) {
      // Try different year ranges (focus on more recent years)
      const years = ['2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010', '2009', '2008', '2007', '2006', '2005', '2004', '2003', '2002', '2001', '2000', '1999', '1998', '1997', '1996', '1995'];
      
      const topicKeywords = this.legalTopics[topic] || [topic];
      
      for (const keyword of topicKeywords) {
        for (const year of years.slice(0, 10)) { // Try recent 10 years first
          // Pattern: /jurisdiction/doctype/keywordyear###/
          for (let num = 1; num <= 500; num += 50) { // Try different act numbers
            const actNumber = num.toString().padStart(3, '0');
            const urlId = `${keyword.substring(0, 2)}${year}${actNumber}`;
            const url = `${this.baseUrl}/${jurisdictionCode}/${docType}/${urlId}/`;
            urls.push({
              url,
              jurisdiction: this.jurisdictionCodes[jurisdictionCode],
              jurisdictionCode,
              docType: docDescription,
              topic,
              keyword,
              year,
              priority: this.calculatePriority(keyword, year, docType)
            });
            
            if (urls.length >= maxUrls) break;
          }
          if (urls.length >= maxUrls) break;
        }
        if (urls.length >= maxUrls) break;
      }
      if (urls.length >= maxUrls) break;
    }

    // Sort by priority (higher priority first)
    return urls.sort((a, b) => b.priority - a.priority);
  }

  // Calculate priority for URL generation (higher = more likely to exist)
  calculatePriority(keyword, year, docType) {
    let priority = 0;
    
    // Recent years get higher priority
    const currentYear = new Date().getFullYear();
    const yearDiff = currentYear - parseInt(year);
    priority += Math.max(0, 25 - yearDiff);
    
    // Important keywords get higher priority
    const importantKeywords = ['planning', 'food', 'local', 'work', 'business', 'corporation'];
    if (importantKeywords.includes(keyword.toLowerCase())) {
      priority += 20;
    }
    
    // Consolidated acts are more common
    if (docType.includes('Consolidated')) {
      priority += 15;
    }
    
    // Random factor to explore diverse documents
    priority += Math.random() * 10;
    
    return priority;
  }

  // Check if site is currently blocking requests
  checkBlocked() {
    if (this.isBlocked) {
      throw new Error('Discovery is currently blocked by the site. Stopping all requests.');
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

  // Test if a URL contains valid legal content with retry logic
  async testUrl(urlData, retryAttempt = 0) {
    this.checkBlocked();

    try {
      console.log(`Testing: ${urlData.url}`);
      
      // First try HEAD request
      let response = await fetch(urlData.url, {
        method: 'HEAD',
        timeout: 5000
      });
      
      // Handle rate limiting
      if (response.status === 429 || response.status === 503) {
        console.warn(`⚠️  Rate limited (${response.status}) - marking site as blocked`);
        this.isBlocked = true;
        throw new Error(`Site blocked discovery with status ${response.status}`);
      }
      
      if (response.ok) {
        // Double-check with a GET request to ensure it's real content
        const contentResponse = await fetch(urlData.url, { timeout: 10000 });
        
        if (contentResponse.status === 429 || contentResponse.status === 503) {
          console.warn(`⚠️  Rate limited on content fetch (${contentResponse.status}) - marking site as blocked`);
          this.isBlocked = true;
          throw new Error(`Site blocked discovery with status ${contentResponse.status}`);
        }
        
        if (contentResponse.ok) {
          const content = await contentResponse.text();
          
          // Basic validation - check if it looks like legal content
          if (this.isValidLegalContent(content)) {
            console.log(`✅ Found valid document: ${urlData.url}`);
            this.knownDocuments.add(urlData.url);
            return {
              ...urlData,
              found: true,
              title: this.extractTitle(content),
              contentPreview: content.substring(0, 500)
            };
          }
        }
      }
      
      return { ...urlData, found: false };
      
    } catch (error) {
      // If we've been blocked, don't retry
      if (this.isBlocked) {
        throw error;
      }

      // Retry on network errors or server errors (5xx)
      const shouldRetry = retryAttempt < this.maxRetries && (
        error.name === 'TypeError' || // Network error
        (error.status && error.status >= 500) // Server error
      );

      if (shouldRetry) {
        const delay = this.calculateDelay(retryAttempt);
        console.warn(`❗ URL test failed (attempt ${retryAttempt + 1}/${this.maxRetries + 1}). Retrying in ${delay}ms...`);
        console.warn(`   URL: ${urlData.url}, Error: ${error.message}`);
        
        await this.sleep(delay);
        return this.testUrl(urlData, retryAttempt + 1);
      }

      return { ...urlData, found: false, error: error.message };
    }
  }

  // Validate if content appears to be a legal document
  isValidLegalContent(content) {
    const legalIndicators = [
      'act', 'section', 'subsection', 'regulation', 'clause',
      'commonwealth', 'australia', 'austlii', 'legislation',
      'statute', 'law', 'legal', 'court', 'jurisdiction'
    ];
    
    const lowerContent = content.toLowerCase();
    const foundIndicators = legalIndicators.filter(indicator => 
      lowerContent.includes(indicator)
    ).length;
    
    // Must have at least 3 legal indicators and be substantial content
    return foundIndicators >= 3 && content.length > 1000;
  }

  // Extract document title from HTML content
  extractTitle(content) {
    // Try various patterns to extract title
    const patterns = [
      /<title>([^<]+)<\/title>/i,
      /<h1[^>]*>([^<]+)<\/h1>/i,
      /<h2[^>]*>([^<]+)<\/h2>/i,
      /Act \d{4}[^<]*(?:<[^>]*>)*([^<\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim().replace(/\s+/g, ' ');
      }
    }
    
    return 'Unknown Document';
  }

  // Discover documents for a specific jurisdiction and topic
  async discoverDocuments(jurisdiction, topic = 'planning', options = {}) {
    const {
      maxUrls = 20,
      batchSize = 5,
      delayBetweenBatches = 1000
    } = options;
    
    console.log(`🔍 Discovering ${topic} documents for ${jurisdiction}...`);
    
    const potentialUrls = this.generatePotentialUrls(jurisdiction, topic, maxUrls);
    const discoveredDocs = [];
    
    console.log(`Generated ${potentialUrls.length} potential URLs to test`);
    
    // Test URLs in batches to avoid overwhelming the server
    for (let i = 0; i < potentialUrls.length; i += batchSize) {
      try {
        // Check if we're blocked before each batch
        this.checkBlocked();
        
        const batch = potentialUrls.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(potentialUrls.length / batchSize);
        
        console.log(`📦 Testing batch ${batchNum}/${totalBatches} (${batch.length} URLs)`);
        
        // Test batch in parallel
        const batchResults = await Promise.allSettled(
          batch.map(urlData => this.testUrl(urlData))
        );
        
        // Collect successful discoveries
        batchResults.forEach((result, idx) => {
          if (result.status === 'fulfilled' && result.value.found) {
            discoveredDocs.push(result.value);
          } else if (result.status === 'rejected' && this.isBlocked) {
            console.warn(`🚫 Batch processing stopped due to blocking`);
            return; // Exit batch processing
          }
        });
        
        // Brief pause between batches
        if (i + batchSize < potentialUrls.length && delayBetweenBatches > 0) {
          console.log(`⏸️  Pausing ${delayBetweenBatches}ms between batches...`);
          await this.sleep(delayBetweenBatches);
        }
        
      } catch (error) {
        if (this.isBlocked) {
          console.error(`🚫 Discovery stopped due to blocking: ${error.message}`);
          break; // Stop all batches
        }
        console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
      }
    }
    
    console.log(`🎉 Discovery complete: found ${discoveredDocs.length} documents`);
    return discoveredDocs;
  }

  // Discover documents across all jurisdictions for a topic
  async discoverAllJurisdictions(topic = 'planning', options = {}) {
    const allDiscoveries = [];
    
    for (const [code, name] of Object.entries(this.jurisdictionCodes)) {
      try {
        console.log(`\n🇦🇺 Discovering ${topic} documents for ${name} (${code.toUpperCase()})...`);
        const discoveries = await this.discoverDocuments(code, topic, options);
        allDiscoveries.push(...discoveries);
      } catch (error) {
        console.error(`❌ Failed to discover documents for ${name}:`, error.message);
      }
    }
    
    return allDiscoveries;
  }

  // Convert discovered documents to seeder format
  convertToSeederFormat(discoveries) {
    return discoveries.map(doc => ({
      url: doc.url,
      title: doc.title,
      description: `${doc.docType} - ${doc.topic} related legislation`,
      priority: Math.floor(doc.priority),
      tags: this.generateTags(doc),
      jurisdiction: doc.jurisdiction,
      document_type: doc.docType.toLowerCase().includes('act') ? 'act' : 'regulation'
    }));
  }

  // Generate relevant tags for a document
  generateTags(doc) {
    const tags = [doc.topic];
    
    // Add jurisdiction-specific tags
    tags.push(doc.jurisdictionCode);
    
    // Add topic-specific tags
    if (this.legalTopics[doc.topic]) {
      tags.push(...this.legalTopics[doc.topic].slice(0, 3));
    }
    
    // Add document type tags
    if (doc.docType.includes('Act')) {
      tags.push('act', 'legislation');
    } else if (doc.docType.includes('Regulation')) {
      tags.push('regulation', 'rules');
    }
    
    return tags;
  }
}

// CLI interface for standalone usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const discovery = new IntelligentDocumentDiscovery();
  
  const args = process.argv.slice(2);
  const jurisdiction = args[0] || 'all';
  const topic = args[1] || 'planning';
  const maxUrls = parseInt(args[2]) || 10;
  
  try {
    let discoveries;
    if (jurisdiction === 'all') {
      console.log(`🔍 Discovering ${topic} documents across all Australian jurisdictions...`);
      discoveries = await discovery.discoverAllJurisdictions(topic, { maxUrls: maxUrls });
    } else {
      console.log(`🔍 Discovering ${topic} documents for ${jurisdiction}...`);
      discoveries = await discovery.discoverDocuments(jurisdiction, topic, { maxUrls: maxUrls });
    }
    
    console.log(`\n📊 Discovery Results:`);
    console.log(`Total documents found: ${discoveries.length}`);
    
    if (discoveries.length > 0) {
      console.log('\n📑 Discovered Documents:');
      discoveries.forEach((doc, index) => {
        console.log(`${index + 1}. ${doc.title}`);
        console.log(`   ${doc.url}`);
        console.log(`   Jurisdiction: ${doc.jurisdiction}`);
        console.log(`   Type: ${doc.docType}`);
        console.log(`   Priority: ${doc.priority.toFixed(1)}\n`);
      });
      
      // Show seeder format
      const seederFormat = discovery.convertToSeederFormat(discoveries);
      console.log('📝 Seeder Format (sample):');
      console.log(JSON.stringify(seederFormat.slice(0, 3), null, 2));
    }
    
  } catch (error) {
    console.error('💥 Discovery failed:', error);
    process.exit(1);
  }
}