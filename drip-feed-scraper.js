#!/usr/bin/env node

// Slow Drip-Feed AustLII Scraper
// Respectfully scrapes documents with configurable delays
// Integrates directly with database for seamless content ingestion

import { PersistentDatabase } from './persistent-database.js';
import { CurlLikeFetcher } from './curl-like-fetcher.js';
import { promises as fs } from 'fs';
import { join } from 'path';

class DripFeedScraper {
  constructor(options = {}) {
    this.db = null;
    this.fetcher = null;
    this.delay = options.delay || 30000; // 30 seconds default
    this.maxDocuments = options.maxDocuments || null; // null = no limit
    this.logFile = options.logFile || 'drip-feed-scraper.log';
    this.running = false;
    this.stats = {
      processed: 0,
      successful: 0,
      failed: 0,
      startTime: null,
      errors: []
    };
  }

  async initialize() {
    this.db = new PersistentDatabase();
    await this.db.initialize();
    
    this.fetcher = new CurlLikeFetcher();
    await this.fetcher.initialize();
    
    this.log('🎯 Drip-Feed Scraper initialized');
    this.log(`⏱️  Delay between requests: ${this.delay / 1000}s`);
    this.log(`📊 Max documents: ${this.maxDocuments || 'unlimited'}`);
  }

  async log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    console.log(logMessage);
    
