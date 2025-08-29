<template>
  <div class="wizard-step">
    <!-- Business Type Step -->
    <div v-if="step === 'business-type'" class="step-content">
      <div class="step-header">
        <h2 class="step-title">What type of business are you starting?</h2>
        <p class="step-description">
          Select your business type to get tailored requirements. This helps us identify
          the specific licenses, permits, and regulations that apply to your business.
        </p>
      </div>

      <div class="form-group">
        <label for="business-type-input" class="form-label">Business Type</label>
        <div class="input-group">
          <input
            id="business-type-input"
            v-model="businessType"
            type="text"
            class="form-input"
            placeholder="e.g., Restaurant, Hair Salon, Construction Company"
            @input="handleBusinessTypeInput"
            @keydown.enter="handleBusinessTypeSubmit"
          />
          <div v-if="businessTypeSuggestions.length > 0" class="suggestions-dropdown">
            <button
              v-for="suggestion in businessTypeSuggestions"
              :key="suggestion"
              class="suggestion-item"
              @click="selectBusinessType(suggestion)"
              type="button"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="selectedBusinessType" class="selected-preview">
        <h3>Selected Business Type:</h3>
        <div class="preview-card">
          <span class="preview-text">{{ selectedBusinessType }}</span>
        </div>
      </div>
    </div>

    <!-- Location Step -->
    <div v-else-if="step === 'location'" class="step-content">
      <div class="step-header">
        <h2 class="step-title">Where will your business operate?</h2>
        <p class="step-description">
          Enter your business address to identify the relevant councils, state regulations,
          and any special planning zones that may apply.
        </p>
      </div>

      <div class="form-group">
        <label for="address-input" class="form-label">Business Address</label>
        <input
          id="address-input"
          v-model="address"
          type="text"
          class="form-input"
          placeholder="123 Main Street, Sydney NSW 2000"
          @input="handleAddressInput"
          @keydown.enter="handleAddressSubmit"
        />
      </div>

      <div v-if="selectedAddress" class="selected-preview">
        <h3>Selected Location:</h3>
        <div class="preview-card">
          <span class="preview-text">{{ selectedAddress }}</span>
          <div v-if="detectedJurisdiction" class="jurisdiction-info">
            <p><strong>Council:</strong> {{ detectedJurisdiction.council }}</p>
            <p><strong>State:</strong> {{ detectedJurisdiction.state }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Requirements Step -->
    <div v-else-if="step === 'requirements'" class="step-content">
      <div class="step-header">
        <h2 class="step-title">What specific requirements do you need?</h2>
        <p class="step-description">
          Select the types of information you're looking for. This helps us prioritize
          the most relevant requirements for your business.
        </p>
      </div>

      <div class="requirements-grid">
        <label
          v-for="requirement in availableRequirements"
          :key="requirement.id"
          class="requirement-option"
          :class="{ 'selected': selectedRequirements.includes(requirement.id) }"
        >
          <input
            type="checkbox"
            :value="requirement.id"
            v-model="selectedRequirements"
            class="requirement-checkbox"
          />
          <div class="requirement-content">
            <div class="requirement-icon">{{ requirement.icon }}</div>
            <div class="requirement-info">
              <h4 class="requirement-title">{{ requirement.title }}</h4>
              <p class="requirement-description">{{ requirement.description }}</p>
            </div>
          </div>
        </label>
      </div>
    </div>

    <!-- Review Step -->
    <div v-else-if="step === 'review'" class="step-content">
      <div class="step-header">
        <h2 class="step-title">Review your search</h2>
        <p class="step-description">
          Please review your selections before we search for requirements. 
          You can go back to edit any information.
        </p>
      </div>

      <div class="review-sections">
        <div class="review-section">
          <h3>Business Information</h3>
          <div class="review-item">
            <label>Business Type:</label>
            <span>{{ progress.progress.searchData.businessType || 'Not specified' }}</span>
            <button @click="goToStep('business-type')" class="edit-btn" type="button">Edit</button>
          </div>
          <div class="review-item">
            <label>Location:</label>
            <span>{{ progress.progress.searchData.address || 'Not specified' }}</span>
            <button @click="goToStep('location')" class="edit-btn" type="button">Edit</button>
          </div>
        </div>

        <div class="review-section">
          <h3>Requirements Selected</h3>
          <div class="review-item">
            <label>Types:</label>
            <div class="requirements-list">
              <span
                v-for="reqId in progress.progress.searchData.requirements"
                :key="reqId"
                class="requirement-tag"
              >
                {{ getRequirementTitle(reqId) }}
              </span>
              <span v-if="progress.progress.searchData.requirements.length === 0" class="no-requirements">
                All requirements
              </span>
            </div>
            <button @click="goToStep('requirements')" class="edit-btn" type="button">Edit</button>
          </div>
        </div>
      </div>

      <div class="search-preview">
        <h3>Search Query</h3>
        <div class="query-preview">
          {{ generateSearchQuery() }}
        </div>
      </div>
    </div>

    <!-- Results Step -->
    <div v-else-if="step === 'results'" class="step-content">
      <div class="step-header">
        <h2 class="step-title">🎉 Search Complete!</h2>
        <p class="step-description">
          Your personalized requirements checklist is ready. You can now export,
          print, or save your results for future reference.
        </p>
      </div>

      <div class="results-summary">
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-number">{{ mockResults.requirements.length }}</span>
            <span class="stat-label">Requirements Found</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ mockResults.conflicts.length }}</span>
            <span class="stat-label">Potential Conflicts</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ mockResults.jurisdictions.length }}</span>
            <span class="stat-label">Jurisdictions</span>
          </div>
        </div>

        <div class="action-buttons">
          <button @click="exportResults" class="btn btn-primary" type="button">
            <span class="btn-icon">📄</span>
            Export Report
          </button>
          <button @click="printResults" class="btn btn-secondary" type="button">
            <span class="btn-icon">🖨️</span>
            Print View
          </button>
          <button @click="saveResults" class="btn btn-secondary" type="button">
            <span class="btn-icon">💾</span>
            Save Results
          </button>
        </div>
      </div>

      <div class="next-steps">
        <h3>Next Steps</h3>
        <ol class="steps-list">
          <li>Review all requirements in the detailed checklist below</li>
          <li>Contact relevant authorities to confirm current requirements</li>
          <li>Begin the application process for licenses and permits</li>
          <li>Set up monitoring for requirement changes</li>
        </ol>
      </div>
    </div>

    <!-- Step Actions -->
    <div class="step-actions">
      <div class="validation-message" v-if="validationMessage">
        <span class="validation-icon">⚠️</span>
        {{ validationMessage }}
      </div>

      <button
        v-if="canCompleteStep"
        @click="completeStep"
        class="btn btn-primary btn-lg"
        type="button"
      >
        {{ getStepButtonText() }}
        <span class="btn-icon">→</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useExport } from '../composables/useExport'

