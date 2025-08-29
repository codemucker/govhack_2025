<template>
  <div class="search-form-wrapper">
    <form @submit.prevent="handleSubmit" class="search-form">
      <div class="form-group">
        <label for="query">What would you like to do?</label>
        <div class="search-input-wrapper">
          <input
            id="query"
            ref="queryInput"
            v-model="query"
            type="text"
            placeholder="e.g., 'open a café in Brisbane' or 'build a fence'"
            class="form-input"
            autocomplete="off"
            @input="handleQueryInput"
            @focus="showSuggestions = true"
            @blur="handleInputBlur"
            @keydown="handleKeydown"
          />
          
          <!-- Search suggestions dropdown -->
          <div v-if="showSuggestions && filteredSuggestions.length > 0" class="suggestions-dropdown">
            <div
              v-for="(suggestion, index) in filteredSuggestions"
              :key="suggestion.query"
              :class="['suggestion-item', { active: selectedIndex === index }]"
              @mousedown.prevent="selectSuggestion(suggestion)"
              @mouseenter="selectedIndex = index"
            >
              <div class="suggestion-content">
                <span class="suggestion-query">{{ suggestion.query }}</span>
                <span :class="['suggestion-category', `category-${suggestion.category}`]">
                  {{ suggestion.category }}
                </span>
              </div>
              <div class="suggestion-popularity">
                {{ suggestion.popularity }}% match
              </div>
            </div>
          </div>
        </div>
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
        <div class="input-help">
          Providing an address helps identify the correct local council and jurisdiction
        </div>
      </div>
      
      <div class="form-actions">
        <button 
          type="submit" 
          :disabled="!query.trim() || isLoading" 
          class="btn btn-primary"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          {{ isLoading ? 'Searching...' : 'Search Requirements' }}
        </button>
        
        <button
          v-if="query || address"
          type="button"
          @click="clearForm"
          class="btn btn-secondary"
        >
          Clear
        </button>
      </div>
    </form>
    
    <!-- Quick examples -->
    <div class="quick-examples">
      <h4>Popular searches:</h4>
      <div class="example-tags">
        <button
          v-for="example in quickExamples"
          :key="example"
          @click="selectExample(example)"
          class="example-tag"
        >
          {{ example }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, type Ref } from 'vue'
import { useSearchSuggestions } from '../composables/useApi'
import type { SearchSuggestion } from '../composables/useApi'

interface Props {
  modelValue?: {
    query: string
    address: string
  }
  isLoading?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: { query: string; address: string }): void
  (e: 'submit', value: { query: string; address: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({ query: '', address: '' }),
  isLoading: false
})

const emit = defineEmits<Emits>()

// Form state
const query = ref(props.modelValue.query)
const address = ref(props.modelValue.address)
const queryInput: Ref<HTMLInputElement | null> = ref(null)

// Suggestions state
const showSuggestions = ref(false)
const selectedIndex = ref(-1)
const { suggestions, searchSuggestions } = useSearchSuggestions()

// Quick examples for common searches
const quickExamples = [
  'open a café',
  'build a fence', 
  'start a business',
  'renovate home',
  'install solar panels'
]

// Filter suggestions based on current query
const filteredSuggestions = computed(() => {
  if (!query.value.trim()) return []
  return suggestions.value.slice(0, 6)
})

/**
 * Handle query input changes with debounced suggestion search
 * @param event - Input event
 */
const handleQueryInput = async (event: Event) => {
  const target = event.target as HTMLInputElement
  query.value = target.value
  
  // Update parent component
  emit('update:modelValue', { query: query.value, address: address.value })
  
  // Reset selection when typing
  selectedIndex.value = -1
  
  // Search for suggestions
  if (target.value.trim()) {
    await searchSuggestions(target.value)
  }
}

/**
 * Handle input blur with delay to allow suggestion clicks
 */
const handleInputBlur = () => {
  // Delay hiding to allow suggestion clicks
  setTimeout(() => {
    showSuggestions.value = false
    selectedIndex.value = -1
  }, 200)
}

/**
 * Handle keyboard navigation in suggestions
 * @param event - Keyboard event
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (!showSuggestions.value || filteredSuggestions.value.length === 0) return
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredSuggestions.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      break
    case 'Enter':
      if (selectedIndex.value >= 0) {
        event.preventDefault()
        selectSuggestion(filteredSuggestions.value[selectedIndex.value])
      }
      break
    case 'Escape':
      showSuggestions.value = false
      selectedIndex.value = -1
      break
  }
}

/**
 * Select a suggestion from the dropdown
 * @param suggestion - Selected suggestion
 */
const selectSuggestion = (suggestion: SearchSuggestion) => {
  query.value = suggestion.query
  showSuggestions.value = false
  selectedIndex.value = -1
  
  // Update parent and focus back to input
  emit('update:modelValue', { query: query.value, address: address.value })
  
  nextTick(() => {
    queryInput.value?.focus()
  })
}

/**
 * Select a quick example
 * @param example - Example query to use
 */
const selectExample = (example: string) => {
  query.value = example
  emit('update:modelValue', { query: query.value, address: address.value })
  
  nextTick(() => {
    queryInput.value?.focus()
  })
}

/**
 * Clear the form
 */
const clearForm = () => {
  query.value = ''
  address.value = ''
  showSuggestions.value = false
  selectedIndex.value = -1
  
  emit('update:modelValue', { query: '', address: '' })
  
  nextTick(() => {
    queryInput.value?.focus()
  })
}

/**
 * Handle form submission
 */
const handleSubmit = () => {
  if (!query.value.trim()) return
  
  showSuggestions.value = false
  selectedIndex.value = -1
  
  emit('submit', { query: query.value, address: address.value })
}
</script>

<style scoped>
.search-form-wrapper {
  max-width: 600px;
  margin: 0 auto;
}

.search-form {
  background: #f9fafb;
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1.5rem;
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.search-input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
}

.input-help {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 50;
  max-height: 300px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.1s;
}

.suggestion-item:hover,
.suggestion-item.active {
  background: #f9fafb;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.suggestion-query {
  font-weight: 500;
  color: #1f2937;
}

.suggestion-category {
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  text-transform: uppercase;
  font-weight: 600;
}

.category-business {
  background: #dbeafe;
  color: #1d4ed8;
}

.category-property {
  background: #d1fae5;
  color: #059669;
}

.category-personal {
  background: #fef3c7;
  color: #d97706;
}

.category-other {
  background: #e5e7eb;
  color: #6b7280;
}

.suggestion-popularity {
  font-size: 0.875rem;
  color: #6b7280;
}

.form-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
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

.btn-primary:hover:not(:disabled) {
  background: #047857;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.quick-examples {
  margin-top: 1.5rem;
}

.quick-examples h4 {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
}

.example-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.example-tag {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 1rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.example-tag:hover {
  border-color: #059669;
  color: #059669;
  background: #f0fdf4;
}

@media (max-width: 768px) {
  .search-form {
    padding: 1.5rem;
  }
  
  .form-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
  
  .example-tags {
    justify-content: center;
  }
}
</style>