    try {
      await fs.appendFile(this.logFile, logMessage + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  async getDocumentsToFetch() {
    try {
      const query = `
        SELECT url, jurisdiction, document_type 
        FROM documents 
        WHERE url LIKE '%austlii.edu.au%' 
        AND (content = '' OR content IS NULL OR length(content) < 1000)
        ORDER BY 
          CASE jurisdiction
            WHEN 'QLD' THEN 1
            WHEN 'NSW' THEN 2
            WHEN 'VIC' THEN 3
            WHEN 'Federal' THEN 4
            ELSE 5
          END,
          document_type,
          url
        ${this.maxDocuments ? `LIMIT ${this.maxDocuments}` : ''}
      `;
      
      const documents = await this.db.allQuery(query);
      this.log(`📋 Found ${documents.length} documents to fetch`);
      
      return documents;
    } catch (error) {
      this.log(`❌ Error getting documents: ${error.message}`);
      return [];
    }
  }

  async updateDocumentContent(url, content, contentHash) {
    try {
      // Update database with new content
      await this.db.runQuery(`
        UPDATE documents 
        SET 
          content = ?, 
          content_hash = ?, 
          updated_at = datetime('now'), 
          synthetic = false
        WHERE url = ?
      `, [
        content.substring(0, 10000), // Truncated for database
        contentHash,
        url
      ]);

      // Save full content to cache using saveDocument method
      const doc = {
        url: url,
        content: content,
        jurisdiction: 'Australia',
        document_type: 'legal'
      };
      
      await this.db.saveDocument(doc);
      
      this.log(`💾 Database updated successfully for ${url}`);
      return true;
    } catch (error) {
      this.log(`❌ Database update failed for ${url}: ${error.message}`);
      this.stats.errors.push({
        url: url,
        error: 'Database update failed',
        message: error.message,
        timestamp: new Date()
      });
      return false;
    }
  }

  async fetchSingleDocument(docData, index, total) {
    const { url, jurisdiction, document_type } = docData;
    
    this.log(`\n📄 [${index}/${total}] Fetching: ${jurisdiction} - ${document_type}`);
    this.log(`🔗 URL: ${url}`);
    
    try {
      const result = await this.fetcher.fetchDocument(url);
      
      if (result.success && result.content) {
        // Update database
        const crypto = await import('crypto');
        const contentHash = crypto.default.createHash('md5').update(result.content).digest('hex');
        const updated = await this.updateDocumentContent(url, result.content, contentHash);
        
        if (updated) {
          this.stats.successful++;
          this.log(`✅ Success: ${result.contentLength} chars, ${result.indicators} legal indicators`);
          
          // Log sample content
          const preview = result.content.substring(0, 200).replace(/\n/g, ' ').trim();
          this.log(`📋 Preview: "${preview}..."`);
          
          return { success: true, contentLength: result.contentLength };
        } else {
          this.stats.failed++;
          return { success: false, error: 'Database update failed' };
        }
      } else {
        this.stats.failed++;
        this.log(`❌ Fetch failed: ${result.error}`);
        
        this.stats.errors.push({
          url: url,
          error: result.error,
          timestamp: new Date()
        });
        
        return { success: false, error: result.error };
      }
    } catch (error) {
      this.stats.failed++;
      this.log(`💥 Exception during fetch: ${error.message}`);
      
      this.stats.errors.push({
        url: url,
        error: 'Exception during fetch',
        message: error.message,
        timestamp: new Date()
      });
      
      return { success: false, error: error.message };
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  async logProgress() {
    if (!this.stats.startTime) return;
    
    const elapsed = Date.now() - this.stats.startTime;
    const successRate = this.stats.processed > 0 ? 
      Math.round((this.stats.successful / this.stats.processed) * 100) : 0;
    
    this.log(`\n📊 PROGRESS UPDATE:`);
    this.log(`   ⏱️  Elapsed time: ${this.formatDuration(elapsed)}`);
    this.log(`   📋 Processed: ${this.stats.processed}`);
    this.log(`   ✅ Successful: ${this.stats.successful}`);
    this.log(`   ❌ Failed: ${this.stats.failed}`);
    this.log(`   📈 Success rate: ${successRate}%`);
    
    if (this.stats.successful > 0) {
      const avgTime = elapsed / this.stats.processed;
      const estimatedRemaining = this.maxDocuments ? 
        (this.maxDocuments - this.stats.processed) * avgTime : 'unknown';
      
      if (estimatedRemaining !== 'unknown') {
        this.log(`   ⏳ Estimated remaining: ${this.formatDuration(estimatedRemaining)}`);
      }
    }
  }

  async logFinalStats() {
    const elapsed = Date.now() - this.stats.startTime;
    const successRate = this.stats.processed > 0 ? 
      Math.round((this.stats.successful / this.stats.processed) * 100) : 0;

    this.log(`\n${'='.repeat(60)}`);
    this.log(`🎯 DRIP-FEED SCRAPING COMPLETED`);
    this.log(`${'='.repeat(60)}`);
    this.log(`⏱️  Total time: ${this.formatDuration(elapsed)}`);
    this.log(`📋 Total processed: ${this.stats.processed}`);
    this.log(`✅ Successful: ${this.stats.successful}`);
    this.log(`❌ Failed: ${this.stats.failed}`);
    this.log(`📈 Success rate: ${successRate}%`);
    
    if (this.stats.successful > 0) {
      const avgPerDoc = elapsed / this.stats.processed;
      this.log(`⏱️  Average time per document: ${this.formatDuration(avgPerDoc)}`);
      
      // Calculate data ingested
      const totalContent = this.stats.successful * 15000; // Estimated avg content length
      this.log(`📊 Estimated content ingested: ${Math.round(totalContent / 1000)}KB`);
    }

    // Log error summary if there were failures
    if (this.stats.errors.length > 0) {
      this.log(`\n❌ ERROR SUMMARY (showing first 10):`);
      const errorCounts = {};
      
      this.stats.errors.slice(0, 10).forEach(error => {
        errorCounts[error.error] = (errorCounts[error.error] || 0) + 1;
        this.log(`   • ${error.url}: ${error.error}`);
      });
      
      this.log(`\n📊 ERROR BREAKDOWN:`);
      Object.entries(errorCounts).forEach(([error, count]) => {
        this.log(`   • ${error}: ${count} occurrences`);
      });
    }

    // Database health check
    try {
      const totalDocs = await this.db.getQuery(`
        SELECT COUNT(*) as count FROM documents WHERE url LIKE '%austlii.edu.au%'
      `);
      
      const docsWithContent = await this.db.getQuery(`
        SELECT COUNT(*) as count 
        FROM documents 
        WHERE url LIKE '%austlii.edu.au%' 
        AND content != '' AND content IS NOT NULL AND length(content) >= 1000
      `);
      
      const healthRate = totalDocs?.count > 0 ? 
        Math.round((docsWithContent?.count / totalDocs.count) * 100) : 0;
      
      this.log(`\n🏥 DATABASE HEALTH:`);
      this.log(`   📚 Total AustLII documents: ${totalDocs?.count || 0}`);
      this.log(`   📄 Documents with content: ${docsWithContent?.count || 0}`);
      this.log(`   🏥 Health rate: ${healthRate}%`);
      
    } catch (error) {
      this.log(`⚠️  Could not check database health: ${error.message}`);
    }
  }

  async startDripFeed() {
    if (this.running) {
      this.log('⚠️  Scraper is already running');
      return;
    }

    this.running = true;
    this.stats.startTime = Date.now();
    
    this.log(`\n🚀 Starting drip-feed scraping process`);
    this.log(`${'='.repeat(60)}`);
    
    try {
      // Get documents to fetch
      const documents = await this.getDocumentsToFetch();
      
      if (documents.length === 0) {
        this.log('✅ No documents need fetching - all done!');
        this.running = false;
        return;
      }

      this.log(`🎯 Processing ${documents.length} documents with ${this.delay / 1000}s delays`);
      
      // Process each document
      for (let i = 0; i < documents.length; i++) {
        if (!this.running) {
          this.log('🛑 Scraping stopped by user');
          break;
        }

        const doc = documents[i];
        this.stats.processed++;
        
        await this.fetchSingleDocument(doc, i + 1, documents.length);
        
        // Progress update every 5 documents
        if (this.stats.processed % 5 === 0) {
          await this.logProgress();
        }
        
        // Rate limiting (except for last document)
        if (i < documents.length - 1) {
          this.log(`⏸️  Waiting ${this.delay / 1000}s before next request...`);
          await this.sleep(this.delay);
        }
      }

      await this.logFinalStats();
      
    } catch (error) {
      this.log(`💥 Fatal error in drip-feed process: ${error.message}`);
      throw error;
    } finally {
      this.running = false;
    }
  }

  async stop() {
    if (this.running) {
      this.log('🛑 Stopping drip-feed scraper...');
      this.running = false;
    }
  }

  // Test mode - just fetch one document
  async testMode() {
    this.log('🧪 Running in TEST MODE - fetching one document');
    
    const testDocs = await this.db.allQuery(`
      SELECT url, jurisdiction, document_type 
      FROM documents 
      WHERE url LIKE '%austlii.edu.au%' 
      AND (content = '' OR content IS NULL)
      LIMIT 1
    `);

    if (testDocs.length === 0) {
      this.log('❌ No test documents available');
      return false;
    }

    const result = await this.fetchSingleDocument(testDocs[0], 1, 1);
    
    if (result.success) {
      this.log('✅ TEST PASSED - drip-feed scraper is working');
      return true;
    } else {
      this.log('❌ TEST FAILED - check configuration');
      return false;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  // Parse options
  const options = {};
  
  // Parse delay
  const delayArg = args.find(arg => arg.startsWith('--delay='));
  if (delayArg) {
    options.delay = parseInt(delayArg.split('=')[1]) * 1000;
  }
  
  // Parse max documents
  const maxArg = args.find(arg => arg.startsWith('--max='));
  if (maxArg) {
    options.maxDocuments = parseInt(maxArg.split('=')[1]);
  }

  const scraper = new DripFeedScraper(options);

  try {
    await scraper.initialize();

    switch (command) {
      case 'test':
        await scraper.testMode();
        break;
        
      case 'start':
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
          console.log('\n🛑 Received interrupt signal...');
          await scraper.stop();
          process.exit(0);
        });
        
        await scraper.startDripFeed();
        break;
        
      case 'quick':
        // Quick mode - 10 second delays, max 10 docs
        scraper.delay = 10000;
        scraper.maxDocuments = 10;
        await scraper.startDripFeed();
        break;
        
      case 'help':
      default:
        console.log(`
🎯 AustLII Drip-Feed Scraper

USAGE:
  node drip-feed-scraper.js <command> [options]

COMMANDS:
  test                    Test fetch of one document
  start                   Start full drip-feed scraping
  quick                   Quick mode (10s delay, max 10 docs)
  help                    Show this help

OPTIONS:
  --delay=<seconds>       Delay between requests (default: 30)
  --max=<number>          Maximum documents to process (default: unlimited)

EXAMPLES:
  node drip-feed-scraper.js test
  node drip-feed-scraper.js start --delay=45 --max=20
  node drip-feed-scraper.js quick
  node drip-feed-scraper.js start --delay=60

NOTES:
  - Use Ctrl+C to stop gracefully
  - Logs saved to drip-feed-scraper.log
  - Respectful delays prevent overwhelming servers
  - Direct database integration for seamless content ingestion
        `);
        break;
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Handle direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { DripFeedScraper };