interface Props {
  step: string
  progress: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'step-complete': [data: any]
  'next-step': []
  'previous-step': []
}>()

const { exportResults: performExport } = useExport()

// Step data
const businessType = ref('')
const address = ref('')
const selectedRequirements = ref<string[]>([])

// UI state
const businessTypeSuggestions = ref<string[]>([])
const validationMessage = ref('')

// Computed data
const selectedBusinessType = ref('')
const selectedAddress = ref('')
const detectedJurisdiction = ref<any>(null)

// Mock data
const availableRequirements = [
  {
    id: 'licenses',
    title: 'Business Licenses',
    description: 'Required licenses to operate legally',
    icon: '📄'
  },
  {
    id: 'permits',
    title: 'Building Permits',
    description: 'Permits for construction or renovation',
    icon: '🏗️'
  },
  {
    id: 'health',
    title: 'Health & Safety',
    description: 'Health department approvals and safety requirements',
    icon: '🏥'
  },
  {
    id: 'planning',
    title: 'Planning Approvals',
    description: 'Zoning and land use permissions',
    icon: '🗺️'
  },
  {
    id: 'environmental',
    title: 'Environmental',
    description: 'Environmental impact and sustainability requirements',
    icon: '🌱'
  },
  {
    id: 'fire',
    title: 'Fire Safety',
    description: 'Fire safety approvals and emergency procedures',
    icon: '🔥'
  }
]

const mockResults = {
  requirements: Array.from({ length: 12 }, (_, i) => ({ id: i })),
  conflicts: Array.from({ length: 3 }, (_, i) => ({ id: i })),
  jurisdictions: ['Sydney City Council', 'NSW Government', 'Australian Government']
}

/**
 * Check if current step can be completed
 */
