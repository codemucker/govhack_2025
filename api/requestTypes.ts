// Self-describing request classes with HTTP method and response type information

export abstract class BaseRequest<TResponse = any> {
  abstract readonly requestType: string;
  abstract readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  abstract readonly path: string;
  // Response type is embedded in the generic for compile-time safety
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

// Get History Request
export class GetHistoryRequest extends BaseRequest<GetHistoryResponse> {
  readonly requestType = 'GetHistory';
  readonly method = 'GET' as const;
  readonly path = '/api/legal/history';
  
  public sessionId: string;
  public limit?: number;

  constructor(params: {
    sessionId: string;
    limit?: number;
  }) {
    super();
    this.sessionId = params.sessionId;
    this.limit = params.limit;
  }
}

export interface GetHistoryResponse {
  success: boolean;
  queries?: Array<{
    id: string;
    question: string;
    answer?: string;
    timestamp: string;
    confidence?: number;
  }>;
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

// Union type for all requests
export type Request = 
  | AskQuestionRequest
  | GetHistoryRequest
  | HealthCheckRequest;