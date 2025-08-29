# Hackathon MVP - Just Make It Work

## Goal: Working Demo in 48 Hours

Forget the enterprise features. We need:
1. Cache some AustLII docs 
2. Tag them with basic keywords
3. Route user questions to an LLM
4. Show it working

## Absolute Minimum Database

```sql
-- Just two tables to start
CREATE TABLE docs (
  id TEXT PRIMARY KEY,
  url TEXT,
  content TEXT,
  tags TEXT  -- comma-separated for now
);

CREATE TABLE queries (
  id TEXT PRIMARY KEY, 
  question TEXT,
  answer TEXT,
  docs_used TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Absolute Minimum Code

### 1. Document Fetcher (30 lines)
```typescript
class SimpleFetcher {
  async getDoc(url: string): Promise<string> {
    // Check if we have it
    const cached = await db.get('SELECT * FROM docs WHERE url = ?', url)
    if (cached) return cached.content
    
    // Fetch it
    const response = await fetch(url)
    const content = await response.text()
    
    // Store it with basic tags
    const tags = this.extractTags(content)
    await db.run('INSERT INTO docs VALUES (?, ?, ?, ?)', 
      [generateId(), url, content, tags.join(',')])
    
    return content
  }
  
  extractTags(content: string): string[] {
    const tags = []
    if (content.includes('business')) tags.push('business')
    if (content.includes('food')) tags.push('food')
    if (content.includes('planning')) tags.push('planning')
    // add more as needed
    return tags
  }
}
```

### 2. Simple Query Handler (20 lines)
```typescript
class SimpleQuery {
  async ask(question: string): Promise<string> {
    // Find relevant docs
    const docs = await this.findDocs(question)
    
    // Ask LLM
    const answer = await this.askLLM(question, docs)
    
    // Log it
    await db.run('INSERT INTO queries VALUES (?, ?, ?, ?, ?)', 
      [generateId(), question, answer, docs.map(d => d.id).join(','), new Date()])
    
    return answer
  }
  
  async findDocs(question: string): Promise<Doc[]> {
    // Super simple - just search content
    return await db.all('SELECT * FROM docs WHERE content LIKE ?', `%${question}%`)
  }
}
```

### 3. LLM Integration (10 lines)
```typescript
async function askLLM(question: string, docs: Doc[]): Promise<string> {
  const context = docs.map(d => d.content).join('\n\n')
  
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
  
  return response.choices[0].message.content
}
```

## Day 1 Tasks (4 hours max)

1. **Setup Encore app** (30 min)
2. **Create database tables** (15 min) 
3. **Fetch 5 sample docs** (1 hour)
4. **Basic tagging working** (30 min)
5. **LLM integration working** (1 hour)
6. **Simple web interface** (45 min)

## Day 2 Tasks (4 hours max)

1. **Add more docs** (30 min)
2. **Better tagging** (1 hour)
3. **Make it look decent** (1 hour)
4. **Test with demo questions** (30 min)
5. **Deploy to Encore cloud** (1 hour)

## Demo Script

1. "Here's our problem - Australian regulations are scattered and complex"
2. "Our solution caches legal documents and makes them queryable"
3. "Ask: 'How do I register a business in NSW?'"
4. Shows relevant cached documents being found
5. Shows LLM generating answer with citations
6. "The system learned this from [X] cached AustLII documents"

## No Enterprise Stuff

❌ Complex routing systems
❌ Multiple expert LLMs  
❌ Advanced analytics
❌ Performance monitoring
❌ Backup strategies
❌ Security hardening
❌ Load balancing

✅ Just cache docs, tag them, answer questions

## Success = Working Demo

- Can ask a question
- System finds relevant docs  
- LLM gives decent answer
- Shows sources used
- Looks professional enough for judges

That's it. Everything else is post-hackathon.