#!/usr/bin/env node

// Final comprehensive test to verify actual response grounding using real query data

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000';
const LEGAL_URL = `${BASE_URL}/api/legal`;
const ADMIN_URL = `${BASE_URL}/api/admin`;

console.log('🎯 FINAL RESPONSE GROUNDING VERIFICATION TEST');
console.log('='.repeat(60));

// Test specific queries that we know should return detailed legislative content
const GROUNDING_TESTS = [
  {
    name: "QLD Food Act Definition Test",
    query: "According to Queensland Food Act 2006, what exactly is defined as a 'food business'? Please quote the specific legal definition.",
    expectedSources: ['https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/fa200657/'],
    expectSpecificContent: ['means a business', 'food business', 'includes', 'does not include'],
    expectLegalStructure: ['section', 'definition', 'act', 'subsection']
  },
  {
    name: "QLD Food Safety Inspector Powers Test",
    query: "What specific powers do Queensland food safety inspectors have under section 88 of the Food Act 2006? List the exact legal provisions.",
    expectedSources: ['https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/fa200657/'],
    expectSpecificContent: ['inspector', 'power', 'enter', 'premises', 'inspect'],
    expectLegalStructure: ['section 88', 'subsection', 'paragraph', 'may']
  },
  {
    name: "QLD Food Business Penalties Test", 
    query: "Under Queensland Food Act 2006, what are the maximum penalty amounts for operating without a food business licence? Cite the specific sections and penalty units.",
    expectedSources: ['https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/fa200657/'],
    expectSpecificContent: ['penalty', 'fine', 'maximum', 'penalty units', 'offence'],
    expectLegalStructure: ['section', 'maximum penalty', 'penalty units', 'dollars']
  }
];

