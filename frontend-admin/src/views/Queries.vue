<template>
  <div class="queries">
    <h1>❓ Query Flow Tracking</h1>
    
    <!-- Filters -->
    <div class="card">
      <div class="filters-row">
        <select v-model="selectedQueryType" @change="loadQueries" class="filter-select">
          <option value="all">All Queries</option>
          <option value="recent">Recent Queries</option>
          <option value="business-intelligence">Business Intelligence</option>
        </select>
        
        <select v-model="hasTranslation" @change="loadQueries" class="filter-select">
          <option value="">All Translations</option>
          <option value="true">Has Translation</option>
          <option value="false">No Translation</option>
        </select>
        
        <select v-model="hasLlmResponse" @change="loadQueries" class="filter-select">
          <option value="">All LLM Responses</option>
          <option value="true">Has LLM Response</option>
          <option value="false">No LLM Response</option>
        </select>

        <input 
          type="date" 
          v-model="startDate" 
          @change="loadQueries" 
          class="filter-input"
          placeholder="Start Date"
        />
        
        <input 
          type="date" 
          v-model="endDate" 
          @change="loadQueries" 
          class="filter-input"
          placeholder="End Date"
        />

        <button @click="clearFilters" class="btn btn-secondary">
          Clear Filters
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="loading">
      Loading queries...
    </div>

    <div v-else>
      <div class="card">
        <div class="table-header">
          <h2>Query History ({{ queries.length }} total)</h2>
          <div class="bulk-actions">
            <button 
              @click="showBulkDeleteModal = true" 
              class="btn btn-danger"
              :disabled="queries.length === 0"
            >
              🗑️ Bulk Delete
            </button>
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Translation</th>
                <th>Jurisdiction</th>
                <th>Confidence</th>
                <th>Time</th>
                <th>Sources</th>
                <th>Relevant</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="query in queries" :key="query.id">
                <td class="question-cell">
                  <div class="question-text" :title="query.question">
                    {{ truncate(query.question, 80) }}
                  </div>
                </td>
                <td class="translation-cell">
                  <span v-if="query.translated_question && query.translated_question !== query.question" 
                        class="translation-indicator" 
                        :title="`Original: ${query.question}\nTranslated: ${query.translated_question}\nLanguage: ${query.detected_language || 'unknown'}`">
                    🌐 {{ query.detected_language?.toUpperCase() || 'TRANS' }}
                  </span>
                  <span v-else class="no-translation">-</span>
                </td>
                <td>{{ query.jurisdiction?.toUpperCase() || 'N/A' }}</td>
                <td>
                  <span :class="getConfidenceClass(query.confidence)">
                    {{ query.confidence?.toFixed(2) || 'N/A' }}
                  </span>
                </td>
                <td>{{ query.execution_time || 0 }}ms</td>
                <td>{{ query.sources_count || 0 }}</td>
                <td>
                  <span :class="query.relevant ? 'relevant-yes' : 'relevant-no'">
                    {{ query.relevant ? 'Yes' : 'No' }}
                  </span>
                </td>
                <td>{{ formatDate(query.created_at) }}</td>
                <td class="actions-cell">
                  <button 
                    @click="viewQueryFlow(query.id)" 
                    class="btn btn-primary btn-sm"
                  >
                    Flow
                  </button>
                  <button 
                    @click="deleteQuery(query.id)" 
                    class="btn btn-danger btn-sm"
                    :disabled="deletingIds.has(query.id)"
                  >
                    {{ deletingIds.has(query.id) ? '...' : 'Del' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Query Flow Modal -->
      <div v-if="showFlowModal" class="modal-overlay" @click="showFlowModal = false">
        <div class="modal query-flow-modal" @click.stop>
          <div class="modal-header">
            <h3>🔍 Query Flow Details</h3>
            <button @click="showFlowModal = false" class="modal-close">×</button>
          </div>
          <div class="modal-body" v-if="selectedQueryFlow">
            <!-- Original Question -->
            <div class="flow-section">
              <h4>📝 Original Question</h4>
              <div class="flow-content">
                <p><strong>Question:</strong> {{ selectedQueryFlow.question }}</p>
                <p><strong>Jurisdiction:</strong> {{ selectedQueryFlow.jurisdiction?.toUpperCase() }}</p>
                <p><strong>Created:</strong> {{ formatDate(selectedQueryFlow.created_at) }}</p>
              </div>
            </div>

            <!-- Translation Flow -->
            <div v-if="selectedQueryFlow.translated_question && selectedQueryFlow.translated_question !== selectedQueryFlow.question" class="flow-section">
              <h4>🌐 Translation Flow</h4>
              <div class="flow-content">
                <p><strong>Detected Language:</strong> {{ selectedQueryFlow.detected_language || 'Unknown' }}</p>
                <p><strong>Original:</strong> {{ selectedQueryFlow.question }}</p>
                <p><strong>Translated:</strong> {{ selectedQueryFlow.translated_question }}</p>
              </div>
            </div>

            <!-- LLM Response -->
            <div v-if="selectedQueryFlow.ai_response" class="flow-section">
              <h4>🤖 LLM Response</h4>
              <div class="flow-content llm-response">
                <template v-if="typeof selectedQueryFlow.ai_response === 'object'">
                  <div v-if="selectedQueryFlow.ai_response.answer">
                    <strong>Answer:</strong>
                    <div v-html="selectedQueryFlow.ai_response.answer"></div>
                  </div>
                  <div v-if="selectedQueryFlow.ai_response.tokensUsed" class="tokens-info">
                    <strong>Tokens Used:</strong> {{ selectedQueryFlow.ai_response.tokensUsed }}
                  </div>
                  <div v-if="selectedQueryFlow.ai_response.sources && selectedQueryFlow.ai_response.sources.length">
                    <strong>Sources Referenced:</strong>
                    <ul>
                      <li v-for="source in selectedQueryFlow.ai_response.sources" :key="source">
                        {{ source }}
                      </li>
                    </ul>
                  </div>
                  <details v-if="selectedQueryFlow.ai_response" class="raw-response">
                    <summary>Raw Response Object</summary>
                    <pre>{{ JSON.stringify(selectedQueryFlow.ai_response, null, 2) }}</pre>
                  </details>
                </template>
                <template v-else>
                  {{ selectedQueryFlow.ai_response }}
                </template>
              </div>
            </div>

            <!-- Sources and Metadata -->
            <div class="flow-section">
              <h4>📊 Query Metadata</h4>
              <div class="flow-content metadata-grid">
                <div class="metadata-item">
                  <strong>Sources:</strong> {{ selectedQueryFlow.sources_count || 0 }}
                </div>
                <div class="metadata-item">
                  <strong>Confidence:</strong> {{ selectedQueryFlow.confidence?.toFixed(3) || 'N/A' }}
                </div>
                <div class="metadata-item">
                  <strong>Execution Time:</strong> {{ selectedQueryFlow.execution_time || 0 }}ms
                </div>
                <div class="metadata-item">
                  <strong>Tokens Used:</strong> {{ selectedQueryFlow.tokens_used?.toLocaleString() || 'N/A' }}
                </div>
                <div class="metadata-item">
                  <strong>Relevant:</strong> {{ selectedQueryFlow.relevant ? 'Yes' : 'No' }}
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="showFlowModal = false" class="btn btn-secondary">Close</button>
          </div>
        </div>
      </div>

      <!-- Bulk Delete Modal -->
      <div v-if="showBulkDeleteModal" class="modal-overlay" @click="showBulkDeleteModal = false">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>🗑️ Bulk Delete Queries</h3>
            <button @click="showBulkDeleteModal = false" class="modal-close">×</button>
          </div>
          <div class="modal-body">
            <p><strong>Warning:</strong> This action cannot be undone!</p>
            <div class="bulk-delete-options">
              <label>
                <input type="number" v-model.number="deleteOlderThanDays" min="1" max="365" />
                Delete queries older than <strong>{{ deleteOlderThanDays }}</strong> days
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="showBulkDeleteModal = false" class="btn btn-secondary">Cancel</button>
            <button 
              @click="bulkDeleteQueries" 
              class="btn btn-danger"
              :disabled="bulkDeleteInProgress"
            >
              {{ bulkDeleteInProgress ? 'Deleting...' : 'Delete Queries' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface QueryInfo {
  id: string
  question: string
  translated_question?: string
  detected_language?: string
  jurisdiction?: string
  ai_response?: string
  sources_count?: number
  confidence?: number
  execution_time?: number
  tokens_used?: number
  relevant?: boolean
  created_at: string
}

const loading = ref(true)
const queries = ref<QueryInfo[]>([])

// Filter state
const selectedQueryType = ref('all')
const hasTranslation = ref('')
const hasLlmResponse = ref('')
const startDate = ref('')
const endDate = ref('')

// Modal state
const showFlowModal = ref(false)
const selectedQueryFlow = ref<QueryInfo | null>(null)
const showBulkDeleteModal = ref(false)
const deleteOlderThanDays = ref(30)
const bulkDeleteInProgress = ref(false)

// Delete state
const deletingIds = ref<Set<string>>(new Set())

const loadQueries = async () => {
  try {
    loading.value = true
    
    let endpoint = '/api/admin/queries'
    const params = new URLSearchParams()
    
    if (selectedQueryType.value === 'business-intelligence') {
      endpoint = '/api/admin/queries/business-intelligence'
    } else if (selectedQueryType.value === 'all') {
      endpoint = '/api/admin/queries/all'
      params.append('limit', '100')
    }
    
    if (hasTranslation.value) params.append('has_translation', hasTranslation.value)
    if (hasLlmResponse.value) params.append('has_llm_response', hasLlmResponse.value)
    if (startDate.value) params.append('start_date', startDate.value)
    if (endDate.value) params.append('end_date', endDate.value)
    
    const url = params.toString() ? `${endpoint}?${params}` : endpoint
    const response = await fetch(url)
    queries.value = await response.json()
  } catch (error) {
    console.error('Error loading queries:', error)
  } finally {
    loading.value = false
  }
}

const clearFilters = () => {
  selectedQueryType.value = 'all'
  hasTranslation.value = ''
  hasLlmResponse.value = ''
  startDate.value = ''
  endDate.value = ''
  loadQueries()
}

const viewQueryFlow = async (queryId: string) => {
  try {
    const response = await fetch(`/api/admin/queries/${queryId}/flow`)
    if (response.ok) {
      selectedQueryFlow.value = await response.json()
      showFlowModal.value = true
    } else {
      alert('Failed to load query flow details')
    }
  } catch (error) {
    console.error('Error loading query flow:', error)
    alert('Error loading query flow details')
  }
}

const deleteQuery = async (queryId: string) => {
  if (!confirm('Are you sure you want to delete this query?')) {
    return
  }

  try {
    deletingIds.value.add(queryId)
    
    const response = await fetch(`/api/admin/queries/${queryId}`, {
      method: 'DELETE'
    })
    
    const result = await response.json()
    
    if (result.success) {
      queries.value = queries.value.filter(q => q.id !== queryId)
    } else {
      alert(`Failed to delete query: ${result.message}`)
    }
  } catch (error) {
    console.error('Error deleting query:', error)
    alert('Failed to delete query. Please try again.')
  } finally {
    deletingIds.value.delete(queryId)
  }
}

const bulkDeleteQueries = async () => {
  if (!confirm(`Are you sure you want to delete all queries older than ${deleteOlderThanDays.value} days? This cannot be undone.`)) {
    return
  }

  try {
    bulkDeleteInProgress.value = true
    
    const response = await fetch(`/api/admin/queries?older_than_days=${deleteOlderThanDays.value}`, {
      method: 'DELETE'
    })
    
    const result = await response.json()
    
    if (result.success) {
      showBulkDeleteModal.value = false
      alert(`Successfully deleted ${result.deleted} queries.`)
      loadQueries()
    } else {
      alert(`Failed to delete queries: ${result.message}`)
    }
  } catch (error) {
    console.error('Error bulk deleting queries:', error)
    alert('Failed to bulk delete queries. Please try again.')
  } finally {
    bulkDeleteInProgress.value = false
  }
}

const truncate = (text: string, length: number): string => {
  if (!text) return 'N/A'
  return text.length > length ? text.substring(0, length) + '...' : text
}

const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

const getConfidenceClass = (confidence: number): string => {
  if (!confidence) return ''
  if (confidence >= 0.8) return 'confidence-high'
  if (confidence >= 0.6) return 'confidence-medium'
  return 'confidence-low'
}

onMounted(() => {
  loadQueries()
})
</script>

<style scoped>
.queries h1 {
  margin-bottom: 2rem;
  color: #2c5aa0;
}

.filters-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 1rem;
}

.filter-select, .filter-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.filter-input {
  max-width: 150px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.bulk-actions {
  display: flex;
  gap: 0.5rem;
}

.question-cell, .translation-cell {
  max-width: 200px;
}

.question-text {
  word-wrap: break-word;
  cursor: help;
}

.translation-indicator {
  background: #3498db;
  color: white;
  padding: 0.2rem 0.4rem;
  border-radius: 12px;
  font-size: 0.7rem;
  cursor: help;
  display: inline-block;
}

.no-translation {
  color: #bdc3c7;
  font-style: italic;
}

.confidence-high {
  color: #27ae60;
  font-weight: bold;
}

.confidence-medium {
  color: #f39c12;
  font-weight: bold;
}

.confidence-low {
  color: #e74c3c;
  font-weight: bold;
}

.relevant-yes {
  color: #27ae60;
  font-weight: bold;
}

.relevant-no {
  color: #e74c3c;
  font-weight: bold;
}

.actions-cell {
  white-space: nowrap;
}

.actions-cell .btn {
  margin-right: 0.25rem;
}

.btn-sm {
  padding: 0.2rem 0.4rem;
  font-size: 0.75rem;
}

.btn-primary {
  background-color: #3498db;
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-danger {
  background-color: #e74c3c;
  color: white;
  border: none;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c0392b;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.query-flow-modal {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  color: #2c5aa0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.flow-section {
  margin-bottom: 2rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.flow-section h4 {
  background: #f8fafc;
  margin: 0;
  padding: 1rem;
  color: #2c5aa0;
  border-bottom: 1px solid #e2e8f0;
}

.flow-content {
  padding: 1rem;
}

.llm-response {
  background: #f9f9f9;
  border-left: 4px solid #3498db;
  max-height: 400px;
  overflow-y: auto;
  font-size: 0.9rem;
  line-height: 1.4;
}

.llm-response strong {
  color: #2c5aa0;
  display: block;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.llm-response strong:first-child {
  margin-top: 0;
}

.llm-response .tokens-info {
  font-size: 0.85rem;
  color: #666;
  padding: 0.5rem;
  background: #f0f0f0;
  border-radius: 4px;
  margin: 0.5rem 0;
}

.llm-response ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.raw-response {
  margin-top: 1rem;
}

.raw-response summary {
  cursor: pointer;
  color: #666;
  font-size: 0.85rem;
}

.raw-response pre {
  background: #f0f0f0;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  overflow-x: auto;
}

.metadata-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
}

.metadata-item {
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 4px;
  font-size: 0.9rem;
}

.bulk-delete-options {
  padding: 1rem 0;
}

.bulk-delete-options label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.bulk-delete-options input {
  width: 80px;
  padding: 0.25rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>