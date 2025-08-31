#!/usr/bin/env node
// Preemptive Document Seeder for LegalEase
// Seeds the database with essential government documents across all Australian jurisdictions
import { PersistentDatabase } from './persistent-database.js';
import { AustLIIScraper } from './austlii-scraper.js';
import { IntelligentDocumentDiscovery } from './intelligent-discovery.js';
export class DocumentSeeder {
    db;
    seedDocuments;
    austliiScraper;
    intelligentDiscovery;
    constructor(database) {
        this.db = database;
        this.seedDocuments = this.getSeedDocumentList();
        this.austliiScraper = new AustLIIScraper();
        this.intelligentDiscovery = new IntelligentDocumentDiscovery();
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
                    url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/tpa1974149/',
                    title: 'Competition and Consumer Act 2010 (formerly Trade Practices Act)',
                    description: 'Consumer protection and competition law',
                    priority: 9,
                    tags: ['consumer', 'competition', 'trading', 'fair', 'misleading', 'advertising'],
                    jurisdiction: 'Commonwealth',
                    document_type: 'act'
                },
                {
                    url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/wra1996220/',
                    title: 'Workplace Relations Act 1996',
                    description: 'Employment and industrial relations',
                    priority: 8,
                    tags: ['employment', 'workplace', 'industrial', 'unions', 'wages', 'conditions'],
                    jurisdiction: 'Commonwealth',
                    document_type: 'act'
                },
                {
                    url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/itaa1997240/',
                    title: 'Income Tax Assessment Act 1997',
                    description: 'Income tax law and regulations',
                    priority: 9,
                    tags: ['tax', 'income', 'deduction', 'capital', 'gains', 'business'],
                    jurisdiction: 'Commonwealth',
                    document_type: 'act'
                },
                {
                    url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/gsta1999141/',
                    title: 'A New Tax System (Goods and Services Tax) Act 1999',
                    description: 'GST law and administration',
                    priority: 8,
                    tags: ['GST', 'tax', 'sales', 'input', 'credits', 'business'],
                    jurisdiction: 'Commonwealth',
                    document_type: 'act'
                }
            ],
            // New South Wales - Core Acts
            nsw: [
                {
                    url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/rta2005207/',
                    title: 'Road Transport Act 2013',
                    description: 'Road transport and driver licensing',
                    priority: 8,
                    tags: ['driving', 'license', 'registration', 'road', 'transport', 'vehicle'],
                    jurisdiction: 'NSW',
                    document_type: 'act'
                },
                {
                    url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/rta1987207/',
                    title: 'Residential Tenancies Act 2010',
                    description: 'Tenancy rights and obligations',
                    priority: 9,
                    tags: ['rental', 'tenancy', 'landlord', 'tenant', 'bond', 'lease'],
                    jurisdiction: 'NSW',
                    document_type: 'act'
                },
                {
                    url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/epaaa1979389/',
                    title: 'Environmental Planning and Assessment Act 1979',
                    description: 'Planning and development approvals',
                    priority: 7,
                    tags: ['planning', 'development', 'consent', 'environmental', 'building'],
                    jurisdiction: 'NSW',
                    document_type: 'act'
                },
                {
                    url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/la2007107/',
                    title: 'Liquor Act 2007',
                    description: 'Liquor licensing and regulation',
                    priority: 6,
                    tags: ['liquor', 'license', 'alcohol', 'pub', 'restaurant', 'club'],
                    jurisdiction: 'NSW',
                    document_type: 'act'
                }
            ],
            // Queensland - Core Acts
            qld: [
                {
                    url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/rta1999207/',
                    title: 'Residential Tenancies and Rooming Accommodation Act 2008',
                    description: 'Queensland tenancy law',
                    priority: 9,
                    tags: ['rental', 'tenancy', 'landlord', 'tenant', 'bond', 'lease'],
                    jurisdiction: 'QLD',
                    document_type: 'act'
                },
                {
                    url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/pa1997222/',
                    title: 'Planning Act 2016',
                    description: 'Planning and development in Queensland',
                    priority: 7,
                    tags: ['planning', 'development', 'consent', 'environmental', 'building'],
                    jurisdiction: 'QLD',
                    document_type: 'act'
                },
                {
                    url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/la1992107/',
                    title: 'Liquor Act 1992',
                    description: 'Queensland liquor licensing',
                    priority: 6,
                    tags: ['liquor', 'license', 'alcohol', 'pub', 'restaurant', 'club'],
                    jurisdiction: 'QLD',
                    document_type: 'act'
                }
            ],
            // Victoria - Core Acts
            vic: [
                {
                    url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_act/rta1997207/',
                    title: 'Residential Tenancies Act 1997',
                    description: 'Victorian tenancy law',
                    priority: 9,
                    tags: ['rental', 'tenancy', 'landlord', 'tenant', 'bond', 'lease'],
                    jurisdiction: 'VIC',
                    document_type: 'act'
                },
                {
                    url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_act/pa1987222/',
                    title: 'Planning and Environment Act 1987',
                    description: 'Victorian planning and environment law',
                    priority: 7,
                    tags: ['planning', 'development', 'consent', 'environmental', 'building'],
                    jurisdiction: 'VIC',
                    document_type: 'act'
                }
            ],
            // Western Australia - Core Acts
            wa: [
                {
                    url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/wa/consol_act/rta1987207/',
                    title: 'Residential Tenancies Act 1987',
                    description: 'WA tenancy law',
                    priority: 9,
                    tags: ['rental', 'tenancy', 'landlord', 'tenant', 'bond', 'lease'],
                    jurisdiction: 'WA',
                    document_type: 'act'
                }
            ],
            // South Australia - Core Acts
            sa: [
                {
                    url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/sa/consol_act/rta1995207/',
                    title: 'Residential Tenancies Act 1995',
                    description: 'SA tenancy law',
                    priority: 9,
                    tags: ['rental', 'tenancy', 'landlord', 'tenant', 'bond', 'lease'],
                    jurisdiction: 'SA',
                    document_type: 'act'
                }
            ],
            // Tasmania - Core Acts
            tas: [
                {
                    url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/tas/consol_act/rta1997207/',
                    title: 'Residential Tenancy Act 1997',
                    description: 'Tasmanian tenancy law',
                    priority: 9,
                    tags: ['rental', 'tenancy', 'landlord', 'tenant', 'bond', 'lease'],
                    jurisdiction: 'TAS',
                    document_type: 'act'
                }
            ],
            // Northern Territory - Core Acts
            nt: [
                {
                    url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nt/consol_act/rta1999207/',
                    title: 'Residential Tenancies Act 1999',
                    description: 'NT tenancy law',
                    priority: 9,
                    tags: ['rental', 'tenancy', 'landlord', 'tenant', 'bond', 'lease'],
                    jurisdiction: 'NT',
                    document_type: 'act'
                }
            ],
            // Australian Capital Territory - Core Acts
            act: [
                {
                    url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/act/consol_act/rta1997207/',
                    title: 'Residential Tenancies Act 1997',
                    description: 'ACT tenancy law',
                    priority: 9,
                    tags: ['rental', 'tenancy', 'landlord', 'tenant', 'bond', 'lease'],
                    jurisdiction: 'ACT',
                    document_type: 'act'
                }
            ]
        };
    }
    // Seed all documents in the database
    async seedAllDocuments() {
        console.log('🌱 Starting document seeding process...');
        let totalSeeded = 0;
        const startTime = Date.now();
        for (const [jurisdiction, documents] of Object.entries(this.seedDocuments)) {
            console.log(`\n📚 Seeding ${jurisdiction.toUpperCase()} documents...`);
            // Sort by priority (higher first)
            const sortedDocs = documents.sort((a, b) => b.priority - a.priority);
            for (const docInfo of sortedDocs) {
                try {
                    console.log(`📄 Fetching: ${docInfo.title}`);
                    // Try to fetch from AustLII first
                    let content = await this.austliiScraper.fetchDocument(docInfo.url);
                    // If AustLII fails, try intelligent discovery
                    if (!content || content.length < 100) {
                        console.log(`  ⚠️ AustLII failed, trying intelligent discovery...`);
                        content = await this.intelligentDiscovery.findAndFetchDocument(docInfo.title, docInfo.jurisdiction);
                    }
                    // If still no content, create synthetic document
                    if (!content || content.length < 100) {
                        console.log(`  🤖 Creating synthetic document...`);
                        content = await this.createSyntheticDocument(docInfo);
                    }
                    const document = {
                        url: docInfo.url,
                        content: content,
                        tags: docInfo.tags,
                        jurisdiction: docInfo.jurisdiction,
                        document_type: docInfo.document_type,
                        synthetic: content.includes('SYNTHETIC LEGAL DOCUMENT')
                    };
                    await this.db.saveDocument(document);
                    totalSeeded++;
                    console.log(`  ✅ Seeded: ${docInfo.title} (${content.length} chars)`);
                    // Small delay to be respectful to servers
                    await this.delay(500);
                }
                catch (error) {
                    console.error(`  ❌ Failed to seed ${docInfo.title}:`, error.message);
                }
            }
        }
        const duration = Math.round((Date.now() - startTime) / 1000);
        console.log(`\n🎉 Document seeding complete!`);
        console.log(`📊 Total documents seeded: ${totalSeeded}`);
        console.log(`⏱️ Duration: ${duration}s`);
    }
    // Create synthetic document when real one can't be fetched
    async createSyntheticDocument(docInfo) {
        const synthetic = `SYNTHETIC LEGAL DOCUMENT - ${docInfo.title}

This is a synthetic document created for ${docInfo.jurisdiction} jurisdiction.

Title: ${docInfo.title}
Description: ${docInfo.description}
Jurisdiction: ${docInfo.jurisdiction}
Document Type: ${docInfo.document_type}

Key Topics: ${docInfo.tags.join(', ')}

DISCLAIMER: This is a synthetic document created when the original could not be retrieved.
For official legal information, please consult the official government sources for ${docInfo.jurisdiction}.

Original URL: ${docInfo.url}

Generated on: ${new Date().toISOString()}
`;
        return synthetic;
    }
    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    // Get seeding statistics
    async getSeadingStats() {
        const stats = await this.db.getStats();
        const totalSeedDocs = Object.values(this.seedDocuments)
            .reduce((sum, docs) => sum + docs.length, 0);
        return {
            total_seed_documents: totalSeedDocs,
            seeded_documents: stats.documents,
            completion_percentage: Math.round((stats.documents / totalSeedDocs) * 100),
            by_jurisdiction: Object.keys(this.seedDocuments).reduce((acc, jurisdiction) => {
                acc[jurisdiction] = this.seedDocuments[jurisdiction].length;
                return acc;
            }, {})
        };
    }
}
// CLI Usage
if (import.meta.url === `file://${process.argv[1]}`) {
    (async () => {
        const db = new PersistentDatabase();
        await db.initialize();
        const seeder = new DocumentSeeder(db);
        await seeder.seedAllDocuments();
        const stats = await seeder.getSeadingStats();
        console.log('\n📊 Final Statistics:', JSON.stringify(stats, null, 2));
        await db.close();
    })().catch(console.error);
}
