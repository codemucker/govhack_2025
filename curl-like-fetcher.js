#!/usr/bin/env node

// Curl-like document fetcher to bypass AustLII bot detection
// Mimics curl requests exactly as they work in browser/command line

import { spawn } from 'child_process';
import { PersistentDatabase } from './persistent-database.js';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';

export class CurlLikeFetcher {
  constructor() {
    this.db = null;
    this.userAgents = [
      'curl/8.4.0',
      'curl/8.1.2',
      'curl/7.88.1',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
    ];
    this.requestDelay = 2000; // 2 second delay between requests
  }

  async initialize() {
    this.db = new PersistentDatabase();
    await this.db.initialize();
  }

  // Execute curl command with proper headers to mimic legitimate access
  async executeCurl(url, options = {}) {
    return new Promise((resolve, reject) => {
      const userAgent = options.userAgent || this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
      
      const curlArgs = [
        url,
        '--silent',                    // Don't show progress
        '--location',                  // Follow redirects
        '--max-time', '30',           // 30 second timeout
        '--connect-timeout', '10',    // 10 second connection timeout
        '--retry', '2',               // Retry twice on failure
        '--retry-delay', '1',         // 1 second delay between retries
        '--user-agent', userAgent,
        '--header', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        '--header', 'Accept-Language: en-US,en;q=0.9',
        '--header', 'Accept-Encoding: gzip, deflate',
        '--header', 'Cache-Control: no-cache',
        '--header', 'DNT: 1',
        '--compressed'                // Accept compressed responses
      ];

      // Add referer for more authentic requests
      if (url.includes('austlii.edu.au')) {
        curlArgs.push('--header', 'Referer: https://www.austlii.edu.au/');
      }

      console.log(`🌐 Fetching with curl: ${url}`);
      
      const curl = spawn('curl', curlArgs);
      let stdout = '';
      let stderr = '';

      curl.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      curl.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      curl.on('close', (code) => {
        if (code === 0 && stdout.length > 0) {
          resolve({
            success: true,
            content: stdout,
            contentLength: stdout.length,
            userAgent: userAgent
          });
        } else {
          reject(new Error(`Curl failed with code ${code}: ${stderr || 'No content received'}`));
        }
      });

      curl.on('error', (error) => {
        reject(new Error(`Curl execution failed: ${error.message}`));
      });
    });
  }

  // Extract text content from HTML similar to browser rendering
  extractTextContent(html) {
    if (!html || typeof html !== 'string') return '';

    // Remove script and style tags completely
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

    // Replace HTML entities
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
      .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

    // Convert HTML to text while preserving structure
    text = text
      .replace(/<\/?(h[1-6]|p|div|br|li)[^>]*>/gi, '\\n')
      .replace(/<\/?(tr|td|th)[^>]*>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\\n+/g, '\\n')
      .replace(/[ \\t]+/g, ' ')
      .trim();

    return text;
  }

  // Check if content looks like valid legal document
  validateLegalContent(content) {
    if (!content || content.length < 500) {
      return { valid: false, reason: 'Content too short' };
    }

    const legalIndicators = [
      'section', 'act', 'regulation', 'subsection', 'schedule', 
      'paragraph', 'penalty', 'offence', 'licence', 'permit',
      'authority', 'legislation', 'statutory', 'law', 'legal',
      'clause', 'part', 'division', 'chapter'
    ];

    const lowerContent = content.toLowerCase();
    const foundIndicators = legalIndicators.filter(indicator => 
      lowerContent.includes(indicator)
    );

    if (foundIndicators.length < 3) {
      return { valid: false, reason: 'Insufficient legal indicators', found: foundIndicators };
    }

    // Check for common error pages
    const errorIndicators = ['404', 'not found', 'error', 'access denied', 'forbidden'];
    const hasErrors = errorIndicators.some(error => lowerContent.includes(error));

    if (hasErrors) {
      return { valid: false, reason: 'Error page detected' };
    }

    return { 
      valid: true, 
      indicators: foundIndicators.length,
      found: foundIndicators
    };
  }

