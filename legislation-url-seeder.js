#!/usr/bin/env node

// AustLII Legislation URL Seeder
// Pre-populated URLs organized by jurisdiction and legal areas
// Workaround for AustLII database scraping limitations

import { PersistentDatabase } from './persistent-database.js';

export class LegislationURLSeeder {
  constructor() {
    this.db = null;
  }

  async initialize() {
    this.db = new PersistentDatabase();
    await this.db.initialize();
  }

  // Comprehensive AustLII legislation URLs by jurisdiction
  getAustralianLegislationURLs() {
    return {
      'QLD': {
        'Food Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/fa200657/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_reg/fr2006488/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_reg/fssr2006489/'
        ],
        'Building and Construction': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/ba1975157/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_reg/br2006291/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/sdpwoa1971427/'
        ],
        'Environmental Protection': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/epa1994323/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_reg/epr2008390/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/wmra2011396/'
        ],
        'Liquor Licensing': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/la1992107/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_reg/lr1992216/'
        ],
        'Business Licensing': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/ftra1999228/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/blr2001330/'
        ],
        'Health and Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/whsa2011218/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_reg/whsr2011308/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/pha2005170/'
        ],
        'Planning and Development': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/pa2016172/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_reg/pr2017276/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/sdpwoa1971427/'
        ]
      },
      'NSW': {
        'Food Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/fa200357/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_reg/fr2015364/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_reg/fsr2015365/'
        ],
        'Building and Construction': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/ba1993141/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_reg/br2022302/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/hba1989197/'
        ],
        'Environmental Protection': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/poea1997160/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_reg/poer2021360/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/wmaa2007194/'
        ],
        'Liquor Licensing': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/la2007107/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_reg/lr2008285/'
        ],
        'Health and Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/whsa2011218/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_reg/whsr2017305/'
        ],
        'Planning and Development': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/epaaa1979389/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_reg/eparr2000333/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/sepp2006226/'
        ]
      },
      'VIC': {
        'Food Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_act/fa1984220/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_reg/fsr2007329/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_reg/fr2007330/'
        ],
        'Building and Construction': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_act/ba1993141/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_reg/br2018126/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_act/pa1987184/'
        ],
        'Environmental Protection': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_act/epa2017188/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_reg/epr2021284/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_act/wmaa2003201/'
        ],
        'Liquor Licensing': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_act/lcra1998266/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_reg/lr2019279/'
        ],
        'Health and Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_act/ohsa2004273/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_reg/ohsr2017305/'
        ]
      },
      'WA': {
        'Food Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/wa/consol_act/fa2008119/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/wa/consol_reg/fr2009206/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/wa/consol_reg/fsr2009207/'
        ],
        'Building and Construction': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/wa/consol_act/ba2011201/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/wa/consol_reg/br2012151/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/wa/consol_act/pa2005137/'
        ],
        'Environmental Protection': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/wa/consol_act/epa1986323/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/wa/consol_reg/epr1987390/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/wa/consol_act/wmaa2007396/'
        ],
        'Liquor Licensing': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/wa/consol_act/lca1988156/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/wa/consol_reg/lcr1989216/'
        ],
        'Health and Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/wa/consol_act/whsa1984218/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/wa/consol_reg/whsr1996308/'
        ]
      },
      'SA': {
        'Food Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/sa/consol_act/fa2001125/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/sa/consol_reg/fr2002185/'
        ],
        'Building and Construction': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/sa/consol_act/dra1993161/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/sa/consol_reg/dr2019156/'
        ],
        'Environmental Protection': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/sa/consol_act/epa1993323/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/sa/consol_reg/epr2009390/'
        ],
        'Health and Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/sa/consol_act/whsa2012218/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/sa/consol_reg/whsr2012308/'
        ]
      },
      'TAS': {
        'Food Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/tas/consol_act/fa2003117/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/tas/consol_reg/fsr2004183/'
        ],
        'Building and Construction': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/tas/consol_act/ba2000157/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/tas/consol_reg/br2014140/'
        ],
        'Environmental Protection': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/tas/consol_act/empca1994323/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/tas/consol_reg/empcr2017390/'
        ],
        'Health and Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/tas/consol_act/whsa2012218/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/tas/consol_reg/whsr2012308/'
        ]
      },
      'NT': {
        'Food Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nt/consol_act/fa2004117/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nt/consol_reg/fsr2005183/'
        ],
        'Building and Construction': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nt/consol_act/ba1993141/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nt/consol_reg/br2014140/'
        ],
        'Environmental Protection': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nt/consol_act/empca1994323/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nt/consol_reg/empcr2017390/'
        ],
        'Health and Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nt/consol_act/whsa2011218/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nt/consol_reg/whsr2011308/'
        ]
      },
      'ACT': {
        'Food Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/act/consol_act/fa2001125/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/act/consol_reg/fsr2002185/'
        ],
        'Building and Construction': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/act/consol_act/ba2004141/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/act/consol_reg/bcr2008140/'
        ],
        'Environmental Protection': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/act/consol_act/epa1997323/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/act/consol_reg/epr2005390/'
        ],
        'Health and Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/act/consol_act/whsa2011218/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/act/consol_reg/whsr2011308/'
        ]
      },
      'Federal': {
        'Food Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/fsa1991109/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_reg/fsr1994275/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/fgcoa2013329/'
        ],
        'Building and Construction': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/ncc2016391/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/bciipia2005430/'
        ],
        'Environmental Protection': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/epbca1999588/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/neia1999330/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/wpoia1999395/'
        ],
        'Health and Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/whsa2011218/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_reg/whsr2011308/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/saia2008296/'
        ],
        'Immigration and Citizenship': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/ma1958118/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_reg/mr1994227/',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/aca2007219/'
        ]
      }
    };
  }

  // Generate document records from URL structure
  generateDocumentRecords() {
    const urlData = this.getAustralianLegislationURLs();
    const documents = [];

    for (const [jurisdiction, legalAreas] of Object.entries(urlData)) {
      for (const [legalArea, urls] of Object.entries(legalAreas)) {
        urls.forEach(url => {
          // Extract document title from URL
          const urlParts = url.split('/');
          const filename = urlParts[urlParts.length - 2]; // Get the filename part
          
          // Generate readable title from filename
          const title = this.generateTitleFromFilename(filename, legalArea);
          const documentType = this.determineDocumentType(filename, title);

          documents.push({
            url: url,
            jurisdiction: jurisdiction,
            document_type: documentType,
            legal_area: legalArea,
            title: title,
            content: '', // Will be populated by document fetcher
            synthetic: false,
            content_hash: null,
            cache_path: null
          });
        });
      }
    }

    return documents;
  }

  // Generate human-readable title from AustLII filename
  generateTitleFromFilename(filename, legalArea) {
    // Common AustLII filename patterns
    const patterns = {
      'fa200657': 'Food Act 2006 (QLD)',
      'fa200357': 'Food Act 2003 (NSW)',
      'fa1984220': 'Food Act 1984 (VIC)',
      'fa2008119': 'Food Act 2008 (WA)',
      'fa2001125': 'Food Act 2001 (SA)',
      'fa2003117': 'Food Act 2003 (TAS)',
      'fa2004117': 'Food Act 2004 (NT)',
      'fsa1991109': 'Food Standards Australia Act 1991 (Commonwealth)',
      'ba1975157': 'Building Act 1975 (QLD)',
      'ba1993141': 'Building Act 1993',
      'ba2011201': 'Building Act 2011 (WA)',
      'epa1994323': 'Environmental Protection Act 1994',
      'epa2017188': 'Environment Protection Act 2017 (VIC)',
      'la1992107': 'Liquor Act 1992 (QLD)',
      'la2007107': 'Liquor Act 2007 (NSW)',
      'whsa2011218': 'Work Health and Safety Act 2011',
      'whsa2012218': 'Work Health and Safety Act 2012',
      'pa2016172': 'Planning Act 2016 (QLD)',
      'epbca1999588': 'Environment Protection and Biodiversity Conservation Act 1999'
    };

    // Return known pattern or generate from legal area and filename
    if (patterns[filename]) {
      return patterns[filename];
    }

    // Extract year and attempt to build title
    const yearMatch = filename.match(/(\d{4})/);
    const year = yearMatch ? yearMatch[1] : '';
    
    // Build generic title
    return `${legalArea} Legislation ${year}`;
  }

  // Determine document type from filename and title
  determineDocumentType(filename, title) {
    const lowerFilename = filename.toLowerCase();
    const lowerTitle = title.toLowerCase();

    if (lowerFilename.includes('reg') || lowerTitle.includes('regulation')) {
      return 'regulation';
    } else if (lowerFilename.includes('rule') || lowerTitle.includes('rule')) {
      return 'rules';
    } else if (lowerTitle.includes('act')) {
      return 'act';
    } else if (lowerTitle.includes('code')) {
      return 'code';
    }

    return 'legislation'; // Default
  }

  // Seed documents table with pre-populated URLs
  async seedDocuments() {
    console.log('🌱 Seeding legislation URLs into database...');
    
    const documents = this.generateDocumentRecords();
    let insertedCount = 0;
    let skippedCount = 0;

    for (const doc of documents) {
      try {
        // Check if document already exists
        const existing = await this.db.runQuery(
          'SELECT url FROM documents WHERE url = ?',
          [doc.url]
        );

        if (existing.length > 0) {
          skippedCount++;
          continue;
        }

        // Insert new document
        await this.db.runQuery(`
          INSERT INTO documents (
            url, jurisdiction, document_type, content, 
            synthetic, content_hash, cache_path, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [
          doc.url,
          doc.jurisdiction,
          doc.document_type,
          doc.content,
          doc.synthetic,
          doc.content_hash,
          doc.cache_path
        ]);

        insertedCount++;

      } catch (error) {
        console.error(`❌ Failed to insert document ${doc.url}:`, error.message);
      }
    }

    console.log(`✅ Seeded ${insertedCount} new legislation URLs`);
    console.log(`⚠️  Skipped ${skippedCount} existing URLs`);
    console.log(`📊 Total URLs in seed data: ${documents.length}`);

    return { inserted: insertedCount, skipped: skippedCount, total: documents.length };
  }

  // Seed jurisdiction_legislation table with structured data
  async seedJurisdictionLegislation() {
    console.log('🏛️ Seeding jurisdiction legislation mapping...');
    
    const urlData = this.getAustralianLegislationURLs();
    let insertedCount = 0;

    for (const [jurisdiction, legalAreas] of Object.entries(urlData)) {
      for (const [legalArea, urls] of Object.entries(legalAreas)) {
        try {
          // Check if mapping already exists
          const existing = await this.db.runQuery(
            'SELECT * FROM jurisdiction_legislation WHERE jurisdiction = ? AND legal_area = ?',
            [jurisdiction, legalArea]
          );

          if (existing.length > 0) {
            continue;
          }

          // Insert primary URL for this jurisdiction/legal area
          const primaryUrl = urls[0]; // Use first URL as primary
          const title = this.generateTitleFromFilename(
            primaryUrl.split('/')[primaryUrl.split('/').length - 2],
            legalArea
          );

          await this.db.runQuery(`
            INSERT INTO jurisdiction_legislation (
              jurisdiction, legal_area, title, url, created_at
            ) VALUES (?, ?, ?, ?, datetime('now'))
          `, [jurisdiction, legalArea, title, primaryUrl]);

          insertedCount++;

        } catch (error) {
          console.error(`❌ Failed to insert jurisdiction legislation for ${jurisdiction} - ${legalArea}:`, error.message);
        }
      }
    }

    console.log(`✅ Seeded ${insertedCount} jurisdiction legislation mappings`);
    return insertedCount;
  }

  // Get statistics about seeded data
  async getSeededStats() {
    const stats = {};

    try {
      const totalDocs = await this.db.runQuery('SELECT COUNT(*) as count FROM documents');
      stats.totalDocuments = totalDocs[0].count;

      const byJurisdiction = await this.db.runQuery(`
        SELECT jurisdiction, COUNT(*) as count 
        FROM documents 
        GROUP BY jurisdiction 
        ORDER BY count DESC
      `);
      stats.byJurisdiction = byJurisdiction;

      const byType = await this.db.runQuery(`
        SELECT document_type, COUNT(*) as count 
        FROM documents 
        GROUP BY document_type 
        ORDER BY count DESC
      `);
      stats.byType = byType;

      const austliiDocs = await this.db.runQuery(`
        SELECT COUNT(*) as count 
        FROM documents 
        WHERE url LIKE '%austlii.edu.au%'
      `);
      stats.austliiDocuments = austliiDocs[0].count;

    } catch (error) {
      console.error('Error getting stats:', error.message);
    }

    return stats;
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const seeder = new LegislationURLSeeder();
  
  async function runSeeding() {
    try {
      await seeder.initialize();
      
      console.log('🎯 Starting AustLII Legislation URL Seeding Process');
      console.log('='.repeat(60));
      
      // Seed documents
      const docResults = await seeder.seedDocuments();
      
      // Seed jurisdiction mappings
      const jurisdictionCount = await seeder.seedJurisdictionLegislation();
      
      // Show statistics
      console.log('\n📊 SEEDING RESULTS');
      console.log('='.repeat(40));
      console.log(`📄 Documents inserted: ${docResults.inserted}`);
      console.log(`⚠️  Documents skipped: ${docResults.skipped}`);
      console.log(`🏛️ Jurisdiction mappings: ${jurisdictionCount}`);
      
      const stats = await seeder.getSeededStats();
      console.log('\n📈 DATABASE STATISTICS');
      console.log('='.repeat(40));
      console.log(`📚 Total documents: ${stats.totalDocuments}`);
      console.log(`🏛️ AustLII documents: ${stats.austliiDocuments}`);
      
      console.log('\n📊 By Jurisdiction:');
      stats.byJurisdiction?.forEach(item => {
        console.log(`   ${item.jurisdiction}: ${item.count} documents`);
      });
      
      console.log('\n📋 By Type:');
      stats.byType?.forEach(item => {
        console.log(`   ${item.document_type}: ${item.count} documents`);
      });
      
      console.log('\n✅ Seeding completed successfully!');
      console.log('Documents are ready for content fetching and ingestion.');
      
    } catch (error) {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    }
  }
  
  runSeeding();
}