const canCompleteStep = computed(() => {
  switch (props.step) {
    case 'business-type':
      return selectedBusinessType.value.length > 0
    case 'location':
      return selectedAddress.value.length > 0
    case 'requirements':
      return true // Optional step
    case 'review':
      return true
    case 'results':
      return true
    default:
      return false
  }
})

/**
 * Business type input handling
 */
const handleBusinessTypeInput = async () => {
  const query = businessType.value.toLowerCase()
  if (query.length < 2) {
    businessTypeSuggestions.value = []
    return
  }

  // Mock suggestions based on common business types
  const allSuggestions = [
    'Restaurant', 'Café', 'Food Truck', 'Catering Service',
    'Hair Salon', 'Beauty Salon', 'Barber Shop', 'Nail Salon',
    'Construction Company', 'Plumbing Service', 'Electrical Service',
    'Retail Store', 'Clothing Store', 'Bookstore', 'Electronics Store',
    'Consulting Service', 'Marketing Agency', 'IT Services',
    'Medical Practice', 'Dental Clinic', 'Physiotherapy',
    'Child Care Center', 'Education Service', 'Tutoring Service',
    'Manufacturing', 'Workshop', 'Warehouse Operation'
  ]

  businessTypeSuggestions.value = allSuggestions
    .filter(suggestion => suggestion.toLowerCase().includes(query))
    .slice(0, 6)
}

/**
 * Select business type from suggestions
 */
const selectBusinessType = (type: string) => {
  businessType.value = type
  selectedBusinessType.value = type
  businessTypeSuggestions.value = []
}

/**
 * Handle business type form submission
 */
const handleBusinessTypeSubmit = () => {
  if (businessType.value) {
    selectedBusinessType.value = businessType.value
    businessTypeSuggestions.value = []
  }
}

/**
 * Address input handling
 */
const handleAddressInput = () => {
  // Mock address validation and jurisdiction detection
  if (address.value.length > 10) {
    selectedAddress.value = address.value
    
    // Mock jurisdiction detection
    detectedJurisdiction.value = {
      council: 'Sydney City Council',
      state: 'New South Wales',
      postcode: '2000'
    }
  }
}

/**
 * Handle address form submission
 */
const handleAddressSubmit = () => {
  if (address.value) {
    selectedAddress.value = address.value
  }
}

/**
 * Get step button text
 */
const getStepButtonText = () => {
  switch (props.step) {
    case 'business-type':
      return 'Continue with Location'
    case 'location':
      return 'Continue with Requirements'
    case 'requirements':
      return 'Review Selections'
    case 'review':
      return 'Search Requirements'
    case 'results':
      return 'View Detailed Results'
    default:
      return 'Continue'
  }
}

/**
 * Complete current step
 */
const completeStep = () => {
  let stepData = {}

  switch (props.step) {
    case 'business-type':
      stepData = { businessType: selectedBusinessType.value }
      props.progress.updateSearchData({ businessType: selectedBusinessType.value })
      break
    case 'location':
      stepData = { address: selectedAddress.value, jurisdiction: detectedJurisdiction.value }
      props.progress.updateSearchData({ address: selectedAddress.value })
      break
    case 'requirements':
      stepData = { requirements: selectedRequirements.value }
      props.progress.updateSearchData({ requirements: selectedRequirements.value })
      break
    case 'review':
      stepData = { searchQuery: generateSearchQuery() }
      props.progress.updateSearchData({ query: generateSearchQuery() })
      break
    case 'results':
      stepData = { completed: true }
      break
  }

  emit('step-complete', stepData)
}

/**
 * Generate search query for review
 */
const generateSearchQuery = () => {
  const { businessType, address, requirements } = props.progress.progress.searchData
  const reqText = requirements.length > 0 
    ? ` focusing on ${requirements.map(getRequirementTitle).join(', ')}`
    : ''
  
  return `${businessType} business at ${address}${reqText}`
}

/**
 * Get requirement title by ID
 */
const getRequirementTitle = (id: string) => {
  const req = availableRequirements.find(r => r.id === id)
  return req?.title || id
}

/**
 * Navigate to specific step
 */
const goToStep = (stepName: string) => {
  props.progress.goToStep(stepName)
}

/**
 * Export results (placeholder)
 */
const exportResults = () => {
  // This would integrate with the actual search results
  console.log('Exporting results...')
  // In a real implementation, this would call performExport with actual data
}

