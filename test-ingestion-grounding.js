#!/usr/bin/env node

// Comprehensive Ingestion and Response Grounding Tests
// Tests to verify we're reading actual legislation and generating responses from ingested data

import fs from 'fs';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000';
const ADMIN_URL = `${BASE_URL}/api/admin`;
const LEGAL_URL = `${BASE_URL}/api/legal`;

console.log('🧪 LegalEase Ingestion & Response Grounding Tests');
console.log('='.repeat(60));

// Test configuration
const TESTS = {
  database: {
    name: 'Database Content Analysis',
    run: testDatabaseContent
  },
  ingestion: {
    name: 'Document Ingestion Verification',
    run: testDocumentIngestion
  },
  grounding: {
    name: 'Response Grounding Verification',
    run: testResponseGrounding
  },
  specific: {
    name: 'Specific Legislation Tests',
    run: testSpecificLegislation
  }
};

// Test specific legal queries with known answers from legislation
const SPECIFIC_TESTS = [
  {
    query: "What is the definition of 'food business' under Queensland Food Act 2006?",
    jurisdiction: 'qld',
    expected_source: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/fa200657/',
    expected_content_keywords: ['food business', 'means', 'definition', 'section']
  },
  {
    query: "What are the penalties for operating without a food business licence in Queensland?",
    jurisdiction: 'qld', 
    expected_source: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/fa200657/',
    expected_content_keywords: ['penalty', 'fine', 'licence', 'offence']
  },
  {
    query: "What powers do food safety inspectors have under Queensland law?",
    jurisdiction: 'qld',
    expected_source: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/fa200657/',
    expected_content_keywords: ['inspector', 'power', 'enter', 'inspect']
  }
];

async function main() {
  let totalPassed = 0;
  let totalFailed = 0;
  
  for (const [key, test] of Object.entries(TESTS)) {
    console.log(`\n🔍 Running: ${test.name}`);
    console.log('-'.repeat(40));
    
    try {
      const result = await test.run();
      if (result.passed) {
        console.log(`✅ PASSED: ${result.summary}`);
        totalPassed++;
      } else {
        console.log(`❌ FAILED: ${result.summary}`);
        if (result.details) {
          console.log(`   Details: ${result.details}`);
        }
        totalFailed++;
      }
    } catch (error) {
      console.log(`💥 ERROR: ${error.message}`);
      totalFailed++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`🎯 TEST SUMMARY: ${totalPassed} passed, ${totalFailed} failed`);
  
  if (totalFailed > 0) {
    console.log('\n⚠️  CRITICAL ISSUES FOUND:');
    console.log('   - The system may not be properly grounded in legislation');
    console.log('   - Responses may be coming from LLM training data instead of ingested docs');
    console.log('   - Document ingestion may be incomplete or broken');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed! System is properly grounded in legislation.');
  }
}

async function testDatabaseContent() {
  // Test 1: Check database statistics
  const statsRes = await fetch(`${ADMIN_URL}/stats`);
  const stats = await statsRes.json();
  
  console.log(`📊 Database contains ${stats.total_documents} documents`);
  
  if (stats.total_documents < 20) {
    return {
      passed: false,
      summary: `Only ${stats.total_documents} documents in database (expected > 20)`,
      details: 'Database appears to be under-populated for comprehensive legal coverage'
    };
  }
  
  // Test 2: Check document content
  const docsRes = await fetch(`${ADMIN_URL}/documents?limit=10`);
  const docsData = await docsRes.json();
  
  let documentsWithContent = 0;
  let totalContentLength = 0;
  let legislationDocuments = 0;
  
  for (const doc of docsData.documents.slice(0, 5)) {
    try {
      const docRes = await fetch(`${ADMIN_URL}/documents/${encodeURIComponent(doc.url)}`);
      const docData = await docRes.json();
      
      if (docData.content && docData.content.length > 1000) {
        documentsWithContent++;
        totalContentLength += docData.content.length;
        
        if (doc.document_type === 'act' || doc.document_type === 'regulation') {
          legislationDocuments++;
        }
        
        console.log(`   ✓ ${doc.url}: ${docData.content.length} chars (${doc.document_type})`);
      } else {
        console.log(`   ✗ ${doc.url}: NO CONTENT or too short`);
      }
    } catch (error) {
      console.log(`   ✗ ${doc.url}: ERROR - ${error.message}`);
    }
  }
  
  const avgContentLength = documentsWithContent > 0 ? Math.round(totalContentLength / documentsWithContent) : 0;
  
  console.log(`📄 Content Analysis: ${documentsWithContent}/5 docs have substantial content`);
  console.log(`📏 Average content length: ${avgContentLength} characters`);
  console.log(`⚖️  Legislation documents: ${legislationDocuments}/5 checked`);
  
  if (documentsWithContent < 3) {
    return {
      passed: false,
      summary: `Only ${documentsWithContent}/5 documents have substantial content`,
      details: 'Documents may not be properly ingested or may be empty'
    };
  }
  
  if (avgContentLength < 5000) {
    return {
      passed: false,
      summary: `Average document length ${avgContentLength} chars is too short for legislation`,
      details: 'Legal documents should typically be much longer'
    };
  }
  
  return {
    passed: true,
    summary: `${documentsWithContent}/5 documents have good content (avg ${avgContentLength} chars)`
  };
}

async function testDocumentIngestion() {
  // Test the document discovery and ingestion process
  console.log('🔍 Testing document discovery process...');
  
  // Trigger document ingestion for a specific area
  const queryRes = await fetch(`${LEGAL_URL}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: "What are the food safety requirements for commercial kitchens in Queensland?",
      bypassClarification: true
    })
  });
  
  const queryData = await queryRes.json();
  
  if (!queryData.success) {
    return {
      passed: false,
      summary: 'Query processing failed',
      details: queryData.error || 'Unknown error during query processing'
    };
  }
  
  console.log(`📋 Query processed with ${queryData.sources?.length || 0} sources`);
  console.log(`🎯 Confidence: ${queryData.confidence}`);
  
  // Check if sources are properly populated
  if (!queryData.sources || queryData.sources.length === 0) {
    return {
      passed: false,
      summary: 'No sources returned for legal query',
      details: 'Query should have returned relevant legal documents as sources'
    };
  }
  
  // Verify sources contain actual legislation URLs
  let legislationSources = 0;
  for (const source of queryData.sources) {
    console.log(`   📄 Source: ${source.title} (${source.url})`);
    
    if (source.url.includes('austlii.edu.au') || 
        source.url.includes('legislation.gov.au') ||
        source.document_type === 'act' ||
        source.document_type === 'regulation') {
      legislationSources++;
    }
  }
  
  console.log(`⚖️  Legislation sources: ${legislationSources}/${queryData.sources.length}`);
  
  if (legislationSources === 0) {
    return {
      passed: false,
      summary: 'No legislation sources found',
      details: 'Response should be grounded in actual legislation, not just general websites'
    };
  }
  
  return {
    passed: true,
    summary: `Found ${legislationSources} legislation sources out of ${queryData.sources.length} total sources`
  };
}

async function testResponseGrounding() {
  // Test if responses contain content that could only come from actual legislation
  console.log('🎯 Testing response grounding in legislation...');
  
  const testQuery = "What is the specific definition of 'food premises' in Queensland food law?";
  
  const queryRes = await fetch(`${LEGAL_URL}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: testQuery,
      bypassClarification: true
    })
  });
  
  const queryData = await queryRes.json();
  
  if (!queryData.success) {
    return {
      passed: false,
      summary: 'Query processing failed for grounding test',
      details: queryData.error
    };
  }
  
  const response = queryData.answer;
  console.log(`📝 Response length: ${response.length} characters`);
  console.log(`📋 First 200 chars: "${response.substring(0, 200)}..."`);
  
  // Check for specific legislative language that indicates grounding
  const legislativeIndicators = [
    'section', 'subsection', 'act', 'regulation', 'schedule',
    'means', 'includes', 'does not include', 'defined',
    'pursuant to', 'under this act', 'prescribed'
  ];
  
  let indicatorCount = 0;
  for (const indicator of legislativeIndicators) {
    if (response.toLowerCase().includes(indicator.toLowerCase())) {
      indicatorCount++;
    }
  }
  
  console.log(`⚖️  Legislative language indicators: ${indicatorCount}/${legislativeIndicators.length}`);
  
  // Check if response references specific sections or provisions
  const sectionReferences = response.match(/section \d+|s\. \d+|\(\d+\)|subsection \(\w+\)/gi) || [];
  console.log(`📏 Section references found: ${sectionReferences.length}`);
  
  if (indicatorCount < 3) {
    return {
      passed: false,
      summary: `Only ${indicatorCount} legislative language indicators found`,
      details: 'Response may not be properly grounded in legislation'
    };
  }
  
  return {
    passed: true,
    summary: `Response contains ${indicatorCount} legislative indicators and ${sectionReferences.length} section references`
  };
}

