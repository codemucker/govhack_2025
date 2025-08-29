#!/usr/bin/env node

// Standalone Node.js server to test the real data pipeline
// This bypasses Encore's cloud dependency issues

import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock database for testing (in a real setup this would be PostgreSQL)
const mockDB = {
  docs: [],
  queries: []
};

// Mock document fetcher
class StandaloneDocumentFetcher {
  async fetchDocument(url) {
    console.log(`Fetching document from: ${url}`);
    
    // Check cache first
    const cached = mockDB.docs.find(doc => doc.url === url);
    if (cached) {
      return {
        content: cached.content,
        tags: cached.tags.split(',').filter(t => t.length > 0),
        url: cached.url
      };
    }

    // Simulate fetching from AustLII
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const html = await response.text();
      const content = this.extractTextFromHtml(html);
      const tags = this.extractTags(content, url);
      
      // Store in mock database
      const doc = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url,
        content,
        tags: tags.join(','),
        created_at: new Date()
      };
      mockDB.docs.push(doc);
      
      return {
        content,
        tags,
        url
      };
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message);
      throw error;
    }
  }

  extractTextFromHtml(html) {
    // Basic HTML to text conversion
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/\s+/g, ' ').trim();
    return text;
  }

  extractTags(content, url) {
    const tags = [];
    
    // Jurisdiction from URL
    if (url.includes('/cth/')) tags.push('commonwealth');
    if (url.includes('/nsw/')) tags.push('nsw');
    if (url.includes('/qld/')) tags.push('qld');
    if (url.includes('/vic/')) tags.push('vic');
    
    // Domain from content
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('fence') || lowerContent.includes('boundary')) tags.push('property');
    if (lowerContent.includes('neighbour') || lowerContent.includes('neighbor')) tags.push('neighbour-disputes');
    if (lowerContent.includes('business') || lowerContent.includes('corporation')) tags.push('business');
    if (lowerContent.includes('planning') || lowerContent.includes('development')) tags.push('planning');
    
    return tags;
  }

  async findDocuments(searchTerm) {
    return mockDB.docs.filter(doc => 
      doc.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
}

// Mock OpenAI client
class StandaloneOpenAIClient {
  async generateAnswer(question, context, userLocale = 'en-AU') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    const prompt = `Based on the following Australian legal documents, please answer this question:

QUESTION: ${question}

CONTEXT FROM LEGAL DOCUMENTS:
${context}

INSTRUCTIONS:
- Answer in Australian English using Australian legal terminology
- Base your answer ONLY on the provided legal documents
- If the documents don't contain relevant information, state this clearly
- Include specific references to which acts or regulations you're citing
- Always end with the standard legal disclaimer

LEGAL DISCLAIMER TO INCLUDE:
"⚠️ IMPORTANT: This information is general in nature and should not be considered legal advice. Australian laws can be complex and may vary by jurisdiction. For specific legal matters, please consult with a qualified legal professional or contact the relevant government department."

Please provide a clear, practical answer that helps the user understand their obligations or options under Australian law.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an Australian legal research assistant. Provide accurate, helpful information based solely on the provided legal documents. Always include appropriate disclaimers about seeking professional legal advice.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response generated from OpenAI');
      }

      return {
        answer: data.choices[0].message.content,
        tokensUsed: data.usage?.total_tokens
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }
}

// Initialize services
const documentFetcher = new StandaloneDocumentFetcher();
const openaiClient = new StandaloneOpenAIClient();

// Sample AustLII documents - including QLD property/neighbour law
const SAMPLE_DOCUMENTS = [
  'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/pa1997175/', // QLD Property Law Act - for boundary/fence disputes
  'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/nd1959264/', // QLD Neighbourhood Disputes Act
  'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/ca2001172/', // Corporations Act
];

// Create Express app
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/api/hello', (req, res) => {
  res.json({
    message: "Hello from LegalEase Standalone API!",
    timestamp: new Date().toISOString(),
    version: "1.0.0-standalone"
  });
});

// Cache documents endpoint
app.post('/api/cache-documents', async (req, res) => {
  try {
    console.log('Caching sample documents...');
    const results = [];
    
    for (const url of SAMPLE_DOCUMENTS) {
      try {
        const doc = await documentFetcher.fetchDocument(url);
        results.push({
          url: doc.url,
          title: url.split('/').pop() || 'Legal Document',
          tags: doc.tags
        });
        console.log(`✅ Cached: ${url}`);
      } catch (error) {
        console.error(`❌ Failed to cache: ${url}`, error.message);
      }
    }
    
    res.json({
      success: true,
      documentsAdded: results.length,
      totalDocuments: mockDB.docs.length,
      cachedDocuments: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      documentsAdded: 0,
      totalDocuments: 0,
      cachedDocuments: []
    });
  }
});

// Ask question endpoint
app.post('/api/legal/ask', async (req, res) => {
  const startTime = Date.now();
  const queryId = `query_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  try {
    const { question, sessionId, userLocale, context } = req.body;
    
    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required',
        queryId,
        executionTime: Date.now() - startTime
      });
    }

    // Find relevant documents
    const relevantDocs = await documentFetcher.findDocuments(question);
    
    if (relevantDocs.length === 0) {
      return res.json({
        success: false,
        error: 'No relevant legal documents found in cache. Please cache documents first using /api/cache-documents',
        queryId,
        executionTime: Date.now() - startTime
      });
    }

    // Prepare context
    const docContext = relevantDocs
      .slice(0, 3)
      .map(doc => `DOCUMENT: ${doc.url}\nCONTENT: ${doc.content.substring(0, 2000)}...\n`)
      .join('\n\n');

    // Generate AI response
    const aiResponse = await openaiClient.generateAnswer(question, docContext, userLocale);

    // Prepare sources
    const sources = relevantDocs.slice(0, 3).map(doc => ({
      title: doc.url.split('/').pop() || 'Legal Document',
      url: doc.url,
      jurisdiction: doc.url.includes('/qld/') ? 'Queensland' : 
                    doc.url.includes('/nsw/') ? 'New South Wales' :
                    doc.url.includes('/cth/') ? 'Commonwealth of Australia' : 'Australia'
    }));

    // Log query
    mockDB.queries.push({
      id: queryId,
      question,
      answer: aiResponse.answer,
      docs_used: relevantDocs.slice(0, 3).map(doc => doc.id).join(','),
      created_at: new Date()
    });

    res.json({
      success: true,
      answer: aiResponse.answer,
      sources,
      confidence: 0.9,
      queryId,
      executionTime: Date.now() - startTime
    });

  } catch (error) {
    console.error('Error in askQuestion:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      queryId,
      executionTime: Date.now() - startTime
    });
  }
});

// Get history endpoint
app.get('/api/legal/history', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const queries = mockDB.queries
      .slice(-limit)
      .reverse()
      .map(query => ({
        id: query.id,
        question: query.question,
        answer: query.answer || 'No answer recorded',
        timestamp: query.created_at.toISOString(),
        confidence: 0.9
      }));

    res.json({
      success: true,
      queries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🏛️  LegalEase Standalone Server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/hello`);
  console.log(`📄 Cache documents: POST http://localhost:${PORT}/api/cache-documents`);
  console.log(`🤖 Ask questions: POST http://localhost:${PORT}/api/legal/ask`);
  console.log('');
  console.log('Ready to test the real data pipeline!');
});