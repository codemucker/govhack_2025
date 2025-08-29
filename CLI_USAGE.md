# LegalEase CLI - Real Data Pipeline

A command-line interface for the LegalEase real data pipeline. Automatically starts the Encore backend and queries real Australian legal documents with AI-powered responses.

## ✨ Features

✅ **Real Data Pipeline** - Fetches and caches actual AustLII legal documents
✅ **AI-Powered Answers** - Uses OpenAI with cached legal documents as context  
✅ **Auto Backend Management** - Automatically starts Encore if not running
✅ **Document Caching** - Intelligent caching of Australian legal documents
✅ **Query History** - Real database storage and retrieval
✅ **Australian Legal Context** - Locale-aware responses with proper legal disclaimers

## 🚀 Quick Start

```bash
# Ask a question (auto-starts backend)
./ask.sh "How do I register a business in Australia?"

# Ask with location context
./ask.sh -l "Sydney, NSW" "What food safety licenses do I need?"

# Cache documents first, then ask
./ask.sh -c "What is the Corporations Act about?"
```

## 📋 Setup

### Prerequisites
1. **jq** (for JSON parsing)
   ```bash
   # Ubuntu/Debian
   sudo apt install jq
   
   # macOS
   brew install jq
   ```

2. **OpenAI API Key**
   ```bash
   encore secret set OPENAI_API_KEY your-openai-api-key-here
   ```

### Installation
```bash
# Make the script executable
chmod +x ask.sh

# Test the setup
./ask.sh --help
```

## 🎯 Usage

### Basic Usage
```bash
./ask.sh "your legal question here"
```

### Advanced Options
```bash
# Specify location for jurisdiction-specific advice
./ask.sh -l "Melbourne, VIC" "Planning permission requirements?"

# Use custom session ID for conversation tracking
./ask.sh -s "my_session_123" "Follow up question"

# Cache documents before asking (recommended for first use)
./ask.sh -c "Business registration process"

# Custom port (if backend running on different port)
./ask.sh -p 8080 "Consumer rights question"
```

## 📖 Example Questions

### Business & Corporations
```bash
./ask.sh "How do I register a company in Australia?"
./ask.sh "What are director responsibilities under corporations law?"
./ask.sh "How to change company structure?"
```

### Food Safety & Licensing  
```bash
./ask.sh -l "Brisbane, QLD" "Food handling license requirements"
./ask.sh "What is HACCP and is it mandatory?"
./ask.sh "Restaurant hygiene standards"
```

### Planning & Development
```bash
./ask.sh -l "Perth, WA" "Do I need council approval for renovations?"
./ask.sh "Environmental impact assessment requirements"
./ask.sh "Heritage building restrictions"
```

### Consumer Rights
```bash
./ask.sh "Warranty rights for defective products"  
./ask.sh "How to dispute credit card charges"
./ask.sh "Online shopping consumer protections"
```

## 📊 Sample Output

```
🏛️  LegalEase CLI - Real Data Pipeline
================================

✅ Backend is already running
📄 Caching legal documents...
✅ Cached 5 new documents (5 total)

🤖 Asking: "How do I register a business in Australia?"
📍 Location: Sydney, NSW

📋 Answer:
Based on Australian law, to register a business in Australia you need to...
[Full AI-generated answer with legal context]

📚 Sources:
  • Corporations Act 2001 (Commonwealth of Australia)
    https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/ca2001172/
  • Australian Securities and Investments Commission Act (Commonwealth of Australia)
    https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/asiaca2001529/

📊 Confidence: 0.9, Execution time: 2847ms

✨ Done! Use the same session ID (cli_1693847582) to continue the conversation.
```

## 🔧 What the Script Does

### 1. Backend Management
- **Auto-detection**: Checks if Encore backend is running
- **Auto-start**: Starts `encore run` in background if needed
- **Health checks**: Waits for backend to be ready before making requests

### 2. Document Pipeline
- **Real AustLII Fetching**: Downloads actual legal documents from austlii.edu.au
- **Intelligent Caching**: Stores documents in PostgreSQL with metadata
- **Content Processing**: Extracts clean text and auto-generates tags
- **Search & Retrieval**: Finds relevant documents for each question

### 3. AI Integration
- **OpenAI API**: Uses real OpenAI API (requires OPENAI_API_KEY)
- **Legal Context**: Provides Australian legal documents as context
- **Localized Responses**: Australian English with proper legal disclaimers
- **Source Attribution**: Shows which documents were used for each answer

### 4. Data Persistence
- **PostgreSQL Database**: All data stored in real database (not in-memory)
- **Query History**: Tracks all questions and answers by session
- **Audit Trail**: Full logging for compliance and debugging

## 🏗️ Real Data Sources

### Cached Legal Documents
The system fetches and caches real Australian legal documents from:

1. **Corporations Act 2001** (Commonwealth)
   - `https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/ca2001172/`
   - Tags: commonwealth, business, corporations

2. **NSW Environmental Planning Act 1979** (NSW)
   - `https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/epaaa1979389/`
   - Tags: nsw, planning, development

3. **Food Standards Australia New Zealand Act** (Commonwealth)
   - `https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/fsanza1991472/`
   - Tags: commonwealth, food, health

4. **NSW Liquor Act 2007** (NSW)
   - `https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/la2007107/`
   - Tags: nsw, liquor, hospitality, licensing

5. **Competition and Consumer Act 2010** (Commonwealth)
   - `https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/cca2010265/`
   - Tags: commonwealth, consumer, trade

## 🛠️ API Endpoints Used

- **POST /api/cache-documents** - Cache AustLII documents
- **POST /api/legal/ask** - Ask legal questions  
- **GET /api/legal/history** - Get query history
- **GET /api/health** - Health check

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check logs
cat encore.log

# Manual start for debugging
encore run
```

### Missing API Key
```bash
# Set the secret
encore secret set OPENAI_API_KEY your-key-here

# Verify it's set
encore secret list
```

### No Documents Cached
```bash
# Manually cache documents
./ask.sh -c "test question"

# Or use the API directly
curl -X POST http://localhost:4000/api/cache-documents -H "Content-Type: application/json" -d '{}'
```

### Connection Issues
```bash
# Check if backend is running
curl http://localhost:4000/api/hello

# Try different port
./ask.sh -p 4001 "test question"
```

## 🎯 Perfect for GovHack Demo!

This CLI tool demonstrates the complete real data pipeline:
- ✅ **Real Government Data** (AustLII legal documents)
- ✅ **AI-Powered Processing** (OpenAI with legal context)  
- ✅ **Production-Ready Backend** (Encore.dev with PostgreSQL)
- ✅ **Instant Results** (Auto-starts everything needed)

Use it to show judges how the system works with actual Australian legal data! 🏆