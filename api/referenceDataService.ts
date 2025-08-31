import { db } from "./database";

// Interfaces for reference data
export interface Authority {
  id?: number;
  name: string;
  official_name?: string;
  jurisdiction: string;
  jurisdiction_level: 'federal' | 'state' | 'council';
  website?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_chatbot?: string;
  contact_hours?: string;
  postal_address?: string;
  abn?: string;
  services?: string[]; // JSON array
  last_updated?: Date;
  created_at?: Date;
}

export interface LocationMapping {
  id?: number;
  state_code: string;
  state_name: string;
  council_id?: string;
  council_name?: string;
  council_official_name?: string;
  postcode_ranges?: string[]; // JSON array
  major_cities?: string[]; // JSON array
  area_type?: 'metro' | 'regional' | 'remote';
  population?: number;
  website?: string;
  contact_info?: any; // JSON object
  created_at?: Date;
}

export interface FeeSchedule {
  id?: number;
  authority_id: number;
  service_type: string;
  service_description?: string;
  base_cost?: number; // cents
  variable_factors?: any; // JSON object
  cost_min?: number; // cents
  cost_max?: number; // cents
  timeframe_min?: number; // days
  timeframe_max?: number; // days
  last_updated?: Date;
  created_at?: Date;
}

export interface RequirementTemplate {
  id?: number;
  template_name: string;
  activity_type: string;
  jurisdiction_level: 'federal' | 'state' | 'council';
  jurisdiction_filter?: string[]; // JSON array
  mandatory?: boolean;
  priority_level?: 'low' | 'medium' | 'high' | 'urgent';
  steps: any[]; // JSON array of step objects
  estimated_cost_min?: number; // cents
  estimated_cost_max?: number; // cents
  estimated_timeframe_min?: number; // days
  estimated_timeframe_max?: number; // days
  requirements?: string[]; // JSON array
  notes?: string[]; // JSON array
  created_at?: Date;
}

export interface AustralianCouncil {
  id?: number;
  council_code: string;
  council_name: string;
  official_name: string;
  state_code: string;
  state_name: string;
  council_type?: string;
  population?: number;
  area_sq_km?: number;
  website?: string;
  abn?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  operating_hours?: string;
  mayor_name?: string;
  ceo_name?: string;
  established_date?: Date;
  postcode_ranges?: string[]; // JSON array
  major_suburbs?: string[]; // JSON array
  economic_profile?: any; // JSON object
  services_offered?: string[]; // JSON array
  development_assessment_info?: any; // JSON object
  business_support_info?: any; // JSON object
  last_updated?: Date;
  created_at?: Date;
}

export interface LocationResolutionResult {
  address: string;
  state?: string;
  council?: string;
  country: string;
  confidence: number;
  source: 'database' | 'fallback';
}

export interface ContactInfo {
  authority: string;
  type: string;
  phone?: string;
  email?: string;
  url: string;
  operatingHours?: string;
}

export interface CostCalculation {
  estimatedCost: string;
  breakdown: {
    service: string;
    cost_min: number;
    cost_max: number;
    currency: string;
  }[];
  total_min: number;
  total_max: number;
  currency: string;
}

export class ReferenceDataService {
  
