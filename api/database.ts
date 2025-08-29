import { SQLDatabase } from "encore.dev/storage/sqldb";

// Database schema for the hackathon MVP
export const db = new SQLDatabase("legalease", {
  migrations: "./migrations",
});

// Simple document interface for cached AustLII documents
export interface Doc {
  id: string;
  url: string;
  content: string;
  tags: string; // comma-separated tags like "business,nsw,planning"
  created_at: Date;
}

// Query log interface for tracking user interactions
export interface Query {
  id: string;
  question: string;
  answer: string;
  docs_used: string; // comma-separated doc IDs
  created_at: Date;
}

// Helper function to generate simple IDs
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}