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

      <!-- Non-intrusive Clarification Suggestions -->
      <div v-if="clarificationSuggestions && clarificationSuggestions.needs_clarification" class="suggestion-card">
        <div class="suggestion-header">
          <span class="suggestion-icon">💡</span>
          <span class="suggestion-title">Get more specific results</span>
        </div>
        <p class="suggestion-reason">{{ clarificationSuggestions.reason }}</p>
        <div v-if="clarificationSuggestions.questions && clarificationSuggestions.questions.length > 0" class="suggestion-questions">
          <div class="suggestion-question-list">
            <span v-for="(question, index) in clarificationSuggestions.questions" 
                  :key="question" 
                  class="suggestion-question"
                  @click="addToQuery(question)">
              {{ question }}
            </span>
          </div>
        </div>
      </div>

      <!-- Compact Progress Indicator -->
      <div v-if="loading" class="compact-progress">
        <div class="progress-content">
          <div class="progress-spinner">🔍</div>
          <div class="progress-text">
            <span class="progress-step">{{ currentStep || 'Processing...' }}</span>
            <div class="progress-stats">
              {{ progressSteps.filter(s => s.completed).length }}/{{ progressSteps.length }}
              <span v-if="canCancelQuery" class="cancel-option" @click="cancelAndResubmit">
                Cancel & resubmit
              </span>
            </div>
          </div>
        </div>
        <div class="compact-progress-bar">
          <div 
            class="compact-progress-fill" 
            :style="{ width: `${(progressSteps.filter(s => s.completed).length / progressSteps.length) * 100}%` }"
          ></div>
        </div>
      </div>

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

    <!-- Old clarification dialog removed - now using inline suggestions -->

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
      contact_phone?: string
      contact_email?: string
      contact_type?: string
      contact_chatbot?: string
      contact_website?: string
      contact_hours?: string
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

// Progress tracking state
const progressSteps = ref<Array<{step: string, message: string, completed: boolean, timestamp?: number}>>([])
const currentStep = ref('')
const queryId = ref('')

// Real-time suggestion state (replaces blocking clarification)
const clarificationSuggestions = ref<{
  needs_clarification: boolean
  questions: string[]
  reason: string
  suggested_details: string[]
} | null>(null)

// Query management
const currentQueryId = ref('')
const canCancelQuery = ref(false)

// Location detection state
const autoDetectedLocation = ref('')
const locationDetected = ref(false)

// Locale detection state
const userLocale = ref('')
const detectedLanguage = ref('')

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
 * Initialize progress tracking for a new query
 */
const initializeProgress = () => {
  progressSteps.value = [
    { step: 'query_received', message: 'Processing your question...', completed: false },
    { step: 'language_detection', message: 'Detecting language...', completed: false },
    { step: 'relevance_check', message: 'Checking question relevance...', completed: false },
    { step: 'location_extraction', message: 'Identifying location...', completed: false },
    { step: 'clarification_check', message: 'Analyzing question clarity...', completed: false },
    { step: 'document_search', message: 'Searching legal documents...', completed: false },
    { step: 'ai_analysis', message: 'Analyzing legal requirements...', completed: false },
    { step: 'response_generation', message: 'Generating response...', completed: false }
  ]
  currentStep.value = ''
}

/**
 * Handle progress events from WebSocket
 */
const handleProgressEvent = (event: QueryEvent) => {
  const eventTypeMap: Record<string, string> = {
    'query_received': 'query_received',
    'language_detection': 'language_detection', 
    'relevance_check_complete': 'relevance_check',
    'location_extraction_complete': 'location_extraction',
    'location_parsed': 'location_extraction',
    'clarification_check_complete': 'clarification_check',
    'clarification_bypassed': 'clarification_check',
    'document_search_init': 'document_search',
    'document_search': 'document_search',
    'llm_analysis_complete': 'document_search',
    'ai_response_start': 'ai_analysis',
    'ai_analysis_complete': 'ai_analysis',
    'response_translation_start': 'response_generation',
    'query_completed': 'response_generation'
  }
  
  const progressStep = eventTypeMap[event.type]
  if (progressStep) {
    const step = progressSteps.value.find(s => s.step === progressStep)
    if (step && !step.completed) {
      step.completed = true
      step.timestamp = event.timestamp
      currentStep.value = step.message
    }
    
    // Update current step message based on event
    if (event.type === 'document_search' || event.type === 'document_ingestion') {
      currentStep.value = event.message || 'Searching legal documents...'
    } else if (event.type === 'ai_response_start') {
      currentStep.value = 'Analyzing legal requirements...'
    } else if (event.type === 'llm_analysis_start') {
      currentStep.value = 'Discovering relevant documents...'
    }
  }
}

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
      link: action.link,
      contact_phone: action.contact_phone,
      contact_email: action.contact_email,
      contact_type: action.contact_type,
      contact_chatbot: action.contact_chatbot,
      contact_website: action.contact_website,
      contact_hours: action.contact_hours
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
 * Detect user's browser locale and preferred language
 */
