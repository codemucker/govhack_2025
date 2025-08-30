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
  public bypassClarification?: boolean;

  constructor(params: {
    question: string;
    sessionId: string;
    userLocale?: string;
    context?: {
      location?: string;
    };
    bypassClarification?: boolean;
  }) {
    super();
    this.question = params.question;
    this.sessionId = params.sessionId;
    this.userLocale = params.userLocale;
    this.context = params.context;
    this.bypassClarification = params.bypassClarification;
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

export interface LocationDetectionResponse {
  success: boolean;
  location: {
    city: string;
    state: string;
    country: string;
    detected: boolean;
    source: 'ip' | 'default' | 'fallback';
    error?: string;
  };
}

export interface ClarificationResponse {
  success: boolean;
  needs_clarification: boolean;
  clarification_questions?: string[];
  suggested_details?: string[];
  reason?: string;
  queryId: string;
  events?: QueryEvent[];
  executionTime: number;
}

export interface AskQuestionResponse {
  success: boolean;
  answer?: string;
  needs_clarification?: boolean;
  clarification_questions?: string[];
  suggested_details?: string[];
  reason?: string;
  structured_data?: Array<{
    title?: string;
    authority?: string;
    description?: string;
    actions?: Array<{
      step: number;
      desc?: string;
      text?: string;
      link?: string;
    }>;
    notes?: string[];
    jurisdiction_level?: string;
    priority?: string;
  }>;
  deep_links?: Array<{
    type: string;
    title: string;
    description: string;
    url: string;
    authority?: string;
    jurisdiction?: string;
    jurisdiction_level?: string;
    contact_type?: string;
    phone?: string;
    email?: string;
    chatbot?: string;
  }>;
  sources?: Array<{
    title: string;
    url: string;
    jurisdiction: string;
    jurisdiction_level?: string;
    total_score?: number;
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

  constructor(baseUrl: string = '') {
    // In development, use relative URLs so Vite proxy works
    // In production, use the full URL
    this.baseUrl = baseUrl || (import.meta.env.DEV ? '' : 'http://localhost:4000');
  }

  // Connect to WebSocket for real-time events
  private connectWebSocket() {
    if (this.websocket?.readyState === WebSocket.OPEN) return;

    // Handle WebSocket URL construction properly for dev and production
    let wsUrl: string;
    if (this.baseUrl) {
      wsUrl = this.baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    } else {
      // In development mode with empty baseUrl, use proxy path
      if (import.meta.env.DEV) {
        // Use the Vite dev server's WebSocket proxy
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${location.host}/ws`;
      } else {
        // Production: connect directly to the server
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${location.host}`;
      }
    }

    console.log('Connecting to WebSocket URL:', wsUrl);

    // Validate the URL before creating WebSocket
    try {
      new URL(wsUrl); // This will throw if URL is invalid
    } catch (error) {
      console.error('Invalid WebSocket URL:', wsUrl, error);
      return;
    }

    try {
      this.websocket = new WebSocket(wsUrl);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      return;
    }

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
    bypassClarification?: boolean;
    onEvent?: (event: QueryEvent) => void;
  }): Promise<AskQuestionResponse> {
    // Direct call to our standalone server API
    const url = `${this.baseUrl}/api/legal/ask`;
    
    const requestBody = {
      question: params.question,
      context: params.context || {},
      bypassClarification: params.bypassClarification || false
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json() as AskQuestionResponse;

    // Don't throw for 400 responses - they contain valid error information
    // Only throw for actual network/server errors (5xx)
    if (!response.ok && response.status >= 500) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // If there's an event callback and we have a queryId, set up real-time listening
    if (params.onEvent && result.queryId) {
      this.onQueryEvents(result.queryId, params.onEvent);
    }

    return result;
  }

  // Cancel an ongoing query
  async cancelQuery(queryId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/cancel-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ queryId })
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel query: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  // Convenience method for location detection
  async detectLocation(): Promise<LocationDetectionResponse> {
    const response = await fetch(`${this.baseUrl}/api/location/detect`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json() as LocationDetectionResponse;
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