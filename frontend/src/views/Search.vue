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
import { ref } from 'vue'
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
 * Parse the answer text to extract structured requirements
 */
function parseRequirementsFromAnswer(answerText: string, deepLinks: any[] = []): any[] {
  const requirements: any[] = []
  
  // Split answer into numbered sections (1. Business Registration, 2. Food Business License, etc.)
  const numberedSections = answerText.split(/\d+\.\s+\*\*([^*]+)\*\*:?\s*/g)
  
  // Process each section (skip first empty split result)
  for (let i = 1; i < numberedSections.length; i += 2) {
    const title = numberedSections[i].trim()
    const content = numberedSections[i + 1]?.trim() || ''
    
    if (!title || !content) continue
    
    // Extract authority from the content (look for organizations)
    let authority = 'Government Authority'
    const authorityMatches = content.match(/(?:through|with|from|by)\s+([A-Z][^.]*?(?:Council|Health|ASIC|Commission|Authority|Department|Government)[^.]*?)(?:\.|,|$)/i)
    if (authorityMatches) {
      authority = authorityMatches[1].trim().replace(/\([^)]*\)/g, '').trim()
    } else if (title.toLowerCase().includes('council')) {
      authority = 'Local Council'
    } else if (title.toLowerCase().includes('food') || title.toLowerCase().includes('health')) {
      authority = 'Queensland Health'
    } else if (title.toLowerCase().includes('business registration')) {
      authority = 'ASIC'
    }

    // Extract actionable steps from the content
    const actions: any[] = []
    let stepNumber = 1

    // Look for sub-bullets or dash points
    const bulletPoints = content.split(/[-•]\s+/).filter(point => point.trim().length > 0)
    
    if (bulletPoints.length > 1) {
      // Multiple bullet points found
      bulletPoints.slice(1).forEach(bullet => { // Skip first empty split
        const cleanBullet = bullet.replace(/\n.*$/, '').trim() // Take first line only
        if (cleanBullet) {
          // Extract link from markdown format [text](url)
          const linkMatch = cleanBullet.match(/\[([^\]]+)\]\(([^)]+)\)/)
          let actionDesc = cleanBullet
          let actionLink = undefined
          
          if (linkMatch) {
            actionLink = linkMatch[2]
            actionDesc = cleanBullet.replace(linkMatch[0], linkMatch[1])
          }
          
          actions.push({
            step: stepNumber++,
            desc: actionDesc,
            link: actionLink
          })
        }
      })
    } else {
      // Single description, create one main action
      let mainAction = content.split('.')[0] + '.' // First sentence
      let actionLink = undefined
      
      // Extract main link from content
      const linkMatch = content.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (linkMatch) {
        actionLink = linkMatch[2]
        // Clean up the action description by removing the markdown link
        mainAction = mainAction.replace(linkMatch[0], linkMatch[1])
      }
      
      actions.push({
        step: 1,
        desc: mainAction.trim(),
        link: actionLink
      })
      
      // Look for additional specific steps mentioned
      if (content.includes('apply for') || content.includes('obtain')) {
        actions.push({
          step: 2,
          desc: 'Submit application and required documentation',
          link: actionLink
        })
      }
      
      if (content.includes('inspection') || content.includes('approval')) {
        actions.push({
          step: actions.length + 1,
          desc: 'Arrange inspection and obtain approval',
          link: undefined
        })
      }
    }
    
    // Extract notes/important information
    const notes: string[] = []
    if (content.includes('must') || content.includes('required')) {
      notes.push('Required before business operations can commence')
    }
    if (content.includes('before') || content.includes('prior to')) {
      notes.push('Complete this requirement before proceeding with other permits')
    }
    
    requirements.push({
      title: title,
      authority: authority,
      actions: actions.length > 0 ? actions : [{
        step: 1,
        desc: 'Contact the relevant authority for specific requirements',
        link: undefined
      }],
      notes: notes.length > 0 ? notes : ['Verify current requirements with the relevant authority']
    })
  }
  
  return requirements
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

  // Parse requirements from the answer text
  const requirements = parseRequirementsFromAnswer(response.answer || '', response.deep_links)

  // Extract contacts from regulatory authority links
  const contacts = response.deep_links?.filter(link => 
    link.type === 'regulatory_authority'
  ).map(link => ({
    authority: link.authority || link.jurisdiction,
    type: link.contact_type || 'General',
    phone: undefined, // Not provided in new API
    url: link.url
  })) || []

  // Add generic contacts if none found
  if (contacts.length === 0) {
    contacts.push({
      authority: 'Local Council',
      type: 'General Enquiries',
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
 * Perform search with form data using the new API client
 * @param data - Form data containing query and address
 */
const performSearch = async (data: { query: string; address: string }) => {
  if (!data.query.trim()) return
  
  loading.value = true
  error.value = ''
  result.value = null
  
  try {
    const response = await apiClient.askLegalQuestion({
      question: data.query,
      userLocale: 'en-AU',
      context: {
        location: data.address || undefined
      }
    })
    
    if (response.success && response.answer) {
      // Convert the new API response format to the old format for compatibility
      result.value = convertToTriageResponse(response, data.query, data.address)
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
</style>