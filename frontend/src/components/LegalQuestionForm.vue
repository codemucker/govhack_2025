<template>
  <div class="legal-question-form">
    <h2>🏛️ LegalEase - Ask Your Legal Question</h2>
    
    <form @submit.prevent="askQuestion" class="question-form">
      <div class="form-group">
        <label for="question">Your Legal Question:</label>
        <textarea
          id="question"
          v-model="question"
          placeholder="e.g., How do I register a business in Australia?"
          rows="3"
          required
          :disabled="loading"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="location">Your Location (optional):</label>
        <select id="location" v-model="location" :disabled="loading">
          <option value="">Select location</option>
          <option value="NSW">New South Wales</option>
          <option value="VIC">Victoria</option>
          <option value="QLD">Queensland</option>
          <option value="WA">Western Australia</option>
          <option value="SA">South Australia</option>
          <option value="TAS">Tasmania</option>
          <option value="NT">Northern Territory</option>
          <option value="ACT">Australian Capital Territory</option>
        </select>
      </div>


      <button type="submit" :disabled="loading || !question.trim()" class="submit-btn">
        {{ loading ? '🤔 Thinking...' : '💡 Get Legal Guidance' }}
      </button>
    </form>

    <!-- Loading State with Real-time Events -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Analyzing your question with Australian legal knowledge...</p>
      
      <!-- Real-time Event Stream -->
      <div v-if="events.length > 0" class="events-stream">
        <h4>📡 Live Progress:</h4>
        <div class="events-list">
          <div 
            v-for="event in events" 
            :key="`${event.queryId}-${event.timestamp}`"
            class="event-item"
            :class="`event-${event.type}`"
          >
            <span class="event-time">{{ formatElapsedTime(event.elapsedTime) }}</span>
            <span class="event-message">{{ event.message }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error">
      <h3>❌ Something went wrong</h3>
      <p>{{ error }}</p>
      <button @click="error = null" class="retry-btn">Try Again</button>
    </div>

    <!-- Success State -->
    <div v-if="response" class="response">
      <h3>✅ Legal Guidance</h3>
      
      <div class="answer">
        <h4>📝 Answer:</h4>
        <div class="answer-content">{{ response.answer }}</div>
      </div>

      <div v-if="response.sources && response.sources.length > 0" class="sources">
        <h4>📚 Legal Sources:</h4>
        <ul>
          <li v-for="(source, index) in response.sources" :key="index" class="source-item">
            <strong>{{ source.title }}</strong>
            <br>
            <span class="jurisdiction">{{ source.jurisdiction }}</span>
            <br>
            <a :href="source.url" target="_blank" rel="noopener">View Document</a>
          </li>
        </ul>
      </div>

      <div class="metadata">
        <p><strong>Confidence:</strong> {{ Math.round((response.confidence || 0) * 100) }}%</p>
        <p><strong>Response Time:</strong> {{ response.executionTime }}ms</p>
        <p><strong>Query ID:</strong> {{ response.queryId }}</p>
      </div>

      <div class="disclaimer">
        <p><strong>⚠️ Disclaimer:</strong> This is general information only and should not be considered legal advice. Consult a qualified legal professional for specific legal matters.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { apiClient } from '../api/client'
import type { AskQuestionResponse, QueryEvent } from '../api/client'

// Form state
const question = ref('')
const location = ref('')

// UI state
const loading = ref(false)
const error = ref<string | null>(null)
const response = ref<AskQuestionResponse | null>(null)
const events = ref<QueryEvent[]>([])
let currentQueryId = ''

// Ask question handler with real-time events
async function askQuestion() {
  if (!question.value.trim()) return

  loading.value = true
  error.value = null
  response.value = null
  events.value = []

  try {
    // Set up real-time event handler
    const onEvent = (event: QueryEvent) => {
      events.value.push(event)
    }

    const result = await apiClient.askLegalQuestion({
      question: question.value.trim(),
      userLocale: 'en-AU',
      context: {
        location: location.value || undefined
      },
      onEvent
    })

    currentQueryId = result.queryId

    if (result.success) {
      response.value = result
      // If we have events in the response, show them too
      if (result.events && result.events.length > 0) {
        events.value = result.events
      }
    } else {
      error.value = result.error || 'Failed to get legal guidance'
    }

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Network error occurred'
  } finally {
    loading.value = false
    // Clean up event subscription
    if (currentQueryId) {
      apiClient.offQueryEvents(currentQueryId)
    }
  }
}

// Utility function to format elapsed time
function formatElapsedTime(elapsedTime: number): string {
  if (elapsedTime < 1000) {
    return `${elapsedTime}ms`
  } else {
    return `${(elapsedTime / 1000).toFixed(1)}s`
  }
}

// Clean up on component unmount
onUnmounted(() => {
  if (currentQueryId) {
    apiClient.offQueryEvents(currentQueryId)
  }
})
</script>

<style scoped>
.legal-question-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

h2 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 30px;
}

