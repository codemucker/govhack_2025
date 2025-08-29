#!/usr/bin/env node

// Preemptive Document Seeder for LegalEase
// Seeds the database with essential government documents across all Australian jurisdictions

import { PersistentDatabase } from './persistent-database.js';

export class DocumentSeeder {
  constructor(database) {
    this.db = database;
    this.seedDocuments = this.getSeedDocumentList();
  }

  // Core government documents that form the foundation for most queries
  getSeedDocumentList() {
    return {
      // Federal (Commonwealth) - Core Acts
      commonwealth: [
        {
          url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/ca2001172/',
          title: 'Corporations Act 2001',
          description: 'Primary business and company regulation',
          priority: 10,
          tags: ['business', 'corporations', 'company', 'director', 'shareholder', 'registration'],
          jurisdiction: 'Commonwealth',
          document_type: 'act'
        },
        {
          url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/caca2010265/',
          title: 'Competition and Consumer Act 2010',
          description: 'Consumer protection and fair trading',
          priority: 9,
          tags: ['consumer', 'trade', 'competition', 'misleading', 'warranty', 'business'],
          jurisdiction: 'Commonwealth',
          document_type: 'act'
        },
        {
          url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/fsca2013428/',
          title: 'Food Standards Australia New Zealand Act 1991',
          description: 'Food safety and standards',
          priority: 8,
          tags: ['food', 'safety', 'standards', 'health', 'restaurant', 'cafe', 'business'],
          jurisdiction: 'Commonwealth',
          document_type: 'act'
        },
        {
          url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/wra1996220/',
          title: 'Workplace Relations Act 1996',
          description: 'Employment and workplace relations',
          priority: 8,
          tags: ['employment', 'workplace', 'wages', 'conditions', 'unfair dismissal', 'industrial'],
          jurisdiction: 'Commonwealth',
          document_type: 'act'
        }
      ],
      
      // NSW - High-impact documents
      nsw: [
        {
          url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/epaaa1979389/',
          title: 'Environmental Planning and Assessment Act 1979 (NSW)',
          description: 'Development applications and planning permits',
          priority: 10,
          tags: ['planning', 'development', 'building', 'council', 'approval', 'permit', 'construction'],
          jurisdiction: 'New South Wales',
          document_type: 'act'
        },
        {
          url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/lga1993182/',
          title: 'Local Government Act 1993 (NSW)',
          description: 'Council powers and local regulations',
          priority: 9,
          tags: ['council', 'local government', 'permits', 'rates', 'bylaws'],
          jurisdiction: 'New South Wales',
          document_type: 'act'
        },
        {
          url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/fsa2003120/',
          title: 'Food Act 2003 (NSW)',
          description: 'Food business licensing and safety',
          priority: 8,
          tags: ['food', 'license', 'restaurant', 'cafe', 'safety', 'health'],
          jurisdiction: 'New South Wales',
          document_type: 'act'
        }
      ],

      // Victoria - Essential documents
      vic: [
        {
          url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_act/paea1987254/',
          title: 'Planning and Environment Act 1987 (VIC)',
          description: 'Victorian planning and development law',
          priority: 10,
          tags: ['planning', 'development', 'building', 'permit', 'council', 'zoning'],
          jurisdiction: 'Victoria',
          document_type: 'act'
        },
        {
          url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_act/lga1989182/',
          title: 'Local Government Act 1989 (VIC)',
          description: 'Victorian council regulations',
          priority: 9,
          tags: ['council', 'local government', 'permits', 'bylaws'],
          jurisdiction: 'Victoria',
          document_type: 'act'
        },
        {
          url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_act/fa1984133/',
          title: 'Food Act 1984 (VIC)',
          description: 'Food safety and business registration',
          priority: 8,
          tags: ['food', 'safety', 'restaurant', 'license', 'health'],
          jurisdiction: 'Victoria',
          document_type: 'act'
        }
      ],

      // Queensland - Key documents
      qld: [
        {
          url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/pa2016172/',
          title: 'Planning Act 2016 (QLD)',
          description: 'Queensland development and planning',
          priority: 10,
          tags: ['planning', 'development', 'building', 'council', 'approval'],
          jurisdiction: 'Queensland',
          document_type: 'act'
        },
        {
          url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/lga2009182/',
          title: 'Local Government Act 2009 (QLD)',
          description: 'Queensland council powers',
          priority: 9,
          tags: ['council', 'local government', 'permits', 'rates'],
          jurisdiction: 'Queensland',
          document_type: 'act'
        },
        {
          url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/fa2006102/',
          title: 'Food Act 2006 (QLD)',
          description: 'Queensland food business regulations',
          priority: 8,
          tags: ['food', 'business', 'license', 'safety', 'health'],
          jurisdiction: 'Queensland',
          document_type: 'act'
        }
      ],

      // Western Australia - Core documents
      wa: [
        {
          url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/wa/consol_act/pada1928264/',
          title: 'Planning and Development Act 2005 (WA)',
          description: 'Western Australian planning law',
          priority: 10,
          tags: ['planning', 'development', 'building', 'approval', 'council'],
          jurisdiction: 'Western Australia',
          document_type: 'act'
        },
        {
          url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/wa/consol_act/lga1995182/',
          title: 'Local Government Act 1995 (WA)',
          description: 'WA local council regulations',
          priority: 9,
          tags: ['council', 'local government', 'permits', 'bylaws'],
          jurisdiction: 'Western Australia',
          document_type: 'act'
        }
      ],

      // South Australia - Essential acts
      sa: [
        {
          url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/sa/consol_act/dpa1993236/',
          title: 'Development Act 1993 (SA)',
          description: 'South Australian development planning',
          priority: 10,
          tags: ['development', 'planning', 'building', 'council', 'approval'],
          jurisdiction: 'South Australia',
          document_type: 'act'
        },
        {
          url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/sa/consol_act/lga1999182/',
          title: 'Local Government Act 1999 (SA)',
          description: 'SA council regulations',
          priority: 9,
          tags: ['council', 'local government', 'permits'],
          jurisdiction: 'South Australia',
          document_type: 'act'
        }
      ],

      // Specialized high-value documents
      specialized: [
        {
          url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/nccba2016312/',
          title: 'National Construction Code',
          description: 'Building standards across Australia',
          priority: 9,
          tags: ['building', 'construction', 'code', 'standards', 'safety', 'residential', 'commercial'],
          jurisdiction: 'National',
          document_type: 'code'
        },
        {
          url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/la1991203/',
          title: 'Liquor Act (Various States)',
          description: 'Liquor licensing regulations',
          priority: 7,
          tags: ['liquor', 'alcohol', 'license', 'restaurant', 'bar', 'hospitality'],
          jurisdiction: 'Multi-State',
          document_type: 'act'
        }
      ]
    };
  }

