// Real data pipeline API endpoints

import { api } from "encore.dev/api";
import { requestHandlerRegistry } from './requestHandlers';
import {
  AskQuestionRequest,
  AskQuestionResponse,
  GetHistoryRequest,
  GetHistoryResponse,
  HealthCheckResponse
} from './requestTypes';

// Ask legal question endpoint
export const askQuestion = api(
  { method: "POST", path: "/api/legal/ask" },
  async (req: {
    question: string;
    sessionId: string;
    userLocale?: string;
    context?: { location?: string };
  }): Promise<AskQuestionResponse> => {
    const request = new AskQuestionRequest(req);
    return await requestHandlerRegistry.handle(request);
  }
);

// Get query history endpoint
export const getHistory = api(
  { method: "GET", path: "/api/legal/history" },
  async (req: { sessionId: string; limit?: number }): Promise<GetHistoryResponse> => {
    const request = new GetHistoryRequest(req);
    return await requestHandlerRegistry.handle(request);
  }
);

// Health check endpoint
export const healthCheck = api(
  { method: "GET", path: "/api/health" },
  async (): Promise<HealthCheckResponse> => {
    return {
      status: "healthy",
      version: "1.0.0",
      timestamp: new Date().toISOString()
    };
  }
);

// That's it! Single endpoint, full type safety, message-driven routing.
//
// Usage:
// const request = new AskQuestionRequest({ question: "How to start business?", sessionId: "user123" });
// const response = await apiClient.invoke(request); // response is AskQuestionResponse type!
//
// const healthRequest = new HealthCheckRequest();
// const healthResponse = await apiClient.invoke(healthRequest); // HealthCheckResponse type!
//
// Client doesn't need to know endpoint names - just creates message and invokes!