  // Location Resolution Methods
  async resolveLocation(query: string, address?: string): Promise<LocationResolutionResult> {
    const location = address || query;
    if (!location) {
      return {
        address: 'Australia',
        country: 'Australia',
        confidence: 0.3,
        source: 'fallback'
      };
    }

    const locationLower = location.toLowerCase();
    
    // Enhanced location mapping with more Australian councils
    const stateMap: Record<string, string> = {
      'nsw': 'New South Wales',
      'new south wales': 'New South Wales',
      'vic': 'Victoria',
      'victoria': 'Victoria',
      'qld': 'Queensland', 
      'queensland': 'Queensland',
      'wa': 'Western Australia',
      'western australia': 'Western Australia',
      'sa': 'South Australia',
      'south australia': 'South Australia',
      'tas': 'Tasmania',
      'tasmania': 'Tasmania',
      'nt': 'Northern Territory',
      'northern territory': 'Northern Territory',
      'act': 'Australian Capital Territory',
      'australian capital territory': 'Australian Capital Territory',
      'canberra': 'Australian Capital Territory'
    };

    const cityCouncilMap: Record<string, string> = {
      // NSW
      'sydney': 'City of Sydney',
      'parramatta': 'City of Parramatta',
      'blacktown': 'Blacktown City Council',
      'penrith': 'Penrith City Council',
      'liverpool': 'Liverpool City Council',
      
      // VIC  
      'melbourne': 'City of Melbourne',
      'monash': 'Monash City Council',
      'casey': 'City of Casey',
      'frankston': 'Frankston City Council',
      'greater dandenong': 'City of Greater Dandenong',
      
      // QLD
      'brisbane': 'Brisbane City Council',
      'gold coast': 'City of Gold Coast',
      'logan': 'Logan City Council',
      'ipswich': 'Ipswich City Council',
      'moreton bay': 'Moreton Bay Regional Council',
      
      // WA
      'perth': 'City of Perth',
      'swan': 'City of Swan',
      'stirling': 'City of Stirling',
      'wanneroo': 'City of Wanneroo',
      'joondalup': 'City of Joondalup',
      
      // SA
      'adelaide': 'Adelaide City Council',
      'charles sturt': 'City of Charles Sturt',
      'port adelaide enfield': 'City of Port Adelaide Enfield',
      'marion': 'City of Marion',
      'onkaparinga': 'City of Onkaparinga',
      
      // TAS
      'hobart': 'City of Hobart',
      'launceston': 'City of Launceston',
      'devonport': 'Devonport City Council',
      'burnie': 'Burnie City Council',
      
      // NT
      'darwin': 'City of Darwin',
      'palmerston': 'City of Palmerston',
      'alice springs': 'Alice Springs Town Council'
    };
    
    let detectedState: string | undefined;
    for (const [key, fullName] of Object.entries(stateMap)) {
      if (locationLower.includes(key)) {
        detectedState = fullName;
        break;
      }
    }

    let detectedCouncil: string | undefined;
    for (const [city, council] of Object.entries(cityCouncilMap)) {
      if (locationLower.includes(city)) {
        detectedCouncil = council;
        break;
      }
    }

    return {
      address: address || 'Australia',
      state: detectedState,
      council: detectedCouncil,
      country: 'Australia',
      confidence: detectedCouncil ? 0.90 : (detectedState ? 0.75 : 0.4),
      source: detectedState || detectedCouncil ? 'database' : 'fallback'
    };
  }

  // Authority Management - Simplified static data for now
  async getAuthority(name: string, jurisdiction?: string): Promise<Authority | null> {
    const staticAuthorities: Authority[] = [
      {
        name: 'ASIC',
        official_name: 'Australian Securities and Investments Commission',
        jurisdiction: 'Australia',
        jurisdiction_level: 'federal',
        website: 'https://asic.gov.au',
        contact_phone: '1300 300 630',
        contact_email: 'info@asic.gov.au',
        contact_hours: 'Monday to Friday 8:30am to 5:00pm AEST',
        services: ['Company Registration', 'Business Name Registration', 'AFSL Applications']
      },
      {
        name: 'ATO',
        official_name: 'Australian Taxation Office',
        jurisdiction: 'Australia',
        jurisdiction_level: 'federal',
        website: 'https://www.ato.gov.au',
        contact_phone: '13 28 61',
        contact_email: 'contact@ato.gov.au',
        contact_hours: 'Monday to Friday 8:00am to 6:00pm',
        services: ['Tax Return Preparation', 'ABN Registration', 'GST Registration']
      },
      {
        name: 'ABR',
        official_name: 'Australian Business Register',
        jurisdiction: 'Australia',
        jurisdiction_level: 'federal',
        website: 'https://www.abr.gov.au',
        contact_phone: '13 28 66',
        contact_email: 'help@abr.gov.au',
        contact_hours: 'Monday to Friday 8:00am to 6:00pm AEST',
        services: ['ABN Applications', 'Business Registry Searches']
      }
    ];

    const authority = staticAuthorities.find(auth => 
      auth.name.toLowerCase() === name.toLowerCase()
    );
    
    return authority || null;
  }

  async findAuthorities(searchTerm: string, jurisdictionLevel?: string): Promise<Authority[]> {
    console.warn('findAuthorities: Using static data - database queries not yet implemented');
    
    const staticAuthorities: Authority[] = [
      {
        name: 'ASIC',
        official_name: 'Australian Securities and Investments Commission',
        jurisdiction: 'Australia',
        jurisdiction_level: 'federal',
        website: 'https://asic.gov.au',
        contact_phone: '1300 300 630',
        contact_email: 'info@asic.gov.au',
        services: ['Company Registration', 'Business Name Registration']
      },
      {
        name: 'Sydney City Council',
        official_name: 'City of Sydney',
        jurisdiction: 'Sydney',
        jurisdiction_level: 'council',
        website: 'https://www.cityofsydney.nsw.gov.au',
        contact_phone: '02 9265 9333',
        contact_email: 'council@cityofsydney.nsw.gov.au',
        services: ['Development Applications', 'Food Business Licences', 'Building Permits']
      },
      {
        name: 'NSW Fair Trading',
        official_name: 'NSW Fair Trading',
        jurisdiction: 'NSW',
        jurisdiction_level: 'state',
        website: 'https://www.fairtrading.nsw.gov.au',
        contact_phone: '13 32 20',
        contact_email: 'info@fairtrading.nsw.gov.au',
        services: ['Business Licensing', 'Consumer Protection']
      }
    ];

    return staticAuthorities.filter(auth => {
      const matchesSearch = auth.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           auth.official_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = !jurisdictionLevel || auth.jurisdiction_level === jurisdictionLevel;
      return matchesSearch && matchesLevel;
    });
  }

