#!/usr/bin/env node

/**
 * Enhanced Document Fetcher with 404 handling, robot blocking workarounds, 
 * and official Australian legislation integration
 */

const crypto = require('crypto');

// Use dynamic import for JSDOM to handle potential module issues
let JSDOM;
try {
  const jsdomModule = require('jsdom');
  JSDOM = jsdomModule.JSDOM;
} catch (error) {
  console.warn('JSDOM not available, falling back to regex HTML parsing:', error.message);
}

class EnhancedDocumentFetcher {
  constructor(db) {
    this.db = db;
    this.maxRetries = 3;
    this.retryDelayMs = 2000;
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0'
    ];
  }

  /**
   * Get a random user agent to avoid bot detection
   */
  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Sleep for specified milliseconds
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if a URL is from legislation.gov.au (official Australian legislation)
   */
  isLegislationGovAu(url) {
    return url.includes('legislation.gov.au');
  }

  /**
   * Check if a URL is from AustLII
   */
  isAustLII(url) {
    return url.includes('austlii.edu.au');
  }

  /**
   * Check if error should trigger a retry
   */
  isRetryableError(error, response) {
    if (response) {
      // Retry on server errors and some client errors
      return response.status >= 500 || 
             response.status === 429 || // Rate limit
             response.status === 503 || // Service unavailable
             response.status === 502;   // Bad gateway
    }
    
    // Retry on network errors
    return error.code === 'ECONNRESET' || 
           error.code === 'ETIMEDOUT' || 
           error.code === 'ECONNREFUSED' ||
           error.message.includes('timeout') ||
           error.message.includes('network');
  }

  /**
   * Enhanced fetch with retry logic and anti-bot measures
   */
  async fetchWithRetry(url, attempt = 0) {
    const headers = {
      'User-Agent': this.getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    };

    // Add delay for anti-bot measures (except first attempt)
    if (attempt > 0) {
      const delay = Math.random() * 2000 + 1000; // 1-3 seconds
      console.log(`⏳ Adding ${Math.round(delay)}ms delay before attempt ${attempt + 1}`);
      await this.sleep(delay);
    }

    try {
      console.log(`🌐 Fetching ${url} (attempt ${attempt + 1}/${this.maxRetries})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(url, {
        headers,
        signal: controller.signal,
        follow: 10, // Follow redirects
        compress: true
      });

      clearTimeout(timeoutId);
      return response;

    } catch (error) {
      console.error(`❌ Fetch attempt ${attempt + 1} failed for ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Validate document content quality
   */
  isValidDocument(content, url) {
    if (!content || typeof content !== 'string') {
      return { valid: false, reason: 'Empty or invalid content' };
    }

    const cleanContent = content.trim();
    
    // Check minimum content length
    if (cleanContent.length < 200) {
      return { valid: false, reason: 'Content too short (less than 200 characters)' };
    }

    // Check for common error pages
    const lowerContent = cleanContent.toLowerCase();
    const errorIndicators = [
      'page not found',
      '404 not found',
      'document not found',
      'access denied',
      'forbidden',
      'temporarily unavailable',
      'under maintenance',
      'coming soon',
      'please try again later',
      'error occurred',
      'page cannot be displayed',
      'sorry, the page you requested'
    ];

    for (const indicator of errorIndicators) {
      if (lowerContent.includes(indicator)) {
        return { valid: false, reason: `Contains error indicator: ${indicator}` };
      }
    }

    // Check if it's mostly HTML with little text content
    const htmlTagCount = (cleanContent.match(/<[^>]+>/g) || []).length;
    const textRatio = (cleanContent.length - htmlTagCount * 10) / cleanContent.length;
    
    if (textRatio < 0.1) {
      return { valid: false, reason: 'Content appears to be mostly HTML tags' };
    }

    return { valid: true, reason: 'Document appears valid' };
  }

  /**
   * Enhanced document fetching with comprehensive error handling
   */
  async fetchDocument(url, eventTracker = null) {
    const log = (message) => {
      console.log(message);
      if (eventTracker) {
        eventTracker.addEvent('document_fetch', message);
      }
    };

    // Check cache first
    try {
      const cached = await this.db.getDocument(url);
      if (cached && cached.content && cached.content.length > 200) {
        // Validate cached document
        const validation = this.isValidDocument(cached.content, url);
        if (validation.valid) {
          log(`📄 Retrieved valid cached document: ${url}`);
          return {
            content: cached.content,
            tags: Array.isArray(cached.tags) ? cached.tags : (cached.tags ? cached.tags.split(',').filter(t => t.length > 0) : []),
            url: cached.url,
            synthetic: cached.synthetic || false,
            cached: true
          };
        } else {
          log(`⚠️ Cached document invalid (${validation.reason}), refetching: ${url}`);
        }
      }
    } catch (error) {
      log(`⚠️ Error checking cache for ${url}: ${error.message}`);
    }

    // Try fetching with retries
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.fetchWithRetry(url, attempt);
        
        if (response.ok) {
          log(`✅ Successfully fetched ${url} (${response.status})`);
          
          const html = await response.text();
          const content = this.extractTextFromHtml(html);
          
          // Validate content quality
          const validation = this.isValidDocument(content, url);
          if (!validation.valid) {
            log(`❌ Invalid document content for ${url}: ${validation.reason}`);
            
            // Try to generate synthetic content for important legislation
            if (this.isLegislationGovAu(url) || this.isAustLII(url)) {
              log(`🔄 Generating synthetic content for important legislation: ${url}`);
              return await this.generateSyntheticLegalContent(url);
            }
            
            throw new Error(`Invalid document: ${validation.reason}`);
          }

          const tags = this.extractTags(content, url);
          const jurisdiction = this.extractJurisdictionFromUrl(url);

          // Store in database
          try {
            await this.db.saveDocument({
              url,
              content,
              tags,
              jurisdiction,
              document_type: this.extractDocumentType(url),
              synthetic: false,
              content_hash: crypto.createHash('md5').update(content).digest('hex')
            });
            log(`💾 Saved document to database: ${url}`);
          } catch (dbError) {
            log(`⚠️ Failed to save document to database: ${dbError.message}`);
          }

          return {
            content,
            tags,
            url,
            synthetic: false,
            cached: false
          };

        } else if (response.status === 404) {
          log(`🔍 Document not found (404): ${url}`);
          
          // For legislation.gov.au, try alternative URLs
          if (this.isLegislationGovAu(url)) {
            const alternativeUrl = await this.findAlternativeLegislationUrl(url);
            if (alternativeUrl && alternativeUrl !== url) {
              log(`🔄 Trying alternative legislation URL: ${alternativeUrl}`);
              return await this.fetchDocument(alternativeUrl, eventTracker);
            }
          }
          
          // Mark as invalid in database to avoid repeated attempts
          await this.markDocumentAsInvalid(url, '404 Not Found');
          throw new Error(`Document not found (404): ${url}`);

        } else if (response.status === 403 || response.status === 429) {
          log(`🚫 Access restricted (${response.status}): ${url}`);
          
          if (attempt < this.maxRetries - 1) {
            // Implement exponential backoff for rate limiting
            const backoffDelay = Math.min(this.retryDelayMs * Math.pow(2, attempt), 30000);
            log(`⏳ Backing off for ${backoffDelay}ms due to access restriction`);
            await this.sleep(backoffDelay);
            continue;
          }
          
        } else if (this.isRetryableError(null, response)) {
          log(`⚠️ Retryable error (${response.status}): ${response.statusText}`);
          
          if (attempt < this.maxRetries - 1) {
            await this.sleep(this.retryDelayMs * (attempt + 1));
            continue;
          }
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      } catch (error) {
        log(`❌ Attempt ${attempt + 1} failed for ${url}: ${error.message}`);
        
        if (attempt < this.maxRetries - 1 && this.isRetryableError(error)) {
          const delay = this.retryDelayMs * Math.pow(2, attempt);
          log(`⏳ Retrying in ${delay}ms...`);
          await this.sleep(delay);
          continue;
        }
        
        // Last attempt failed - try synthetic content for important documents
        if (this.isLegislationGovAu(url) || this.isAustLII(url)) {
          log(`🔄 All attempts failed, generating synthetic content: ${url}`);
          return await this.generateSyntheticLegalContent(url);
        }

        throw error;
      }
    }

    throw new Error(`Failed to fetch document after ${this.maxRetries} attempts: ${url}`);
  }

  /**
   * Find alternative URL for legislation.gov.au documents
   */
  async findAlternativeLegislationUrl(originalUrl) {
    const patterns = [
      // Try different series formats
      url => url.replace('/C2024C00', '/C2023C00'),
      url => url.replace('/C2023C00', '/C2024C00'),
      url => url.replace('/C2024C00', '/C2022C00'),
      // Try removing the series number
      url => url.replace(/\/C\d{4}C\d{5}\//, '/'),
      // Try current compilation
      url => url.replace(/\/C\d{4}C\d{5}\//, '/current/'),
    ];

    for (const pattern of patterns) {
      const alternativeUrl = pattern(originalUrl);
      if (alternativeUrl !== originalUrl) {
        try {
          const response = await this.fetchWithRetry(alternativeUrl, 0);
          if (response.ok) {
            return alternativeUrl;
          }
        } catch (error) {
          // Continue trying other patterns
        }
      }
    }

    return null;
  }

  /**
   * Generate synthetic legal content when documents are unavailable
   */
  async generateSyntheticLegalContent(url) {
    const documentType = this.extractDocumentType(url);
    const jurisdiction = this.extractJurisdictionFromUrl(url);
    const title = this.extractTitleFromUrl(url);

    const syntheticContent = `
SYNTHETIC LEGAL DOCUMENT - ${title}

This is a synthetic legal document generated when the original source was unavailable.
Source URL: ${url}
Jurisdiction: ${jurisdiction}
Document Type: ${documentType}

IMPORTANT NOTICE: This synthetic content is generated for system continuity only. 
For accurate and current legal information, please:

1. Visit the official government legislation website: https://www.legislation.gov.au/
2. Contact the relevant government department
3. Consult with a qualified legal professional

Key Legal Areas Covered:
- ${documentType} regulations and requirements
- Compliance obligations
- Application procedures
- Relevant authorities and contacts

For specific legal advice related to this document, please refer to current legislation 
and consult with appropriate legal professionals.

Last Generated: ${new Date().toISOString()}
Status: Synthetic - Original document unavailable
    `.trim();

    const tags = this.extractTags(syntheticContent, url);

    // Store synthetic document
    await this.db.saveDocument({
      url,
      content: syntheticContent,
      tags,
      jurisdiction,
      document_type: documentType,
      synthetic: true,
      content_hash: crypto.createHash('md5').update(syntheticContent).digest('hex')
    });

    return {
      content: syntheticContent,
      tags,
      url,
      synthetic: true,
      cached: false
    };
  }

  /**
   * Mark document as invalid to avoid repeated fetch attempts
   */
  async markDocumentAsInvalid(url, reason) {
    try {
      await this.db.saveDocument({
        url,
        content: `INVALID DOCUMENT: ${reason}`,
        tags: ['invalid'],
        jurisdiction: this.extractJurisdictionFromUrl(url),
        document_type: 'invalid',
        synthetic: true,
        content_hash: crypto.createHash('md5').update(reason).digest('hex')
      });
      console.log(`📝 Marked document as invalid: ${url} (${reason})`);
    } catch (error) {
      console.error(`Failed to mark document as invalid: ${error.message}`);
    }
  }

  /**
   * Clean up invalid documents from database
   */
  async cleanupInvalidDocuments() {
    try {
      const allDocuments = await this.db.getAllDocuments();
      let cleanedCount = 0;

      for (const doc of allDocuments) {
        const validation = this.isValidDocument(doc.content, doc.url);
        
        if (!validation.valid) {
          console.log(`🧹 Removing invalid document: ${doc.url} (${validation.reason})`);
          await this.db.deleteDocument(doc.url);
          cleanedCount++;
        }
      }

      console.log(`✅ Cleanup complete: Removed ${cleanedCount} invalid documents`);
      return { removed: cleanedCount, total: allDocuments.length };

    } catch (error) {
      console.error(`❌ Error during cleanup: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add official Australian legislation sources
   */
  getOfficialLegislationSources() {
    return {
      'legislation.gov.au': {
        baseUrl: 'https://www.legislation.gov.au',
        searchUrl: 'https://www.legislation.gov.au/Search',
        priority: 1, // Highest priority
        description: 'Official Australian Government legislation database'
      },
      'austlii.edu.au': {
        baseUrl: 'https://www.austlii.edu.au',
        searchUrl: 'https://www.austlii.edu.au/databases.html',
        priority: 2,
        description: 'Australasian Legal Information Institute'
      },
      'comlaw.gov.au': {
        baseUrl: 'https://www.comlaw.gov.au',
        priority: 3,
        description: 'Commonwealth Law (redirects to legislation.gov.au)'
      }
    };
  }

  /**
   * Enhanced tag extraction with legislation.gov.au support
   */
  extractTags(content, url) {
    const tags = [];
    
    // Jurisdiction from URL
    if (url.includes('/cth/') || url.includes('legislation.gov.au')) tags.push('commonwealth');
    if (url.includes('/nsw/')) tags.push('nsw');
    if (url.includes('/vic/')) tags.push('vic');
    if (url.includes('/qld/')) tags.push('qld');
    if (url.includes('/wa/')) tags.push('wa');
    if (url.includes('/sa/')) tags.push('sa');
    if (url.includes('/tas/')) tags.push('tas');
    if (url.includes('/nt/')) tags.push('nt');
    if (url.includes('/act/')) tags.push('act');

    // Source type
    if (this.isLegislationGovAu(url)) tags.push('official-legislation');
    if (this.isAustLII(url)) tags.push('austlii');

    // Legal areas from content
    const lowerContent = content.toLowerCase();
    
    // Business and commercial
    if (lowerContent.includes('business') || lowerContent.includes('corporation') || 
        lowerContent.includes('company')) tags.push('business');
    
    // Food and safety
    if (lowerContent.includes('food') || lowerContent.includes('nutrition') ||
        lowerContent.includes('safety') || lowerContent.includes('hygiene')) tags.push('food');
    
    // Planning and development
    if (lowerContent.includes('planning') || lowerContent.includes('development') ||
        lowerContent.includes('building') || lowerContent.includes('construction')) tags.push('planning');
    
    // Licensing
    if (lowerContent.includes('license') || lowerContent.includes('licence') ||
        lowerContent.includes('permit') || lowerContent.includes('approval')) tags.push('licensing');
    
    // Environment
    if (lowerContent.includes('environment') || lowerContent.includes('pollution') ||
        lowerContent.includes('waste') || lowerContent.includes('emission')) tags.push('environment');
    
    // Consumer protection
    if (lowerContent.includes('consumer') || lowerContent.includes('trade') ||
        lowerContent.includes('fair trading') || lowerContent.includes('competition')) tags.push('consumer');
    
    // Hospitality
    if (lowerContent.includes('liquor') || lowerContent.includes('alcohol') ||
        lowerContent.includes('gaming') || lowerContent.includes('entertainment')) tags.push('hospitality');
    
    // Health
    if (lowerContent.includes('health') || lowerContent.includes('medical') ||
        lowerContent.includes('therapeutic') || lowerContent.includes('pharmacy')) tags.push('health');
    
    // Employment
    if (lowerContent.includes('employment') || lowerContent.includes('workplace') ||
        lowerContent.includes('industrial') || lowerContent.includes('fair work')) tags.push('employment');

    // Property and real estate
    if (lowerContent.includes('property') || lowerContent.includes('real estate') ||
        lowerContent.includes('conveyancing') || lowerContent.includes('strata')) tags.push('property');

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Extract jurisdiction from URL
   */
  extractJurisdictionFromUrl(url) {
    if (url.includes('/cth/') || url.includes('legislation.gov.au')) return 'Commonwealth';
    if (url.includes('/nsw/')) return 'NSW';
    if (url.includes('/vic/')) return 'VIC';
    if (url.includes('/qld/')) return 'QLD';
    if (url.includes('/wa/')) return 'WA';
    if (url.includes('/sa/')) return 'SA';
    if (url.includes('/tas/')) return 'TAS';
    if (url.includes('/nt/')) return 'NT';
    if (url.includes('/act/')) return 'ACT';
    return 'Australia';
  }

  /**
   * Extract document type from URL
   */
  extractDocumentType(url) {
    if (url.includes('consol_act')) return 'Act';
    if (url.includes('consol_reg')) return 'Regulation';
    if (url.includes('num_reg')) return 'Regulation';
    if (url.includes('num_act')) return 'Act';
    if (url.includes('legislation.gov.au/Details/')) return 'Legislation';
    if (url.includes('legislation.gov.au/Series/')) return 'Act';
    return 'Legal Document';
  }

  /**
   * Extract title from URL for synthetic content
   */
  extractTitleFromUrl(url) {
    // Extract from legislation.gov.au URLs
    if (this.isLegislationGovAu(url)) {
      const match = url.match(/\/([^\/]+)$/);
      if (match) {
        return match[1].replace(/([A-Z])/g, ' $1').trim();
      }
    }

    // Extract from AustLII URLs  
    if (this.isAustLII(url)) {
      const parts = url.split('/');
      const filename = parts[parts.length - 2] || parts[parts.length - 1];
      return filename.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\d{4}/g, '').trim();
    }

    return 'Legal Document';
  }

  /**
   * Enhanced HTML text extraction
   */
  extractTextFromHtml(html) {
    try {
      if (!JSDOM) {
        throw new Error('JSDOM not available');
      }
      
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Remove script and style elements
      const scripts = document.querySelectorAll('script, style, nav, header, footer');
      scripts.forEach(el => el.remove());

      // Get main content areas first
      let content = '';
      const contentSelectors = [
        'main',
        '.content',
        '#content', 
        '.main-content',
        'article',
        '.article-content',
        '.document-content'
      ];

      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim().length > 500) {
          content = element.textContent;
          break;
        }
      }

      // Fallback to body if no main content found
      if (!content) {
        content = document.body ? document.body.textContent : html;
      }

      // Clean up the text
      return content
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();

    } catch (error) {
      console.warn('Failed to parse HTML with JSDOM, falling back to regex:', error.message);
      
      // Fallback to regex-based extraction
      let text = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();

      return text;
    }
  }
}

module.exports = { EnhancedDocumentFetcher };