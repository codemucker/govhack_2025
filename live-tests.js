#!/usr/bin/env node

// Live Testing Suite for LegalEase
// Tests common questions to ensure the system finds relevant documents and provides answers

const BASE_URL = 'http://localhost:4000';

// Common legal questions that should ALWAYS find results
const CRITICAL_TEST_CASES = [
  {
    category: 'Business Licensing',
    question: 'what permits are required to opena cafe in maroochydore?',
    expectedKeywords: ['food business', 'license', 'permit', 'health', 'council'],
    location: 'Maroochydore, QLD',
    minDocuments: 2,
    description: 'Food business licensing in Queensland'
  },
  {
    category: 'Building Permits',
    question: 'Do I need council approval to build a shed in Melbourne?',
    expectedKeywords: ['building', 'permit', 'council', 'approval', 'development'],
    location: 'Melbourne, VIC',
    minDocuments: 1,
    description: 'Building approvals for residential structures in Victoria'
  },
  {
    category: 'Business Registration',
    question: 'How do I register a new business in Sydney?',
    expectedKeywords: ['business', 'registration', 'ABN', 'ASIC', 'company'],
    location: 'Sydney, NSW',
    minDocuments: 1,
    description: 'Business registration requirements in Australia'
  },
  {
    category: 'Food Safety',
    question: 'What food safety requirements apply to my restaurant in Perth?',
    expectedKeywords: ['food safety', 'restaurant', 'health', 'regulations', 'permit'],
    location: 'Perth, WA',
    minDocuments: 1,
    description: 'Food safety regulations for restaurants'
  },
  {
    category: 'Planning Applications',
    question: 'I want to extend my house in Adelaide, what approvals do I need?',
    expectedKeywords: ['planning', 'development', 'building', 'approval', 'extension'],
    location: 'Adelaide, SA',
    minDocuments: 1,
    description: 'Residential development approvals'
  }
];

// Test result tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: CRITICAL_TEST_CASES.length,
  failures: []
};

class LiveTester {
  constructor() {
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🧪 Starting LegalEase Live Testing Suite...');
    console.log(`📋 Running ${CRITICAL_TEST_CASES.length} critical test cases\n`);

    // Test server health first
    const serverHealthy = await this.testServerHealth();
    if (!serverHealthy) {
      console.error('❌ Server health check failed. Aborting tests.');
      process.exit(1);
    }

    // Run each test case
    for (let i = 0; i < CRITICAL_TEST_CASES.length; i++) {
      const testCase = CRITICAL_TEST_CASES[i];
      const testNumber = i + 1;
      
      console.log(`\n🔍 Test ${testNumber}/${CRITICAL_TEST_CASES.length}: ${testCase.category}`);
      console.log(`   Question: "${testCase.question}"`);
      console.log(`   Location: ${testCase.location}`);
      console.log(`   Expected: ${testCase.minDocuments}+ documents, keywords: ${testCase.expectedKeywords.slice(0, 3).join(', ')}`);

      const result = await this.runTestCase(testCase, testNumber);
      
      if (result.success) {
        testResults.passed++;
        console.log(`   ✅ PASSED - Found ${result.documentsFound} documents, answered in ${result.responseTime}ms`);
      } else {
        testResults.failed++;
        testResults.failures.push({
          testNumber,
          testCase,
          error: result.error,
          details: result.details
        });
        console.log(`   ❌ FAILED - ${result.error}`);
        if (result.details) {
          console.log(`      Details: ${result.details}`);
        }
      }

      // Brief pause between tests to avoid overwhelming the system
      await this.sleep(1000);
    }

    // Print final results
    this.printFinalResults();
  }

