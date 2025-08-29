<template>
  <div class="search">
    <div class="search-header">
      <h1>Search Regulatory Requirements</h1>
      <p class="search-subtitle">
        Discover the permits, licences, and regulations that apply to your situation across all levels of Australian government
      </p>
    </div>
    
    <SearchForm 
      v-model="formData" 
      :is-loading="loading"
      @submit="performSearch" 
    />

    <SearchResults 
      v-if="result" 
      :result="result" 
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
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SearchForm from '../components/SearchForm.vue'
import SearchResults from '../components/SearchResults.vue'
import { useTriageSearch, type TriageResponse } from '../composables/useApi'

// Search state
const formData = ref({
  query: '',
  address: ''
})

const loading = ref(false)
const result = ref<TriageResponse | null>(null)
const error = ref('')

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
  margin: 0 auto;
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