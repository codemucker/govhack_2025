#!/usr/bin/env node

// Preseed script to populate database with permit sites from all Australian jurisdictions

import { PersistentDatabase } from './persistent-database.js';
import { PermitSiteIngester } from './permit-site-ingester.js';

class PermitPreseedService {
  constructor() {
    this.db = null;
    this.ingester = null;
  }

  async initialize() {
    console.log('🚀 Initializing Permit Preseed Service...');
    
    // Initialize database
    this.db = new PersistentDatabase();
    await this.db.initialize();
    
    // Initialize permit site ingester with null documentFetcher (will disable web search)
    this.ingester = new PermitSiteIngester(this.db, null);
    
    console.log('✅ Initialization complete');
  }

  async preseedAllJurisdictions() {
    console.log('🌱 Starting preseed of permit sites for all Australian jurisdictions...');
    
    try {
      // Run the preseeding process
      const totalSites = await this.ingester.preseedDatabase();
      
      // Get final stats
      const stats = await this.db.getStats();
      
      console.log('\n📊 PRESEED COMPLETE');
      console.log('===================');
      console.log(`✅ Total permit sites ingested: ${totalSites}`);
      console.log(`📚 Total documents in database: ${stats.documents}`);
      console.log(`💾 Cache size: ${stats.cache.totalSize}KB (${stats.cache.files} files)`);
      console.log(`📊 Database path: ${stats.database_path}`);
      
      return {
        success: true,
        sites_ingested: totalSites,
        total_documents: stats.documents,
        cache_size_kb: stats.cache.totalSize
      };
      
    } catch (error) {
      console.error('❌ Preseed failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async preseedSpecificJurisdiction(jurisdiction) {
    console.log(`🏛️ Preseeding permit sites for ${jurisdiction.toUpperCase()}...`);
    
    try {
      const sites = await this.ingester.ingestPermitSitesForJurisdiction(jurisdiction, []);
      
      console.log(`✅ Successfully ingested ${sites.length} sites for ${jurisdiction.toUpperCase()}`);
      return {
        success: true,
        jurisdiction: jurisdiction,
        sites_ingested: sites.length,
        sites: sites.map(s => s.url)
      };
      
    } catch (error) {
      console.error(`❌ Failed to preseed ${jurisdiction}:`, error.message);
      return {
        success: false,
        jurisdiction: jurisdiction,
        error: error.message
      };
    }
  }

  async showCurrentStats() {
    const stats = await this.db.getStats();
    const permitSites = await this.db.allQuery(`
      SELECT jurisdiction, COUNT(*) as count 
      FROM documents 
      WHERE document_type = 'permit_site' 
      GROUP BY jurisdiction
      ORDER BY count DESC
    `);
    
    console.log('\n📊 CURRENT DATABASE STATS');
    console.log('==========================');
    console.log(`📚 Total documents: ${stats.documents}`);
    console.log(`🏛️ Permit sites by jurisdiction:`);
    
    if (permitSites.length > 0) {
      permitSites.forEach(row => {
        console.log(`   ${row.jurisdiction?.toUpperCase() || 'Unknown'}: ${row.count} sites`);
      });
    } else {
      console.log('   No permit sites found in database');
    }
    
    console.log(`💾 Cache: ${stats.cache.totalSize}KB (${stats.cache.files} files)`);
    console.log(`📅 Last updated: ${stats.last_updated}`);
    
    return stats;
  }

  async close() {
    if (this.db) {
      await this.db.close();
    }
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const jurisdiction = args[1];
  
  const service = new PermitPreseedService();
  await service.initialize();
  
  try {
    switch (command) {
      case 'all':
        await service.preseedAllJurisdictions();
        break;
        
      case 'jurisdiction':
        if (!jurisdiction) {
          console.error('❌ Please specify jurisdiction: qld, nsw, vic, wa, sa, tas, nt, act, cth');
          process.exit(1);
        }
        await service.preseedSpecificJurisdiction(jurisdiction.toLowerCase());
        break;
        
      case 'stats':
        await service.showCurrentStats();
        break;
        
      case 'clear':
        console.log('🧹 Clearing permit sites from database...');
        await service.db.runQuery(`DELETE FROM documents WHERE document_type = 'permit_site'`);
        console.log('✅ Permit sites cleared');
        await service.showCurrentStats();
        break;
        
      default:
        console.log('🔧 Permit Site Preseed Tool');
        console.log('Usage:');
        console.log('  node preseed-permits.js all              # Preseed all jurisdictions');
        console.log('  node preseed-permits.js jurisdiction qld  # Preseed specific jurisdiction');
        console.log('  node preseed-permits.js stats             # Show current database stats');
        console.log('  node preseed-permits.js clear             # Clear all permit sites');
        console.log('\nAvailable jurisdictions: qld, nsw, vic, wa, sa, tas, nt, act, cth');
        break;
    }
  } finally {
    await service.close();
  }
}

// Export for use as module
export { PermitPreseedService };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}