const detectUserLocale = () => {
  try {
    // Get browser language preference
    const browserLang = navigator.language || navigator.languages?.[0] || 'en-US'
    userLocale.value = browserLang
    
    // Extract primary language code (e.g., 'zh' from 'zh-CN', 'en' from 'en-US')
    const primaryLang = browserLang.split('-')[0].toLowerCase()
    detectedLanguage.value = primaryLang
    
    // Map languages to their full names for display (comprehensive list)
    const languageNames: Record<string, string> = {
      // Major world languages
      'en': 'English',
      'zh': '中文', 
      'es': 'Español',
      'ar': 'العربية',
      'hi': 'हिन्दी',
      'fr': 'Français',
      'de': 'Deutsch',
      'ja': '日本語',
      'ko': '한국어',
      'it': 'Italiano',
      'pt': 'Português',
      'ru': 'Русский',
      'nl': 'Nederlands',
      'sv': 'Svenska',
      'no': 'Norsk',
      'da': 'Dansk',
      'fi': 'Suomi',
      'pl': 'Polski',
      'tr': 'Türkçe',
      'he': 'עברית',
      'fa': 'فارسی',
      'ur': 'اردو',
      
      // South and Southeast Asian languages
      'vi': 'Tiếng Việt',
      'th': 'ไทย',
      'id': 'Bahasa Indonesia',
      'ms': 'Bahasa Melayu',
      'tl': 'Filipino',
      'ta': 'தமிழ்',
      'te': 'తెలుగు',
      'bn': 'বাংলা',
      'pa': 'ਪੰਜਾਬੀ',
      'gu': 'ગુજરાતી',
      'ml': 'മലയാളം',
      'kn': 'ಕನ್ನಡ',
      'or': 'ଓଡ଼ିଆ',
      'si': 'සිංහල',
      'my': 'မြန်မာ',
      'km': 'ខ្មែរ',
      'lo': 'ລາວ',
      'ne': 'नेपाली',
      
      // East Asian languages  
      'mn': 'Монгол',
      'bo': 'བོད་ཡིག',
      'ug': 'ئۇيغۇرچە',
      
      // European languages
      'uk': 'Українська',
      'cs': 'Čeština',
      'sk': 'Slovenčina',
      'hu': 'Magyar',
      'ro': 'Română',
      'bg': 'Български',
      'hr': 'Hrvatski',
      'sr': 'Српски',
      'bs': 'Bosanski',
      'mk': 'Македонски',
      'sq': 'Shqip',
      'sl': 'Slovenščina',
      'lv': 'Latviešu',
      'lt': 'Lietuvių',
      'et': 'Eesti',
      'is': 'Íslenska',
      'mt': 'Malti',
      'ga': 'Gaeilge',
      'cy': 'Cymraeg',
      'eu': 'Euskera',
      'ca': 'Català',
      'gl': 'Galego',
      
      // African languages
      'sw': 'Kiswahili',
      'am': 'አማርኛ',
      'ha': 'Hausa',
      'yo': 'Yorùbá',
      'ig': 'Igbo',
      'zu': 'isiZulu',
      'af': 'Afrikaans',
      'xh': 'isiXhosa',
      'st': 'Sesotho',
      'tn': 'Setswana',
      'ss': 'siSwati',
      'ts': 'Xitsonga',
      've': 'Tshivenda',
      'nr': 'isiNdebele',
      
      // Americas
      'qu': 'Runasimi', // Quechua
      'gn': 'Avañe\'ẽ', // Guarani
      'ay': 'Aymar aru', // Aymara
      'nah': 'Nāhuatlahtolli', // Nahuatl
      
      // Pacific
      'mi': 'Te Reo Māori',
      'haw': 'ʻŌlelo Hawaiʻi',
      'sm': 'Gagana Samoa',
      'to': 'Lea faka-Tonga',
      'fj': 'Na vosa vaka-Viti',
      
      // Other significant languages
      'eo': 'Esperanto',
      'la': 'Latina',
      'sa': 'संस्कृतम्',
      'gd': 'Gàidhlig',
      'br': 'Brezhoneg',
      'kw': 'Kernowek',
      'fo': 'Føroyskt',
      'rm': 'Rumantsch',
      'lb': 'Lëtzebuergesch'
    }
    
    console.log(`🌐 Detected locale: ${browserLang} (${languageNames[primaryLang] || primaryLang})`)
    
  } catch (error) {
    console.warn('Failed to detect locale:', error)
    // Default to English
    userLocale.value = 'en-US'
    detectedLanguage.value = 'en'
  }
}

