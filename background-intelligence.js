#!/usr/bin/env node

// Background Intelligence System for LegalEase
// Proactively generates questions, finds gaps, and discovers documents

import { PersistentDatabase } from './persistent-database.js';
import { DocumentSeeder } from './document-seeder.js';

export class BackgroundIntelligenceService {
  constructor(database, queryAnalyzer, documentEngine) {
    this.db = database;
    this.queryAnalyzer = queryAnalyzer;
    this.documentEngine = documentEngine;
    
    this.isRunning = false;
    this.intervalId = null;
    
    // Configuration
    this.config = {
      questionGenerationInterval: 300000, // 5 minutes
      maxQuestionsPerRun: 3,
      maxDocumentsPerSearch: 2,
      intelligenceScore: 0,
      learningEnabled: true
    };
    
    // Track what we've already processed
    this.processedQuestions = new Set();
    this.discoveryStats = {
      questionsGenerated: 0,
      documentsDiscovered: 0,
      successfulAnswers: 0,
      failedQueries: 0
    };
  }

  // Start the background intelligence service
  async start() {
    if (this.isRunning) {
      console.log('🧠 Background Intelligence Service already running');
      return;
    }

    console.log('🚀 Starting Background Intelligence Service...');
    this.isRunning = true;
    
    // Load previously generated questions for continuity
    await this.loadPreviousQuestions();
    
    // Initial seeding
    setTimeout(() => this.runIntelligenceCycle(), 5000);
    
    // Regular intelligence cycles
    this.intervalId = setInterval(() => {
      this.runIntelligenceCycle();
    }, this.config.questionGenerationInterval);
  }

