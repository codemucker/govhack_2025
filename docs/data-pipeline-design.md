# AustLII Data Pipeline Design - Hackathon MVP

## Overview

**HACKATHON VERSION**: This is the minimal viable implementation for a 48-hour hackathon demo. Focus is on getting something working quickly, not enterprise features.

This document outlines the simplified design for caching AustLII documents and answering user queries with an LLM. The system demonstrates the core concept with minimal complexity.

## Core Architecture (Simplified)

### Design Principles

1. **Just Make It Work** - Working demo in 2 days
2. **Cache-First** - Store docs locally, don't refetch
3. **Simple Tagging** - Basic keyword matching only
4. **One LLM** - No sophisticated routing, just OpenAI API
5. **Minimal Code** - ~60 lines total

### System Components (Minimal)

```
User Query → Find Docs → Ask LLM → Return Answer
    ↓            ↓          ↓         ↓
Simple DB → Keyword Match → OpenAI → Done
```

## Data Architecture (Hackathon Simple)

### Database Schema (2 Tables Only)

**docs** - Document cache
```sql
CREATE TABLE docs (
  id TEXT PRIMARY KEY,
  url TEXT,
  content TEXT,
  tags TEXT  -- comma-separated: "business,nsw,food"
);
```

**queries** - Query log
```sql
CREATE TABLE queries (
  id TEXT PRIMARY KEY,
  question TEXT,
  answer TEXT,
  docs_used TEXT,  -- comma-separated doc IDs
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tag System (Basic Keywords)

Simple comma-separated tags for demo:
- **Jurisdiction**: commonwealth, nsw, vic
- **Domain**: business, planning, food, licensing

#### Tag Extraction (Simple)
```typescript
function extractTags(content: string): string[] {
  const tags = []
  
  // Jurisdiction from URL
  if (url.includes('/cth/')) tags.push('commonwealth')
  if (url.includes('/nsw/')) tags.push('nsw')
  if (url.includes('/vic/')) tags.push('vic')
  
  // Domain from content keywords
  if (content.toLowerCase().includes('business')) tags.push('business')
  if (content.toLowerCase().includes('food')) tags.push('food')
  if (content.toLowerCase().includes('planning')) tags.push('planning')
  if (content.toLowerCase().includes('license')) tags.push('licensing')
  
  return tags
}
```

## Document Lifecycle (Simplified)

### 1. Document Fetching (30 lines)
```typescript
async getDoc(url: string): Promise<string> {
  // Check cache
  const cached = await db.get('SELECT * FROM docs WHERE url = ?', url)
  if (cached) return cached.content
  
  // Fetch and store
  const response = await fetch(url)
  const content = await response.text()
  const tags = extractTags(content, url)
  
  await db.run('INSERT INTO docs VALUES (?, ?, ?, ?)', 
    [generateId(), url, content, tags.join(',')])
  
  return content
}
```

### 2. Query Processing (20 lines)
```typescript
async askQuestion(question: string): Promise<string> {
  // Find docs with simple text search
  const docs = await db.all('SELECT * FROM docs WHERE content LIKE ?', 
    `%${question}%`)
  
  // Ask LLM with context
  const context = docs.map(d => d.content).join('\n\n')
  const answer = await askOpenAI(question, context)
  
  // Log query
  await db.run('INSERT INTO queries VALUES (?, ?, ?, ?, ?)', 
    [generateId(), question, answer, docs.map(d => d.id).join(','), new Date()])
  
  return answer
}
```

### 3. LLM Integration (10 lines)
```typescript
async askOpenAI(question: string, context: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `Based on this Australian legal content:\n\n${context}\n\nQuestion: ${question}`
      }]
    })
  })
  
  return response.json().choices[0].message.content
}
```

## Hackathon Implementation

### Day 1 (4 hours): Basic Functionality
1. **Setup Encore app** (30 min)
2. **Create 2 database tables** (15 min)
3. **Fetch 5 sample AustLII docs** (1 hour)
4. **Basic keyword tagging working** (30 min)
5. **OpenAI integration working** (1 hour)
6. **Simple web form** (45 min)

### Day 2 (4 hours): Polish & Demo
1. **Cache 10-15 more docs** (30 min)
2. **Improve tagging accuracy** (1 hour)
3. **Make UI look professional** (1 hour)
4. **Test demo script** (30 min)
5. **Deploy to Encore cloud** (1 hour)

### Sample Documents for Cache
1. Commonwealth Corporations Act 2001 (business)
2. NSW Environmental Planning Assessment Act (planning)
3. Food Standards Australia New Zealand Act (food)
4. NSW Liquor Act 2007 (hospitality)
5. Commonwealth Australian Consumer Law (consumer rights)

## Demo Features

### What Works
- ✅ Cache AustLII documents locally
- ✅ Basic keyword tagging (business, planning, food, etc.)
- ✅ Text search to find relevant docs
- ✅ OpenAI generates answers with context
- ✅ Shows which documents were used
- ✅ Simple web interface

### Demo Script
1. **Problem**: "Australian regulations are scattered across hundreds of sites"
2. **Solution**: "We cache and make them queryable with AI"
3. **Demo Query**: "How do I register a business in NSW?"
4. **Show**: System finds NSW business docs, generates answer
5. **Sources**: Display which cached documents were used
6. **Impact**: "Saves hours of manual research"

## API Design (Minimal)

### Encore API Endpoints

```typescript
// Get or cache a document
export const fetchDoc = api({ method: "POST", path: "/fetch" }, 
  async (req: { url: string }): Promise<{ content: string, tags: string[] }> => {
    return await getDoc(req.url)
  }
)

// Ask a question
export const askQuestion = api({ method: "POST", path: "/ask" }, 
  async (req: { question: string }): Promise<{ 
    answer: string, 
    sources: string[] 
  }> => {
    return await askQuestion(req.question)
  }
)

// List cached docs
export const listDocs = api({ method: "GET", path: "/docs" },
  async (): Promise<{ id: string, url: string, tags: string }[]> => {
    return await db.all('SELECT id, url, tags FROM docs')
  }
)
```

## Hackathon Success Criteria

### Must Have (Demo Requirements)
- ✅ Cache 5+ AustLII documents
- ✅ Answer questions using cached content
- ✅ Show which documents were referenced
- ✅ Professional-looking web interface
- ✅ Deployed and accessible online

### Nice to Have (If Time Permits)
- ✅ 15+ documents for better coverage
- ✅ Better UI with document browsing
- ✅ Query history display
- ✅ Tag-based document filtering

### Post-Hackathon Ideas
- Multiple expert LLMs for different domains
- Real-time document updates
- Advanced NLP for better matching
- Integration with council websites
- Mobile app version

---

*Last Updated: 2025-08-29*
*Version: 1.0*