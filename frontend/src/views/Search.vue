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
import { useTriageSearch, type TriageResponse } from '../composables/useApi'
import type { ExportData } from '../composables/useExport'

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

// Use the triage search composable
const { performTriage } = useTriageSearch()

/**
 * Perform search with form data
 * @param data - Form data containing query and address
 */
const performSearch = async (data: { query: string; address: string }) => {
  if (!data.query.trim()) return
  
  loading.value = true
  error.value = ''
  result.value = null
  
  try {
    result.value = await performTriage({
      query: data.query,
      address: data.address || undefined,
    })
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