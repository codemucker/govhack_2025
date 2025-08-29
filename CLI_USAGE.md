# LegalEase CLI - Backend Testing Tool

A command-line interface for testing the LegalEase backend question-answering pipeline directly from the terminal.

## Features

✅ **Full Pipeline Testing** - Tests document search, AI integration, and database storage
✅ **Complete Document References** - Shows all matched documents with full metadata
✅ **Database Integration** - Creates in-memory database with realistic legal document data
✅ **Query History** - Tracks and displays recent queries
✅ **Token Usage Monitoring** - Shows OpenRouter API usage statistics

## Setup

1. **Install Dependencies:**
   ```bash
   npm install dotenv sqlite3
   ```

2. **Set API Key:**
   Make sure your OpenRouter API key is in `.env`:
   ```
   OPENAI_API_KEY=sk-or-v1-your-key-here
   ```

## Usage

```bash
node cli-test.js "your legal question here"
```

### Example Commands

```bash
# Business registration
node cli-test.js "How do I register a business in Australia?"

# Food safety licensing
node cli-test.js "What food safety licenses do I need for a restaurant?"

# Planning permissions
node cli-test.js "Do I need planning permission for a house extension?"

# Consumer rights
node cli-test.js "What are my rights when buying faulty products?"

# Liquor licensing
node cli-test.js "How do I get a liquor license in NSW?"
```

## Output Format

The CLI provides comprehensive output including:

### 1. Document Search Results
```
✅ Found 4 relevant documents:

1. corp_act_2001
   URL: https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/ca2001172/
   Tags: [business, commonwealth, corporations, registration]
   Preview: CORPORATIONS ACT 2001...
```

### 2. AI-Generated Answer
```
🎯 AI Answer:
----------------------------------------
To register a business in Australia, you need to follow specific procedures...
[Full detailed answer with legal disclaimers]
----------------------------------------
```

### 3. Usage Statistics
```
📊 Token Usage: 1349 (prompt: 977, completion: 372)
💾 Query saved to database with ID: query_1756473700885_3kxdjqds2
```

### 4. Query History
```
📋 Recent Queries (3):
1. How do I register a business in Australia?
2. What food safety licenses do I need for a restaurant?
3. Do I need planning permission for a house extension?
```

## Database Content

The CLI automatically seeds an in-memory SQLite database with 5 comprehensive legal documents:

1. **Corporations Act 2001** (Commonwealth) - Business registration
2. **Environmental Planning and Assessment Act 1979** (NSW) - Planning permissions
3. **Food Standards Australia New Zealand Act 1991** - Food safety
4. **Liquor Act 2007** (NSW) - Liquor licensing
5. **Competition and Consumer Act 2010** - Consumer rights

Each document includes:
- Full legal content (1000+ words)
- Proper Australian legal URLs
- Comprehensive tagging (jurisdiction + domain)
- Realistic legal guidance

## Testing Different Scenarios

### Document Matching
The CLI demonstrates how the system finds relevant documents by:
- **Content matching** - Searching document text for question keywords
- **Tag matching** - Using jurisdiction and domain tags
- **Relevance ranking** - Ordering results by recency and relevance

### AI Response Quality
Test various question types to see how the AI handles:
- **Specific procedures** (e.g., "How to register...")
- **Requirements** (e.g., "What licenses do I need...")
- **Permissions** (e.g., "Do I need approval for...")
- **Rights** (e.g., "What are my rights when...")

### Edge Cases
- Questions with no relevant documents
- Very general vs. very specific questions
- Multi-jurisdictional questions (NSW vs. Commonwealth)

## Troubleshooting

### API Key Issues
```
❌ OPENAI_API_KEY not found in environment variables
Make sure you have set it in the .env file
```
**Solution:** Check your `.env` file has the correct API key format.

### No Documents Found
```
❌ No relevant documents found. Try a different question.
```
**Solution:** Try questions related to business, food safety, planning, liquor, or consumer law.

### API Rate Limits
If you hit rate limits, the CLI will show the error. Wait a moment and try again.

## Development Notes

- Uses in-memory SQLite database for testing (data doesn't persist)
- Mimics the actual Encore.dev database schema
- Includes realistic token usage tracking
- Demonstrates the full pipeline: Search → AI → Database → Response

This CLI tool is perfect for:
- **Testing AI responses** before frontend integration
- **Validating document search** algorithms
- **Monitoring API usage** and costs
- **Demonstrating the system** to judges/stakeholders