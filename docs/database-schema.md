# Database Schema - Hackathon MVP

## Overview

**HACKATHON VERSION**: Simplified to 2 tables only. No complex features, just what's needed for a working demo in 48 hours.

This document outlines the minimal database schema for caching AustLII documents and processing user queries.

## Schema Design Principles

1. **Minimal Tables** - Just 2 tables to get started
2. **Simple Data Types** - No JSON, no complex relationships
3. **Fast to Implement** - Can be set up in 15 minutes
4. **Demo Ready** - Supports all core functionality for presentation

## Core Tables (2 Only)

### docs
Document cache - stores AustLII documents locally.

```sql
CREATE TABLE docs (
    id TEXT PRIMARY KEY,           -- Simple ID like "doc_001"
    url TEXT UNIQUE NOT NULL,      -- AustLII source URL
    content TEXT NOT NULL,         -- Full document text
    tags TEXT DEFAULT '',         -- Comma-separated: "business,nsw,food"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Simple Design**:
- No complex JSON fields
- No status tracking 
- No content hashing
- Tags are just comma-separated strings
- One timestamp field

**Index** (if needed):
```sql
CREATE INDEX idx_docs_url ON docs(url);
```

### queries
Query log - tracks what users asked and what we answered.

```sql
CREATE TABLE queries (
    id TEXT PRIMARY KEY,           -- Simple ID like "query_001" 
    question TEXT NOT NULL,        -- User's question
    answer TEXT,                   -- LLM response
    docs_used TEXT DEFAULT '',     -- Comma-separated doc IDs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Simple Design**:
- No confidence scores
- No performance metrics
- Just basic logging for demo
- Comma-separated doc references

## That's It!

No additional tables needed for hackathon demo. Keep it simple.

## Setup Commands

```sql
-- Create the database tables
CREATE TABLE docs (
    id TEXT PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    tags TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE queries (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT,
    docs_used TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional index for faster URL lookups
CREATE INDEX idx_docs_url ON docs(url);
```

## Sample Data

```sql
-- Sample document
INSERT INTO docs VALUES (
    'doc_001',
    'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/ca2001172/',
    'Corporations Act 2001 content goes here...',
    'business,commonwealth,corporations',
    CURRENT_TIMESTAMP
);

-- Sample query
INSERT INTO queries VALUES (
    'query_001', 
    'How do I register a company?',
    'To register a company in Australia, you need to...',
    'doc_001',
    CURRENT_TIMESTAMP
);
```

## Common Queries

### Find Documents by Tags
```sql
-- Simple tag search (tags are comma-separated strings)
SELECT * FROM docs 
WHERE tags LIKE '%business%' 
  OR tags LIKE '%nsw%'
ORDER BY created_at DESC;
```

### Find Documents by Content
```sql
-- Full-text search in content
SELECT * FROM docs 
WHERE content LIKE '%register%' 
  AND content LIKE '%business%'
LIMIT 5;
```

### Get Recent Queries
```sql
-- Show recent user questions and answers
SELECT question, answer, created_at 
FROM queries 
ORDER BY created_at DESC 
LIMIT 10;
```

### Simple Analytics
```sql
-- Count docs by tag
SELECT 
  'business' as tag,
  COUNT(*) as count
FROM docs 
WHERE tags LIKE '%business%'

UNION ALL

SELECT 
  'planning' as tag,
  COUNT(*) as count  
FROM docs
WHERE tags LIKE '%planning%';
```

## That's All!

For hackathon, we don't need:
- ❌ Performance optimization
- ❌ Backup strategies  
- ❌ Migration plans
- ❌ Complex monitoring

Just get the 2 tables working and focus on the demo!

---

*Last Updated: 2025-08-29*
*Schema Version: 1.0*