import { db, generateId, type Jurisdiction, type LocationMapping, type AuthorityContact, type FeeSchedule } from "./database";
import { ReferenceDataService } from "./referenceDataService";

// Data ingestion service to populate reference data from various sources
export class DataIngestionService {
  private referenceDataService = new ReferenceDataService();

  // Seed initial jurisdictions (federal, states, territories)
  async seedJurisdictions(): Promise<void> {
    const jurisdictions = [
      // Federal
      { name: 'Australian Government', type: 'federal', state_code: 'au' },
      
      // States and Territories
      { name: 'New South Wales Government', type: 'state', state_code: 'nsw' },
      { name: 'Victoria Government', type: 'state', state_code: 'vic' },
      { name: 'Queensland Government', type: 'state', state_code: 'qld' },
      { name: 'Western Australia Government', type: 'state', state_code: 'wa' },
      { name: 'South Australia Government', type: 'state', state_code: 'sa' },
      { name: 'Tasmania Government', type: 'state', state_code: 'tas' },
      { name: 'Northern Territory Government', type: 'territory', state_code: 'nt' },
      { name: 'Australian Capital Territory Government', type: 'territory', state_code: 'act' },
    ];

    for (const jurisdiction of jurisdictions) {
      await this.upsertJurisdiction({
        id: generateId(),
        name: jurisdiction.name,
        type: jurisdiction.type as any,
        state_code: jurisdiction.state_code,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    console.log(`✅ Seeded ${jurisdictions.length} base jurisdictions`);
  }

  // Ingest council data from existing location mapper
  async ingestCouncilData(): Promise<void> {
    // Use web search to discover Australian councils
    const councilData = await this.discoverAustralianCouncils();
    
    let ingestedCount = 0;
    for (const council of councilData) {
      try {
        // Create jurisdiction entry for council
        const councilJurisdiction: Partial<Jurisdiction> = {
          id: generateId(),
          name: council.name,
          official_name: council.official_name,
          type: 'council',
          state_code: council.state_code,
          council_code: council.code,
          website_url: council.website,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        };

        await this.upsertJurisdiction(councilJurisdiction as Jurisdiction);

        // Create location mappings for cities/suburbs served by this council
        for (const location of council.locations) {
          await this.upsertLocationMapping({
            id: generateId(),
            location_name: location.name,
            location_type: location.type as any,
            state_code: council.state_code,
            council_id: councilJurisdiction.id!,
            postcode_range: location.postcodes,
            created_at: new Date(),
            updated_at: new Date()
          });
        }

        // Discover and cache contact information
        await this.ingestCouncilContactInfo(council.name, council.state_code, councilJurisdiction.id!);
        
        ingestedCount++;
      } catch (error) {
        console.error(`Failed to ingest council ${council.name}:`, error);
      }
    }

    console.log(`✅ Ingested ${ingestedCount} councils with location mappings`);
  }

  // Discover fee information from government websites
  async ingestFeeSchedules(): Promise<void> {
    const feeCategories = [
      'business_registration',
      'food_license',
      'development_permit',
      'building_permit',
      'planning_application'
    ];

    const states = ['nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'nt', 'act'];
    
    for (const state of states) {
      const stateJurisdiction = await this.getJurisdictionByStateCode(state);
      if (!stateJurisdiction) continue;

      for (const category of feeCategories) {
        try {
          const fees = await this.scrapeGovernmentFees(state, category);
          for (const fee of fees) {
            await this.upsertFeeSchedule({
              id: generateId(),
              jurisdiction_id: stateJurisdiction.id,
              fee_category: category,
              fee_type: fee.type,
              description: fee.description,
              min_cost: fee.min_cost,
              max_cost: fee.max_cost,
              currency: 'AUD',
              unit: fee.unit,
              source_url: fee.source_url,
              effective_date: new Date(),
              last_updated: new Date(),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            });
          }
        } catch (error) {
          console.error(`Failed to ingest fees for ${state}/${category}:`, error);
        }
      }
    }

    console.log('✅ Fee schedule ingestion completed');
  }

  // Periodic data refresh from external sources
  async refreshExternalData(): Promise<void> {
    console.log('🔄 Starting external data refresh...');
    
    try {
      // Refresh authority contacts
      await this.refreshAuthorityContacts();
      
      // Refresh fee schedules
      await this.refreshFeeSchedules();
      
      // Deduplication pass
      await this.referenceDataService.deduplicateData();
      
      // Clean up expired cache entries
      await this.cleanupExpiredCache();
      
      console.log('✅ External data refresh completed');
    } catch (error) {
      console.error('❌ External data refresh failed:', error);
    }
  }

  // Private helper methods
  private async discoverAustralianCouncils(): Promise<any[]> {
    // This would use web scraping to discover Australian councils
    // For now, return a curated set based on the existing location-mapper.js data
    return [
      {
        name: 'Sydney City Council',
        official_name: 'City of Sydney',
        state_code: 'nsw',
        code: 'sydney',
        website: 'https://www.cityofsydney.nsw.gov.au',
        locations: [
          { name: 'Sydney', type: 'city', postcodes: '2000-2009' },
          { name: 'Darlinghurst', type: 'suburb', postcodes: '2010' },
          { name: 'Surry Hills', type: 'suburb', postcodes: '2010' }
        ]
      },
      {
        name: 'Melbourne City Council',
        official_name: 'City of Melbourne',
        state_code: 'vic',
        code: 'melbourne',
        website: 'https://www.melbourne.vic.gov.au',
        locations: [
          { name: 'Melbourne', type: 'city', postcodes: '3000-3006' },
          { name: 'Docklands', type: 'suburb', postcodes: '3008' },
          { name: 'Southbank', type: 'suburb', postcodes: '3006' }
        ]
      },
      {
        name: 'Brisbane City Council',
        official_name: 'Brisbane City Council',
        state_code: 'qld', 
        code: 'brisbane',
        website: 'https://www.brisbane.qld.gov.au',
        locations: [
          { name: 'Brisbane', type: 'city', postcodes: '4000-4179' },
          { name: 'South Bank', type: 'suburb', postcodes: '4101' },
          { name: 'New Farm', type: 'suburb', postcodes: '4005' }
        ]
      },
      {
        name: 'Perth City Council', 
        official_name: 'City of Perth',
        state_code: 'wa',
        code: 'perth',
        website: 'https://www.perth.wa.gov.au',
        locations: [
          { name: 'Perth', type: 'city', postcodes: '6000-6015' },
          { name: 'Northbridge', type: 'suburb', postcodes: '6003' },
          { name: 'East Perth', type: 'suburb', postcodes: '6004' }
        ]
      },
      {
        name: 'Adelaide City Council',
        official_name: 'City of Adelaide',
        state_code: 'sa',
        code: 'adelaide',
        website: 'https://www.cityofadelaide.com.au',
        locations: [
          { name: 'Adelaide', type: 'city', postcodes: '5000-5999' },
          { name: 'North Adelaide', type: 'suburb', postcodes: '5006' }
        ]
      }
    ];
  }

  private async ingestCouncilContactInfo(councilName: string, stateCode: string, jurisdictionId: string): Promise<void> {
    try {
      // Use web search to find contact information
      const contactData = await this.webSearchCouncilContact(councilName, stateCode);
      
      if (contactData) {
        await this.upsertAuthorityContact({
          id: generateId(),
          jurisdiction_id: jurisdictionId,
          authority_name: councilName,
          contact_type: 'council',
          phone: contactData.phone,
          email: contactData.email,
          website_url: contactData.website,
          physical_address: contactData.address,
          operating_hours: contactData.hours,
          services: JSON.stringify(['general inquiries', 'permits', 'planning']),
          last_verified: new Date(),
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    } catch (error) {
      console.error(`Failed to ingest contact info for ${councilName}:`, error);
    }
  }

  private async scrapeGovernmentFees(state: string, category: string): Promise<any[]> {
    // This would scrape government websites for current fee information
    // Return sample data for now to avoid external dependencies during implementation
    return [
      {
        type: 'standard_application',
        description: `${category.replace('_', ' ')} standard application fee`,
        min_cost: 50,
        max_cost: 500,
        unit: 'per application',
        source_url: `https://${state}.gov.au/fees/${category}`
      }
    ];
  }

  private async webSearchCouncilContact(councilName: string, stateCode: string): Promise<any> {
    // This would use WebSearch to find council contact information
    // Return null for now to avoid external API calls during implementation
    return null;
  }

  private async upsertJurisdiction(jurisdiction: Jurisdiction): Promise<void> {
    const existing = await db.query(
      `SELECT id FROM jurisdictions WHERE name = ? AND state_code = ?`,
      [jurisdiction.name, jurisdiction.state_code]
    );

    if (existing.length > 0) {
      // Update existing
      await db.query(
        `UPDATE jurisdictions SET 
          official_name = ?, website_url = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [jurisdiction.official_name, jurisdiction.website_url, existing[0].id]
      );
    } else {
      // Insert new
      await db.query(
        `INSERT INTO jurisdictions (id, name, official_name, type, state_code, council_code, website_url, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          jurisdiction.id,
          jurisdiction.name, 
          jurisdiction.official_name,
          jurisdiction.type,
          jurisdiction.state_code,
          jurisdiction.council_code,
          jurisdiction.website_url,
          jurisdiction.is_active,
          jurisdiction.created_at,
          jurisdiction.updated_at
        ]
      );
    }
  }

  private async upsertLocationMapping(mapping: LocationMapping): Promise<void> {
    const existing = await db.query(
      `SELECT id FROM location_mappings WHERE location_name = ? AND state_code = ?`,
      [mapping.location_name, mapping.state_code]
    );

    if (existing.length === 0) {
      await db.query(
        `INSERT INTO location_mappings (id, location_name, location_type, state_code, council_id, postcode_range, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mapping.id,
          mapping.location_name,
          mapping.location_type,
          mapping.state_code,
          mapping.council_id,
          mapping.postcode_range,
          mapping.created_at,
          mapping.updated_at
        ]
      );
    }
  }

  private async upsertAuthorityContact(contact: AuthorityContact): Promise<void> {
    const existing = await db.query(
      `SELECT id FROM authority_contacts WHERE authority_name = ? AND jurisdiction_id = ?`,
      [contact.authority_name, contact.jurisdiction_id]
    );

    if (existing.length > 0) {
      // Update existing
      await db.query(
        `UPDATE authority_contacts SET 
          phone = ?, email = ?, website_url = ?, operating_hours = ?, 
          last_verified = datetime('now'), updated_at = datetime('now')
         WHERE id = ?`,
        [contact.phone, contact.email, contact.website_url, contact.operating_hours, existing[0].id]
      );
    } else {
      // Insert new
      await db.query(
        `INSERT INTO authority_contacts (id, jurisdiction_id, authority_name, contact_type, phone, email, website_url, physical_address, operating_hours, services, last_verified, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          contact.id,
          contact.jurisdiction_id,
          contact.authority_name,
          contact.contact_type,
          contact.phone,
          contact.email,
          contact.website_url,
          contact.physical_address,
          contact.operating_hours,
          contact.services,
          contact.last_verified,
          contact.is_active,
          contact.created_at,
          contact.updated_at
        ]
      );
    }
  }

  private async upsertFeeSchedule(fee: FeeSchedule): Promise<void> {
    const existing = await db.query(
      `SELECT id FROM fee_schedules WHERE jurisdiction_id = ? AND fee_category = ? AND fee_type = ?`,
      [fee.jurisdiction_id, fee.fee_category, fee.fee_type]
    );

    if (existing.length > 0) {
      // Update existing
      await db.query(
        `UPDATE fee_schedules SET 
          min_cost = ?, max_cost = ?, description = ?, source_url = ?,
          last_updated = datetime('now'), updated_at = datetime('now')
         WHERE id = ?`,
        [fee.min_cost, fee.max_cost, fee.description, fee.source_url, existing[0].id]
      );
    } else {
      // Insert new
      await db.query(
        `INSERT INTO fee_schedules (id, jurisdiction_id, fee_category, fee_type, description, min_cost, max_cost, currency, unit, source_url, effective_date, last_updated, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          fee.id,
          fee.jurisdiction_id,
          fee.fee_category,
          fee.fee_type,
          fee.description,
          fee.min_cost,
          fee.max_cost,
          fee.currency,
          fee.unit,
          fee.source_url,
          fee.effective_date,
          fee.last_updated,
          fee.is_active,
          fee.created_at,
          fee.updated_at
        ]
      );
    }
  }

  private async getJurisdictionByStateCode(stateCode: string): Promise<Jurisdiction | null> {
    const results = await db.query(
      `SELECT * FROM jurisdictions WHERE state_code = ? AND type = 'state'`,
      [stateCode]
    );
    return results.length > 0 ? results[0] : null;
  }

  private async refreshAuthorityContacts(): Promise<void> {
    // Mark old contacts for reverification
    await db.query(
      `UPDATE authority_contacts 
       SET last_verified = datetime('now', '-30 days') 
       WHERE last_verified < datetime('now', '-7 days')`
    );
  }

  private async refreshFeeSchedules(): Promise<void> {
    // Mark old fee schedules as potentially outdated
    await db.query(
      `UPDATE fee_schedules 
       SET last_updated = datetime('now', '-60 days')
       WHERE last_updated < datetime('now', '-30 days')`
    );
  }

  private async cleanupExpiredCache(): Promise<void> {
    await db.query(
      `DELETE FROM external_data_cache WHERE expires_at < datetime('now')`
    );
  }
}