  // Stop the service
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ Background Intelligence Service stopped');
  }

  // Load previously generated questions to avoid regenerating the same ones
  async loadPreviousQuestions() {
    try {
      const previousQueries = await this.db.runQuery(`
        SELECT DISTINCT question 
        FROM queries 
        WHERE relevance_reason LIKE '%Background Intelligence%'
        ORDER BY created_at DESC
        LIMIT 100
      `);
      
      let loadedCount = 0;
      if (previousQueries && Array.isArray(previousQueries)) {
        for (const row of previousQueries) {
          if (row.question) {
            this.processedQuestions.add(row.question);
            loadedCount++;
          }
        }
      }
      
      if (loadedCount > 0) {
        console.log(`🧠 Loaded ${loadedCount} previously generated questions to avoid duplication`);
      }
    } catch (error) {
      console.warn('⚠️ Could not load previous questions:', error.message);
    }
  }

  // Main intelligence cycle
  async runIntelligenceCycle() {
    if (!this.isRunning) return;

    try {
      console.log('\n🧠 Running Background Intelligence Cycle...');
      
      // Step 1: Generate realistic user questions
      const questions = await this.generateRealisticQuestions();
      
      // Step 2: For each question, try to answer it and discover gaps
      for (const question of questions) {
        await this.processIntelligentQuestion(question);
        
        // Brief pause between questions
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Step 3: Report progress
      this.reportIntelligenceStats();
      
    } catch (error) {
      console.error('🚨 Intelligence cycle error:', error.message);
    }
  }

  // Generate realistic questions users might ask
  async generateRealisticQuestions() {
    const prompt = `Generate 3 realistic legal questions that Australian residents commonly ask about:
    - Starting a business (cafes, food trucks, online stores)
    - Property and planning (building sheds, fences, renovations)
    - Food safety and licensing
    - Employment and workplace issues
    - Consumer rights and regulations
    
    Make them specific with locations like "Sydney", "Melbourne", "Brisbane", etc.
    
    Return ONLY a JSON array of strings, no other text:
    ["question 1", "question 2", "question 3"]`;

    try {
      const response = await this.queryAnalyzer.makeOpenAIRequest([
        { role: 'system', content: 'You are a legal question generator for Australian law.' },
        { role: 'user', content: prompt }
      ], 'gpt-4o-mini');

      const questions = JSON.parse(response);
      
      // Filter out questions we've already processed
      const newQuestions = questions.filter(q => !this.processedQuestions.has(q));
      
      console.log(`🎯 Generated ${newQuestions.length} new intelligent questions`);
      this.discoveryStats.questionsGenerated += newQuestions.length;
      
      return newQuestions.slice(0, this.config.maxQuestionsPerRun);
      
    } catch (error) {
      console.error('❌ Failed to generate questions:', error.message);
      
      // Fallback questions
      const fallbackQuestions = [
        'Do I need a permit to build a shed in Melbourne?',
        'What licenses do I need to open a cafe in Sydney?',
        'Can I start a food truck business in Brisbane?'
      ];
      
      return fallbackQuestions.filter(q => !this.processedQuestions.has(q)).slice(0, 1);
    }
  }

  // Process an intelligent question to discover content gaps
  async processIntelligentQuestion(question) {
    try {
      console.log(`🤔 Proactively processing: "${question}"`);
      this.processedQuestions.add(question);
      
      // Try to answer the question with current knowledge
      const existingDocs = await this.db.findDocuments(question);
      
      if (existingDocs.length === 0) {
        console.log(`📚 No existing documents found, discovering new content...`);
        
        // Use our document engine to discover and fetch relevant documents
        const discoveredDocs = await this.documentEngine.findOrDiscoverDocuments(
          question, 
          'Australia', // Default location
          this.config.maxDocumentsPerSearch,
          null // No event tracker for background processing
        );
        
        if (discoveredDocs.length > 0) {
          console.log(`✨ Discovered ${discoveredDocs.length} new documents for future queries`);
          this.discoveryStats.documentsDiscovered += discoveredDocs.length;
          
          // Generate and store a synthetic answer for caching
          await this.generateAndCacheAnswer(question, discoveredDocs);
          this.discoveryStats.successfulAnswers++;
          
        } else {
          console.log(`🕳️ Knowledge gap identified: "${question}"`);
          this.discoveryStats.failedQueries++;
        }
      } else {
        console.log(`✅ Question already covered by ${existingDocs.length} existing documents`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing intelligent question: ${error.message}`);
      this.discoveryStats.failedQueries++;
    }
  }

  // Generate and cache answer for future use
  async generateAndCacheAnswer(question, documents) {
    try {
      const queryId = `bg_intel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create context from discovered documents
      const context = documents.map(doc => 
        `Document: ${doc.url}\nContent: ${doc.content.substring(0, 1500)}...`
      ).join('\n\n');

      // Generate answer using LLM
      const answerPrompt = `Based on the following legal documents, provide a helpful answer to: "${question}"

${context}

Provide a clear, practical answer with specific steps and requirements.`;

      const answer = await this.queryAnalyzer.makeOpenAIRequest([
        { role: 'system', content: 'You are an Australian legal assistant providing practical advice.' },
        { role: 'user', content: answerPrompt }
      ], 'gpt-4o-mini');

      // Cache the query and answer
      const queryRecord = {
        id: queryId,
        question: question,
        answer: answer,
        sources_used: documents.map(doc => doc.url),
        jurisdiction: 'Australia',
        confidence: 0.85, // Background generated confidence
        execution_time: 0,
        tokens_used: 0,
        relevant: true,
        relevance_reason: 'Proactively generated by Background Intelligence',
        events_count: 0
      };

      await this.db.saveQuery(queryRecord);
      console.log(`💾 Cached intelligent answer for: "${question.substring(0, 50)}..."`);
      
    } catch (error) {
      console.error('❌ Failed to generate/cache intelligent answer:', error.message);
    }
  }

  // Report intelligence statistics
  reportIntelligenceStats() {
    const stats = this.discoveryStats;
    console.log(`\n📊 Background Intelligence Stats:`);
    console.log(`   Questions Generated: ${stats.questionsGenerated}`);
    console.log(`   Documents Discovered: ${stats.documentsDiscovered}`);
    console.log(`   Successful Answers: ${stats.successfulAnswers}`);
    console.log(`   Knowledge Gaps: ${stats.failedQueries}`);
    
    // Calculate intelligence score
    const totalAttempts = stats.successfulAnswers + stats.failedQueries;
    this.config.intelligenceScore = totalAttempts > 0 
      ? Math.round((stats.successfulAnswers / totalAttempts) * 100)
      : 0;
    
    console.log(`   Intelligence Score: ${this.config.intelligenceScore}%`);
  }

  // Get current statistics
  getStats() {
    return {
      isRunning: this.isRunning,
      ...this.discoveryStats,
      intelligenceScore: this.config.intelligenceScore,
      processedQuestions: this.processedQuestions.size,
      nextCycleIn: this.intervalId ? this.config.questionGenerationInterval : null
    };
  }

  // Handle failed queries by discovering missing content
  async handleFailedQuery(question, location = 'Australia') {
    console.log(`🔍 Handling failed query with content discovery: "${question}"`);
    
    try {
      // Use document engine to find relevant content
      const discoveredDocs = await this.documentEngine.findOrDiscoverDocuments(
        question, 
        location,
        3, // Allow more documents for failed queries
        null // No event tracker
      );

      if (discoveredDocs.length > 0) {
        console.log(`🎉 Successfully discovered ${discoveredDocs.length} documents for failed query`);
        
        // Generate answer and cache it
        await this.generateAndCacheAnswer(question, discoveredDocs);
        
        return {
          success: true,
          documentsFound: discoveredDocs.length,
          canAnswerNow: true
        };
      } else {
        console.log(`💔 No relevant documents found for: "${question}"`);
        return {
          success: false,
          documentsFound: 0,
          canAnswerNow: false
        };
      }
      
    } catch (error) {
      console.error('❌ Failed query handling error:', error.message);
      return {
        success: false,
        error: error.message,
        documentsFound: 0,
        canAnswerNow: false
      };
    }
  }

  // Smart seeding based on popular legal topics
  async performSmartSeeding() {
    console.log('🌱 Performing smart seeding based on common legal needs...');
    
    const commonTopics = [
      'business registration',
      'food safety licenses', 
      'building permits',
      'employment law',
      'consumer protection',
      'property development',
      'liquor licensing',
      'planning applications'
    ];

    for (const topic of commonTopics) {
      try {
        const sampleQuestion = `What are the requirements for ${topic} in Australia?`;
        await this.processIntelligentQuestion(sampleQuestion);
        
        // Brief pause between topics
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Smart seeding error for ${topic}:`, error.message);
      }
    }
  }
}

// Enhanced query failure handler that integrates with intelligence service
export class IntelligentFailureHandler {
  constructor(intelligenceService) {
    this.intelligence = intelligenceService;
    this.failureLog = [];
  }

  // Handle a query that couldn't be answered
  async handleQueryFailure(question, location, originalError) {
    console.log(`🚨 Query failure detected: "${question}"`);
    
    // Log the failure
    this.failureLog.push({
      question,
      location,
      error: originalError?.message || 'No documents found',
      timestamp: new Date(),
      resolved: false
    });

    // Attempt to resolve with background intelligence
    const resolution = await this.intelligence.handleFailedQuery(question, location);
    
    if (resolution.success) {
      // Mark as resolved
      const lastFailure = this.failureLog[this.failureLog.length - 1];
      lastFailure.resolved = true;
      lastFailure.documentsFound = resolution.documentsFound;
      
      console.log(`✅ Query failure resolved: found ${resolution.documentsFound} new documents`);
    }

    return resolution;
  }

  // Get failure statistics
  getFailureStats() {
    const total = this.failureLog.length;
    const resolved = this.failureLog.filter(f => f.resolved).length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return {
      totalFailures: total,
      resolvedFailures: resolved,
      resolutionRate: resolutionRate,
      recentFailures: this.failureLog.slice(-5)
    };
  }
}