async function main() {
  let totalTests = 0;
  let passedTests = 0;
  let stronglyGrounded = 0;

  console.log('\n🔍 Testing Real Response Grounding...\n');

  for (const test of GROUNDING_TESTS) {
    console.log('='.repeat(80));
    console.log(`🧪 ${test.name}`);
    console.log('='.repeat(80));
    console.log(`❓ Query: "${test.query}"`);
    
    totalTests++;

    try {
      // Submit the query
      const queryRes = await fetch(`${LEGAL_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: test.query,
          bypassClarification: true
        })
      });

      if (!queryRes.ok) {
        console.log(`❌ Query failed: ${queryRes.status}`);
        continue;
      }

      const queryData = await queryRes.json();

      if (!queryData.success) {
        console.log(`❌ Query processing failed: ${queryData.error}`);
        continue;
      }

      console.log(`\n📋 RESPONSE ANALYSIS:`);
      console.log(`📝 Response length: ${queryData.answer.length} characters`);
      console.log(`📄 Sources: ${queryData.sources?.length || 0}`);
      console.log(`🎯 Confidence: ${queryData.confidence}`);

      // Check sources
      const hasExpectedSources = test.expectedSources.some(expectedUrl =>
        queryData.sources?.some(source => 
          source.url.includes(expectedUrl.split('/').pop()) || source.url === expectedUrl
        )
      );

      console.log(`\n🔍 SOURCE VERIFICATION:`);
      console.log(`✅ Expected AustLII source found: ${hasExpectedSources ? 'YES' : 'NO'}`);
      
      if (queryData.sources) {
        queryData.sources.forEach((source, i) => {
          console.log(`   📄 Source ${i+1}: ${source.title} (${source.url})`);
        });
      }

      // Analyze response content for grounding indicators
      const response = queryData.answer.toLowerCase();
      
      // Check for specific content
      const contentMatches = test.expectSpecificContent.filter(content =>
        response.includes(content.toLowerCase())
      );

      // Check for legal structure indicators  
      const structureMatches = test.expectLegalStructure.filter(structure =>
        response.includes(structure.toLowerCase())
      );

      // Look for direct quotes (indicating specific legislative text)
      const quotationMarks = (queryData.answer.match(/["']/g) || []).length;
      const hasQuotes = quotationMarks >= 2;

      // Look for section references
      const sectionReferences = queryData.answer.match(/section \d+|s\. \d+|\(\d+\)|subsection \([a-z]\)/gi) || [];
      
      // Look for specific penalty amounts or units
      const penaltyReferences = queryData.answer.match(/\$[\d,]+|penalty units?|\d+ penalty/gi) || [];

      console.log(`\n📊 GROUNDING ANALYSIS:`);
      console.log(`🎯 Content matches: ${contentMatches.length}/${test.expectSpecificContent.length} (${contentMatches.join(', ')})`);
      console.log(`⚖️  Legal structure: ${structureMatches.length}/${test.expectLegalStructure.length} (${structureMatches.join(', ')})`);
      console.log(`📝 Direct quotes: ${hasQuotes ? 'YES' : 'NO'} (${quotationMarks} quotation marks)`);
      console.log(`🔢 Section references: ${sectionReferences.length} (${sectionReferences.join(', ')})`);
      console.log(`💰 Penalty references: ${penaltyReferences.length} (${penaltyReferences.join(', ')})`);

      console.log(`\n📖 RESPONSE PREVIEW:`);
      console.log(`"${queryData.answer.substring(0, 300)}${queryData.answer.length > 300 ? '...' : ''}"`);

      // Scoring
      let score = 0;
      let maxScore = 5;

      // 1. Has expected sources (20%)
      if (hasExpectedSources) score++;

      // 2. Has good content matches (20%)
      if (contentMatches.length >= test.expectSpecificContent.length / 2) score++;

      // 3. Has legal structure (20%)
      if (structureMatches.length >= test.expectLegalStructure.length / 2) score++;

      // 4. Has section references or quotes (20%)
      if (sectionReferences.length > 0 || hasQuotes) score++;

      // 5. Response is substantial and detailed (20%)
      if (queryData.answer.length > 500 && queryData.confidence > 0.8) score++;

      const graded = score >= 3;
      const stronglyGroundedTest = score >= 4;

      console.log(`\n🏆 FINAL SCORING:`);
      console.log(`📊 Score: ${score}/${maxScore} (${Math.round(score/maxScore*100)}%)`);
      console.log(`✅ GROUNDED: ${graded ? 'YES' : 'NO'}`);
      console.log(`🎯 STRONGLY GROUNDED: ${stronglyGroundedTest ? 'YES' : 'NO'}`);

      if (graded) {
        passedTests++;
        if (stronglyGroundedTest) stronglyGrounded++;
      }

    } catch (error) {
      console.log(`💥 Test error: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 3000)); // Rate limiting
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎯 COMPREHENSIVE GROUNDING TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`📊 Total tests: ${totalTests}`);
  console.log(`✅ Grounded responses: ${passedTests}`);
  console.log(`🎯 Strongly grounded: ${stronglyGrounded}`);
  console.log(`📈 Success rate: ${Math.round(passedTests/totalTests*100)}%`);
  console.log(`🏆 Strong grounding rate: ${Math.round(stronglyGrounded/totalTests*100)}%`);

  if (stronglyGrounded === totalTests) {
    console.log('\n🎉 EXCELLENT: All responses are strongly grounded in legislation!');
    console.log('   The system is successfully using ingested legal documents.');
    console.log('   Responses contain specific legal provisions and references.');
  } else if (passedTests === totalTests) {
    console.log('\n✅ GOOD: All responses are grounded in legislation.');
    console.log('   The system is using ingested documents, but could quote more specifically.');
  } else if (passedTests > 0) {
    console.log('\n⚠️  PARTIAL: Some responses are grounded, but improvements needed.');
    console.log('   The system is partially using ingested documents.');
  } else {
    console.log('\n🚨 CRITICAL: No responses are properly grounded!');
    console.log('   The system may still be relying on LLM training data.');
    process.exit(1);
  }
}

main().catch(console.error);