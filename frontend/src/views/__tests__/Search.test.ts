import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Search from '../Search.vue'

// Mock the components
vi.mock('../../components/SearchForm.vue', () => ({
  default: {
    name: 'SearchForm',
    props: ['modelValue', 'isLoading'],
    emits: ['update:modelValue', 'submit'],
    template: `
      <form @submit.prevent="$emit('submit', modelValue)">
        <input v-model="query" @input="updateModel" />
        <button type="submit">Submit</button>
      </form>
    `,
    data() {
      return {
        query: this.modelValue?.query || ''
      }
    },
    methods: {
      updateModel() {
        this.$emit('update:modelValue', { query: this.query, address: '' })
      }
    }
  }
}))

vi.mock('../../components/SearchResults.vue', () => ({
  default: {
    name: 'SearchResults',
    props: ['result'],
    template: '<div class="search-results-mock">Results: {{ result?.query?.raw }}</div>'
  }
}))

// Mock the API composable
const mockPerformTriage = vi.fn()
vi.mock('../../composables/useApi', () => ({
  useTriageSearch: () => ({
    performTriage: mockPerformTriage
  })
}))

const mockTriageResponse = {
  query: {
    raw: 'open a café',
    location: {
      address: 'Brisbane QLD',
      council: 'Brisbane City Council',
      state: 'Queensland'
    },
    assumptions: ['New business']
  },
  jurisdictions: [
    {
      name: 'Brisbane City Council',
      level: 'local' as const,
      confidence: 0.92
    }
  ],
  requirements: [
    {
      title: 'Business Registration',
      authority: 'ASIC',
      actions: [{ step: 1, desc: 'Register business' }],
      notes: ['Important note']
    }
  ],
  contacts: [
    {
      authority: 'ASIC',
      type: 'Government',
      url: 'https://asic.gov.au'
    }
  ],
  disclaimer: 'This is guidance only'
}

