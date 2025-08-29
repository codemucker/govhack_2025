<template>
  <div class="search-results">
    <div class="results-header">
      <h2>Search Results</h2>
      <div class="results-summary">
        Found {{ totalRequirements }} requirements across {{ jurisdictions.length }} jurisdictions
      </div>
    </div>
    
    <!-- Query Analysis Section -->
    <section class="result-section">
      <div class="section-header">
        <h3>🔍 Query Analysis</h3>
        <button 
          @click="toggleSection('analysis')" 
          :class="['toggle-btn', { expanded: expandedSections.analysis }]"
        >
          {{ expandedSections.analysis ? 'Hide' : 'Show' }} Details
        </button>
      </div>
      
      <div v-show="expandedSections.analysis" class="analysis-card">
        <div class="analysis-row">
          <strong>Original Query:</strong>
          <span class="query-text">{{ result.query.raw }}</span>
        </div>
        
        <div class="analysis-row">
          <strong>Location:</strong> 
          <span class="location-text">
            {{ result.query.location?.address || 'Not specified' }}
          </span>
          <span v-if="result.query.location?.council" class="council-badge">
            {{ result.query.location.council }}
          </span>
        </div>
        
        <div v-if="result.query.assumptions.length" class="assumptions-section">
          <strong>Our Assumptions:</strong>
          <ul class="assumptions-list">
            <li v-for="assumption in result.query.assumptions" :key="assumption">
              <span class="assumption-icon">💡</span>
              {{ assumption }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Jurisdictions Section -->
    <section class="result-section">
      <div class="section-header">
        <h3>🏛️ Jurisdictions</h3>
        <div class="jurisdiction-summary">
          {{ jurisdictions.length }} levels of government involved
        </div>
      </div>
      
      <div class="jurisdiction-grid">
        <div 
          v-for="jurisdiction in jurisdictions" 
          :key="jurisdiction.name"
          class="jurisdiction-card"
        >
          <div class="jurisdiction-header">
            <div class="jurisdiction-level">{{ jurisdiction.level }}</div>
            <div class="confidence-score">
              {{ Math.round(jurisdiction.confidence * 100) }}%
            </div>
          </div>
          
          <div class="jurisdiction-name">{{ jurisdiction.name }}</div>
          
          <div class="confidence-bar">
            <div 
              class="confidence-fill"
              :style="{ 
                width: jurisdiction.confidence * 100 + '%',
                backgroundColor: getConfidenceColor(jurisdiction.confidence)
              }"
            ></div>
          </div>
          
          <div class="confidence-label">
            {{ getConfidenceLabel(jurisdiction.confidence) }}
          </div>
        </div>
      </div>
    </section>

    <!-- Requirements Section -->
    <section class="result-section">
      <div class="section-header">
        <h3>📋 Requirements</h3>
        <div class="requirements-filters">
          <button 
            v-for="authority in uniqueAuthorities" 
            :key="authority"
            @click="toggleAuthorityFilter(authority)"
            :class="['filter-btn', { active: authorityFilters.includes(authority) }]"
          >
            {{ authority }}
          </button>
        </div>
      </div>
      
      <div class="requirements-list">
        <div 
          v-for="requirement in filteredRequirements" 
          :key="requirement.title"
          class="requirement-card"
        >
          <div class="requirement-header">
            <h4>{{ requirement.title }}</h4>
            <div class="requirement-meta">
              <span class="requirement-authority">{{ requirement.authority }}</span>
              <span class="steps-count">{{ requirement.actions.length }} steps</span>
            </div>
          </div>
          
          <!-- Action Steps -->
          <div class="actions-section">
            <div class="actions-header">
              <h5>Required Actions</h5>
              <div class="progress-indicator">
                <span>0 of {{ requirement.actions.length }} completed</span>
              </div>
            </div>
            
            <div class="actions-list">
              <div 
                v-for="action in requirement.actions" 
                :key="action.step"
                class="action-item"
              >
                <div class="action-checkbox">
                  <input 
                    :id="`action-${requirement.title}-${action.step}`"
                    type="checkbox" 
                    class="action-check"
                    @change="toggleActionComplete"
                  />
                  <label :for="`action-${requirement.title}-${action.step}`" class="sr-only">
                    Mark step {{ action.step }} as complete
                  </label>
                </div>
                
                <div class="step-number">{{ action.step }}</div>
                
                <div class="action-content">
                  <div class="step-description">{{ action.desc }}</div>
                  <a 
                    v-if="action.link" 
                    :href="action.link" 
                    target="_blank"
                    rel="noopener noreferrer"
                    class="step-link"
                  >
                    View Details
                    <span class="external-icon">↗</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Notes Section -->
          <div v-if="requirement.notes.length" class="requirement-notes">
            <div class="notes-header">
              <span class="notes-icon">⚠️</span>
              <strong>Important Notes:</strong>
            </div>
            <ul class="notes-list">
              <li v-for="note in requirement.notes" :key="note">{{ note }}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Contacts Section -->
    <section class="result-section">
      <div class="section-header">
        <h3>📞 Contacts & Support</h3>
      </div>
      
      <div class="contacts-grid">
        <div v-for="contact in result.contacts" :key="contact.authority" class="contact-card">
          <div class="contact-header">
            <h4>{{ contact.authority }}</h4>
            <span class="contact-type">{{ contact.type }}</span>
          </div>
          
          <div class="contact-details">
            <div v-if="contact.phone" class="contact-item">
              <span class="contact-icon">📞</span>
              <a :href="`tel:${contact.phone}`" class="contact-link">
                {{ contact.phone }}
              </a>
            </div>
            <div class="contact-item">
              <span class="contact-icon">🌐</span>
              <a :href="contact.url" target="_blank" rel="noopener noreferrer" class="contact-link">
                Visit Website
                <span class="external-icon">↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Disclaimer -->
    <div class="disclaimer">
      <div class="disclaimer-icon">⚖️</div>
      <div class="disclaimer-content">
        <strong>Legal Disclaimer:</strong>
        {{ result.disclaimer }}
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="result-actions">
      <button @click="exportResults" class="btn btn-secondary">
        <span class="btn-icon">📄</span>
        Export PDF
      </button>
      <button @click="shareResults" class="btn btn-secondary">
        <span class="btn-icon">🔗</span>
        Share Results
      </button>
      <button @click="saveResults" class="btn btn-primary">
        <span class="btn-icon">💾</span>
        Save for Later
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TriageResponse } from '../composables/useApi'

