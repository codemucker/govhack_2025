<template>
  <div class="search">
    <div class="search-header">
      <h1>Search Regulatory Requirements</h1>
      <p class="search-subtitle">
        Discover the permits, licences, and regulations that apply to your situation across all levels of Australian government
      </p>
      
      <!-- Search Mode Toggle -->
      <div class="search-mode-toggle">
        <label class="mode-option" :class="{ active: !wizardMode }">
          <input
            type="radio"
            :value="false"
            v-model="wizardMode"
            name="search-mode"
            class="mode-radio"
          />
          <span class="mode-icon">🔍</span>
          <span class="mode-text">Quick Search</span>
        </label>
        
        <label class="mode-option" :class="{ active: wizardMode }">
          <input
            type="radio"
            :value="true"
            v-model="wizardMode"
            name="search-mode"
            class="mode-radio"
          />
          <span class="mode-icon">🧭</span>
          <span class="mode-text">Guided Wizard</span>
        </label>
      </div>
    </div>

    <!-- Quick Search Mode -->
    <div v-if="!wizardMode" class="quick-search-mode">
      <SearchForm 
        v-model="formData" 
        :is-loading="loading"
        @submit="performSearch" 
      />

      <SearchResults 
        v-if="result" 
        :result="result"
        @export-results="handleExportResults"
      />

      <div v-if="error" class="error">
        <div class="error-icon">❌</div>
        <div class="error-content">
          <h3>Search Error</h3>
          <p>{{ error }}</p>
          <button @click="clearError" class="btn btn-secondary">
            Try Again
          </button>
        </div>
      </div>
    </div>

    <!-- Wizard Mode -->
    <div v-else class="wizard-mode">
      <SearchWizard
        @wizard-complete="handleWizardComplete"
        @wizard-cancelled="handleWizardCancelled"
      />
    </div>

    <!-- Clarification Dialog -->
    <div v-if="showClarification" class="clarification-overlay">
      <div class="clarification-dialog">
        <div class="clarification-header">
          <h3>Need More Details</h3>
          <p class="clarification-reason">{{ clarificationReason }}</p>
        </div>
        
        <div class="clarification-content">
          <div v-if="clarificationQuestions.length > 0" class="clarification-questions">
            <h4>Please provide more information:</h4>
            <ul>
              <li v-for="question in clarificationQuestions" :key="question">
                {{ question }}
              </li>
            </ul>
          </div>
          
          <div v-if="suggestedDetails.length > 0" class="suggested-details">
            <h4>Helpful details to include:</h4>
            <div class="detail-tags">
              <span v-for="detail in suggestedDetails" :key="detail" class="detail-tag">
                {{ detail }}
              </span>
            </div>
          </div>
          
          <div class="clarification-input">
            <label for="updated-query">Updated question with more details:</label>
            <textarea 
              id="updated-query"
              v-model="formData.query"
              rows="4"
              placeholder="Please provide the additional details mentioned above..."
              class="clarification-textarea"
            ></textarea>
          </div>
        </div>
        
        <div class="clarification-actions">
          <button 
            @click="handleClarificationResponse(formData.query)" 
            class="btn btn-primary"
            :disabled="!formData.query.trim()"
          >
            Search with Details
          </button>
          <button @click="dismissClarification" class="btn btn-secondary">
            Continue Anyway
          </button>
        </div>
      </div>
    </div>

    <!-- Export Dialog -->
    <ExportDialog
      :is-open="exportDialogOpen"
      :search-data="exportData.searchQuery"
      :results="exportData.results"
      @close="closeExportDialog"
      @export-complete="handleExportComplete"
      @export-error="handleExportError"
    />

    <!-- Print View (hidden, used for printing) -->
    <div class="print-view-container" style="display: none;">
      <PrintView
        v-if="printData"
        :search-data="printData.searchQuery"
        :results="printData.results"
        ref="printViewRef"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SearchForm from '../components/SearchForm.vue'
import SearchResults from '../components/SearchResults.vue'
import SearchWizard from '../components/SearchWizard.vue'
import ExportDialog from '../components/ExportDialog.vue'
import PrintView from '../components/PrintView.vue'
import { apiClient } from '../api/client'
import type { AskQuestionResponse } from '../api/client'
import type { ExportData } from '../composables/useExport'

