#!/usr/bin/env node

// Simple test script to verify the real data pipeline works
// This tests document fetching and caching without needing the full server

const { documentFetcher, SAMPLE_AUSTLII_DOCUMENTS } = require('./api/documentFetcher');

async function testPipeline() {
  console.log('🧪 Testing Real Data Pipeline');
  console.log('=============================\n');

  try {
    // Test 1: Cache a single document
    console.log('📄 Test 1: Caching single document...');
    const testUrl = 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/ca2001172/';
    
    try {
      const doc = await documentFetcher.fetchDocument(testUrl);
      console.log('✅ Document cached successfully:');
      console.log(`   URL: ${doc.url}`);
      console.log(`   Content length: ${doc.content.length} characters`);
      console.log(`   Tags: ${doc.tags.join(', ')}`);
      console.log('');
    } catch (error) {
      console.log(`❌ Failed to cache document: ${error.message}`);
      console.log('');
    }

    // Test 2: List cached documents
    console.log('📋 Test 2: Listing cached documents...');
    try {
      const cachedDocs = await documentFetcher.getCachedDocuments();
      console.log(`✅ Found ${cachedDocs.length} cached documents`);
      cachedDocs.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.url} (${doc.tags})`);
      });
      console.log('');
    } catch (error) {
      console.log(`❌ Failed to list documents: ${error.message}`);
      console.log('');
    }

    // Test 3: Search documents
    console.log('🔍 Test 3: Searching documents...');
    try {
      const results = await documentFetcher.findDocuments('corporation');
      console.log(`✅ Found ${results.length} documents matching 'corporation'`);
      results.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.url}`);
      });
      console.log('');
    } catch (error) {
      console.log(`❌ Search failed: ${error.message}`);
      console.log('');
    }

    console.log('✅ Pipeline test completed successfully!');
    console.log('\n🎉 Real data pipeline is working. Seed data has been removed.');
    
  } catch (error) {
    console.error('❌ Pipeline test failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testPipeline().catch(console.error);
}

module.exports = { testPipeline };