/**
 * Print results (placeholder)
 */
const printResults = () => {
  window.print()
}

/**
 * Save results (placeholder)
 */
const saveResults = () => {
  props.progress.saveProgress()
}

/**
 * Initialize step data from progress
 */
const initializeStepData = () => {
  const { searchData } = props.progress.progress
  
  businessType.value = searchData.businessType || ''
  selectedBusinessType.value = searchData.businessType || ''
  
  address.value = searchData.address || ''
  selectedAddress.value = searchData.address || ''
  
  selectedRequirements.value = searchData.requirements || []
}

// Initialize data when component mounts
watch(() => props.step, initializeStepData, { immediate: true })
</script>

<style scoped>
.wizard-step {
  max-width: 800px;
  margin: 0 auto;
}

.step-content {
  margin-bottom: 3rem;
}

.step-header {
  text-align: center;
  margin-bottom: 2rem;
}

.step-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.step-description {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* Form Elements */
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.input-group {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
}

/* Suggestions Dropdown */
.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-top: none;
  border-radius: 0 0 0.5rem 0.5rem;
  box-shadow: var(--shadow-lg);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  width: 100%;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: var(--text-primary);
}

.suggestion-item:hover {
  background: var(--hover-bg);
}

/* Selected Preview */
.selected-preview {
  margin-top: 1.5rem;
}

.selected-preview h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.preview-card {
  padding: 1rem;
  background: var(--active-bg);
  border: 1px solid var(--primary-color);
  border-radius: 0.5rem;
}

.preview-text {
  font-weight: 500;
  color: var(--primary-color);
}

.jurisdiction-info {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-light);
}

.jurisdiction-info p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Requirements Grid */
.requirements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.requirement-option {
  display: flex;
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-primary);
}

.requirement-option:hover {
  border-color: var(--primary-color);
  background: var(--hover-bg);
}

.requirement-option.selected {
  border-color: var(--primary-color);
  background: var(--active-bg);
}

.requirement-checkbox {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.requirement-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  width: 100%;
}

.requirement-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.requirement-info {
  flex: 1;
}

.requirement-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.requirement-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

/* Review Sections */
.review-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.review-section {
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
}

.review-section h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.review-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-light);
}

.review-item:last-child {
  border-bottom: none;
}

.review-item label {
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 120px;
}

.review-item span {
  flex: 1;
  color: var(--text-primary);
}

.edit-btn {
  padding: 0.375rem 0.75rem;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  color: var(--primary-color);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-btn:hover {
  background: var(--hover-bg);
  border-color: var(--primary-color);
}

.requirements-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  flex: 1;
}

.requirement-tag {
  padding: 0.25rem 0.5rem;
  background: var(--primary-light);
  color: var(--primary-color);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.no-requirements {
  color: var(--text-tertiary);
  font-style: italic;
}

/* Search Preview */
.search-preview {
  margin-top: 2rem;
}

.search-preview h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.query-preview {
  padding: 1rem;
  background: var(--info-bg);
  border: 1px solid var(--info-border);
  border-radius: 0.5rem;
  color: var(--info-text);
  font-family: monospace;
  font-size: 0.875rem;
}

/* Results Summary */
.results-summary {
  margin: 2rem 0;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-item {
  text-align: center;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Next Steps */
.next-steps {
  margin-top: 2rem;
  padding: 1.5rem;
  background: var(--accent-bg);
  border: 1px solid var(--accent-border);
  border-radius: 0.75rem;
}

.next-steps h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--accent-text);
  margin: 0 0 1rem 0;
}

.steps-list {
  margin: 0;
  padding-left: 1.5rem;
}

.steps-list li {
  margin-bottom: 0.5rem;
  color: var(--accent-text);
  line-height: 1.5;
}

/* Step Actions */
.step-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.validation-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--warning-bg);
  border: 1px solid var(--warning-border);
  border-radius: 0.5rem;
  color: var(--warning-text);
  font-size: 0.875rem;
}

.validation-icon {
  font-size: 1rem;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
}

/* Responsive Design */
@media (max-width: 768px) {
  .requirements-grid {
    grid-template-columns: 1fr;
  }
  
  .review-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .requirements-list {
    margin-top: 0.5rem;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }
  
  .summary-stats {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }
  
  .stat-item {
    padding: 1rem;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
}
</style>