interface Props {
  result: TriageResponse
}

const props = defineProps<Props>()

// Section expansion state
const expandedSections = ref({
  analysis: true,
})

// Authority filtering state
const authorityFilters = ref<string[]>([])

// Computed values
const jurisdictions = computed(() => props.result.jurisdictions)
const totalRequirements = computed(() => props.result.requirements.length)

const uniqueAuthorities = computed(() => {
  const authorities = props.result.requirements.map(req => req.authority)
  return [...new Set(authorities)]
})

const filteredRequirements = computed(() => {
  if (authorityFilters.value.length === 0) {
    return props.result.requirements
  }
  return props.result.requirements.filter(req => 
    authorityFilters.value.includes(req.authority)
  )
})

/**
 * Toggle section expansion
 * @param section - Section name to toggle
 */
const toggleSection = (section: keyof typeof expandedSections.value) => {
  expandedSections.value[section] = !expandedSections.value[section]
}

/**
 * Toggle authority filter
 * @param authority - Authority name to filter by
 */
const toggleAuthorityFilter = (authority: string) => {
  const index = authorityFilters.value.indexOf(authority)
  if (index >= 0) {
    authorityFilters.value.splice(index, 1)
  } else {
    authorityFilters.value.push(authority)
  }
}

/**
 * Get confidence color based on score
 * @param confidence - Confidence score (0-1)
 * @returns CSS color value
 */
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return '#059669' // Green
  if (confidence >= 0.6) return '#d97706' // Orange  
  return '#dc2626' // Red
}

/**
 * Get confidence label based on score
 * @param confidence - Confidence score (0-1)
 * @returns Human readable confidence label
 */
const getConfidenceLabel = (confidence: number): string => {
  if (confidence >= 0.9) return 'Very High Confidence'
  if (confidence >= 0.8) return 'High Confidence'
  if (confidence >= 0.6) return 'Medium Confidence'
  if (confidence >= 0.4) return 'Low Confidence'
  return 'Very Low Confidence'
}

/**
 * Handle action completion toggle
 * @param event - Checkbox change event
 */
const toggleActionComplete = (event: Event) => {
  const target = event.target as HTMLInputElement
  // TODO: Implement progress tracking
  console.log('Action completed:', target.checked)
}

/**
 * Export results to PDF
 */
const exportResults = () => {
  // TODO: Implement PDF export functionality
  console.log('Export results to PDF')
}

/**
 * Share results via URL or social media
 */
const shareResults = () => {
  // TODO: Implement sharing functionality
  if (navigator.share) {
    navigator.share({
      title: 'LegalEase Search Results',
      text: `Requirements for: ${props.result.query.raw}`,
      url: window.location.href,
    })
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(window.location.href)
    alert('Link copied to clipboard!')
  }
}