// Type mapping for compatibility with existing Search components
type TriageResponse = {
  query: {
    raw: string
    location?: {
      address: string
      council?: string
      state?: string
    }
    assumptions: string[]
  }
  jurisdictions: Array<{
    name: string
    level: 'local' | 'state' | 'federal'
    confidence: number
  }>
  requirements: Array<{
    title: string
    authority: string
    actions: Array<{
      step: number
      desc: string
      link?: string
    }>
    notes: string[]
  }>
  contacts: Array<{
    authority: string
    type: string
    phone?: string
    email?: string
    chatbot?: string
    url: string
  }>
  disclaimer: string
}

// Search mode
const wizardMode = ref(false)

// Search state
const formData = ref({
  query: '',
  address: ''
})

const loading = ref(false)
const result = ref<TriageResponse | null>(null)
const error = ref('')

// Clarification state
const showClarification = ref(false)
const clarificationQuestions = ref<string[]>([])
const clarificationReason = ref('')
const suggestedDetails = ref<string[]>([])

// Location detection state
const autoDetectedLocation = ref('')
const locationDetected = ref(false)

// Export state
const exportDialogOpen = ref(false)
const exportData = ref<ExportData>({
  searchQuery: {
    query: '',
    address: '',
    businessType: '',
    timestamp: Date.now()
  },
  results: {
    requirements: [],
    conflicts: [],
    recommendations: []
  },
  metadata: {
    exportedAt: Date.now(),
    exportedBy: 'LegalEase User',
    version: '1.0'
  }
})

// Print state
const printData = ref<ExportData | null>(null)
const printViewRef = ref()


/**
 * Convert AskQuestionResponse to TriageResponse format for compatibility
 */
function convertToTriageResponse(response: AskQuestionResponse, originalQuery: string, originalAddress?: string): TriageResponse {
  // Extract assumptions from the response metadata
  const assumptions = [
    'Using real-time Australian legal document analysis',
    'Based on current regulatory requirements from government sources',
    `Analysis confidence: ${Math.round((response.confidence || 0) * 100)}%`
  ]
  
  // Create jurisdiction info from sources
  const jurisdictions = response.sources?.map(source => ({
    name: source.jurisdiction,
    level: source.jurisdiction_level === 'commonwealth' ? 'federal' as const : 
           source.jurisdiction_level === 'state' ? 'state' as const : 'local' as const,
    confidence: (source.total_score || 50) / 100
  })) || []

  // Use structured data from backend instead of parsing answer text
  const requirements = (response.structured_data || []).map(req => ({
    title: req.title || 'Requirement',
    authority: req.authority || 'Government Authority',
    actions: req.actions?.map(action => ({
      step: action.step,
      desc: action.desc || action.text || '',
      link: action.link
    })) || [],
    notes: req.notes || []
  }))

  // Extract contacts from regulatory authority links
  const contacts = response.deep_links?.filter(link => 
    link.type === 'regulatory_authority'
  ).map(link => ({
    authority: link.authority || link.jurisdiction || 'Government Authority',
    type: link.contact_type || 'General',
    phone: link.phone,
    email: link.email,
    chatbot: link.chatbot,
    url: link.url
  })) || []

  // Add generic contacts if none found
  if (contacts.length === 0) {
    contacts.push({
      authority: 'Local Council',
      type: 'General Enquiries',
      phone: undefined,
      email: undefined,
      chatbot: undefined,
      url: response.deep_links?.find(l => l.type === 'regulatory_authority')?.url || '#'
    })
  }

  return {
    query: {
      raw: originalQuery,
      location: originalAddress ? {
        address: originalAddress,
        council: response.sources?.find(s => s.jurisdiction_level === 'local')?.jurisdiction,
        state: response.sources?.find(s => s.jurisdiction_level === 'state')?.jurisdiction
      } : undefined,
      assumptions
    },
    jurisdictions,
    requirements,
    contacts,
    disclaimer: response.answer?.includes('⚠️ IMPORTANT:') ? 
      response.answer.split('⚠️ IMPORTANT:')[1]?.trim() || "This information should not be considered legal advice." :
      "This information is generated from real-time analysis of Australian legal documents and should not be considered legal advice. Always verify current requirements with the relevant authorities."
  }
}

/**
 * Auto-detect user location on component mount
 */
