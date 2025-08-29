// Perfect TypeScript-safe message-driven API

import { apiClient } from './api/client';
import { AskQuestionRequest, AskQuestionResponse, GetHistoryRequest, HealthCheckRequest } from './api/requestTypes';

// Perfect usage - exactly what you wanted!
async function perfectExample() {
  
  // 1. Client creates message with named parameters - clean and readable!
  const askRequest = new AskQuestionRequest({
    question: "How do I register a business in Australia?",
    sessionId: "user_123",
    userLocale: "en-AU",
    context: { 
      location: "Sydney, NSW"
    }
  });
  
  // 2. Single invoke call - API constructs HTTP request from message metadata
  const response = await apiClient.invoke(askRequest) as AskQuestionResponse;
  // response is automatically typed as AskQuestionResponse!
  
  console.log(response.answer);      // TypeScript knows this exists
  console.log(response.confidence); // Full intellisense support
  console.log(response.sources);    // Compile-time type checking

  // More examples - all with named parameters, fully typed
  const historyRequest = new GetHistoryRequest({ 
    sessionId: "user_123", 
    limit: 10 
  });
  const history = await apiClient.invoke(historyRequest); // GetHistoryResponse type
  
  const healthRequest = new HealthCheckRequest(); // No params needed
  const health = await apiClient.invoke(healthRequest); // HealthCheckResponse type
  
  // Perfect! Client only needs to know:
  // 1. What message type to create
  // 2. What arguments it needs
  // API handles all HTTP construction automatically from message metadata
}

// Show the architecture:
function showArchitecture() {
  const request = new AskQuestionRequest({
    question: "test",
    sessionId: "user123"
  });
  
  console.log('Message contains all HTTP metadata:');
  console.log(`Request Type: ${request.requestType}`); // 'AskQuestion'
  console.log(`HTTP Method: ${request.method}`);       // 'POST'
  console.log(`Relative URL: ${request.path}`);        // '/api/legal/ask'
  console.log('Message determines handler routing automatically');
  
  // Client doesn't need to know any of this - just creates message and invokes!
}

export { perfectExample, showArchitecture };