.question-form {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #555;
}

.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.submit-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
}

.submit-btn:hover:not(:disabled) {
  background: #2980b9;
}

.submit-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 40px;
  background: #e8f5e8;
  border-radius: 8px;
  margin-bottom: 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  background: #ffe6e6;
  border: 1px solid #ff9999;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.error h3 {
  color: #cc0000;
  margin-top: 0;
}

.retry-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.response {
  background: #e8f5e8;
  border: 1px solid #4CAF50;
  padding: 20px;
  border-radius: 8px;
}

.response h3 {
  color: #2e7d32;
  margin-top: 0;
}

.answer {
  margin-bottom: 20px;
}

.answer h4 {
  color: #1976d2;
  margin-bottom: 10px;
}

.answer-content {
  background: white;
  padding: 15px;
  border-radius: 4px;
  border-left: 4px solid #2196F3;
  white-space: pre-wrap;
  line-height: 1.6;
}

.sources {
  margin-bottom: 20px;
}

.sources h4 {
  color: #1976d2;
  margin-bottom: 10px;
}

.sources ul {
  list-style: none;
  padding: 0;
}

.source-item {
  background: white;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  border-left: 4px solid #FF9800;
}

.source-item strong {
  color: #333;
}

.jurisdiction {
  color: #666;
  font-size: 14px;
}

.source-item a {
  color: #1976d2;
  text-decoration: none;
}

.source-item a:hover {
  text-decoration: underline;
}

.metadata {
  background: white;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 14px;
}

.metadata p {
  margin: 5px 0;
}

.disclaimer {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  padding: 15px;
  border-radius: 4px;
  font-size: 14px;
}

.disclaimer p {
  margin: 0;
  color: #856404;
}

/* Real-time Events Styling */
.events-stream {
  margin-top: 20px;
  padding: 15px;
  background: white;
  border-radius: 6px;
  border-left: 4px solid #3498db;
}

.events-stream h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 16px;
}

.events-list {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 14px;
  animation: slideIn 0.3s ease-out;
}

.event-time {
  font-family: monospace;
  font-weight: 600;
  color: #666;
  min-width: 60px;
  text-align: right;
}

.event-message {
  flex: 1;
  color: #2c3e50;
}

/* Event type specific styling */
.event-query_received,
.event-query_completed {
  background: #e8f5e8;
  border-left: 3px solid #4CAF50;
}

.event-document_search,
.event-document_fetch_start,
.event-document_fetch_success {
  background: #e3f2fd;
  border-left: 3px solid #2196F3;
}

.event-llm_analysis_start,
.event-ai_generation_start,
.event-ai_generation_complete {
  background: #fff3e0;
  border-left: 3px solid #FF9800;
}

.event-query_failed {
  background: #ffebee;
  border-left: 3px solid #f44336;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile responsive adjustments */
@media (max-width: 600px) {
  .event-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .event-time {
    min-width: auto;
    text-align: left;
    font-size: 12px;
  }
}
</style>