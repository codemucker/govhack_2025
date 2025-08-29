// Request handlers - self-contained logic for each request type

import {
  AskQuestionRequest,
  AskQuestionResponse,
  GetHistoryRequest,
  GetHistoryResponse,
  HealthCheckRequest,
  HealthCheckResponse,
  BaseRequest
} from './requestTypes';
import { db, Query } from './database';
import { documentFetcher } from './documentFetcher';
import { openaiClient } from './openaiClient';

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
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    try {
      // Find relevant documents from cache
      const relevantDocs = await documentFetcher.findDocuments(request.question);
      
      if (relevantDocs.length === 0) {
        return {
          success: false,
          error: 'No relevant legal documents found in cache. Please ensure documents are cached first.',
          queryId,
          executionTime: Date.now() - startTime
        };
      }

      // Prepare context from relevant documents
      const context = relevantDocs
        .slice(0, 3) // Limit to top 3 most relevant documents
        .map(doc => `DOCUMENT: ${doc.url}\nCONTENT: ${doc.content.substring(0, 2000)}...\n`)
        .join('\n\n');

      // Generate AI response using OpenAI
      const aiResponse = await openaiClient.generateAnswer(
        request.question,
        context,
        request.userLocale
      );

      // Prepare sources
      const sources = relevantDocs.slice(0, 3).map(doc => ({
        title: this.extractTitleFromUrl(doc.url),
        url: doc.url,
        jurisdiction: this.extractJurisdictionFromUrl(doc.url)
      }));

      // Log query to database
      await db.exec`
        INSERT INTO queries (id, question, answer, docs_used, created_at)
        VALUES (
          ${queryId},
          ${request.question},
          ${aiResponse.answer},
          ${relevantDocs.slice(0, 3).map(doc => doc.id).join(',')},
          CURRENT_TIMESTAMP
        )
      `;

      return {
        success: true,
        answer: aiResponse.answer,
        sources,
        confidence: 0.9, // High confidence when using real legal documents
        queryId,
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Error in AskQuestionHandler:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        queryId,
        executionTime: Date.now() - startTime
      };
    }
  }

  private extractTitleFromUrl(url: string): string {
    const match = url.match(/\/([^/]+)\/([^/]+)\/$/);
    if (match) {
      return match[2].replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, str => str.toUpperCase());
    }
    return 'Australian Legal Document';
  }

  private extractJurisdictionFromUrl(url: string): string {
    if (url.includes('/cth/')) return 'Commonwealth of Australia';
    if (url.includes('/nsw/')) return 'New South Wales';
    if (url.includes('/vic/')) return 'Victoria';
    if (url.includes('/qld/')) return 'Queensland';
    if (url.includes('/wa/')) return 'Western Australia';
    if (url.includes('/sa/')) return 'South Australia';
    if (url.includes('/tas/')) return 'Tasmania';
    if (url.includes('/nt/')) return 'Northern Territory';
    if (url.includes('/act/')) return 'Australian Capital Territory';
    return 'Australia';
  }
}

class GetHistoryHandler implements RequestHandler<GetHistoryRequest, GetHistoryResponse> {
  async handle(request: GetHistoryRequest): Promise<GetHistoryResponse> {
    try {
      // Query real database for session history
      const limit = request.limit || 50;
      const rows = [];
      for await (const row of db.query`
        SELECT * FROM queries 
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `) {
        rows.push(row);
      }

      const queries = rows.map(row => ({
        id: row.id as string,
        question: row.question as string,
        answer: (row.answer as string) || 'No answer recorded',
        timestamp: new Date(row.created_at as string).toISOString(),
        confidence: 0.9 // Default confidence for real queries
      }));

      return {
        success: true,
        queries
      };

    } catch (error) {
      console.error('Error in GetHistoryHandler:', error);
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
requestHandlerRegistry.register('HealthCheck', new HealthCheckHandler());

export default requestHandlerRegistry;