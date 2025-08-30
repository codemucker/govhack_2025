#!/usr/bin/env node

// Authority Contact Information Seeder
// Seeds the database with Australian government department and council contact information

import { PersistentDatabase } from './persistent-database.js';

export class AuthoritySeeder {
  constructor(db) {
    this.db = db;
  }

  async seedAuthorities() {
    console.log('🏛️ Seeding authority contact information...');
    
    const authorities = [
      // Federal Authorities
      {
        name: 'ASIC',
        official_name: 'Australian Securities and Investments Commission',
        jurisdiction: 'Australia',
        jurisdiction_level: 'federal',
        website: 'https://asic.gov.au',
        contact_phone: '1300 300 630',
        contact_email: 'info@asic.gov.au',
        contact_chatbot: 'https://asic.gov.au/about-asic/contact-us/asic-assistant/',
        contact_hours: 'Monday to Friday 8:30am to 5:00pm AEST',
        postal_address: 'Level 5, 100 Market Street, Sydney NSW 2000'
      },
      {
        name: 'ATO',
        official_name: 'Australian Taxation Office',
        jurisdiction: 'Australia',
        jurisdiction_level: 'federal',
        website: 'https://www.ato.gov.au',
        contact_phone: '13 28 61',
        contact_email: 'contact@ato.gov.au',
        contact_chatbot: 'https://www.ato.gov.au/about-ato/contact-us/phone-us/online-services/',
        contact_hours: 'Monday to Friday 8:00am to 6:00pm',
        postal_address: 'Australian Taxation Office, PO Box 9990, Penrith NSW 2740'
      },
      {
        name: 'ABR',
        official_name: 'Australian Business Register',
        jurisdiction: 'Australia',
        jurisdiction_level: 'federal',
        website: 'https://www.abr.gov.au',
        contact_phone: '13 28 66',
        contact_email: 'help@abr.gov.au',
        contact_hours: 'Monday to Friday 8:00am to 6:00pm AEST'
      },

      // NSW Authorities
      {
        name: 'NSW Fair Trading',
        official_name: 'NSW Fair Trading',
        jurisdiction: 'NSW',
        jurisdiction_level: 'state',
        website: 'https://www.fairtrading.nsw.gov.au',
        contact_phone: '13 32 20',
        contact_email: 'info@fairtrading.nsw.gov.au',
        contact_hours: 'Monday to Friday 8:30am to 5:00pm'
      },
      {
        name: 'Sydney City Council',
        official_name: 'City of Sydney Council',
        jurisdiction: 'Sydney',
        jurisdiction_level: 'council',
        website: 'https://www.cityofsydney.nsw.gov.au',
        contact_phone: '02 9265 9333',
        contact_email: 'council@cityofsydney.nsw.gov.au',
        contact_hours: 'Monday to Friday 8:30am to 5:00pm',
        postal_address: 'Town Hall House, 456 Kent Street, Sydney NSW 2000'
      },
      {
        name: 'Parramatta City Council',
        official_name: 'City of Parramatta Council',
        jurisdiction: 'Parramatta',
        jurisdiction_level: 'council',
        website: 'https://www.cityofparramatta.nsw.gov.au',
        contact_phone: '02 9806 5050',
        contact_email: 'council@cityofparramatta.nsw.gov.au',
        contact_hours: 'Monday to Friday 8:30am to 5:00pm'
      },

      // VIC Authorities
      {
        name: 'Consumer Affairs Victoria',
        official_name: 'Consumer Affairs Victoria',
        jurisdiction: 'VIC',
        jurisdiction_level: 'state',
        website: 'https://www.consumer.vic.gov.au',
        contact_phone: '1300 558 181',
        contact_email: 'info@consumer.vic.gov.au',
        contact_hours: 'Monday to Friday 9:00am to 5:00pm'
      },
      {
        name: 'Melbourne City Council',
        official_name: 'City of Melbourne',
        jurisdiction: 'Melbourne',
        jurisdiction_level: 'council',
        website: 'https://www.melbourne.vic.gov.au',
        contact_phone: '03 9658 9658',
        contact_email: 'info@melbourne.vic.gov.au',
        contact_chatbot: 'https://www.melbourne.vic.gov.au/about-melbourne/melbourne-profile/contact-us',
        contact_hours: 'Monday to Friday 8:00am to 6:00pm',
        postal_address: 'GPO Box 1603, Melbourne VIC 3001'
      },

      // QLD Authorities
      {
        name: 'Office of Fair Trading Queensland',
        official_name: 'Office of Fair Trading Queensland',
        jurisdiction: 'QLD',
        jurisdiction_level: 'state',
        website: 'https://www.qld.gov.au/law/fair-trading',
        contact_phone: '13 74 68',
        contact_email: 'oftinfo@dtf.qld.gov.au',
        contact_hours: 'Monday to Friday 8:30am to 5:00pm'
      },
      {
        name: 'Brisbane City Council',
        official_name: 'Brisbane City Council',
        jurisdiction: 'Brisbane',
        jurisdiction_level: 'council',
        website: 'https://www.brisbane.qld.gov.au',
        contact_phone: '07 3403 8888',
        contact_email: 'council@brisbane.qld.gov.au',
        contact_chatbot: 'https://www.brisbane.qld.gov.au/about-council/contact-council',
        contact_hours: 'Monday to Friday 8:00am to 5:30pm',
        postal_address: 'GPO Box 1434, Brisbane QLD 4001'
      },
      {
        name: 'Gold Coast City Council',
        official_name: 'City of Gold Coast',
        jurisdiction: 'Gold Coast',
        jurisdiction_level: 'council',
        website: 'https://www.goldcoast.qld.gov.au',
        contact_phone: '07 5581 6000',
        contact_email: 'info@goldcoast.qld.gov.au',
        contact_hours: 'Monday to Friday 8:30am to 4:30pm'
      },

      // WA Authorities
      {
        name: 'Consumer Protection WA',
        official_name: 'Department of Mines, Industry Regulation and Safety',
        jurisdiction: 'WA',
        jurisdiction_level: 'state',
        website: 'https://www.consumerprotection.wa.gov.au',
        contact_phone: '1300 304 054',
        contact_email: 'consumer@dmirs.wa.gov.au',
        contact_hours: 'Monday to Friday 8:30am to 4:30pm'
      },
      {
        name: 'City of Perth',
        official_name: 'City of Perth',
        jurisdiction: 'Perth',
        jurisdiction_level: 'council',
        website: 'https://www.perth.wa.gov.au',
        contact_phone: '08 9461 3333',
        contact_email: 'info@cityofperth.wa.gov.au',
        contact_hours: 'Monday to Friday 8:00am to 5:00pm'
      },

      // SA Authorities
      {
        name: 'Consumer and Business Services SA',
        official_name: 'Consumer and Business Services',
        jurisdiction: 'SA',
        jurisdiction_level: 'state',
        website: 'https://www.cbs.sa.gov.au',
        contact_phone: '131 882',
        contact_email: 'cbs@sa.gov.au',
        contact_hours: 'Monday to Friday 9:00am to 5:00pm'
      },
      {
        name: 'Adelaide City Council',
        official_name: 'Adelaide City Council',
        jurisdiction: 'Adelaide',
        jurisdiction_level: 'council',
        website: 'https://www.adelaide.sa.gov.au',
        contact_phone: '08 8203 7203',
        contact_email: 'city@adelaide.sa.gov.au',
        contact_hours: 'Monday to Friday 8:30am to 5:00pm'
      }
    ];

    let savedCount = 0;
    for (const authority of authorities) {
      try {
        await this.db.saveAuthority(authority);
        savedCount++;
      } catch (error) {
        console.warn(`Failed to save authority ${authority.name}:`, error.message);
      }
    }

    console.log(`✅ Seeded ${savedCount} authorities into database`);
    return savedCount;
  }
}