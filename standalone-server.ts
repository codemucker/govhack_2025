#!/usr/bin/env node

// Standalone Node.js server to test the real data pipeline
// This bypasses Encore's cloud dependency issues

import express from 'express';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { PersistentDatabase } from './persistent-database.js';
import { DocumentSeeder } from './document-seeder.js';

// Use Node.js style path resolution
const __dirname = process.cwd();

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, 'frontend/dist')));

// Database connection
let db: PersistentDatabase;

// Initialize database and services
async function initializeServices(): Promise<void> {
  console.log('🚀 Initializing LegalEase Standalone Server...');
  
  try {
    // Initialize database
    db = new PersistentDatabase();
    await db.initialize();
    console.log('✅ Database initialized');
    
    // Initialize document seeder
    const seeder = new DocumentSeeder(db);
    const stats = await seeder.getSeadingStats();
    console.log('✅ Document seeder ready');
    console.log(`📊 Seeding status: ${stats.completion_percentage}% complete`);
    
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json({
      status: 'healthy',
      database: 'connected',
      documents: stats.documents,
      queries: stats.queries,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get all documents
app.get('/api/documents', async (req, res) => {
  try {
    const documents = await db.getAllDocuments();
    res.json({
      documents: documents.slice(0, 50), // Limit to first 50
      total: documents.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get document by URL
app.get('/api/document', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter required' });
    }
    
    const document = await db.getDocument(url);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(document);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Search documents
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" required' });
    }
    
    const documents = await db.findDocuments(q);
    res.json({
      query: q,
      documents,
      count: documents.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent queries
app.get('/api/queries', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const queries = await db.getRecentQueries(limit);
    res.json({
      queries,
      count: queries.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all authorities
app.get('/api/authorities', async (req, res) => {
  try {
    const authorities = await db.getAllAuthorities();
    res.json({
      authorities,
      count: authorities.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Serve the frontend for any other routes
app.get('*', (req, res) => {
  const frontendPath = join(__dirname, 'frontend/dist/index.html');
  if (existsSync(frontendPath)) {
    res.sendFile(frontendPath);
  } else {
    res.status(404).json({ 
      error: 'Frontend not built',
      message: 'Run "npm run build" to build the frontend'
    });
  }
});

// Create HTTP server
const server = createServer(app);

// Setup WebSocket for real-time updates (optional)
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('📱 WebSocket client connected');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('📨 WebSocket message:', data);
      
      // Echo back for now
      ws.send(JSON.stringify({
        type: 'echo',
        data,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid JSON message',
        timestamp: new Date().toISOString()
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('📱 WebSocket client disconnected');
  });
});

// Start the server
async function startServer(): Promise<void> {
  await initializeServices();
  
  server.listen(PORT, () => {
    console.log(`\n🎉 LegalEase Standalone Server running!`);
    console.log(`🌐 HTTP Server: http://localhost:${PORT}`);
    console.log(`🔌 WebSocket Server: ws://localhost:${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📚 Documents: http://localhost:${PORT}/api/documents`);
    console.log(`🔍 Search: http://localhost:${PORT}/api/search?q=rental`);
    console.log(`\n✨ Ready to serve legal information!`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  
  if (db) {
    await db.close();
    console.log('✅ Database closed');
  }
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start the application
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});