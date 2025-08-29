import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import axios from 'axios'
import { useSearchSuggestions, useTriageSearch } from '../useApi'

// Mock axios
vi.mock('axios', () => {
  const mockAxiosInstance = {
    post: vi.fn(),
    interceptors: {
      response: {
        use: vi.fn()
      }
    }
  }
  
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance)
    }
  }
})

const mockedAxios = vi.mocked(axios)
const mockAxiosInstance = (axios.create as any)()

describe('useSearchSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('should initialize with empty suggestions', () => {
    const { suggestions, isLoading, error } = useSearchSuggestions()
    
    expect(suggestions.value).toEqual([])
    expect(isLoading.value).toBe(false)
    expect(error.value).toBe('')
  })

  it('should return empty suggestions for empty query', async () => {
    const { suggestions, searchSuggestions } = useSearchSuggestions()
    
    await searchSuggestions('')
    
    expect(suggestions.value).toEqual([])
  })

  it('should debounce search suggestions', async () => {
    const { searchSuggestions, isLoading } = useSearchSuggestions()
    
    // Start multiple searches quickly
    searchSuggestions('open')
    searchSuggestions('open a')
    searchSuggestions('open a café')
    
    // Loading should not be true yet (debounced)
    expect(isLoading.value).toBe(false)
    
    // Fast-forward past debounce delay
    vi.advanceTimersByTime(300)
    await nextTick()
    
    // Now loading should be true
    expect(isLoading.value).toBe(true)
  })

  it('should filter suggestions based on query', async () => {
    const { suggestions, searchSuggestions } = useSearchSuggestions()
    
    await searchSuggestions('café')
    vi.advanceTimersByTime(500)
    await nextTick()
    
    // Should have filtered suggestions containing 'café'
    expect(suggestions.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          query: 'open a café',
          category: 'business',
          popularity: expect.any(Number)
        })
      ])
    )
  })

  it('should limit suggestions to 6 items', async () => {
    const { suggestions, searchSuggestions } = useSearchSuggestions()
    
    await searchSuggestions('a') // Very broad search
    vi.advanceTimersByTime(500)
    await nextTick()
    
    expect(suggestions.value.length).toBeLessThanOrEqual(6)
  })

  it('should sort suggestions by popularity', async () => {
    const { suggestions, searchSuggestions } = useSearchSuggestions()
    
    await searchSuggestions('build')
    vi.advanceTimersByTime(500)
    await nextTick()
    
    // Check that suggestions are sorted by popularity (descending)
    for (let i = 1; i < suggestions.value.length; i++) {
      expect(suggestions.value[i - 1].popularity).toBeGreaterThanOrEqual(
        suggestions.value[i].popularity
      )
    }
  })
})

describe('useTriageSearch', () => {
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
        actions: [
          {
            step: 1,
            desc: 'Register business name',
            link: 'https://asic.gov.au'
          }
        ],
        notes: ['Required before trading']
      }
    ],
    contacts: [
      {
        authority: 'ASIC',
        type: 'Government',
        url: 'https://asic.gov.au'
      }
    ],
    disclaimer: 'This is for guidance only'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty state', () => {
    const { result, isLoading, error } = useTriageSearch()
    
    expect(result.value).toBeNull()
    expect(isLoading.value).toBe(false)
    expect(error.value).toBe('')
  })

  it('should perform successful triage search', async () => {
    const { result, isLoading, error, performTriage } = useTriageSearch()
    
    mockAxiosInstance.post.mockResolvedValueOnce({
      data: mockTriageResponse
    })
    
    const request = { query: 'open a café', address: 'Brisbane QLD' }
    const response = await performTriage(request)
    
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v1/triage/demo-public', request)
    expect(result.value).toEqual(mockTriageResponse)
    expect(response).toEqual(mockTriageResponse)
    expect(isLoading.value).toBe(false)
    expect(error.value).toBe('')
  })

  it('should set loading state during request', async () => {
    const { isLoading, performTriage } = useTriageSearch()
    
    // Mock a delayed response
    mockAxiosInstance.post.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: mockTriageResponse }), 100))
    )
    
    const promise = performTriage({ query: 'test query' })
    
    // Should be loading immediately after call
    expect(isLoading.value).toBe(true)
    
    await promise
    
    // Should not be loading after completion
    expect(isLoading.value).toBe(false)
  })

  it('should handle API errors', async () => {
    const { result, error, performTriage } = useTriageSearch()
    
    const errorMessage = 'API Error'
    mockAxiosInstance.post.mockRejectedValueOnce(new Error(errorMessage))
    
    await expect(performTriage({ query: 'test query' })).rejects.toThrow(errorMessage)
    
    expect(result.value).toBeNull()
    expect(error.value).toBe(errorMessage)
  })

  it('should validate empty query', async () => {
    const { performTriage } = useTriageSearch()
    
    await expect(performTriage({ query: '' })).rejects.toThrow('Query is required')
    await expect(performTriage({ query: '   ' })).rejects.toThrow('Query is required')
  })

  it('should clear previous results when starting new search', async () => {
    const { result, error, performTriage } = useTriageSearch()
    
    // Set initial state
    result.value = mockTriageResponse
    error.value = 'Previous error'
    
    mockAxiosInstance.post.mockResolvedValueOnce({ data: mockTriageResponse })
    
    await performTriage({ query: 'new query' })
    
    // Previous error should be cleared
    expect(error.value).toBe('')
  })

  it('should handle network errors gracefully', async () => {
    const { error, performTriage } = useTriageSearch()
    
    mockAxiosInstance.post.mockRejectedValueOnce({
      code: 'NETWORK_ERROR',
      message: 'Network Error'
    })
    
    await expect(performTriage({ query: 'test' })).rejects.toThrow('Network Error')
    expect(error.value).toBe('Network Error')
  })

  it('should handle HTTP status errors', async () => {
    const { error, performTriage } = useTriageSearch()
    
    mockAxiosInstance.post.mockRejectedValueOnce({
      response: {
        status: 500,
        statusText: 'Internal Server Error',
        data: { message: 'Server error' }
      }
    })
    
    await expect(performTriage({ query: 'test' })).rejects.toThrow()
    expect(error.value).toBeTruthy()
  })

  it('should include address in request when provided', async () => {
    const { performTriage } = useTriageSearch()
    
    mockAxiosInstance.post.mockResolvedValueOnce({ data: mockTriageResponse })
    
    const request = { 
      query: 'open café', 
      address: '123 Main St, Brisbane QLD' 
    }
    
    await performTriage(request)
    
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v1/triage/demo-public', request)
  })

  it('should handle undefined address correctly', async () => {
    const { performTriage } = useTriageSearch()
    
    mockAxiosInstance.post.mockResolvedValueOnce({ data: mockTriageResponse })
    
    await performTriage({ query: 'test query', address: undefined })
    
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v1/triage/demo-public', {
      query: 'test query',
      address: undefined
    })
  })
})

describe('API interceptor setup', () => {
  it('should configure axios instance correctly', () => {
    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: '/api',
      timeout: 10000,
    })
  })

  it('should set up response interceptor for development', () => {
    expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled()
  })
})