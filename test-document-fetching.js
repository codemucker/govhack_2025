#!/usr/bin/env node

// Test document fetching directly to verify if we can get actual content

import fetch from 'node-fetch';

const AUSTLII_TEST_URLS = [
  'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/fa200657/',
  'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/fa200357/',
  'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_reg/br2006291/'
];

const BASE_URL = 'http://localhost:4000';

console.log('🧪 Testing Document Fetching Mechanism');
console.log('='.repeat(50));

async function testDirectFetch(url) {
  console.log(`\n🔍 Direct Fetch Test: ${url}`);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      const textContent = extractTextFromHtml(html);
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📄 Content Length: ${textContent.length} chars`);
      console.log(`📋 Preview: "${textContent.substring(0, 200)}..."`);
      
      // Check for legal content indicators
      const legalIndicators = ['section', 'act', 'regulation', 'subsection', 'schedule'];
      const foundIndicators = legalIndicators.filter(ind => textContent.toLowerCase().includes(ind));
      console.log(`⚖️  Legal indicators found: ${foundIndicators.length} (${foundIndicators.join(', ')})`);
      
      return { success: true, contentLength: textContent.length, content: textContent };
    } else {
      console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.log(`💥 Fetch Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testServerDocumentAPI(url) {
  console.log(`\n🏛️ Server API Test: ${url}`);
  try {
    const encodedUrl = encodeURIComponent(url);
    const response = await fetch(`${BASE_URL}/api/admin/documents/${encodedUrl}`);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log(`✅ API Status: 200`);
      console.log(`📄 Content Length: ${data.content?.length || 0} chars`);
      
      if (data.content && data.content.length > 0) {
        console.log(`📋 Preview: "${data.content.substring(0, 200)}..."`);
        
        const legalIndicators = ['section', 'act', 'regulation', 'subsection', 'schedule'];
        const foundIndicators = legalIndicators.filter(ind => data.content.toLowerCase().includes(ind));
        console.log(`⚖️  Legal indicators found: ${foundIndicators.length} (${foundIndicators.join(', ')})`);
        
        return { success: true, contentLength: data.content.length, hasContent: true };
      } else {
        console.log(`❌ Document has no content in database`);
        return { success: true, contentLength: 0, hasContent: false };
      }
    } else {
      console.log(`❌ API Error: ${response.status}`);
      return { success: false, error: `API ${response.status}` };
    }
  } catch (error) {
    console.log(`💥 API Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testDocumentFetchingAPI(url) {
  console.log(`\n🔧 Document Fetching API Test: ${url}`);
  try {
    const response = await fetch(`${BASE_URL}/api/test/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    if (response.ok) {
      const data = await response.json();
      
      console.log(`✅ Fetch API Status: 200`);
      console.log(`📄 Content Length: ${data.content_length} chars`);
      console.log(`🔗 URL: ${data.url}`);
      console.log(`💾 Cached: ${data.cached}`);
      console.log(`🤖 Synthetic: ${data.synthetic}`);
      
      return { success: true, contentLength: data.content_length };
    } else {
      console.log(`❌ Fetch API Error: ${response.status}`);
      return { success: false, error: `Fetch API ${response.status}` };
    }
  } catch (error) {
    console.log(`💥 Fetch API Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

function extractTextFromHtml(html) {
  // Simple HTML text extraction
  return html
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function runTests() {
  console.log('\n📊 COMPREHENSIVE DOCUMENT FETCHING TESTS\n');
  
  let totalTests = 0;
  let passedTests = 0;
  let documentsWithContent = 0;
  
  for (const url of AUSTLII_TEST_URLS) {
    console.log('\n' + '='.repeat(80));
    console.log(`Testing: ${url}`);
    console.log('='.repeat(80));
    
    // Test 1: Direct fetch
    const directResult = await testDirectFetch(url);
    totalTests++;
    if (directResult.success && directResult.contentLength > 1000) {
      passedTests++;
      documentsWithContent++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
    
    // Test 2: Server API
    const apiResult = await testServerDocumentAPI(url);
    totalTests++;
    if (apiResult.success && apiResult.hasContent) {
      passedTests++;
    }
    
    // Test 3: Document Fetching API
    const fetchResult = await testDocumentFetchingAPI(url);
    totalTests++;
    if (fetchResult.success && fetchResult.contentLength > 1000) {
      passedTests++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🎯 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`📊 Total tests: ${totalTests}`);
  console.log(`✅ Passed tests: ${passedTests}`);
  console.log(`❌ Failed tests: ${totalTests - passedTests}`);
  console.log(`📄 Documents with content: ${documentsWithContent}/${AUSTLII_TEST_URLS.length}`);
  
  if (documentsWithContent === 0) {
    console.log('\n🚨 CRITICAL ISSUE: No documents could be fetched with content!');
    console.log('   This confirms the ingestion system is broken.');
    console.log('   Responses are likely coming from LLM training data, not legislation.');
    process.exit(1);
  } else if (documentsWithContent < AUSTLII_TEST_URLS.length) {
    console.log('\n⚠️  PARTIAL FAILURE: Some documents could not be fetched.');
    console.log('   The ingestion system is partially working but needs fixes.');
  } else {
    console.log('\n🎉 SUCCESS: All documents can be fetched with content!');
    console.log('   The ingestion system appears to be working correctly.');
  }
}

runTests().catch(console.error);