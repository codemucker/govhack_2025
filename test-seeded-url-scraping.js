#!/usr/bin/env node

// Test scraping of pre-populated AustLII URLs
// Verify the workaround for AustLII database.html scraping limitations

import { PersistentDatabase } from './persistent-database.js';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000';

console.log('🧪 Testing Pre-Populated URL Scraping');
console.log('='.repeat(50));

class SeededURLScrapingTest {
  constructor() {
    this.db = null;
    this.passedTests = 0;
    this.totalTests = 0;
  }

  async initialize() {
    this.db = new PersistentDatabase();
    await this.db.initialize();
  }

  async getSeededAustLIIUrls(limit = 10) {
    const urls = await this.db.allQuery(`
      SELECT url, jurisdiction, document_type 
      FROM documents 
      WHERE url LIKE '%austlii.edu.au%' 
      AND content = ''
      ORDER BY RANDOM() 
      LIMIT ?
    `, [limit]);
    
    return urls || [];
  }

  async testDirectURLFetch(url) {
    console.log(`\n🔍 Direct URL Test: ${url}`);
    this.totalTests++;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 30000
      });

      if (response.ok) {
        const html = await response.text();
        const textContent = this.extractTextFromHtml(html);
        
        console.log(`✅ Status: ${response.status}`);
        console.log(`📄 Content Length: ${textContent.length} chars`);
        console.log(`📋 Preview: "${textContent.substring(0, 300)}..."`);
        
        // Check for legal content indicators
        const legalIndicators = this.checkLegalContent(textContent);
        console.log(`⚖️  Legal indicators: ${legalIndicators.found}/${legalIndicators.total} (${legalIndicators.indicators.join(', ')})`);
        
        if (textContent.length > 1000 && legalIndicators.found >= 3) {
          console.log(`🎯 PASS: Valid legal document content`);
          this.passedTests++;
          return { success: true, content: textContent, indicators: legalIndicators };
        } else {
          console.log(`❌ FAIL: Insufficient content or legal indicators`);
          return { success: false, error: 'Insufficient content' };
        }
      } else {
        console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      console.log(`💥 Fetch Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async testServerDocumentAPI(url) {
    console.log(`\n🏛️ Server Document API Test: ${url}`);
    this.totalTests++;

    try {
      const encodedUrl = encodeURIComponent(url);
      const response = await fetch(`${BASE_URL}/api/admin/documents/${encodedUrl}`, {
        timeout: 30000
      });
      
      if (response.ok) {
        const data = await response.json();
        
        console.log(`✅ API Status: 200`);
        console.log(`📄 Content Length: ${data.content?.length || 0} chars`);
        
        if (data.content && data.content.length > 1000) {
          console.log(`📋 Preview: "${data.content.substring(0, 300)}..."`);
          
          const legalIndicators = this.checkLegalContent(data.content);
          console.log(`⚖️  Legal indicators: ${legalIndicators.found}/${legalIndicators.total} (${legalIndicators.indicators.join(', ')})`);
          
          if (legalIndicators.found >= 3) {
            console.log(`🎯 PASS: Document API returned valid content`);
            this.passedTests++;
            return { success: true, contentLength: data.content.length, hasContent: true };
          }
        }
        
        console.log(`❌ FAIL: Document API returned insufficient content`);
        return { success: false, error: 'Insufficient content from API' };
      } else {
        console.log(`❌ API Error: ${response.status}`);
        return { success: false, error: `API ${response.status}` };
      }
    } catch (error) {
      console.log(`💥 API Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async testEnhancedDocumentFetch(url) {
    console.log(`\n🔧 Enhanced Document Fetch Test: ${url}`);
    this.totalTests++;

    try {
      const response = await fetch(`${BASE_URL}/api/test/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        timeout: 30000
      });
      
      if (response.ok) {
        const data = await response.json();
        
        console.log(`✅ Enhanced Fetch Status: 200`);
        console.log(`📄 Content Length: ${data.content_length} chars`);
        console.log(`🔗 URL: ${data.url}`);
        console.log(`💾 Cached: ${data.cached}`);
        console.log(`🤖 Synthetic: ${data.synthetic}`);
        
        if (data.content_length > 1000) {
          console.log(`🎯 PASS: Enhanced fetcher successfully retrieved content`);
          this.passedTests++;
          return { success: true, contentLength: data.content_length };
        } else {
          console.log(`❌ FAIL: Enhanced fetcher returned insufficient content`);
          return { success: false, error: 'Insufficient content' };
        }
      } else {
        console.log(`❌ Enhanced Fetch Error: ${response.status}`);
        return { success: false, error: `Enhanced Fetch ${response.status}` };
      }
    } catch (error) {
      console.log(`💥 Enhanced Fetch Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async testLegalQueryGrounding() {
    console.log(`\n📋 Legal Query Grounding Test`);
    this.totalTests++;

    try {
      // Test a specific legal query that should use our seeded URLs
      const testQuery = "What are the food business licence requirements under Queensland Food Act 2006?";
      
      const response = await fetch(`${BASE_URL}/api/legal/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: testQuery,
          bypassClarification: true
        }),
        timeout: 60000
      });

      if (response.ok) {
        const data = await response.json();
        
        console.log(`✅ Query Status: Success`);
        console.log(`📝 Response Length: ${data.answer?.length || 0} chars`);
        console.log(`📄 Sources: ${data.sources?.length || 0}`);
        console.log(`🎯 Confidence: ${data.confidence}`);
        
        // Check if sources include our seeded AustLII URLs
        const austliiSources = data.sources?.filter(source => 
          source.url.includes('austlii.edu.au')
        ) || [];
        
        console.log(`🏛️ AustLII Sources: ${austliiSources.length}`);
        austliiSources.forEach(source => {
          console.log(`   📄 ${source.title || 'Legal Document'} (${source.url})`);
        });
        
        if (austliiSources.length > 0 && data.answer.length > 500) {
          console.log(`🎯 PASS: Query successfully used seeded AustLII documents`);
          this.passedTests++;
          return { success: true, austliiSources: austliiSources.length };
        } else {
          console.log(`❌ FAIL: Query did not use seeded AustLII documents effectively`);
          return { success: false, error: 'No AustLII sources used' };
        }
        
      } else {
        console.log(`❌ Query Error: ${response.status}`);
        return { success: false, error: `Query ${response.status}` };
      }
    } catch (error) {
      console.log(`💥 Query Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  extractTextFromHtml(html) {
    // Simple HTML text extraction
    return html
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  checkLegalContent(text) {
    const indicators = [
      'section', 'act', 'regulation', 'subsection', 'schedule', 
      'paragraph', 'penalty', 'offence', 'licence', 'permit',
      'authority', 'legislation', 'statutory', 'law', 'legal'
    ];
    
    const lowerText = text.toLowerCase();
    const foundIndicators = indicators.filter(indicator => 
      lowerText.includes(indicator)
    );
    
    return {
      found: foundIndicators.length,
      total: indicators.length,
      indicators: foundIndicators
    };
  }

  async runComprehensiveTest() {
    console.log(`\n📊 COMPREHENSIVE SEEDED URL SCRAPING TEST\n`);
    
    // Get sample URLs from our seeded data
    const seededUrls = await this.getSeededAustLIIUrls(5);
    
    if (seededUrls.length === 0) {
      console.log(`❌ No empty AustLII URLs found in database for testing`);
      return;
    }
    
    console.log(`🎯 Testing ${seededUrls.length} seeded AustLII URLs...\n`);
    
    for (const urlData of seededUrls) {
      console.log('\\n' + '='.repeat(80));
      console.log(`Testing: ${urlData.jurisdiction} - ${urlData.document_type}`);
      console.log(`URL: ${urlData.url}`);
      console.log('='.repeat(80));
      
      // Test 1: Direct fetch
      await this.testDirectURLFetch(urlData.url);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting
      
      // Test 2: Server API
      await this.testServerDocumentAPI(urlData.url);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting
      
      // Test 3: Enhanced document fetcher
      await this.testEnhancedDocumentFetch(urlData.url);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Rate limiting
    }
    
    // Test 4: Legal query grounding
    console.log('\\n' + '='.repeat(80));
    console.log('LEGAL QUERY GROUNDING TEST');
    console.log('='.repeat(80));
    await this.testLegalQueryGrounding();
    
    // Summary
    console.log('\\n' + '='.repeat(80));
    console.log('🎯 SEEDED URL SCRAPING TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`📊 Total tests: ${this.totalTests}`);
    console.log(`✅ Passed tests: ${this.passedTests}`);
    console.log(`❌ Failed tests: ${this.totalTests - this.passedTests}`);
    console.log(`📈 Success rate: ${Math.round((this.passedTests / this.totalTests) * 100)}%`);
    
    if (this.passedTests === this.totalTests) {
      console.log('\\n🎉 EXCELLENT: All URL scraping tests passed!');
      console.log('   The AustLII workaround is working perfectly.');
      console.log('   Documents can be fetched and used for legal queries.');
    } else if (this.passedTests > this.totalTests * 0.7) {
      console.log('\\n✅ GOOD: Most URL scraping tests passed.');
      console.log('   The AustLII workaround is mostly working.');
      console.log('   Some URLs may need individual attention.');
    } else if (this.passedTests > 0) {
      console.log('\\n⚠️  PARTIAL: Some URL scraping tests passed.');
      console.log('   The AustLII workaround is partially working.');
      console.log('   Investigation needed for failed URLs.');
    } else {
      console.log('\\n🚨 CRITICAL: No URL scraping tests passed!');
      console.log('   The AustLII workaround is not working.');
      console.log('   Major fixes needed for document fetching.');
      process.exit(1);
    }
  }
}

// Run the test
async function main() {
  const tester = new SeededURLScrapingTest();
  await tester.initialize();
  await tester.runComprehensiveTest();
}

main().catch(console.error);