const detectUserLocation = async () => {
  try {
    const locationResponse = await apiClient.detectLocation()
    if (locationResponse.success && locationResponse.location.detected) {
      autoDetectedLocation.value = `${locationResponse.location.city}, ${locationResponse.location.state}`
      locationDetected.value = true
      
      // Pre-fill address field if not already filled
      if (!formData.value.address) {
        formData.value.address = autoDetectedLocation.value
      }
    }
  } catch (error) {
    console.warn('Failed to detect location:', error)
  }
}

/**
 * Handle clarification response - user provides more details
 */
const handleClarificationResponse = (updatedQuery: string) => {
  formData.value.query = updatedQuery
  showClarification.value = false
  performSearch(formData.value)
}

/**
 * Dismiss clarification dialog and proceed with original query
 */
const dismissClarification = () => {
  showClarification.value = false
  // Force search without clarification check by setting a flag
  performSearchWithoutClarification(formData.value)
}

/**
 * Perform search with form data using the new API client
 * @param data - Form data containing query and address
 */
const performSearch = async (data: { query: string; address: string }) => {
  if (!data.query.trim()) return
  
  loading.value = true
  error.value = ''
  result.value = null
  showClarification.value = false
  
  try {
    // Use detected location if address field is empty
    const finalAddress = data.address || autoDetectedLocation.value
    
    const response = await apiClient.askLegalQuestion({
      question: data.query,
      userLocale: 'en-AU',
      context: {
        location: finalAddress || undefined
      }
    })
    
    if (response.success) {
      // Check if clarification is needed
      if (response.needs_clarification) {
        showClarification.value = true
        clarificationQuestions.value = response.clarification_questions || []
        clarificationReason.value = response.reason || ''
        suggestedDetails.value = response.suggested_details || []
      } else if (response.answer) {
        // Convert the new API response format to the old format for compatibility
        result.value = convertToTriageResponse(response, data.query, finalAddress)
      }
    } else {
      error.value = response.error || 'Failed to get legal guidance'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An unknown error occurred'
  } finally {
    loading.value = false
  }
}

/**
 * Perform search without clarification check (for when user dismisses clarification)
 */
const performSearchWithoutClarification = async (data: { query: string; address: string }) => {
  // Implementation would include a flag to bypass clarification
  // For now, we'll just call regular search
  await performSearch(data)
}

/**
 * Handle wizard completion
 */
const handleWizardComplete = async (wizardData: any) => {
  // Convert wizard data to search query and perform search
  const searchQuery = {
    query: wizardData.searchData.query || `${wizardData.searchData.businessType} business at ${wizardData.searchData.address}`,
    address: wizardData.searchData.address || ''
  }
  
  await performSearch(searchQuery)
  
  // Switch back to quick search mode to show results
  wizardMode.value = false
}

/**
 * Handle wizard cancellation
 */
const handleWizardCancelled = () => {
  wizardMode.value = false
}

/**
 * Handle export results request
 */
const handleExportResults = () => {
  if (!result.value) return
  
  // Convert search result to export data format
  exportData.value = {
    searchQuery: {
      query: formData.value.query,
      address: formData.value.address,
      businessType: result.value.businessContext?.type || '',
      timestamp: Date.now()
    },
    results: {
      requirements: result.value.requirements.map(req => ({
        title: req.title,
        authority: req.authority,
        jurisdiction: req.jurisdiction,
        status: req.status || 'Required',
        description: req.description,
        estimatedTime: req.estimatedTime || 'Contact authority',
        estimatedCost: req.estimatedCost || 'Contact authority'
      })),
      conflicts: result.value.conflicts?.map(conflict => ({
        title: conflict.title,
        description: conflict.description,
        severity: conflict.severity as 'low' | 'medium' | 'high'
      })) || [],
      recommendations: result.value.recommendations?.map((rec, index) => ({
        title: rec.title || `Recommendation ${index + 1}`,
        description: rec.description,
        priority: rec.priority || index + 1
      })) || []
    },
    metadata: {
      exportedAt: Date.now(),
      exportedBy: 'LegalEase User',
      version: '1.0'
    }
  }
  
  exportDialogOpen.value = true
}

/**
 * Close export dialog
 */
const closeExportDialog = () => {
  exportDialogOpen.value = false
}

/**
 * Handle export completion
 */
const handleExportComplete = (filename: string, format: string) => {
  console.log(`Export completed: ${filename} (${format})`)
  // Could show a success toast here
}

/**
 * Handle export error
 */
const handleExportError = (error: string) => {
  console.error('Export error:', error)
  // Could show an error toast here
}

/**
 * Clear error state and allow retry
 */
const clearError = () => {
  error.value = ''
}

// Auto-detect location when component mounts
onMounted(() => {
  detectUserLocation()
})
</script>

<style scoped>
.search {
  padding: 2rem 1rem;
  min-height: 100vh;
}

.search-header {
  text-align: center;
  margin-bottom: 3rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.search-header h1 {
  color: #1f2937;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.search-subtitle {
  color: #6b7280;
  font-size: 1.125rem;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto 2rem auto;
}

/* Search Mode Toggle */
.search-mode-toggle {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border: 2px solid var(--border-color, #e5e7eb);
  border-radius: 0.75rem;
  background: var(--bg-secondary, #f9fafb);
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-secondary, #6b7280);
}

.mode-option:hover {
  border-color: var(--primary-color, #059669);
  background: var(--hover-bg, #f3f4f6);
  color: var(--text-primary, #1f2937);
}

.mode-option.active {
  border-color: var(--primary-color, #059669);
  background: var(--active-bg, #f0fdf4);
  color: var(--primary-color, #059669);
}

.mode-radio {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.mode-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.mode-text {
  font-weight: 500;
  font-size: 0.9375rem;
}

/* Mode Content */
.quick-search-mode,
.wizard-mode {
  margin-top: 2rem;
}

.error {
  background: #fee2e2;
  border: 1px solid #ef4444;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 2rem auto;
  max-width: 600px;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.error-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.error-content {
  flex: 1;
}

.error-content h3 {
  color: #dc2626;
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
}

.error-content p {
  color: #dc2626;
  margin: 0 0 1rem 0;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f9fafb;
}

@media (max-width: 768px) {
  .search {
    padding: 1rem 0.5rem;
  }
  
  .search-header h1 {
    font-size: 2rem;
  }
  
  .search-subtitle {
    font-size: 1rem;
  }
  
  .error {
    margin: 1rem;
    padding: 1rem;
  }
  
  .error-content h3 {
    font-size: 1rem;
  }
}

/* Clarification Dialog Styles */
.clarification-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.clarification-dialog {
  background: white;
  border-radius: 1rem;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.clarification-header {
  padding: 2rem 2rem 1rem 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.clarification-header h3 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
}

.clarification-reason {
  margin: 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.clarification-content {
  padding: 1.5rem 2rem;
}

.clarification-questions {
  margin-bottom: 1.5rem;
}

.clarification-questions h4 {
  margin: 0 0 0.75rem 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 500;
}

.clarification-questions ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #4b5563;
}

.clarification-questions li {
  margin-bottom: 0.5rem;
}

.suggested-details {
  margin-bottom: 1.5rem;
}

.suggested-details h4 {
  margin: 0 0 0.75rem 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 500;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.detail-tag {
  background: #f3f4f6;
  color: #374151;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  border: 1px solid #d1d5db;
}

.clarification-input {
  margin-top: 1.5rem;
}

.clarification-input label {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-weight: 500;
  font-size: 0.95rem;
}

.clarification-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 0.95rem;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.2s;
}

.clarification-textarea:focus {
  outline: none;
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
}

.clarification-actions {
  padding: 1.5rem 2rem 2rem 2rem;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  border-top: 1px solid #e5e7eb;
}

.clarification-actions .btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.clarification-actions .btn-primary {
  background: #059669;
  color: white;
}

.clarification-actions .btn-primary:hover:not(:disabled) {
  background: #047857;
}

.clarification-actions .btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clarification-actions .btn-secondary {
  background: #f9fafb;
  color: #374151;
  border: 1px solid #d1d5db;
}

.clarification-actions .btn-secondary:hover {
  background: #f3f4f6;
}

@media (max-width: 640px) {
  .clarification-dialog {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
  }
  
  .clarification-header,
  .clarification-content,
  .clarification-actions {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  
  .clarification-actions {
    flex-direction: column;
  }
  
  .detail-tags {
    justify-content: center;
  }
}
</style>