  // Fetch and process a single document
  async fetchDocument(url) {
    try {
      console.log(`📄 Fetching document: ${url}`);
      
      // Use curl to fetch the document
      const result = await this.executeCurl(url);
      
      if (!result.success) {
        throw new Error('Curl request failed');
      }

      // Extract text content
      const textContent = this.extractTextContent(result.content);
      
      // Validate content
      const validation = this.validateLegalContent(textContent);
      
      if (!validation.valid) {
        console.log(`❌ Invalid content: ${validation.reason}`);
        return {
          success: false,
          error: validation.reason,
          contentLength: textContent.length
        };
      }

      console.log(`✅ Valid legal document fetched (${textContent.length} chars, ${validation.indicators} legal indicators)`);
      
      return {
        success: true,
        content: textContent,
        contentLength: textContent.length,
        indicators: validation.indicators,
        userAgent: result.userAgent
      };

    } catch (error) {
      console.log(`❌ Fetch failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Batch fetch documents with proper rate limiting
  async fetchDocumentBatch(urls, options = {}) {
    const batchSize = options.batchSize || 5;
    const results = [];
    
    console.log(`📦 Processing ${urls.length} URLs in batches of ${batchSize}`);
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      console.log(`\\n🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(urls.length/batchSize)}`);
      
      const batchPromises = batch.map(async (urlData, index) => {
        // Stagger requests within batch to avoid overwhelming server
        await new Promise(resolve => setTimeout(resolve, index * 500));
        
        const result = await this.fetchDocument(urlData.url);
        return {
          url: urlData.url,
          jurisdiction: urlData.jurisdiction,
          document_type: urlData.document_type,
          ...result
        };
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const promiseResult of batchResults) {
        if (promiseResult.status === 'fulfilled') {
          results.push(promiseResult.value);
        } else {
          console.error(`💥 Batch item failed:`, promiseResult.reason);
          results.push({
            success: false,
            error: promiseResult.reason.message
          });
        }
      }

      // Rate limiting between batches
      if (i + batchSize < urls.length) {
        console.log(`⏸️  Waiting ${this.requestDelay}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, this.requestDelay));
      }
    }

    return results;
  }

  // Update database with fetched content
  async updateDocumentContent(url, content) {
    try {
      const contentHash = crypto.createHash('md5').update(content).digest('hex');
      
      await this.db.runQuery(`
        UPDATE documents 
        SET content = ?, content_hash = ?, updated_at = datetime('now'), synthetic = false
        WHERE url = ?
      `, [content.substring(0, 10000), contentHash, url]); // Store truncated content in DB

      // Also save full content to cache if database has cache functionality
      try {
        const doc = {
          url: url,
          content: content,
          jurisdiction: 'Australia',
          document_type: 'legal'
        };
        await this.db.saveDocument(doc);
        console.log(`💾 Cached full document content`);
      } catch (cacheError) {
        console.warn(`⚠️ Cache save failed: ${cacheError.message}`);
      }

      console.log(`✅ Updated database for ${url}`);
      return true;
    } catch (error) {
      console.error(`❌ Database update failed for ${url}: ${error.message}`);
      return false;
    }
  }

  // Main function to fetch all empty AustLII documents
  async fetchAllEmptyDocuments() {
    console.log('🎯 Starting Curl-like AustLII Document Fetching');
    console.log('='.repeat(60));

    // Get empty AustLII documents
    const emptyDocs = await this.db.allQuery(`
      SELECT url, jurisdiction, document_type 
      FROM documents 
      WHERE url LIKE '%austlii.edu.au%' 
      AND (content = '' OR content IS NULL)
      LIMIT 50
    `);

    if (emptyDocs.length === 0) {
      console.log('✅ No empty AustLII documents found!');
      return { processed: 0, successful: 0, failed: 0 };
    }

    console.log(`📋 Found ${emptyDocs.length} empty documents to fetch`);

    // Fetch in batches
    const results = await this.fetchDocumentBatch(emptyDocs);

    // Process results and update database
    let successful = 0;
    let failed = 0;

    for (const result of results) {
      if (result.success && result.content) {
        const updated = await this.updateDocumentContent(result.url, result.content);
        if (updated) {
          successful++;
        } else {
          failed++;
        }
      } else {
        failed++;
        console.log(`❌ Failed to fetch ${result.url}: ${result.error}`);
      }
    }

    console.log('\\n' + '='.repeat(60));
    console.log('🎯 CURL-LIKE FETCHING RESULTS');
    console.log('='.repeat(60));
    console.log(`📊 Total processed: ${results.length}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success rate: ${Math.round((successful / results.length) * 100)}%`);

    return {
      processed: results.length,
      successful: successful,
      failed: failed,
      successRate: Math.round((successful / results.length) * 100)
    };
  }
}

// Test a single URL to verify curl approach works
async function testSingleUrl() {
  const fetcher = new CurlLikeFetcher();
  
  console.log('🧪 Testing single AustLII URL with curl approach...');
  
  const testUrl = 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/fa200657/';
  const result = await fetcher.fetchDocument(testUrl);
  
  if (result.success) {
    console.log('🎉 SUCCESS: Curl approach works!');
    console.log(`📄 Content length: ${result.contentLength}`);
    console.log(`⚖️ Legal indicators: ${result.indicators}`);
    console.log(`📋 Preview: "${result.content.substring(0, 300)}..."`);
  } else {
    console.log('❌ FAILED: Curl approach not working');
    console.log(`💥 Error: ${result.error}`);
  }
  
  return result.success;
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  if (command === 'test') {
    // Test mode - just test one URL
    testSingleUrl().catch(console.error);
  } else {
    // Full fetch mode
    const fetcher = new CurlLikeFetcher();
    
    async function runFetch() {
      try {
        await fetcher.initialize();
        
        // First test a single URL
        const testPassed = await testSingleUrl();
        
        if (!testPassed) {
          console.log('❌ Test failed, skipping batch fetch');
          process.exit(1);
        }
        
        // Run full batch fetch
        console.log('\\n' + '='.repeat(60));
        const results = await fetcher.fetchAllEmptyDocuments();
        
        if (results.successRate > 70) {
          console.log('\\n🎉 EXCELLENT: High success rate with curl approach!');
        } else if (results.successRate > 30) {
          console.log('\\n✅ GOOD: Moderate success rate, some URLs working');
        } else {
          console.log('\\n⚠️ WARNING: Low success rate, may need adjustments');
        }
        
      } catch (error) {
        console.error('💥 Fetching failed:', error);
        process.exit(1);
      }
    }
    
    runFetch();
  }
}