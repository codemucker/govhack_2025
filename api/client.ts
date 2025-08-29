// Perfect TypeScript client - constructs HTTP requests from message metadata

import { BaseRequest } from './requestTypes';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:4000') {
    this.baseUrl = baseUrl;
  }

  // Single invoke method - constructs HTTP request from message metadata
  async invoke<TResponse>(request: BaseRequest<TResponse>): Promise<TResponse> {
    // Message contains all HTTP metadata - construct request automatically
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
}

// Singleton client
export const apiClient = new ApiClient();