/**
 * Add question suggestion to current query
 */
const addToQuery = (suggestion: string) => {
  if (formData.value.query.includes(suggestion)) return
  
  // Add the suggestion as additional context
  const currentQuery = formData.value.query.trim()
  formData.value.query = `${currentQuery} ${suggestion}`.trim()
}

/**
 * Cancel current query and submit improved version
 */
const cancelAndResubmit = async () => {
  if (!currentQueryId.value) return
  
  try {
    // Cancel the current query
    await apiClient.cancelQuery(currentQueryId.value)
    
    // Clear current state
    clarificationSuggestions.value = null
    canCancelQuery.value = false
    
    // Submit the improved query
    performSearch(formData.value)
  } catch (error) {
    console.error('Failed to cancel query:', error)
    // If cancellation fails, just proceed with new query anyway
    performSearch(formData.value)
  }
}

/**
 * Dismiss suggestions and continue with current processing
 */
const dismissSuggestions = () => {
  clarificationSuggestions.value = null
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
  clarificationSuggestions.value = null
  
  // Initialize progress tracking
  initializeProgress()
  
  try {
    // Use detected location if address field is empty
    const finalAddress = data.address || autoDetectedLocation.value
    
    const response = await apiClient.askLegalQuestion({
      question: data.query,
      userLocale: userLocale.value || 'en-AU',
      context: {
        location: finalAddress || undefined
      },
      onEvent: (event) => {
        currentQueryId.value = event.queryId
        canCancelQuery.value = true
        handleProgressEvent(event)
        
        // Handle real-time clarification suggestions
        if (event.type === 'clarification_suggestions_ready' && event.data?.suggestions) {
          clarificationSuggestions.value = {
            needs_clarification: true,
            questions: event.data.suggestions,
            reason: event.data.reason || '',
            suggested_details: event.data.suggested_details || []
          }
        }
      }
    })
    
    if (response.success) {
      // Convert the new API response format to the old format for compatibility
      result.value = convertToTriageResponse(response, data.query, finalAddress)
      
      // Show suggestions if they weren't already shown during processing
      if (response.clarification_suggestions?.needs_clarification && !clarificationSuggestions.value) {
        clarificationSuggestions.value = response.clarification_suggestions
      }
    } else {
      error.value = response.error || 'Failed to get legal guidance'
    }
  } catch (err: any) {
    console.error('Search error:', err)
    error.value = err.message || 'Failed to connect to the server'
  } finally {
    loading.value = false
    canCancelQuery.value = false
  }
}

/**
 * Perform search without clarification check (for when user dismisses clarification)
 * 🚨 CRITICAL: This function MUST use bypassClarification: true to prevent infinite clarification loops!
 * 🚨 DO NOT REMOVE THE bypassClarification FLAG - it prevents the same clarification popup from appearing repeatedly
 * 🚨 This is the solution to prevent clarification popups showing again and again
 */