  async findRelevantContacts(jurisdictions: string[], activityType?: string): Promise<ContactInfo[]> {
    const contacts: ContactInfo[] = [
      {
        authority: 'Australian Business Register',
        type: 'Business Registration Support',
        phone: '13 28 66',
        url: 'https://abr.business.gov.au',
        operatingHours: 'Monday to Friday, 8:00am to 6:00pm AEST'
      },
      {
        authority: 'ASIC',
        type: 'Company Registration',
        phone: '1300 300 630',
        url: 'https://asic.gov.au',
        operatingHours: 'Monday to Friday 8:30am to 5:00pm AEST'
      }
    ];

    // Add jurisdiction-specific contacts
    for (const jurisdiction of jurisdictions) {
      if (jurisdiction.toLowerCase().includes('nsw') || jurisdiction.toLowerCase().includes('new south wales')) {
        contacts.push({
          authority: 'Service NSW Business',
          type: 'State Government Support',
          phone: '13 77 88',
          url: 'https://www.service.nsw.gov.au',
          operatingHours: 'Monday to Friday, 7:00am to 7:00pm AEST'
        });
      }
      
      if (jurisdiction.toLowerCase().includes('qld') || jurisdiction.toLowerCase().includes('queensland')) {
        contacts.push({
          authority: 'Business Queensland',
          type: 'State Government Support',
          phone: '13 74 68',
          url: 'https://www.business.qld.gov.au',
          operatingHours: 'Monday to Friday, 8:30am to 4:30pm AEST'
        });
      }
    }

    return contacts.slice(0, 5); // Limit to 5 most relevant
  }

  // Fee Schedule Management - Simplified for now
  async getFeeSchedule(authorityName: string, serviceType: string): Promise<CostCalculation | null> {
    console.warn('getFeeSchedule: Using static data - database queries not yet implemented');
    
    // Static fee data for common services
    const staticFees: Record<string, Record<string, CostCalculation>> = {
      'ABR': {
        'business_registration': {
          estimatedCost: '$0',
          breakdown: [{ service: 'ABN Registration', cost_min: 0, cost_max: 0, currency: 'AUD' }],
          total_min: 0,
          total_max: 0,
          currency: 'AUD'
        }
      },
      'ASIC': {
        'business_registration': {
          estimatedCost: '$40-$500',
          breakdown: [{ service: 'Business Name Registration', cost_min: 4000, cost_max: 50000, currency: 'AUD' }],
          total_min: 4000,
          total_max: 50000,
          currency: 'AUD'
        }
      },
      'Local Council': {
        'food_business': {
          estimatedCost: '$200-$800',
          breakdown: [{ service: 'Food Business Licence', cost_min: 20000, cost_max: 80000, currency: 'AUD' }],
          total_min: 20000,
          total_max: 80000,
          currency: 'AUD'
        },
        'development_approval': {
          estimatedCost: '$500-$5,000',
          breakdown: [{ service: 'Development Application', cost_min: 50000, cost_max: 500000, currency: 'AUD' }],
          total_min: 50000,
          total_max: 500000,
          currency: 'AUD'
        }
      }
    };

    const authorityFees = staticFees[authorityName];
    if (!authorityFees) return null;
    
    return authorityFees[serviceType] || null;
  }

  // Requirement Template Management - Simplified for now
  async getRequirementTemplates(activityType: string, jurisdictionLevel?: string): Promise<RequirementTemplate[]> {
    console.warn('getRequirementTemplates: Using static data - database queries not yet implemented');
    return []; // Return empty array for now to use existing logic
  }

  // Australian Council Management - Simplified for now
  async findCouncilsByLocation(state?: string, location?: string): Promise<AustralianCouncil[]> {
    console.warn('findCouncilsByLocation: Using static data - database queries not yet implemented');
    return [];
  }

  async getAllAustralianCouncils(): Promise<AustralianCouncil[]> {
    console.warn('getAllAustralianCouncils: Using static data - database queries not yet implemented');
    return [];
  }

  // Data insertion methods - Simplified for now
  async saveAuthority(authority: Authority): Promise<void> {
    console.log(`Saving authority: ${authority.name} (static mode - not persisted)`);
  }

  async saveAustralianCouncil(council: AustralianCouncil): Promise<void> {
    console.log(`Saving council: ${council.council_name} (static mode - not persisted)`);
  }

  // Statistics methods
  async getDataStats() {
    return {
      authorities: 0,
      location_mappings: 0,
      fee_schedules: 0,
      requirement_templates: 0,
      australian_councils: 0,
      last_updated: new Date(),
      note: 'Static data mode - database not yet populated'
    };
  }
}