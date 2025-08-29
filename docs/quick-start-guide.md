# Quick Start Guide - Hackathon Implementation

## Get It Running in 1 Hour

This guide gets you from zero to working demo as fast as possible.

## Prerequisites (5 minutes)

1. **Node.js** installed
2. **OpenAI API key** (sign up at openai.com)
3. **Encore CLI** installed: `curl -L https://encore.dev/install.sh | bash`
4. **Git** for version control

## Step 1: Create Encore App (10 minutes)

```bash
# Create new Encore app
encore app create red-tape-navigator

cd red-tape-navigator

# Install dependencies
npm install sqlite3 node-fetch
```

## Step 2: Database Setup (5 minutes)

Create `db.ts`:
```typescript
import sqlite3 from 'sqlite3'
import { Database } from 'sqlite3'

let db: Database

export function initDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database('data.sqlite', (err) => {
      if (err) reject(err)
      else {
        // Create tables
        db.exec(`
          CREATE TABLE IF NOT EXISTS docs (
            id TEXT PRIMARY KEY,
            url TEXT UNIQUE NOT NULL,
            content TEXT NOT NULL,
            tags TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS queries (
            id TEXT PRIMARY KEY,
            question TEXT NOT NULL,
            answer TEXT,
            docs_used TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `, (err) => {
          if (err) reject(err)
          else resolve()
        })
      }
    })
  })
}

export { db }
```

## Step 3: Document Fetcher (15 minutes)

Create `services/docs.ts`:
```typescript
import { api } from "encore.dev/api"
import { db, initDB } from "../db"
import fetch from 'node-fetch'

// Initialize DB on startup
initDB()

function generateId(): string {
  return 'doc_' + Math.random().toString(36).substr(2, 9)
}

function extractTags(content: string, url: string): string[] {
  const tags = []
  
  // Jurisdiction from URL
  if (url.includes('/cth/')) tags.push('commonwealth')
  if (url.includes('/nsw/')) tags.push('nsw') 
  if (url.includes('/vic/')) tags.push('vic')
  
  // Content keywords
  const lower = content.toLowerCase()
  if (lower.includes('business') || lower.includes('company')) tags.push('business')
  if (lower.includes('food') || lower.includes('restaurant')) tags.push('food')
  if (lower.includes('planning') || lower.includes('development')) tags.push('planning')
  if (lower.includes('license') || lower.includes('permit')) tags.push('licensing')
  
  return tags
}

export const fetchDoc = api({ method: "POST", path: "/docs/fetch" },
  async (req: { url: string }): Promise<{ success: boolean, id?: string }> => {
    try {
      // Check if already cached
      const existing = await new Promise<any>((resolve, reject) => {
        db.get('SELECT id FROM docs WHERE url = ?', [req.url], (err, row) => {
          if (err) reject(err)
          else resolve(row)
        })
      })
      
      if (existing) {
        return { success: true, id: existing.id }
      }
      
      // Fetch from AustLII
      console.log('Fetching:', req.url)
      const response = await fetch(req.url)
      const content = await response.text()
      
      // Extract basic content (remove HTML tags)
      const cleanContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      
      // Generate tags
      const tags = extractTags(cleanContent, req.url)
      const id = generateId()
      
      // Store in database
      await new Promise<void>((resolve, reject) => {
        db.run('INSERT INTO docs VALUES (?, ?, ?, ?, ?)', 
          [id, req.url, cleanContent, tags.join(','), new Date().toISOString()],
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })
      
      console.log(`Cached document ${id} with tags: ${tags.join(', ')}`)
      return { success: true, id }
      
    } catch (error) {
      console.error('Error fetching document:', error)
      return { success: false }
    }
  }
)

export const listDocs = api({ method: "GET", path: "/docs" },
  async (): Promise<{ id: string, url: string, tags: string }[]> => {
    return new Promise((resolve, reject) => {
      db.all('SELECT id, url, tags FROM docs ORDER BY created_at DESC', 
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows as any[])
        }
      )
    })
  }
)
```

## Step 4: OpenAI Integration (10 minutes)

Create `services/ai.ts`:
```typescript
import { api } from "encore.dev/api"
import { db } from "../db"
import fetch from 'node-fetch'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

function generateQueryId(): string {
  return 'query_' + Math.random().toString(36).substr(2, 9)
}

export const askQuestion = api({ method: "POST", path: "/ask" },
  async (req: { question: string }): Promise<{ 
    answer: string, 
    sources: string[],
    error?: string 
  }> => {
    try {
      if (!OPENAI_API_KEY) {
        return { answer: "", sources: [], error: "OpenAI API key not configured" }
      }
      
      // Find relevant documents (simple text search)
      const docs = await new Promise<any[]>((resolve, reject) => {
        const keywords = req.question.toLowerCase().split(' ')
        let query = 'SELECT * FROM docs WHERE '
        const conditions = []
        const params = []
        
        // Search in content and tags
        for (const keyword of keywords) {
          conditions.push('(content LIKE ? OR tags LIKE ?)')
          params.push(`%${keyword}%`, `%${keyword}%`)
        }
        
        query += conditions.join(' OR ') + ' LIMIT 5'
        
        db.all(query, params, (err, rows) => {
          if (err) reject(err)
          else resolve(rows as any[])
        })
      })
      
      if (docs.length === 0) {
        return { 
          answer: "I couldn't find any relevant documents for your question. Try asking about business registration, food permits, or planning requirements.", 
          sources: [] 
        }
      }
      
      // Prepare context for OpenAI
      const context = docs.map(doc => doc.content).join('\n\n---\n\n')
      const sources = docs.map(doc => doc.url)
      
      // Call OpenAI API
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'user',
            content: `Based on the following Australian legal documents, please answer this question: "${req.question}"

Legal Documents:
${context}

Please provide a clear, practical answer citing the relevant requirements and authorities. Focus on actionable steps the user can take.`
          }],
          max_tokens: 500,
          temperature: 0.3
        })
      })
      
      const aiData = await openaiResponse.json()
      const answer = aiData.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response."
      
      // Log the query
      const queryId = generateQueryId()
      db.run('INSERT INTO queries VALUES (?, ?, ?, ?, ?)',
        [queryId, req.question, answer, docs.map(d => d.id).join(','), new Date().toISOString()],
        (err) => {
          if (err) console.error('Error logging query:', err)
        }
      )
      
      return { answer, sources }
      
    } catch (error) {
      console.error('Error processing question:', error)
      return { 
        answer: "Sorry, there was an error processing your question.", 
        sources: [],
        error: error.message 
      }
    }
  }
)
```

## Step 5: Simple Web UI (15 minutes)

Create `static/index.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <title>AU Red Tape Navigator</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            background: #f5f5f5;
        }
        .container { 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { 
            color: #2c5aa0; 
            text-align: center; 
            margin-bottom: 30px;
        }
        .question-box {
            margin-bottom: 20px;
        }
        input[type="text"] { 
            width: 100%; 
            padding: 15px; 
            font-size: 16px; 
            border: 2px solid #ddd; 
            border-radius: 5px;
            box-sizing: border-box;
        }
        button { 
            background: #2c5aa0; 
            color: white; 
            padding: 15px 30px; 
            font-size: 16px; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer;
            margin-top: 10px;
        }
        button:hover { background: #1e3f73; }
        button:disabled { background: #ccc; cursor: not-allowed; }
        .answer { 
            background: #f0f7ff; 
            padding: 20px; 
            border-radius: 5px; 
            margin-top: 20px;
            border-left: 4px solid #2c5aa0;
        }
        .sources {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 14px;
        }
        .sources h4 { margin: 0 0 10px 0; color: #666; }
        .sources a { color: #2c5aa0; text-decoration: none; }
        .sources a:hover { text-decoration: underline; }
        .sample-questions {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .sample-questions h3 { margin-top: 0; color: #555; }
        .sample-question {
            background: white;
            padding: 10px;
            margin: 5px 0;
            border-radius: 3px;
            cursor: pointer;
            border: 1px solid #ddd;
        }
        .sample-question:hover { background: #f0f7ff; }
        .loading { text-align: center; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🇦🇺 AU Red Tape Navigator</h1>
        <p style="text-align: center; color: #666;">Ask questions about Australian business, planning, and licensing requirements</p>
        
        <div class="sample-questions">
            <h3>Try these sample questions:</h3>
            <div class="sample-question" onclick="askSample('How do I register a business in Australia?')">
                How do I register a business in Australia?
            </div>
            <div class="sample-question" onclick="askSample('What permits do I need to open a restaurant in Sydney?')">
                What permits do I need to open a restaurant in Sydney?
            </div>
            <div class="sample-question" onclick="askSample('What are the planning requirements for building extensions?')">
                What are the planning requirements for building extensions?
            </div>
        </div>
        
        <div class="question-box">
            <input type="text" id="question" placeholder="Ask your question about Australian regulations..." />
            <button onclick="askQuestion()" id="askBtn">Ask Question</button>
        </div>
        
        <div id="result"></div>
    </div>

    <script>
        function askSample(question) {
            document.getElementById('question').value = question;
            askQuestion();
        }
        
        async function askQuestion() {
            const question = document.getElementById('question').value.trim();
            const resultDiv = document.getElementById('result');
            const askBtn = document.getElementById('askBtn');
            
            if (!question) return;
            
            askBtn.disabled = true;
            askBtn.textContent = 'Thinking...';
            resultDiv.innerHTML = '<div class="loading">🤔 Searching Australian legal documents...</div>';
            
            try {
                const response = await fetch('/ask', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question })
                });
                
                const data = await response.json();
                
                if (data.error) {
                    resultDiv.innerHTML = `<div class="answer" style="background: #ffe6e6; border-left-color: #d32f2f;">
                        <strong>Error:</strong> ${data.error}
                    </div>`;
                } else {
                    const sourcesHtml = data.sources.length > 0 ? 
                        `<div class="sources">
                            <h4>Sources:</h4>
                            ${data.sources.map(url => `<div><a href="${url}" target="_blank">${url}</a></div>`).join('')}
                        </div>` : '';
                    
                    resultDiv.innerHTML = `<div class="answer">
                        <div>${data.answer.replace(/\n/g, '<br>')}</div>
                        ${sourcesHtml}
                    </div>`;
                }
                
            } catch (error) {
                resultDiv.innerHTML = `<div class="answer" style="background: #ffe6e6; border-left-color: #d32f2f;">
                    <strong>Error:</strong> Failed to get response. Please try again.
                </div>`;
            }
            
            askBtn.disabled = false;
            askBtn.textContent = 'Ask Question';
        }
        
        // Allow Enter key to submit
        document.getElementById('question').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                askQuestion();
            }
        });
    </script>
</body>
</html>
```

## Step 6: Environment Setup (5 minutes)

Create `.env` file:
```
OPENAI_API_KEY=your_openai_api_key_here
```

Update `encore.app`:
```json
{
  "id": "red-tape-navigator",
  "global_cors": {
    "allow_origins_without_credentials": ["*"]
  }
}
```

## Step 7: Cache Sample Documents (5 minutes)

Create `scripts/seed-data.ts`:
```typescript
const sampleDocs = [
  'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/ca2001172/',
  'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/epaaa1979389/',
  'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/fsanza1991472/',
  'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/la2007107/',
  'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/cca2010265/'
];

async function seedDocs() {
  for (const url of sampleDocs) {
    try {
      const response = await fetch('http://localhost:4000/docs/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const result = await response.json();
      console.log(`${url}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.log(`${url}: ERROR - ${error.message}`);
    }
  }
}

seedDocs();
```

## Step 8: Run & Test (5 minutes)

```bash
# Start the development server
encore run

# In another terminal, seed the database
npx ts-node scripts/seed-data.ts

# Open browser to http://localhost:4000
# Try the sample questions!
```

## Step 9: Deploy (5 minutes)

```bash
# Push to Git
git add .
git commit -m "Initial hackathon implementation"
git push

# Deploy to Encore cloud
encore deploy --env=dev
```

## That's It!

You now have a working AU Red Tape Navigator that:
- ✅ Caches AustLII documents
- ✅ Answers questions using AI
- ✅ Shows source documents
- ✅ Has a professional web interface
- ✅ Is deployed to the cloud

Total time: ~1 hour

## Next Steps (If Time)

1. **Add more documents** - Run the seed script with more URLs
2. **Improve UI** - Add document browsing, query history
3. **Better tagging** - More sophisticated keyword extraction
4. **Error handling** - Handle edge cases and API failures
5. **Demo prep** - Test your presentation questions