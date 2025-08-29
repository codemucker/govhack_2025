<template>
  <div class="search">
    <h1>Search Regulatory Requirements</h1>
    
    <form @submit.prevent="performSearch" class="search-form">
      <div class="form-group">
        <label for="query">What would you like to do?</label>
        <input
          id="query"
          v-model="query"
          type="text"
          placeholder="e.g., 'open a café in Brisbane' or 'build a fence'"
          class="form-input"
        />
      </div>
      
      <div class="form-group">
        <label for="address">Address (optional)</label>
        <input
          id="address"
          v-model="address"
          type="text"
          placeholder="e.g., '123 Collins St, Melbourne VIC 3000'"
          class="form-input"
        />
      </div>
      
      <button type="submit" :disabled="!query || loading" class="btn btn-primary">
        {{ loading ? 'Searching...' : 'Search Requirements' }}
      </button>
    </form>

    <div v-if="result" class="results">
      <h2>Results</h2>
      
      <div class="result-section">
        <h3>Query Analysis</h3>
        <div class="analysis-card">
          <p><strong>Original:</strong> {{ result.query.raw }}</p>
          <p><strong>Location:</strong> 
            {{ result.query.location?.address || 'Not specified' }}
          </p>
          <div v-if="result.query.assumptions.length">
            <p><strong>Assumptions:</strong></p>
            <ul>
              <li v-for="assumption in result.query.assumptions" :key="assumption">
                {{ assumption }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="result-section">
        <h3>Jurisdictions</h3>
        <div class="jurisdiction-grid">
          <div 
            v-for="jurisdiction in result.jurisdictions" 
            :key="jurisdiction.name"
            class="jurisdiction-card"
          >
            <div class="jurisdiction-level">{{ jurisdiction.level }}</div>
            <div class="jurisdiction-name">{{ jurisdiction.name }}</div>
            <div class="confidence-bar">
              <div 
                class="confidence-fill"
                :style="{ width: jurisdiction.confidence * 100 + '%' }"
              ></div>
            </div>
            <div class="confidence-text">
              {{ Math.round(jurisdiction.confidence * 100) }}% confidence
            </div>
          </div>
        </div>
      </div>

      <div class="result-section">
        <h3>Requirements</h3>
        <div class="requirements-list">
          <div 
            v-for="requirement in result.requirements" 
            :key="requirement.title"
            class="requirement-card"
          >
            <h4>{{ requirement.title }}</h4>
            <p class="requirement-authority">{{ requirement.authority }}</p>
            
            <div class="actions-list">
              <div 
                v-for="action in requirement.actions" 
                :key="action.step"
                class="action-item"
              >
                <span class="step-number">{{ action.step }}</span>
                <span class="step-description">{{ action.desc }}</span>
                <a 
                  v-if="action.link" 
                  :href="action.link" 
                  target="_blank"
                  class="step-link"
                >
                  View Details
                </a>
              </div>
            </div>
            
            <div v-if="requirement.notes.length" class="requirement-notes">
              <p><strong>Notes:</strong></p>
              <ul>
                <li v-for="note in requirement.notes" :key="note">{{ note }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="result-section">
        <h3>Contacts</h3>
        <div class="contacts-list">
          <div v-for="contact in result.contacts" :key="contact.authority" class="contact-card">
            <h4>{{ contact.authority }}</h4>
            <p>{{ contact.type }}</p>
            <div class="contact-details">
              <span v-if="contact.phone">📞 {{ contact.phone }}</span>
              <a :href="contact.url" target="_blank">🌐 Website</a>
            </div>
          </div>
        </div>
      </div>

      <div class="disclaimer">
        <p><strong>Disclaimer:</strong> {{ result.disclaimer }}</p>
      </div>
    </div>

    <div v-if="error" class="error">
      <h3>Error</h3>
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const query = ref('')
const address = ref('')
const loading = ref(false)
const result = ref<any>(null)
const error = ref('')

const performSearch = async () => {
  if (!query.value.trim()) return
  
  loading.value = true
  error.value = ''
  result.value = null
  
  try {
    const response = await fetch('/api/v1/triage/demo-public', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query.value,
        address: address.value || undefined,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    result.value = await response.json()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An unknown error occurred'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.search {
  max-width: 800px;
  margin: 0 auto;
}

.search h1 {
  text-align: center;
  color: #1f2937;
  margin-bottom: 2rem;
}

.search-form {
  background: #f9fafb;
  padding: 2rem;
  border-radius: 0.75rem;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #059669;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #047857;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.results {
  margin-top: 2rem;
}

.result-section {
  margin-bottom: 2rem;
}

.result-section h3 {
  color: #1f2937;
  margin-bottom: 1rem;
  border-bottom: 2px solid #059669;
  padding-bottom: 0.5rem;
}

.analysis-card {
  background: #f3f4f6;
  padding: 1.5rem;
  border-radius: 0.5rem;
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
  padding: 1rem;
}

.jurisdiction-level {
  font-size: 0.875rem;
  color: #6b7280;
  text-transform: uppercase;
  font-weight: 600;
}

.jurisdiction-name {
  font-weight: 600;
  margin: 0.5rem 0;
}

.confidence-bar {
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  margin: 0.5rem 0;
}

.confidence-fill {
  height: 100%;
  background: #059669;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.confidence-text {
  font-size: 0.875rem;
  color: #6b7280;
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
}

.requirement-card h4 {
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.requirement-authority {
  color: #6b7280;
  font-style: italic;
  margin-bottom: 1rem;
}

.actions-list {
  margin-bottom: 1rem;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.step-number {
  background: #059669;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  flex-shrink: 0;
}

.step-description {
  flex: 1;
}

.step-link {
  color: #059669;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.875rem;
}

.step-link:hover {
  text-decoration: underline;
}

.requirement-notes {
  background: #fffbeb;
  border: 1px solid #f59e0b;
  border-radius: 0.5rem;
  padding: 1rem;
}

.contacts-list {
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

.contact-card h4 {
  margin-bottom: 0.5rem;
}

.contact-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.contact-details a {
  color: #059669;
  text-decoration: none;
}

.contact-details a:hover {
  text-decoration: underline;
}

.disclaimer {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 2rem;
}

.error {
  background: #fee2e2;
  border: 1px solid #ef4444;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 2rem;
  color: #dc2626;
}

@media (max-width: 768px) {
  .search-form {
    padding: 1rem;
  }
  
  .action-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .jurisdiction-grid,
  .contacts-list {
    grid-template-columns: 1fr;
  }
}
</style>