const performSearchWithoutClarification = async (data: { query: string; address: string }) => {
  if (!data.query.trim()) return
  
  loading.value = true
  error.value = ''
  result.value = null
  showClarification.value = false
  
  // Initialize progress tracking
  initializeProgress()
  
  try {
    // Use detected location if address field is empty
    const finalAddress = data.address || autoDetectedLocation.value
    
    // 🚨 CRITICAL: bypassClarification: true prevents repeated clarification popups!
    const response = await apiClient.askLegalQuestion({
      question: data.query,
      userLocale: userLocale.value || 'en-AU',
      context: {
        location: finalAddress || undefined
      },
      bypassClarification: true, // 🚨 THIS IS ESSENTIAL - DO NOT REMOVE!
      onEvent: (event) => {
        queryId.value = event.queryId
        handleProgressEvent(event)
      }
    })
    
    if (response.success) {
      if (response.answer) {
        // Convert response and show results
        result.value = convertToTriageResponse(response, data.query, finalAddress)
      } else {
        error.value = 'No answer received from the service'
      }
    } else {
      error.value = response.error || 'An error occurred while processing your request'
    }
    
  } catch (err) {
    console.error('Search error:', err)
    error.value = `Network error: ${err instanceof Error ? err.message : 'Unknown error'}`
  } finally {
    loading.value = false
    // Mark all progress steps as completed
    progressSteps.value.forEach(step => { step.completed = true })
    currentStep.value = 'Complete'
  }
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

// Auto-detect location and locale when component mounts
onMounted(() => {
  detectUserLocale()
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

/* Progress Indicator Styles */
.progress-indicator {
  margin: 2rem 0;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.progress-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.progress-header h3 {
  margin: 0;
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
}

.current-step {
  margin: 0.5rem 0 0 0;
  color: #059669;
  font-weight: 500;
  font-size: 0.95rem;
  animation: pulse 2s infinite;
}

.progress-steps {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.progress-step {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  transition: all 0.3s ease;
  opacity: 0.6;
}

.progress-step.completed {
  opacity: 1;
  background: #f0fdf4;
  border-left: 4px solid #059669;
}

.progress-step.active {
  opacity: 1;
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
}

.step-indicator {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.875rem;
}

.step-number {
  background: #e2e8f0;
  color: #64748b;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.step-checkmark {
  background: #059669;
  color: white;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.step-content {
  flex: 1;
}

.step-message {
  color: #374151;
  font-weight: 500;
  font-size: 0.9rem;
}

.step-time {
  color: #6b7280;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.progress-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #059669, #34d399);
  border-radius: 3px;
  transition: width 0.5s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  animation: shimmer 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Responsive Progress Indicator */
@media (max-width: 768px) {
  .progress-indicator {
    margin: 1rem 0;
    padding: 1rem;
  }
  
  .progress-header h3 {
    font-size: 1.1rem;
  }
  
  .progress-steps {
    gap: 0.5rem;
  }
  
  .progress-step {
    padding: 0.5rem;
  }
  
  .step-indicator {
    width: 1.5rem;
    height: 1.5rem;
  }
  
  .step-message {
    font-size: 0.85rem;
  }
}

/* Compact Progress Styles */
.compact-progress {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1rem;
  margin: 1rem 0;
}

.progress-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.progress-spinner {
  font-size: 1.25rem;
  animation: pulse 2s infinite;
}

.progress-text {
  flex: 1;
}

.progress-step {
  display: block;
  font-weight: 500;
  color: #1e293b;
  font-size: 0.95rem;
}

.progress-stats {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.cancel-option {
  color: #dc2626;
  cursor: pointer;
  text-decoration: underline;
  font-weight: 500;
}

.cancel-option:hover {
  color: #991b1b;
}

.compact-progress-bar {
  width: 100%;
  height: 0.25rem;
  background: #e2e8f0;
  border-radius: 0.125rem;
  overflow: hidden;
}

.compact-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #059669, #10b981);
  border-radius: 0.125rem;
  transition: width 0.3s ease;
}

/* Suggestion Card Styles */
.suggestion-card {
  background: #fffbeb;
  border: 1px solid #fbbf24;
  border-radius: 0.75rem;
  padding: 1rem;
  margin: 1rem 0;
}

.suggestion-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.suggestion-icon {
  font-size: 1.125rem;
}

.suggestion-title {
  font-weight: 600;
  color: #92400e;
}

.suggestion-reason {
  color: #78350f;
  font-size: 0.875rem;
  margin: 0 0 0.75rem 0;
}

.suggestion-question-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.suggestion-question {
  background: white;
  border: 1px solid #fbbf24;
  color: #92400e;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-question:hover {
  background: #fef3c7;
  transform: translateY(-1px);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@media (max-width: 640px) {
  .compact-progress {
    padding: 0.75rem;
  }
  
  .progress-content {
    gap: 0.75rem;
  }
  
  .progress-stats {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .suggestion-card {
    padding: 0.75rem;
  }
  
  .suggestion-question-list {
    gap: 0.375rem;
  }
}
</style>