/**
 * Save results for later access
 */
const saveResults = () => {
  // TODO: Implement user accounts and saved searches
  console.log('Save results for later')
}
</script>

<style scoped>
.search-results {
  max-width: 900px;
  margin: 0 auto;
}

.results-header {
  text-align: center;
  margin-bottom: 2rem;
}

.results-header h2 {
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.results-summary {
  color: #6b7280;
  font-size: 1.125rem;
}

.result-section {
  margin-bottom: 2.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #059669;
}

.section-header h3 {
  color: #1f2937;
  margin: 0;
}

.toggle-btn {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: #e5e7eb;
}

.toggle-btn.expanded {
  background: #059669;
  color: white;
  border-color: #059669;
}

/* Analysis Section */
.analysis-card {
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.analysis-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.query-text {
  font-style: italic;
  color: #1f2937;
}

.location-text {
  color: #059669;
  font-weight: 500;
}

.council-badge {
  background: #dbeafe;
  color: #1d4ed8;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.assumptions-section {
  margin-top: 1rem;
}

.assumptions-list {
  margin-top: 0.5rem;
  list-style: none;
  padding: 0;
}

.assumptions-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.assumption-icon {
  flex-shrink: 0;
  margin-top: 0.125rem;
}

/* Jurisdictions Section */
.jurisdiction-summary {
  color: #6b7280;
  font-size: 0.875rem;
}

.jurisdiction-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.jurisdiction-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.25rem;
  transition: box-shadow 0.2s;
}

.jurisdiction-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.jurisdiction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.jurisdiction-level {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.confidence-score {
  font-weight: 700;
  font-size: 1.25rem;
  color: #059669;
}

.jurisdiction-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.75rem;
}

.confidence-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  margin-bottom: 0.5rem;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.confidence-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

/* Requirements Section */
.requirements-filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 1rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  border-color: #059669;
  color: #059669;
}

.filter-btn.active {
  background: #059669;
  color: white;
  border-color: #059669;
}

.requirements-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.requirement-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.requirement-header {
  margin-bottom: 1rem;
}

.requirement-header h4 {
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.requirement-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.requirement-authority {
  color: #6b7280;
  font-style: italic;
}

.steps-count {
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.actions-section {
  margin-bottom: 1rem;
}

.actions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.actions-header h5 {
  color: #374151;
  margin: 0;
  font-size: 1rem;
}

.progress-indicator {
  font-size: 0.875rem;
  color: #6b7280;
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.action-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.75rem;
  border: 1px solid #f3f4f6;
  border-radius: 0.5rem;
  transition: background-color 0.2s;
}

.action-item:hover {
  background: #f9fafb;
}

.action-checkbox {
  position: relative;
  top: 0.125rem;
}

.action-check {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.step-number {
  background: #059669;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  flex-shrink: 0;
}

.action-content {
  flex: 1;
  min-width: 0;
}

.step-description {
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.step-link {
  color: #059669;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.875rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.step-link:hover {
  text-decoration: underline;
}

.external-icon {
  font-size: 0.75rem;
}

.requirement-notes {
  background: #fffbeb;
  border: 1px solid #fbbf24;
  border-radius: 0.5rem;
  padding: 1rem;
}

.notes-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.notes-icon {
  font-size: 1.125rem;
}

.notes-list {
  margin: 0;
  padding-left: 1.25rem;
}

.notes-list li {
  margin-bottom: 0.25rem;
  color: #92400e;
}

/* Contacts Section */
.contacts-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.contact-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.contact-header {
  margin-bottom: 1rem;
}

.contact-header h4 {
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.contact-type {
  color: #6b7280;
  font-size: 0.875rem;
}

.contact-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.contact-icon {
  font-size: 1rem;
}

.contact-link {
  color: #059669;
  text-decoration: none;
  font-weight: 500;
}

.contact-link:hover {
  text-decoration: underline;
}

/* Disclaimer */
.disclaimer {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 2rem 0;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.disclaimer-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.disclaimer-content {
  color: #92400e;
  line-height: 1.5;
}

/* Action Buttons */
.result-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #059669;
  color: white;
}

.btn-primary:hover {
  background: #047857;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f9fafb;
}

.btn-icon {
  font-size: 1rem;
}

@media (max-width: 768px) {
  .search-results {
    padding: 1rem;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .requirements-filters {
    width: 100%;
  }
  
  .requirement-meta {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .action-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .result-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .jurisdiction-grid,
  .contacts-grid {
    grid-template-columns: 1fr;
  }
}
</style>