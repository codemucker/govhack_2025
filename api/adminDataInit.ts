import { api } from "encore.dev/api";
import { CouncilDataIngestionService } from "./councilDataIngestionService";
import { ReferenceDataService } from "./referenceDataService";

interface DataInitResponse {
  success: boolean;
  message: string;
  stats: any;
  timestamp: string;
}

// Admin endpoint to initialize reference data
export const initializeReferenceData = api(
  { method: "POST", path: "/api/admin/initialize-data" },
  async (): Promise<DataInitResponse> => {
    try {
      console.log('🚀 Starting reference data initialization...');
      
      const councilService = new CouncilDataIngestionService();
      const referenceService = new ReferenceDataService();

      // Initialize all Australian council data
      await councilService.ingestAllAustralianCouncils();

      // Seed federal authorities
      await seedFederalAuthorities(referenceService);

      // Seed state authorities  
      await seedStateAuthorities(referenceService);

      // Get final statistics
      const stats = await referenceService.getDataStats();

      return {
        success: true,
        message: 'Reference data initialization completed successfully',
        stats,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Reference data initialization failed:', error);
      return {
        success: false,
        message: `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stats: null,
        timestamp: new Date().toISOString()
      };
    }
  }
);

// Admin endpoint to get data statistics
export const getDataStats = api(
  { method: "GET", path: "/api/admin/data-stats" },
  async (): Promise<{ stats: any; timestamp: string }> => {
    const referenceService = new ReferenceDataService();
    const stats = await referenceService.getDataStats();
    
    return {
      stats,
      timestamp: new Date().toISOString()
    };
  }
);

// Admin endpoint to refresh council data
export const refreshCouncilData = api(
  { method: "POST", path: "/api/admin/refresh-councils" },
  async (): Promise<DataInitResponse> => {
    try {
      console.log('🔄 Refreshing council data...');
      
      const councilService = new CouncilDataIngestionService();
      await councilService.ingestAllAustralianCouncils();
      
      const referenceService = new ReferenceDataService();
      const stats = await referenceService.getDataStats();

      return {
        success: true,
        message: 'Council data refresh completed successfully',
        stats,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Council data refresh failed:', error);
      return {
        success: false,
        message: `Refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stats: null,
        timestamp: new Date().toISOString()
      };
    }
  }
);

// Helper function to seed federal authorities
async function seedFederalAuthorities(referenceService: ReferenceDataService): Promise<void> {
  console.log('🏛️ Seeding federal authorities...');

  const federalAuthorities = [
    {
      name: 'ASIC',
      official_name: 'Australian Securities and Investments Commission',
      jurisdiction: 'Australia',
      jurisdiction_level: 'federal' as const,
      website: 'https://asic.gov.au',
      contact_phone: '1300 300 630',
      contact_email: 'info@asic.gov.au',
      contact_hours: 'Monday to Friday 8:30am to 5:00pm AEST',
      postal_address: 'Level 5, 100 Market Street, Sydney NSW 2000',
      services: [
        'Company Registration',
        'Business Name Registration',
        'AFSL Applications',
        'Compliance and Enforcement'
      ]
    },
    {
      name: 'ATO',
      official_name: 'Australian Taxation Office',
      jurisdiction: 'Australia',
      jurisdiction_level: 'federal' as const,
      website: 'https://www.ato.gov.au',
      contact_phone: '13 28 61',
      contact_email: 'contact@ato.gov.au',
      contact_hours: 'Monday to Friday 8:00am to 6:00pm',
      postal_address: 'Australian Taxation Office, PO Box 9990, Penrith NSW 2740',
      services: [
        'Tax Return Preparation',
        'ABN Registration',
        'GST Registration',
        'Business Activity Statements',
        'Tax Compliance'
      ]
    },
    {
      name: 'ABR',
      official_name: 'Australian Business Register',
      jurisdiction: 'Australia',
      jurisdiction_level: 'federal' as const,
      website: 'https://www.abr.gov.au',
      contact_phone: '13 28 66',
      contact_email: 'help@abr.gov.au',
      contact_hours: 'Monday to Friday 8:00am to 6:00pm AEST',
      services: [
        'ABN Applications',
        'Business Registry Searches',
        'Business Details Updates'
      ]
    },
    {
      name: 'ACMA',
      official_name: 'Australian Communications and Media Authority',
      jurisdiction: 'Australia',
      jurisdiction_level: 'federal' as const,
      website: 'https://www.acma.gov.au',
      contact_phone: '1800 803 772',
      contact_email: 'info@acma.gov.au',
      services: [
        'Telecommunications Licensing',
        'Broadcasting Licenses',
        'Internet Regulation'
      ]
    }
  ];

  for (const authority of federalAuthorities) {
    try {
      await referenceService.saveAuthority(authority);
      console.log(`💾 Saved federal authority: ${authority.official_name}`);
    } catch (error) {
      console.warn(`Failed to save federal authority ${authority.name}:`, error);
    }
  }
}

// Helper function to seed state authorities
async function seedStateAuthorities(referenceService: ReferenceDataService): Promise<void> {
  console.log('🏛️ Seeding state authorities...');

  const stateAuthorities = [
    // NSW
    {
      name: 'NSW Fair Trading',
      official_name: 'NSW Fair Trading',
      jurisdiction: 'NSW',
      jurisdiction_level: 'state' as const,
      website: 'https://www.fairtrading.nsw.gov.au',
      contact_phone: '13 32 20',
      contact_email: 'info@fairtrading.nsw.gov.au',
      contact_hours: 'Monday to Friday 8:30am to 5:00pm',
      services: [
        'Business Licensing',
        'Consumer Protection',
        'Trader Registration',
        'Dispute Resolution'
      ]
    },
    {
      name: 'Service NSW',
      official_name: 'Service NSW',
      jurisdiction: 'NSW',
      jurisdiction_level: 'state' as const,
      website: 'https://www.service.nsw.gov.au',
      contact_phone: '13 77 88',
      contact_email: 'info@service.nsw.gov.au',
      contact_hours: 'Monday to Friday 7:00am to 7:00pm AEST',
      services: [
        'Business Registration',
        'Licensing Services',
        'Government Services Integration'
      ]
    },

    // VIC
    {
      name: 'Consumer Affairs Victoria',
      official_name: 'Consumer Affairs Victoria',
      jurisdiction: 'VIC',
      jurisdiction_level: 'state' as const,
      website: 'https://www.consumer.vic.gov.au',
      contact_phone: '1300 558 181',
      contact_email: 'info@consumer.vic.gov.au',
      contact_hours: 'Monday to Friday 9:00am to 5:00pm',
      services: [
        'Business Registration',
        'Licensing and Registration',
        'Consumer Protection'
      ]
    },

    // QLD
    {
      name: 'Office of Fair Trading Queensland',
      official_name: 'Office of Fair Trading Queensland',
      jurisdiction: 'QLD',
      jurisdiction_level: 'state' as const,
      website: 'https://www.qld.gov.au/law/fair-trading',
      contact_phone: '13 74 68',
      contact_email: 'oftinfo@dtf.qld.gov.au',
      contact_hours: 'Monday to Friday 8:30am to 5:00pm',
      services: [
        'Business Licensing',
        'Consumer Protection',
        'Professional Registration'
      ]
    },

    // WA
    {
      name: 'Consumer Protection WA',
      official_name: 'Department of Mines, Industry Regulation and Safety',
      jurisdiction: 'WA',
      jurisdiction_level: 'state' as const,
      website: 'https://www.consumerprotection.wa.gov.au',
      contact_phone: '1300 304 054',
      contact_email: 'consumer@dmirs.wa.gov.au',
      contact_hours: 'Monday to Friday 8:30am to 4:30pm',
      services: [
        'Business Licensing',
        'Consumer Protection',
        'Industry Regulation'
      ]
    },

    // SA
    {
      name: 'Consumer and Business Services SA',
      official_name: 'Consumer and Business Services',
      jurisdiction: 'SA',
      jurisdiction_level: 'state' as const,
      website: 'https://www.cbs.sa.gov.au',
      contact_phone: '131 882',
      contact_email: 'cbs@sa.gov.au',
      contact_hours: 'Monday to Friday 9:00am to 5:00pm',
      services: [
        'Business Registration',
        'Occupational Licensing',
        'Consumer Protection'
      ]
    }
  ];

  for (const authority of stateAuthorities) {
    try {
      await referenceService.saveAuthority(authority);
      console.log(`💾 Saved state authority: ${authority.official_name}`);
    } catch (error) {
      console.warn(`Failed to save state authority ${authority.name}:`, error);
    }
  }
}