describe('Search View', () => {
  let wrapper: any

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = mount(Search)
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  describe('rendering', () => {
    it('should render search header correctly', () => {
      const header = wrapper.find('.search-header')
      expect(header.exists()).toBe(true)
      
      const title = header.find('h1')
      expect(title.text()).toBe('Search Regulatory Requirements')
      
      const subtitle = header.find('.search-subtitle')
      expect(subtitle.exists()).toBe(true)
      expect(subtitle.text()).toContain('permits, licences, and regulations')
    })

    it('should render SearchForm component', () => {
      const searchForm = wrapper.findComponent({ name: 'SearchForm' })
      expect(searchForm.exists()).toBe(true)
    })

    it('should not render SearchResults initially', () => {
      const searchResults = wrapper.findComponent({ name: 'SearchResults' })
      expect(searchResults.exists()).toBe(false)
    })

    it('should not render error message initially', () => {
      const error = wrapper.find('.error')
      expect(error.exists()).toBe(false)
    })
  })

  describe('search functionality', () => {
    it('should handle successful search', async () => {
      mockPerformTriage.mockResolvedValueOnce(mockTriageResponse)
      
      const searchForm = wrapper.findComponent({ name: 'SearchForm' })
      await searchForm.vm.$emit('submit', { query: 'open a café', address: 'Brisbane' })
      await nextTick()
      
      expect(mockPerformTriage).toHaveBeenCalledWith({
        query: 'open a café',
        address: 'Brisbane'
      })
      
      // Wait for async operation to complete
      await wrapper.vm.$nextTick()
      
      const searchResults = wrapper.findComponent({ name: 'SearchResults' })
      expect(searchResults.exists()).toBe(true)
      expect(searchResults.props('result')).toEqual(mockTriageResponse)
    })

    it('should handle search with empty address', async () => {
      mockPerformTriage.mockResolvedValueOnce(mockTriageResponse)
      
      const searchForm = wrapper.findComponent({ name: 'SearchForm' })
      await searchForm.vm.$emit('submit', { query: 'open a café', address: '' })
      await nextTick()
      
      expect(mockPerformTriage).toHaveBeenCalledWith({
        query: 'open a café',
        address: undefined
      })
    })

    it('should not search with empty query', async () => {
      const searchForm = wrapper.findComponent({ name: 'SearchForm' })
      await searchForm.vm.$emit('submit', { query: '', address: 'Brisbane' })
      
      expect(mockPerformTriage).not.toHaveBeenCalled()
    })

    it('should not search with whitespace-only query', async () => {
      const searchForm = wrapper.findComponent({ name: 'SearchForm' })
      await searchForm.vm.$emit('submit', { query: '   ', address: 'Brisbane' })
      
      expect(mockPerformTriage).not.toHaveBeenCalled()
    })
  })

  describe('loading states', () => {
    it('should show loading state during search', async () => {
      // Mock a delayed response
      mockPerformTriage.mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve(mockTriageResponse), 100)
        )
      )
      
      const searchForm = wrapper.findComponent({ name: 'SearchForm' })
      searchForm.vm.$emit('submit', { query: 'test query', address: '' })
      await nextTick()
      
      // Should be loading
      expect(searchForm.props('isLoading')).toBe(true)
    })

    it('should clear loading state after successful search', async () => {
      mockPerformTriage.mockResolvedValueOnce(mockTriageResponse)
      
      const searchForm = wrapper.findComponent({ name: 'SearchForm' })
      await searchForm.vm.$emit('submit', { query: 'test query', address: '' })
      
      // Wait for promise resolution
      await new Promise(resolve => setTimeout(resolve, 0))
      await nextTick()
      
      expect(searchForm.props('isLoading')).toBe(false)
    })

    it('should clear loading state after failed search', async () => {
      mockPerformTriage.mockRejectedValueOnce(new Error('API Error'))
      
      const searchForm = wrapper.findComponent({ name: 'SearchForm' })
      await searchForm.vm.$emit('submit', { query: 'test query', address: '' })
      
      // Wait for promise resolution
      await new Promise(resolve => setTimeout(resolve, 0))
      await nextTick()
      
      expect(searchForm.props('isLoading')).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should display error message on search failure', async () => {
      const errorMessage = 'API connection failed'
      mockPerformTriage.mockRejectedValueOnce(new Error(errorMessage))
      
      const searchForm = wrapper.findComponent({ name: 'SearchForm' })
      await searchForm.vm.$emit('submit', { query: 'test query', address: '' })
      
      // Wait for promise resolution
      await new Promise(resolve => setTimeout(resolve, 0))
      await nextTick()
      
      const error = wrapper.find('.error')
      expect(error.exists()).toBe(true)
      expect(error.text()).toContain('Search Error')
      expect(error.text()).toContain(errorMessage)
    })

    it('should handle non-Error exceptions', async () => {
      mockPerformTriage.mockRejectedValueOnce('String error')
      
      const searchForm = wrapper.findComponent({ name: 'SearchForm' })
      await searchForm.vm.$emit('submit', { query: 'test query', address: '' })
      
      await new Promise(resolve => setTimeout(resolve, 0))
      await nextTick()
      
      const error = wrapper.find('.error')
      expect(error.exists()).toBe(true)
      expect(error.text()).toContain('An unknown error occurred')
    })

    it('should clear error on successful search', async () => {
      // First, cause an error
      mockPerformTriage.mockRejectedValueOnce(new Error('First error'))
      
      const searchForm = wrapper.findComponent({ name: 'SearchForm' })
      await searchForm.vm.$emit('submit', { query: 'test query', address: '' })
      await new Promise(resolve => setTimeout(resolve, 0))
      await nextTick()
      
      expect(wrapper.find('.error').exists()).toBe(true)
      
      // Then, perform successful search
      mockPerformTriage.mockResolvedValueOnce(mockTriageResponse)
      await searchForm.vm.$emit('submit', { query: 'new query', address: '' })
      await new Promise(resolve => setTimeout(resolve, 0))
      await nextTick()
      
      expect(wrapper.find('.error').exists()).toBe(false)
    })

    it('should clear error when clear button is clicked', async () => {
      mockPerformTriage.mockRejectedValueOnce(new Error('Test error'))
      
      const searchForm = wrapper.findComponent({ name: 'SearchForm' })
      await searchForm.vm.$emit('submit', { query: 'test query', address: '' })
      await new Promise(resolve => setTimeout(resolve, 0))
      await nextTick()
      
      const error = wrapper.find('.error')
      expect(error.exists()).toBe(true)
      
      const clearButton = error.find('button')
      await clearButton.trigger('click')
      
      expect(wrapper.find('.error').exists()).toBe(false)
    })
  })

  describe('form data handling', () => {
    it('should update form data when SearchForm emits update:modelValue', async () => {
      const searchForm = wrapper.findComponent({ name: 'SearchForm' })
      
      await searchForm.vm.$emit('update:modelValue', {
        query: 'new query',
        address: 'new address'
      })
      
      expect(wrapper.vm.formData).toEqual({
        query: 'new query',
        address: 'new address'
      })
    })
  })

  describe('state management', () => {
    it('should clear results when starting new search', async () => {
      // First successful search
      mockPerformTriage.mockResolvedValueOnce(mockTriageResponse)
      
      const searchForm = wrapper.findComponent({ name: 'SearchForm' })
      await searchForm.vm.$emit('submit', { query: 'first query', address: '' })
      await new Promise(resolve => setTimeout(resolve, 0))
      await nextTick()
      
      expect(wrapper.findComponent({ name: 'SearchResults' }).exists()).toBe(true)
      
      // Start second search
      mockPerformTriage.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockTriageResponse), 100))
      )
      
      searchForm.vm.$emit('submit', { query: 'second query', address: '' })
      await nextTick()
      
      // Results should be cleared immediately when new search starts
      expect(wrapper.vm.result).toBeNull()
    })

    it('should reset error state when starting new search', async () => {
      // First, cause an error
      mockPerformTriage.mockRejectedValueOnce(new Error('First error'))
      
      const searchForm = wrapper.findComponent({ name: 'SearchForm' })
      await searchForm.vm.$emit('submit', { query: 'error query', address: '' })
      await new Promise(resolve => setTimeout(resolve, 0))
      await nextTick()
      
      expect(wrapper.find('.error').exists()).toBe(true)
      
      // Start new search (don't wait for completion)
      mockPerformTriage.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockTriageResponse), 100))
      )
      
      searchForm.vm.$emit('submit', { query: 'new query', address: '' })
      await nextTick()
      
      // Error should be cleared immediately when new search starts
      expect(wrapper.vm.error).toBe('')
      expect(wrapper.find('.error').exists()).toBe(false)
    })
  })

  describe('component integration', () => {
    it('should pass correct props to SearchForm', () => {
      const searchForm = wrapper.findComponent({ name: 'SearchForm' })
      
      expect(searchForm.props('modelValue')).toEqual({
        query: '',
        address: ''
      })
      expect(searchForm.props('isLoading')).toBe(false)
    })

    it('should pass correct props to SearchResults when results exist', async () => {
      mockPerformTriage.mockResolvedValueOnce(mockTriageResponse)
      
      const searchForm = wrapper.findComponent({ name: 'SearchForm' })
      await searchForm.vm.$emit('submit', { query: 'test query', address: '' })
      await new Promise(resolve => setTimeout(resolve, 0))
      await nextTick()
      
      const searchResults = wrapper.findComponent({ name: 'SearchResults' })
      expect(searchResults.exists()).toBe(true)
      expect(searchResults.props('result')).toEqual(mockTriageResponse)
    })
  })

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const h1 = wrapper.find('h1')
      expect(h1.exists()).toBe(true)
      expect(h1.text()).toBe('Search Regulatory Requirements')
    })

    it('should have descriptive subtitle text', () => {
      const subtitle = wrapper.find('.search-subtitle')
      expect(subtitle.text()).toContain('Australian government')
      expect(subtitle.text()).toContain('permits, licences, and regulations')
    })

    it('should have proper error message structure', async () => {
      mockPerformTriage.mockRejectedValueOnce(new Error('Test error'))
      
      const searchForm = wrapper.findComponent({ name: 'SearchForm' })
      await searchForm.vm.$emit('submit', { query: 'test', address: '' })
      await new Promise(resolve => setTimeout(resolve, 0))
      await nextTick()
      
      const error = wrapper.find('.error')
      expect(error.find('h3').text()).toBe('Search Error')
      expect(error.find('button').text()).toBe('Try Again')
    })
  })

  describe('responsive design', () => {
    it('should have responsive classes', () => {
      expect(wrapper.find('.search').exists()).toBe(true)
      expect(wrapper.find('.search-header').exists()).toBe(true)
    })
  })
})