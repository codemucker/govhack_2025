// Frontend API Client - TypeScript-safe message-driven interface

export abstract class BaseRequest<TResponse = any> {
  abstract readonly requestType: string;
  abstract readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  abstract readonly path: string;
}

// Ask Question Request
export class AskQuestionRequest extends BaseRequest<AskQuestionResponse> {
  readonly requestType = 'AskQuestion';
  readonly method = 'POST' as const;
  readonly path = '/api/legal/ask';
  
  public question: string;
  public sessionId: string;
  public userLocale?: string;
  public context?: {
    location?: string;
  };

  constructor(params: {
    question: string;
    sessionId: string;
    userLocale?: string;
    context?: {
      location?: string;
    };
  }) {
    super();
    this.question = params.question;
    this.sessionId = params.sessionId;
    this.userLocale = params.userLocale;
    this.context = params.context;
  }
}

export interface AskQuestionResponse {
  success: boolean;
  answer?: string;
  sources?: Array<{
    title: string;
    url: string;
    jurisdiction: string;
  }>;
  confidence?: number;
  queryId: string;
  executionTime: number;
  error?: string;
}

// Health Check Request
export class HealthCheckRequest extends BaseRequest<HealthCheckResponse> {
  readonly requestType = 'HealthCheck';
  readonly method = 'GET' as const;
  readonly path = '/api/legal/health';
  
  constructor() {
    super();
  }
}

export interface HealthCheckResponse {
  status: string;
  version: string;
  timestamp: string;
}

// Frontend API Client
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/') { // Use relative URLs in frontend
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  // Single invoke method - constructs HTTP request from message metadata
  async invoke<TResponse>(request: BaseRequest<TResponse>): Promise<TResponse> {
    const url = `${this.baseUrl}/api/message`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json() as TResponse;
  }

  // Convenience method for asking legal questions
  async askLegalQuestion(params: {
    question: string;
    sessionId?: string;
    userLocale?: string;
    context?: {
      location?: string;
    };
  }): Promise<AskQuestionResponse> {
    const request = new AskQuestionRequest({
      question: params.question,
      sessionId: params.sessionId || this.generateSessionId(),
      userLocale: params.userLocale || 'en-AU',
      context: params.context
    });

    return await this.invoke(request);
  }

  // Convenience method for health check
  async healthCheck(): Promise<HealthCheckResponse> {
    const request = new HealthCheckRequest();
    return await this.invoke(request);
  }

  // Generate a session ID if none provided
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();