// Demo examples for the frontend API client

import { apiClient } from './client'

export async function demoAskQuestion() {
  console.log('🚀 Demo: Asking a legal question...')
  
  try {
    const response = await apiClient.askLegalQuestion({
      question: "How do I register a business in Australia?",
      userLocale: 'en-AU',
      context: {
        location: 'NSW'
      }
    })

    console.log('✅ Success!', response)
    return response

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

export async function demoHealthCheck() {
  console.log('🔍 Demo: Checking API health...')
  
  try {
    const response = await apiClient.healthCheck()
    console.log('✅ API Health:', response)
    return response

  } catch (error) {
    console.error('❌ Health check failed:', error)
    throw error
  }
}

// Example of using the raw invoke method with custom requests
export async function demoRawInvoke() {
  console.log('⚙️ Demo: Raw API invoke...')
  
  const { AskQuestionRequest } = await import('./client')
  
  const request = new AskQuestionRequest({
    question: "What are the requirements for starting a food business?",
    sessionId: 'demo_session_123',
    userLocale: 'en-AU',
    context: {
      location: 'Victoria'
    }
  })

  try {
    const response = await apiClient.invoke(request)
    console.log('✅ Raw invoke success:', response)
    return response

  } catch (error) {
    console.error('❌ Raw invoke failed:', error)
    throw error
  }
}

// Show all the demos
export async function runAllDemos() {
  console.log('🎯 Running all frontend API demos...')
  
  try {
    console.log('\n1. Health Check:')
    await demoHealthCheck()
    
    console.log('\n2. Ask Legal Question (convenience method):')
    await demoAskQuestion()
    
    console.log('\n3. Raw API Invoke:')
    await demoRawInvoke()
    
    console.log('\n✅ All demos completed successfully!')

  } catch (error) {
    console.error('\n❌ Demo failed:', error)
  }
}