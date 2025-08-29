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

export interface QueryEvent {
  queryId: string;
  type: string;
  message: string;
  timestamp: number;
  elapsedTime: number;
  data?: any;
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
  tokensUsed?: number;
  events?: QueryEvent[];
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
  private eventCallbacks: Map<string, (event: QueryEvent) => void> = new Map();
  private websocket: WebSocket | null = null;

  constructor(baseUrl: string = 'http://localhost:4000') {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  // Connect to WebSocket for real-time events
  private connectWebSocket() {
    if (this.websocket?.readyState === WebSocket.OPEN) return;

    const wsUrl = this.baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    this.websocket = new WebSocket(wsUrl);

    this.websocket.onmessage = (event) => {
      try {
        const queryEvent: QueryEvent = JSON.parse(event.data);
        const callback = this.eventCallbacks.get(queryEvent.queryId);
        if (callback) {
          callback(queryEvent);
        }
      } catch (error) {
        console.warn('Failed to parse WebSocket event:', error);
      }
    };

    this.websocket.onerror = (error) => {
      console.warn('WebSocket error:', error);
    };
  }

  // Subscribe to real-time events for a query
  onQueryEvents(queryId: string, callback: (event: QueryEvent) => void) {
    this.eventCallbacks.set(queryId, callback);
    this.connectWebSocket();
  }

  // Unsubscribe from query events
  offQueryEvents(queryId: string) {
    this.eventCallbacks.delete(queryId);
  }

  // Convenience method for asking legal questions with real-time events
  async askLegalQuestion(params: {
    question: string;
    sessionId?: string;
    userLocale?: string;
    context?: {
      location?: string;
    };
    onEvent?: (event: QueryEvent) => void;
  }): Promise<AskQuestionResponse> {
    // Direct call to our standalone server API
    const url = `${this.baseUrl}/api/legal/ask`;
    
    const requestBody = {
      question: params.question,
      context: params.context || {}
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json() as AskQuestionResponse;

    // If there's an event callback and we have a queryId, set up real-time listening
    if (params.onEvent && result.queryId) {
      this.onQueryEvents(result.queryId, params.onEvent);
    }

    return result;
  }

  // Convenience method for health check
  async healthCheck(): Promise<HealthCheckResponse> {
    const response = await fetch(`${this.baseUrl}/api/hello`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json() as HealthCheckResponse;
  }

  // Generate a session ID if none provided
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();