  // Get documents by priority (higher first)
  getPrioritizedDocuments() {
    const allDocs = [];
    
    Object.keys(this.seedDocuments).forEach(jurisdiction => {
      this.seedDocuments[jurisdiction].forEach(doc => {
        allDocs.push(doc);
      });
    });

    return allDocs.sort((a, b) => b.priority - a.priority);
  }

  // Seed documents in batches to avoid overwhelming the system
  async seedDatabase(options = {}) {
    const {
      batchSize = 5,
      delayBetweenBatches = 2000,
      skipExisting = true,
      maxDocuments = 50
    } = options;

    console.log('🌱 Starting database seeding process...');
    
    const prioritizedDocs = this.getPrioritizedDocuments();
    const docsToSeed = prioritizedDocs.slice(0, maxDocuments);
    
    console.log(`📋 Planning to seed ${docsToSeed.length} documents in batches of ${batchSize}`);
    
    let seededCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    
    // Process documents in batches
    for (let i = 0; i < docsToSeed.length; i += batchSize) {
      const batch = docsToSeed.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(docsToSeed.length / batchSize);
      
      console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} documents)`);
      
      // Process batch in parallel
      const batchPromises = batch.map(doc => this.seedDocument(doc, skipExisting));
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Count results
      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          const outcome = result.value;
          if (outcome.seeded) seededCount++;
          else if (outcome.skipped) skippedCount++;
        } else {
          console.error(`❌ Batch error for ${batch[idx].title}:`, result.reason);
          failedCount++;
        }
      });
      
      // Brief pause between batches to avoid overwhelming external services
      if (i + batchSize < docsToSeed.length) {
        console.log(`⏸️  Pausing ${delayBetweenBatches}ms between batches...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }
    
    // Final statistics
    console.log('\n✅ Database seeding completed!');
    console.log(`📊 Results: ${seededCount} seeded, ${skippedCount} skipped, ${failedCount} failed`);
    
    const finalStats = await this.db.getStats();
    console.log(`📈 Database now contains: ${finalStats.documents} documents, ${finalStats.cache.files} cached files`);
    
    return {
      seeded: seededCount,
      skipped: skippedCount,
      failed: failedCount,
      total: docsToSeed.length
    };
  }

  // Seed a single document
  async seedDocument(docConfig, skipExisting = true) {
    try {
      // Check if document already exists
      if (skipExisting) {
        const existing = await this.db.getDocument(docConfig.url);
        if (existing) {
          console.log(`⏭️  Skipped (exists): ${docConfig.title}`);
          return { skipped: true, url: docConfig.url };
        }
      }
      
      console.log(`📄 Seeding: ${docConfig.title}...`);
      
      // Create document object for database
      const document = {
        url: docConfig.url,
        content: await this.fetchRealContent(docConfig.url),
        tags: docConfig.tags,
        jurisdiction: docConfig.jurisdiction,
        document_type: docConfig.document_type,
        synthetic: false // Mark as real content
      };
      
      // Save to database (automatically caches to disk)
      await this.db.saveDocument(document);
      
      console.log(`✅ Seeded: ${docConfig.title}`);
      return { seeded: true, url: docConfig.url };
      
    } catch (error) {
      console.error(`❌ Failed to seed ${docConfig.title}:`, error.message);
      return { failed: true, url: docConfig.url, error: error.message };
    }
  }

  // Fetch real content from AustLII
  async fetchRealContent(url) {
    try {
      console.log(`Fetching real content from: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
      }
      const html = await response.text();
      // Basic HTML to text extraction
      let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
      text = text.replace(/<[^>]+>/g, ' ');
      text = text.replace(/&nbsp;/g, ' ');
      text = text.replace(/\s+/g, ' ').trim();
      return text;
    } catch (error) {
      console.error(`Error fetching real content from ${url}:`, error);
      return `Error fetching content: ${error.message}`;
    }
  }

  // Quick seed with just the highest priority documents
  async quickSeed() {
    console.log('⚡ Quick seeding with top 15 priority documents...');
    
    return await this.seedDatabase({
      batchSize: 3,
      delayBetweenBatches: 1000,
      maxDocuments: 15,
      skipExisting: true
    });
  }

  // Full comprehensive seed
  async fullSeed() {
    console.log('🌳 Full seeding with all available documents...');
    
    return await this.seedDatabase({
      batchSize: 5,
      delayBetweenBatches: 2000,
      maxDocuments: 100,
      skipExisting: true
    });
  }
}

// CLI interface for standalone usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const db = new PersistentDatabase();
  await db.initialize();
  
  const seeder = new DocumentSeeder(db);
  
  const args = process.argv.slice(2);
  const command = args[0] || 'quick';
  
  try {
    let result;
    switch (command) {
      case 'quick':
        result = await seeder.quickSeed();
        break;
      case 'full':
        result = await seeder.fullSeed();
        break;
      default:
        console.log('Usage: node document-seeder.js [quick|full]');
        process.exit(1);
    }
    
    console.log('\n🎉 Seeding process completed successfully!');
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}