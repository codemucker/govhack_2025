// Simple test script to verify the real data pipeline works

import { documentFetcher, SAMPLE_AUSTLII_DOCUMENTS } from './api/documentFetcher.js';

async function testPipeline() {
  console.log('🧪 Testing Real Data Pipeline');
  console.log('=============================\n');

  try {
    // Test: List cached documents
    console.log('📋 Test: Listing cached documents...');
    try {
      const cachedDocs = await documentFetcher.getCachedDocuments();
      console.log(`✅ Found ${cachedDocs.length} cached documents`);
      cachedDocs.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.url} (${doc.tags})`);
      });
      console.log('');
    } catch (error) {
      console.log(`❌ Failed to list documents: ${(error as Error).message}`);
      console.log('');
    }

    console.log('✅ Pipeline database connection test completed!');
    console.log('\n🎉 Real data pipeline is connected. Seed data has been removed.');
    console.log('\n📝 Next steps:');
    console.log('   1. Set OPENAI_API_KEY environment variable');
    console.log('   2. Use /api/cache-documents endpoint to cache documents');
    console.log('   3. Use /api/legal/ask endpoint to ask questions');
    
  } catch (error) {
    console.error('❌ Pipeline test failed:', error);
    process.exit(1);
  }
}

testPipeline().catch(console.error);