async function testSpecificLegislation() {
  console.log('📖 Testing specific legislation knowledge...');
  
  let passed = 0;
  let total = SPECIFIC_TESTS.length;
  
  for (const test of SPECIFIC_TESTS) {
    console.log(`\n🔍 Testing: "${test.query}"`);
    
    const queryRes = await fetch(`${LEGAL_URL}/ask`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: test.query,
        bypassClarification: true
      })
    });
    
    const queryData = await queryRes.json();
    
    if (!queryData.success) {
      console.log(`   ❌ Query failed: ${queryData.error}`);
      continue;
    }
    
    // Check if expected source is used
    const hasExpectedSource = queryData.sources?.some(s => 
      s.url.includes(test.expected_source) || s.url === test.expected_source
    );
    
    // Check if response contains expected keywords
    const response = queryData.answer.toLowerCase();
    const keywordMatches = test.expected_content_keywords.filter(keyword =>
      response.includes(keyword.toLowerCase())
    ).length;
    
    console.log(`   📄 Expected source found: ${hasExpectedSource ? '✅' : '❌'}`);
    console.log(`   🔑 Keyword matches: ${keywordMatches}/${test.expected_content_keywords.length}`);
    console.log(`   📋 Sources: ${queryData.sources?.map(s => s.title).join(', ')}`);
    
    if (hasExpectedSource && keywordMatches >= test.expected_content_keywords.length / 2) {
      passed++;
      console.log(`   ✅ PASSED`);
    } else {
      console.log(`   ❌ FAILED`);
    }
  }
  
  if (passed < total / 2) {
    return {
      passed: false,
      summary: `Only ${passed}/${total} specific legislation tests passed`,
      details: 'System may not be properly accessing or utilizing specific legislative content'
    };
  }
  
  return {
    passed: true,
    summary: `${passed}/${total} specific legislation tests passed`
  };
}

// Run the tests
main().catch(console.error);