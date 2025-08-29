import { api } from "encore.dev/api";

interface HelloResponse {
  message: string;
  timestamp: string;
  version: string;
}

// Hello world API endpoint
export const hello = api(
  { method: "GET", path: "/api/hello" },
  async (): Promise<HelloResponse> => {
    return {
      message: "Hello from LegalEase API!",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    };
  }
);

// Health check endpoint
export const health = api(
  { method: "GET", path: "/api/health" },
  async (): Promise<{ status: string; uptime: number }> => {
    return {
      status: "healthy",
      uptime: process.uptime()
    };
  }
);