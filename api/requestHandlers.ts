// Request handlers - self-contained logic for each request type

import fs from 'fs/promises';
import path from 'path';
import {
  AskQuestionRequest,
  AskQuestionResponse,
  GetHistoryRequest,
  GetHistoryResponse,
  SeedDatabaseRequest,
  SeedDatabaseResponse,
  HealthCheckRequest,
  HealthCheckResponse,
  Request,
  BaseRequest
} from './requestTypes';

// Generic request handler interface
export interface RequestHandler<TRequest extends BaseRequest<TResponse>, TResponse> {
  handle(request: TRequest): Promise<TResponse>;
}

// Request handler registry
export class RequestHandlerRegistry {
  private handlers: Map<string, RequestHandler<any, any>> = new Map();

  register<TRequest extends BaseRequest<TResponse>, TResponse>(
    requestType: string,
    handler: RequestHandler<TRequest, TResponse>
  ) {
    this.handlers.set(requestType, handler);
  }

  async handle<TResponse>(request: BaseRequest<TResponse>): Promise<TResponse> {
    const handler = this.handlers.get(request.requestType);
    if (!handler) {
      throw new Error(`No handler registered for request: ${request.requestType}`);
    }
    return await handler.handle(request);
  }

  getRegisteredRequests(): string[] {
    return Array.from(this.handlers.keys());
  }
}

// Individual request handlers with integrated logic

class AskQuestionHandler implements RequestHandler<AskQuestionRequest, AskQuestionResponse> {
  async handle(request: AskQuestionRequest): Promise<AskQuestionResponse> {
    const startTime = Date.now();
    
    try {
      // Integrated AI query processing
      const mockSources = [
        {
          title: 'Corporations Act 2001',
          url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/ca2001172/',
          jurisdiction: 'Commonwealth of Australia'
        }
      ];
      
      const mockAnswer = `Based on Australian law, to address your question "${request.question}":

This is a simplified response for demonstration purposes. In the full implementation, this would:

1. Search the legal document database for relevant information
2. Use AI (OpenRouter) to generate a comprehensive legal response
3. Include proper legal disclaimers and source citations
4. Provide jurisdiction-specific guidance based on your location (${request.context?.location || 'Australia'})

⚠️ DISCLAIMER: This is general information only and should not be considered legal advice. Consult a qualified legal professional for specific legal matters.`;

      return {
        success: true,
        answer: mockAnswer,
        sources: mockSources,
        confidence: 0.8,
        queryId: `query_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        queryId: `query_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        executionTime: Date.now() - startTime
      };
    }
  }
}

class GetHistoryHandler implements RequestHandler<GetHistoryRequest, GetHistoryResponse> {
  async handle(request: GetHistoryRequest): Promise<GetHistoryResponse> {
    try {
      // Mock implementation - in real version would read from persistence
      const queries = [
        {
          id: `hist_${Date.now()}`,
          question: "Sample previous question",
          answer: "Sample previous answer",
          timestamp: new Date().toISOString(),
          confidence: 0.8
        }
      ];

      return {
        success: true,
        queries: queries.slice(0, request.limit || 50)
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

class SeedDatabaseHandler implements RequestHandler<SeedDatabaseRequest, SeedDatabaseResponse> {
  async handle(request: SeedDatabaseRequest): Promise<SeedDatabaseResponse> {
    try {
      // Mock implementation - in real version would seed PostgreSQL
      return {
        success: true,
        documentsAdded: 2,
        totalDocuments: 2
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

class HealthCheckHandler implements RequestHandler<HealthCheckRequest, HealthCheckResponse> {
  async handle(request: HealthCheckRequest): Promise<HealthCheckResponse> {
    return {
      status: "healthy",
      version: "1.0.0",
      timestamp: new Date().toISOString()
    };
  }
}

// Create and configure the registry
export const requestHandlerRegistry = new RequestHandlerRegistry();

// Register all handlers
requestHandlerRegistry.register('AskQuestion', new AskQuestionHandler());
requestHandlerRegistry.register('GetHistory', new GetHistoryHandler());
requestHandlerRegistry.register('SeedDatabase', new SeedDatabaseHandler());
requestHandlerRegistry.register('HealthCheck', new HealthCheckHandler());

export default requestHandlerRegistry;