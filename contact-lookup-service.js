#!/usr/bin/env node

// Contact Lookup Service
// Matches authority names in responses and enriches them with contact information

export class ContactLookupService {
  constructor(db) {
    this.db = db;
    this.authorityCache = new Map();
    this.lastCacheUpdate = 0;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async refreshCache() {
    const now = Date.now();
    if (now - this.lastCacheUpdate < this.cacheTimeout && this.authorityCache.size > 0) {
      return; // Cache is still fresh
    }

    console.log('🔄 Refreshing authority contact cache...');
    const authorities = await this.db.getAllAuthorities();
    
    this.authorityCache.clear();
    for (const auth of authorities) {
      // Create multiple lookup keys for flexibility
      const keys = [
        auth.name.toLowerCase(),
        auth.official_name?.toLowerCase(),
        // Add variations
        auth.name.toLowerCase().replace(/\s+/g, ''),
        auth.official_name?.toLowerCase().replace(/\s+/g, '')
      ].filter(Boolean);

      for (const key of keys) {
        this.authorityCache.set(key, auth);
      }
    }

    this.lastCacheUpdate = now;
    console.log(`📋 Cached ${authorities.length} authorities with ${this.authorityCache.size} lookup keys`);
  }

  async findAuthorityContact(authorityName, jurisdiction = null) {
    await this.refreshCache();
    
    if (!authorityName) return null;

    // Try exact match first
    let key = authorityName.toLowerCase();
    let authority = this.authorityCache.get(key);
    
    if (!authority) {
      // Try without spaces
      key = authorityName.toLowerCase().replace(/\s+/g, '');
      authority = this.authorityCache.get(key);
    }

    if (!authority) {
      // Try partial matches
      for (const [cacheKey, auth] of this.authorityCache.entries()) {
        if (cacheKey.includes(key) || key.includes(cacheKey)) {
          // If jurisdiction is specified, prefer matching jurisdiction
          if (jurisdiction && auth.jurisdiction?.toLowerCase() === jurisdiction.toLowerCase()) {
            authority = auth;
            break;
          } else if (!jurisdiction) {
            authority = auth;
            break;
          }
        }
      }
    }

    return authority;
  }

  // Enrich action steps with contact information
  async enrichActionsWithContacts(actions, jurisdiction = null) {
    if (!actions || !Array.isArray(actions)) return actions;

    const enrichedActions = [];
    
    for (const action of actions) {
      const enrichedAction = { ...action };
      
      // Try to extract authority name from action description
      const authorityName = this.extractAuthorityFromText(action.desc || action.text || '');
      
      if (authorityName) {
        const contact = await this.findAuthorityContact(authorityName, jurisdiction);
        
        if (contact) {
          // Only add contact info if not already present
          if (!enrichedAction.contact_phone && contact.contact_phone) {
            enrichedAction.contact_phone = contact.contact_phone;
          }
          if (!enrichedAction.contact_email && contact.contact_email) {
            enrichedAction.contact_email = contact.contact_email;
          }
          if (!enrichedAction.contact_website && contact.website) {
            enrichedAction.contact_website = contact.website;
          }
          if (!enrichedAction.contact_chatbot && contact.contact_chatbot) {
            enrichedAction.contact_chatbot = contact.contact_chatbot;
          }
          if (!enrichedAction.contact_hours && contact.contact_hours) {
            enrichedAction.contact_hours = contact.contact_hours;
          }
          
          console.log(`📞 Enriched action with ${contact.name} contact info`);
        }
      }
      
      enrichedActions.push(enrichedAction);
    }
    
    return enrichedActions;
  }

  // Extract authority names from text using common patterns
  extractAuthorityFromText(text) {
    if (!text) return null;
    
    const patterns = [
      // "Contact ASIC", "Register with ASIC"
      /(?:contact|register with|apply to|visit|call)\s+([A-Z][A-Z\s&]+)(?:\s|$|\.|\,)/i,
      // "ASIC registration", "ATO requirements"
      /([A-Z][A-Z\s&]+?)\s+(?:registration|requirements|permits?|licen[cs]es?|approval)/i,
      // "Australian Securities and Investments Commission"
      /(Australian\s+[A-Z][a-z\s]+Commission)/i,
      // "City Council", "Brisbane City Council"
      /([A-Z][a-z]+\s+City\s+Council)/i,
      // "Office of Fair Trading"
      /(Office\s+of\s+[A-Z][a-z\s]+)/i,
      // Generic department patterns
      /(Department\s+of\s+[A-Z][a-z\s]+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Check for known abbreviations
    const abbreviations = ['ASIC', 'ATO', 'ABR', 'ACMA', 'APRA'];
    for (const abbrev of abbreviations) {
      if (text.toUpperCase().includes(abbrev)) {
        return abbrev;
      }
    }

    return null;
  }

  // Auto-discover new authorities mentioned in documents
  async discoverNewAuthority(authorityName, jurisdiction = null, sourceUrl = null) {
    // Check if we already have this authority
    const existing = await this.findAuthorityContact(authorityName, jurisdiction);
    if (existing) return existing;

    console.log(`🔍 Discovering new authority: ${authorityName} (${jurisdiction || 'unknown jurisdiction'})`);

    // Try to find contact information through web search
    const contactInfo = await this.searchAuthorityContact(authorityName, jurisdiction);
    
    if (contactInfo) {
      // Save the discovered authority to database
      await this.db.saveAuthority({
        name: authorityName,
        official_name: contactInfo.official_name || authorityName,
        jurisdiction: jurisdiction || 'unknown',
        jurisdiction_level: this.guessJurisdictionLevel(authorityName),
        website: contactInfo.website,
        contact_phone: contactInfo.phone,
        contact_email: contactInfo.email,
        contact_chatbot: contactInfo.chatbot,
        contact_hours: contactInfo.hours,
        postal_address: contactInfo.address
      });

      console.log(`✅ Added new authority: ${authorityName}`);
      
      // Clear cache to include new authority
      this.authorityCache.clear();
      this.lastCacheUpdate = 0;
      
      return await this.findAuthorityContact(authorityName, jurisdiction);
    }

    return null;
  }

  // Search for authority contact information
  async searchAuthorityContact(authorityName, jurisdiction) {
    // This would implement web scraping logic
    // For now, return basic structure that can be enhanced later
    
    const searchQueries = [
      `${authorityName} contact information australia`,
      `${authorityName} phone email ${jurisdiction || ''}`,
      `${authorityName} official website`
    ];

    // Placeholder for actual web scraping implementation
    console.log(`🌐 Would search for: ${searchQueries[0]}`);
    
    // Return null for now - this is where web scraping would happen
    return null;
  }

  // Guess jurisdiction level from authority name patterns
  guessJurisdictionLevel(authorityName) {
    const name = authorityName.toLowerCase();
    
    if (name.includes('australian') || name.includes('federal') || 
        name.includes('commonwealth') || name.match(/^a[a-z]{2,4}$/)) {
      return 'federal';
    }
    
    if (name.includes('council') || name.includes('city of') || name.includes('shire')) {
      return 'council';
    }
    
    if (name.includes('nsw') || name.includes('vic') || name.includes('qld') || 
        name.includes('wa') || name.includes('sa') || name.includes('tas') || name.includes('nt')) {
      return 'state';
    }
    
    return 'unknown';
  }

  // Process documents and discover new authorities
  async processDocumentForAuthorities(documentContent, jurisdiction = null, sourceUrl = null) {
    if (!documentContent) return [];

    const authorities = this.extractAllAuthorities(documentContent);
    const discovered = [];

    for (const authorityName of authorities) {
      try {
        const authority = await this.discoverNewAuthority(authorityName, jurisdiction, sourceUrl);
        if (authority) {
          discovered.push(authority);
        }
      } catch (error) {
        console.warn(`Failed to discover authority ${authorityName}:`, error.message);
      }
    }

    return discovered;
  }

  // Extract all possible authority names from document content
  extractAllAuthorities(text) {
    if (!text) return [];
    
    const authorities = new Set();
    
    // Multiple extraction patterns
    const patterns = [
      // Department of...
      /(Department\s+of\s+[A-Z][a-z\s,]+?)(?=\s|$|\.|,|\()/gi,
      // Office of...
      /(Office\s+of\s+[A-Z][a-z\s,]+?)(?=\s|$|\.|,|\()/gi,
      // Australian ... Commission/Authority/Office
      /(Australian\s+[A-Z][a-z\s]+?(?:Commission|Authority|Office|Agency|Bureau))(?=\s|$|\.|,|\()/gi,
      // State agencies (NSW Fair Trading, etc.)
      /([A-Z]{2,3}\s+[A-Z][a-z\s]+?)(?=\s|$|\.|,|\()/gi,
      // City/Town Councils
      /([A-Z][a-z]+\s+(?:City|Town|Shire)\s+Council)(?=\s|$|\.|,|\()/gi,
      // Council of/for...
      /(Council\s+(?:of|for)\s+[A-Z][a-z\s]+?)(?=\s|$|\.|,|\()/gi,
      // Common abbreviations in uppercase
      /\b([A-Z]{3,6})\b/g
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 2) {
          const authority = match[1].trim().replace(/\s+/g, ' ');
          // Filter out common false positives
          if (!this.isCommonFalsePositive(authority)) {
            authorities.add(authority);
          }
        }
      }
    }

    return Array.from(authorities);
  }

  // Filter out common false positives
  isCommonFalsePositive(text) {
    const falsePositives = [
      'THE', 'AND', 'FOR', 'WITH', 'FROM', 'THAT', 'THIS', 'HAVE', 'WILL',
      'ARE', 'WAS', 'HAS', 'BUT', 'NOT', 'CAN', 'ALL', 'ANY', 'MAY', 'NEW',
      'WAY', 'USE', 'HER', 'YOU', 'OUR', 'OUT', 'DAY', 'GET', 'SEE', 'HIM',
      'OLD', 'NOW', 'ITS', 'WHO', 'DID', 'YES', 'HIS', 'HAS', 'HAD'
    ];
    
    return falsePositives.includes(text.toUpperCase()) || 
           text.length < 3 || 
           /^\d+$/.test(text);
  }

  // Get contact info for a specific authority by name
  async getContactInfo(authorityName, jurisdiction = null) {
    const contact = await this.findAuthorityContact(authorityName, jurisdiction);
    
    if (!contact) return null;

    return {
      name: contact.name,
      official_name: contact.official_name,
      phone: contact.contact_phone,
      email: contact.contact_email,
      website: contact.website,
      chatbot: contact.contact_chatbot,
      hours: contact.contact_hours,
      address: contact.postal_address
    };
  }
}