  async testServerHealth() {
    try {
      console.log('🏥 Testing server health...');
      const response = await fetch(`${BASE_URL}/api/hello`, { 
        timeout: 5000 
      });
      
      if (response.ok) {
        console.log('✅ Server is healthy');
        return true;
      } else {
        console.error(`❌ Server health check failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Server unreachable: ${error.message}`);
      return false;
    }
  }

  async runTestCase(testCase, testNumber) {
    const startTime = Date.now();
    
    try {
      // Make request to legal ask endpoint
      const response = await fetch(`${BASE_URL}/api/legal/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: testCase.question,
          context: {
            location: testCase.location
          }
        }),
        timeout: 30000 // 30 second timeout for legal queries
      });

      const responseTime = Date.now() - startTime;
      const result = await response.json();

      // Check if request was successful
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}`,
          details: result.error || 'Unknown error',
          responseTime
        };
      }

      // Check if we got a successful legal response
      if (!result.success) {
        return {
          success: false,
          error: 'Query failed',
          details: result.error || 'No answer provided',
          responseTime
        };
      }

      // Extract document count from sources
      const documentsFound = result.sources ? result.sources.length : 0;
      
      // Validate response contains expected elements
      const validation = this.validateResponse(result, testCase, documentsFound);
      
      return {
        success: validation.valid,
        error: validation.valid ? null : validation.error,
        details: validation.details,
        documentsFound: documentsFound,
        responseTime,
        answer: result.answer
      };

    } catch (error) {
      return {
        success: false,
        error: 'Request failed',
        details: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  validateResponse(result, testCase, documentsFound) {
    // Check if answer exists and is substantial
    if (!result.answer || result.answer.length < 50) {
      return {
        valid: false,
        error: 'Answer too short or missing',
        details: `Answer length: ${result.answer ? result.answer.length : 0} characters`
      };
    }

    // Check if minimum documents were found
    if (documentsFound < testCase.minDocuments) {
      return {
        valid: false,
        error: 'Insufficient documents found',
        details: `Found ${documentsFound}, expected at least ${testCase.minDocuments}`
      };
    }

    // Check if answer contains expected keywords (at least 2 out of expected)
    const answerLower = result.answer.toLowerCase();
    const matchingKeywords = testCase.expectedKeywords.filter(keyword => 
      answerLower.includes(keyword.toLowerCase())
    );

    if (matchingKeywords.length < 2) {
      return {
        valid: false,
        error: 'Answer lacks expected keywords',
        details: `Found keywords: [${matchingKeywords.join(', ')}], expected: [${testCase.expectedKeywords.join(', ')}]`
      };
    }

    return {
      valid: true,
      matchingKeywords: matchingKeywords.length,
      documentsFound: documentsFound
    };
  }

  printFinalResults() {
    const totalTime = Date.now() - this.startTime;
    const successRate = Math.round((testResults.passed / testResults.total) * 100);

    console.log('\n' + '='.repeat(60));
    console.log('📊 LIVE TESTING RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log(`⏱️  Total Time: ${Math.round(totalTime / 1000)}s`);
    console.log('='.repeat(60));

    if (testResults.failures.length > 0) {
      console.log('\n🚨 FAILED TESTS:');
      testResults.failures.forEach(failure => {
        console.log(`\n${failure.testNumber}. ${failure.testCase.category}`);
        console.log(`   Question: "${failure.testCase.question}"`);
        console.log(`   Error: ${failure.error}`);
        if (failure.details) {
          console.log(`   Details: ${failure.details}`);
        }
      });
    }

    // Determine overall result
    if (successRate >= 80) {
      console.log('\n🎉 OVERALL RESULT: ACCEPTABLE (≥80% success rate)');
      process.exit(0);
    } else if (successRate >= 60) {
      console.log('\n⚠️  OVERALL RESULT: NEEDS IMPROVEMENT (60-79% success rate)');
      process.exit(1);
    } else {
      console.log('\n💥 OVERALL RESULT: CRITICAL ISSUES (<60% success rate)');
      process.exit(1);
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new LiveTester();
  
  console.log('LegalEase Live Testing Suite');
  console.log('============================');
  console.log('This suite tests common Australian legal questions');
  console.log('to ensure the system consistently finds relevant documents.\n');
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('\n💥 Testing suite crashed:', error.message);
    process.exit(1);
  }
}

export { LiveTester, CRITICAL_TEST_CASES };