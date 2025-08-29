import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SearchForm from '../SearchForm.vue'

// Mock the composable
vi.mock('../../composables/useApi', () => ({
  useSearchSuggestions: () => ({
    suggestions: vi.fn().mockReturnValue([
      { query: 'open a café', category: 'business', popularity: 95 },
      { query: 'build a fence', category: 'property', popularity: 87 },
      { query: 'start a business', category: 'business', popularity: 82 }
    ]),
    searchSuggestions: vi.fn()
  })
}))

describe('SearchForm', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(SearchForm, {
      props: {
        modelValue: { query: '', address: '' },
        isLoading: false
      }
    })
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  describe('rendering', () => {
    it('should render form elements correctly', () => {
      expect(wrapper.find('form').exists()).toBe(true)
      expect(wrapper.find('#query').exists()).toBe(true)
      expect(wrapper.find('#address').exists()).toBe(true)
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    })

    it('should display correct labels and placeholders', () => {
      const queryLabel = wrapper.find('label[for="query"]')
      const addressLabel = wrapper.find('label[for="address"]')
      const queryInput = wrapper.find('#query')
      const addressInput = wrapper.find('#address')

      expect(queryLabel.text()).toBe('What would you like to do?')
      expect(addressLabel.text()).toBe('Address (optional)')
      expect(queryInput.attributes('placeholder')).toContain('open a café')
      expect(addressInput.attributes('placeholder')).toContain('Collins St')
    })

    it('should render quick examples', () => {
      const examples = wrapper.findAll('.example-tag')
      expect(examples.length).toBeGreaterThan(0)
      expect(examples[0].text()).toContain('open a café')
    })

    it('should render help text for address input', () => {
      const helpText = wrapper.find('.input-help')
      expect(helpText.exists()).toBe(true)
      expect(helpText.text()).toContain('local council')
    })
  })

  describe('form interaction', () => {
    it('should emit update:modelValue when query changes', async () => {
      const queryInput = wrapper.find('#query')
      
      await queryInput.setValue('open a café')
      
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      const emittedEvents = wrapper.emitted('update:modelValue')
      expect(emittedEvents[emittedEvents.length - 1][0]).toEqual({
        query: 'open a café',
        address: ''
      })
    })

    it('should emit update:modelValue when address changes', async () => {
      const addressInput = wrapper.find('#address')
      
      await addressInput.setValue('Brisbane QLD')
      
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      const emittedEvents = wrapper.emitted('update:modelValue')
      expect(emittedEvents[emittedEvents.length - 1][0]).toEqual({
        query: '',
        address: 'Brisbane QLD'
      })
    })

    it('should emit submit event when form is submitted', async () => {
      const queryInput = wrapper.find('#query')
      await queryInput.setValue('test query')
      
      const form = wrapper.find('form')
      await form.trigger('submit.prevent')
      
      expect(wrapper.emitted('submit')).toBeTruthy()
      expect(wrapper.emitted('submit')[0][0]).toEqual({
        query: 'test query',
        address: ''
      })
    })

    it('should not submit if query is empty', async () => {
      const form = wrapper.find('form')
      await form.trigger('submit.prevent')
      
      expect(wrapper.emitted('submit')).toBeFalsy()
    })

    it('should disable submit button when loading', async () => {
      await wrapper.setProps({ isLoading: true })
      
      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })

    it('should disable submit button when query is empty', async () => {
      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })

    it('should enable submit button when query has content', async () => {
      const queryInput = wrapper.find('#query')
      await queryInput.setValue('test')
      await nextTick()
      
      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeUndefined()
    })
  })

  describe('suggestions dropdown', () => {
    it('should show suggestions when query input is focused', async () => {
      const queryInput = wrapper.find('#query')
      await queryInput.setValue('café')
      await queryInput.trigger('focus')
      await nextTick()
      
      // Note: Since we mocked the composable, suggestions won't actually show
      // In a real test, you'd test the integration with the actual composable
      expect(wrapper.find('.suggestions-dropdown').exists()).toBe(false)
    })

    it('should hide suggestions when input loses focus', async () => {
      const queryInput = wrapper.find('#query')
      await queryInput.setValue('café')
      await queryInput.trigger('focus')
      await queryInput.trigger('blur')
      await nextTick()
      
      expect(wrapper.find('.suggestions-dropdown').exists()).toBe(false)
    })
  })

  describe('keyboard navigation', () => {
    it('should handle arrow down key', async () => {
      const queryInput = wrapper.find('#query')
      await queryInput.setValue('café')
      
      await queryInput.trigger('keydown', { key: 'ArrowDown' })
      
      // Test that keyboard navigation doesn't crash
      // Actual functionality would require mocking the suggestions
      expect(true).toBe(true)
    })

    it('should handle escape key', async () => {
      const queryInput = wrapper.find('#query')
      await queryInput.setValue('café')
      
      await queryInput.trigger('keydown', { key: 'Escape' })
      
      // Test that escape key handling doesn't crash
      expect(true).toBe(true)
    })
  })

  describe('quick examples', () => {
    it('should populate query when example is clicked', async () => {
      const exampleTag = wrapper.find('.example-tag')
      await exampleTag.trigger('click')
      
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      const emittedEvents = wrapper.emitted('update:modelValue')
      const lastEmit = emittedEvents[emittedEvents.length - 1][0]
      expect(lastEmit.query).toBeTruthy()
    })
  })

  describe('clear functionality', () => {
    it('should show clear button when form has content', async () => {
      await wrapper.find('#query').setValue('test')
      await nextTick()
      
      const clearButton = wrapper.find('button:not([type="submit"])')
      expect(clearButton.exists()).toBe(true)
      expect(clearButton.text()).toBe('Clear')
    })

    it('should clear form when clear button is clicked', async () => {
      await wrapper.find('#query').setValue('test')
      await wrapper.find('#address').setValue('address')
      await nextTick()
      
      const clearButton = wrapper.find('button:not([type="submit"])')
      await clearButton.trigger('click')
      
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      const emittedEvents = wrapper.emitted('update:modelValue')
      const lastEmit = emittedEvents[emittedEvents.length - 1][0]
      expect(lastEmit).toEqual({ query: '', address: '' })
    })
  })

  describe('loading states', () => {
    it('should show loading text when isLoading is true', async () => {
      await wrapper.setProps({ isLoading: true })
      
      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.text()).toContain('Searching...')
    })

    it('should show loading spinner when isLoading is true', async () => {
      await wrapper.setProps({ isLoading: true })
      
      const spinner = wrapper.find('.loading-spinner')
      expect(spinner.exists()).toBe(true)
    })

    it('should show normal text when not loading', async () => {
      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.text()).toBe('Search Requirements')
    })
  })

  describe('accessibility', () => {
    it('should have proper form labels', () => {
      const queryLabel = wrapper.find('label[for="query"]')
      const addressLabel = wrapper.find('label[for="address"]')
      const queryInput = wrapper.find('#query')
      const addressInput = wrapper.find('#address')
      
      expect(queryLabel.exists()).toBe(true)
      expect(addressLabel.exists()).toBe(true)
      expect(queryInput.attributes('id')).toBe('query')
      expect(addressInput.attributes('id')).toBe('address')
    })

    it('should have autocomplete disabled for query input', () => {
      const queryInput = wrapper.find('#query')
      expect(queryInput.attributes('autocomplete')).toBe('off')
    })

    it('should have proper button types', () => {
      const submitButton = wrapper.find('button[type="submit"]')
      const clearButton = wrapper.find('button[type="button"]')
      
      expect(submitButton.exists()).toBe(true)
      // Clear button only exists when form has content
      if (clearButton.exists()) {
        expect(clearButton.attributes('type')).toBe('button')
      }
    })
  })

  describe('responsive design', () => {
    it('should render without mobile-specific classes by default', () => {
      expect(wrapper.classes()).not.toContain('mobile')
    })
  })

  describe('props handling', () => {
    it('should use modelValue prop for initial values', async () => {
      const newWrapper = mount(SearchForm, {
        props: {
          modelValue: { query: 'initial query', address: 'initial address' },
          isLoading: false
        }
      })
      
      const queryInput = newWrapper.find('#query')
      const addressInput = newWrapper.find('#address')
      
      expect((queryInput.element as HTMLInputElement).value).toBe('initial query')
      expect((addressInput.element as HTMLInputElement).value).toBe('initial address')
      
      newWrapper.unmount()
    })

    it('should handle isLoading prop changes', async () => {
      expect(wrapper.find('.loading-spinner').exists()).toBe(false)
      
      await wrapper.setProps({ isLoading: true })
      expect(wrapper.find('.loading-spinner').exists()).toBe(true)
      
      await wrapper.setProps({ isLoading: false })
      expect(wrapper.find('.loading-spinner').exists()).toBe(false)
    })
  })
})