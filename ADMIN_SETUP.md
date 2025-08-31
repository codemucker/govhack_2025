# LegalEase Admin Interface

## Overview

The admin interface provides comprehensive visibility into the LegalEase database and system performance.

## Services

### 1. Backend API Server
- **Port:** 4000
- **Start:** `node standalone-server.js`
- **Admin Endpoints:** `http://localhost:4000/api/admin/*`

### 2. Main Frontend (User-facing)
- **Port:** 3000  
- **Start:** `cd frontend && npm run dev`
- **URL:** `http://localhost:3000`

### 3. Admin Frontend (Database inspection)
- **Port:** 3001
- **Start:** `cd frontend-admin && npm run dev` 
- **URL:** `http://localhost:3001`

## Quick Start

### Manual Start (All Services)

```bash
# Terminal 1: Backend
node standalone-server.js

# Terminal 2: Main Frontend  
cd frontend && npm run dev

# Terminal 3: Admin Frontend
cd frontend-admin && npm run dev
```

### Access Points

- **Main App:** http://localhost:3000 (Users ask legal questions)
- **Admin Dashboard:** http://localhost:3001 (Database inspection)
- **Backend API:** http://localhost:4000 (API endpoints)

## Admin Features

### 📊 Dashboard
- Database statistics and health monitoring
- Top jurisdictions and tags
- Recent query performance metrics

### 📄 Documents  
- Browse all ingested documents
- Filter by jurisdiction, type, synthetic/real
- Search by URL, tags, or content
- View document details and content previews

### ❓ Queries
- View recent user queries 
- Performance metrics (execution time, tokens, confidence)
- Relevance scoring and source tracking

### 🏛️ Authorities
- Browse authority contact database
- Contact information by jurisdiction and level
- Website links and contact details

### ⚖️ Legal Taxonomy
- Inspect legal area definitions and keywords
- View authority type mappings
- Browse jurisdiction-specific legislation
- Authority contact information by region

## Admin API Endpoints

All admin endpoints are prefixed with `/api/admin/`:

- `GET /api/admin/stats` - Database statistics
- `GET /api/admin/documents` - List documents (with filters)
- `GET /api/admin/documents/:url` - Get specific document
- `GET /api/admin/jurisdictions` - List jurisdictions
- `GET /api/admin/document-types` - List document types  
- `GET /api/admin/tags` - Most common tags
- `GET /api/admin/queries` - Recent queries
- `GET /api/admin/authorities` - Authority contacts
- `GET /api/admin/legal-taxonomy` - Legal taxonomy data
- `GET /api/admin/search?q=term` - Search documents
- `GET /api/admin/health` - Database health check

## Development Notes

The admin interface is built with:
- **Vue 3 + TypeScript** (frontend)
- **Vite** (build tool)  
- **TypeScript AdminApi class** (backend)
- **SQLite database** (data storage)

The interface provides real-time visibility into what documents have been ingested, what legal taxonomy is being used, and how the system is performing with user queries.