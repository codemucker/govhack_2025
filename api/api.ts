// TypeScript-safe single endpoint API

import { api } from "encore.dev/api";
import { requestHandlerRegistry } from './requestHandlers';
import { BaseRequest } from './requestTypes';

// SINGLE ENDPOINT that handles all message types with full TypeScript safety
export const message = api(
  { method: "POST", path: "/api/message" },
  async (request: BaseRequest<any>): Promise<any> => {
    // Message type determines handler - request contains all HTTP metadata
    return await requestHandlerRegistry.handle(request);
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