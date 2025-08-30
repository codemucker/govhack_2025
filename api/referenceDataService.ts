import { db, generateId, type Jurisdiction, type AuthorityContact, type LocationMapping, type FeeSchedule, type RequirementTemplate, type ExternalDataCache } from "./database";

// Dynamic reference data service to replace hardcoded values
export class ReferenceDataService {
  private cache = new Map<string, any>();
  private cacheExpiry = new Map<string, number>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // Location and jurisdiction resolution
  async resolveLocation(location: string, address?: string): Promise<{
    state?: string;
    council?: string;
    jurisdiction_id?: string;
    confidence: number;
  } | undefined> {
    const cacheKey = `location:${location}:${address || ''}`;
    
    // Check cache first
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const locationLower = location.toLowerCase();
      const searchText = `${location} ${address || ''}`.toLowerCase();

      // Find matching location mapping
      const query = `
        SELECT lm.*, j.name as council_name, j.official_name, j.state_code
        FROM location_mappings lm
        JOIN jurisdictions j ON lm.council_id = j.id
        WHERE LOWER(lm.location_name) LIKE ? 
           OR LOWER(j.name) LIKE ?
           OR LOWER(j.official_name) LIKE ?
        ORDER BY 
          CASE 
            WHEN LOWER(lm.location_name) = ? THEN 1
            WHEN LOWER(j.name) = ? THEN 2
            ELSE 3
          END,
          LENGTH(lm.location_name)
        LIMIT 1
      `;
      
      const params = [
        `%${locationLower}%`,
        `%${locationLower}%`, 
        `%${locationLower}%`,
        locationLower,
        locationLower
      ];

      const result = await db.query(query, params);
      
      if (result.length > 0) {
        const match = result[0];
        const locationData = {
          state: this.expandStateCode(match.state_code),
          council: match.council_name,
          jurisdiction_id: match.council_id,
          confidence: locationLower === match.location_name.toLowerCase() ? 0.95 : 0.85
        };
        
        this.setCache(cacheKey, locationData);
        return locationData;
      }

      // Fallback to state detection only
      const stateMatch = await this.detectStateFromText(searchText);
      if (stateMatch) {
        this.setCache(cacheKey, stateMatch);
        return stateMatch;
      }

      return undefined;
    } catch (error) {
      console.error('Location resolution failed:', error);
      return undefined;
    }
  }

  // Get authority contact information dynamically
  async getAuthorityContacts(jurisdictionIds: string[], requirementTypes: string[] = []): Promise<AuthorityContact[]> {
    try {
      let query = `
        SELECT DISTINCT ac.*
        FROM authority_contacts ac
        WHERE ac.is_active = TRUE
      `;
      const params: any[] = [];

      if (jurisdictionIds.length > 0) {
        const placeholders = jurisdictionIds.map(() => '?').join(',');
        query += ` AND ac.jurisdiction_id IN (${placeholders})`;
        params.push(...jurisdictionIds);
      }

      if (requirementTypes.length > 0) {
        const serviceConditions = requirementTypes.map(() => `ac.services LIKE ?`).join(' OR ');
        query += ` AND (${serviceConditions})`;
        params.push(...requirementTypes.map(type => `%${type}%`));
      }

      query += ` ORDER BY ac.last_verified DESC`;

      const contacts = await db.query(query, params);
      return contacts || [];
    } catch (error) {
      console.error('Failed to get authority contacts:', error);
      return [];
    }
  }

  // Get fee information dynamically
  async getFeeSchedule(jurisdictionId: string, category: string, feeType?: string): Promise<FeeSchedule[]> {
    try {
      let query = `
        SELECT * FROM fee_schedules 
        WHERE jurisdiction_id = ? 
          AND fee_category = ?
          AND is_active = TRUE
          AND (expiry_date IS NULL OR expiry_date > datetime('now'))
      `;
      const params = [jurisdictionId, category];

      if (feeType) {
        query += ` AND fee_type = ?`;
        params.push(feeType);
      }

      query += ` ORDER BY effective_date DESC`;

      const fees = await db.query(query, params);
      return fees || [];
    } catch (error) {
      console.error('Failed to get fee schedule:', error);
      return [];
    }
  }

  // Get requirement templates dynamically
  async getRequirementTemplates(jurisdictionId: string, activityType: string): Promise<RequirementTemplate[]> {
    try {
      const query = `
        SELECT * FROM requirement_templates
        WHERE jurisdiction_id = ? 
          AND activity_type = ?
          AND is_active = TRUE
        ORDER BY is_mandatory DESC, requirement_category
      `;

      const templates = await db.query(query, [jurisdictionId, activityType]);
      return templates || [];
    } catch (error) {
      console.error('Failed to get requirement templates:', error);
      return [];
    }
  }

  // Web scraping for missing data
  async discoverAndCacheContactInfo(authorityName: string, jurisdiction: string): Promise<AuthorityContact | null> {
    const cacheKey = `contact:${authorityName}:${jurisdiction}`;
    
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Use web search to find authority contact information
      const searchQuery = `${authorityName} ${jurisdiction} contact phone hours website official`;
      const contactInfo = await this.webSearchContactInfo(searchQuery);
      
      if (contactInfo) {
        // Store in database for future use
        const contact: AuthorityContact = {
          id: generateId(),
          jurisdiction_id: await this.getJurisdictionId(jurisdiction),
          authority_name: authorityName,
          contact_type: 'general',
          phone: contactInfo.phone,
          email: contactInfo.email,
          website_url: contactInfo.website,
          operating_hours: contactInfo.hours,
          services: JSON.stringify(contactInfo.services || []),
          last_verified: new Date(),
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        };

        await this.saveAuthorityContact(contact);
        this.setCache(cacheKey, contact);
        return contact;
      }

      return null;
    } catch (error) {
      console.error(`Failed to discover contact info for ${authorityName}:`, error);
      return null;
    }
  }

  // Deduplication strategy
  async deduplicateData(): Promise<void> {
    try {
      // Deduplicate authority contacts
      await this.deduplicateAuthorityContacts();
      
      // Deduplicate location mappings
      await this.deduplicateLocationMappings();
      
      // Deduplicate fee schedules
      await this.deduplicateFeeSchedules();
      
      console.log('✅ Data deduplication completed');
    } catch (error) {
      console.error('❌ Data deduplication failed:', error);
    }
  }

  // Private helper methods
  private isValidCache(key: string): boolean {
    return this.cache.has(key) && 
           this.cacheExpiry.has(key) && 
           Date.now() < this.cacheExpiry.get(key)!;
  }

  private setCache(key: string, value: any): void {
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + this.cacheTimeout);
  }

  private expandStateCode(stateCode: string): string {
    const stateMap: Record<string, string> = {
      'nsw': 'New South Wales',
      'vic': 'Victoria',
      'qld': 'Queensland',
      'wa': 'Western Australia',
      'sa': 'South Australia',
      'tas': 'Tasmania',
      'nt': 'Northern Territory',
      'act': 'Australian Capital Territory'
    };
    return stateMap[stateCode?.toLowerCase()] || stateCode;
  }

  private async detectStateFromText(text: string): Promise<{ state: string; confidence: number } | undefined> {
    const statePatterns = [
      { pattern: /new south wales|nsw/i, state: 'New South Wales', code: 'nsw' },
      { pattern: /victoria|vic(?!\w)/i, state: 'Victoria', code: 'vic' },
      { pattern: /queensland|qld/i, state: 'Queensland', code: 'qld' },
      { pattern: /western australia|wa(?!\w)/i, state: 'Western Australia', code: 'wa' },
      { pattern: /south australia|sa(?!\w)/i, state: 'South Australia', code: 'sa' },
      { pattern: /tasmania|tas/i, state: 'Tasmania', code: 'tas' },
      { pattern: /northern territory|nt(?!\w)/i, state: 'Northern Territory', code: 'nt' },
      { pattern: /australian capital territory|act/i, state: 'Australian Capital Territory', code: 'act' }
    ];

    for (const { pattern, state } of statePatterns) {
      if (pattern.test(text)) {
        return { state, confidence: 0.8 };
      }
    }

    return undefined;
  }

  private async getJurisdictionId(jurisdiction: string): Promise<string> {
    // Try to find existing jurisdiction or create new one
    const existing = await db.query(
      `SELECT id FROM jurisdictions WHERE LOWER(name) = ? OR LOWER(official_name) = ?`,
      [jurisdiction.toLowerCase(), jurisdiction.toLowerCase()]
    );

    if (existing.length > 0) {
      return existing[0].id;
    }

    // Create new jurisdiction entry
    const id = generateId();
    await db.query(
      `INSERT INTO jurisdictions (id, name, type, is_active, created_at, updated_at) 
       VALUES (?, ?, 'council', TRUE, datetime('now'), datetime('now'))`,
      [id, jurisdiction]
    );

    return id;
  }

  private async webSearchContactInfo(query: string): Promise<any> {
    // This would integrate with the existing WebFetch service
    // For now, return null to avoid external dependencies during implementation
    return null;
  }

  private async saveAuthorityContact(contact: AuthorityContact): Promise<void> {
    const query = `
      INSERT INTO authority_contacts (
        id, jurisdiction_id, authority_name, contact_type, phone, email, 
        website_url, operating_hours, services, last_verified, is_active, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(query, [
      contact.id,
      contact.jurisdiction_id,
      contact.authority_name,
      contact.contact_type,
      contact.phone,
      contact.email,
      contact.website_url,
      contact.operating_hours,
      contact.services,
      contact.last_verified,
      contact.is_active,
      contact.created_at,
      contact.updated_at
    ]);
  }

  private async deduplicateAuthorityContacts(): Promise<void> {
    // Remove duplicate contacts based on authority_name and jurisdiction_id
    await db.query(`
      DELETE FROM authority_contacts 
      WHERE id NOT IN (
        SELECT MIN(id) FROM authority_contacts 
        GROUP BY authority_name, jurisdiction_id
      )
    `);
  }

  private async deduplicateLocationMappings(): Promise<void> {
    // Remove duplicate location mappings
    await db.query(`
      DELETE FROM location_mappings 
      WHERE id NOT IN (
        SELECT MIN(id) FROM location_mappings 
        GROUP BY location_name, state_code
      )
    `);
  }

  private async deduplicateFeeSchedules(): Promise<void> {
    // Keep only the most recent fee schedule for each category/type/jurisdiction
    await db.query(`
      DELETE FROM fee_schedules 
      WHERE id NOT IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (
            PARTITION BY jurisdiction_id, fee_category, fee_type 
            ORDER BY effective_date DESC, last_updated DESC
          ) as rn
          FROM fee_schedules
        ) WHERE rn = 1
      )
    `);
  }
}