import { ref, type Ref } from 'vue'
import axios, { type AxiosResponse } from 'axios'

// API types based on the backend contracts
export interface TriageRequest {
  query: string
  address?: string
}

export interface TriageResponse {
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

export interface SearchSuggestion {
  query: string
  category: 'business' | 'property' | 'personal' | 'other'
  popularity: number
}

// Create axios instance with interceptors for development
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Mock data for development/testing
const MOCK_SUGGESTIONS: SearchSuggestion[] = [
  { query: 'open a café', category: 'business', popularity: 95 },
  { query: 'build a fence', category: 'property', popularity: 87 },
  { query: 'start a food truck', category: 'business', popularity: 82 },
  { query: 'renovate bathroom', category: 'property', popularity: 78 },
  { query: 'get married', category: 'personal', popularity: 76 },
  { query: 'register a business', category: 'business', popularity: 71 },
  { query: 'build a deck', category: 'property', popularity: 69 },
  { query: 'install solar panels', category: 'property', popularity: 65 },
]

const MOCK_TRIAGE_RESPONSE: TriageResponse = {
  query: {
    raw: 'open a café in Brisbane',
    location: {
      address: 'Brisbane QLD',
      council: 'Brisbane City Council',
      state: 'Queensland'
    },
    assumptions: [
      'New business (not transferring existing licence)',
      'Food service premises requiring commercial kitchen',
      'Seating for customers (dine-in service)'
    ]
  },
  jurisdictions: [
    {
      name: 'Brisbane City Council',
      level: 'local',
      confidence: 0.92
    },
    {
      name: 'Queensland Government',
      level: 'state',
      confidence: 0.88
    },
    {
      name: 'Australian Government',
      level: 'federal',
      confidence: 0.76
    }
  ],
  requirements: [
    {
      title: 'Business Registration & ABN',
      authority: 'Australian Business Register',
      actions: [
        {
          step: 1,
          desc: 'Register business name with ASIC',
          link: 'https://asic.gov.au/for-business/registering-a-business-name'
        },
        {
          step: 2,
          desc: 'Apply for Australian Business Number (ABN)',
          link: 'https://abr.business.gov.au'
        }
      ],
      notes: ['Required before applying for local permits']
    },
    {
      title: 'Food Business Licence',
      authority: 'Brisbane City Council',
      actions: [
        {
          step: 1,
          desc: 'Submit food business notification',
          link: 'https://www.brisbane.qld.gov.au/business-and-trade/business-licences-and-permits/food-business-licences'
        },
        {
          step: 2,
          desc: 'Arrange pre-opening inspection',
        },
        {
          step: 3,
          desc: 'Obtain food safety supervisor certification'
        }
      ],
      notes: ['Must be completed before serving food to public']
    }
  ],
  contacts: [
    {
      authority: 'Brisbane City Council',
      type: 'Business Support',
      phone: '07 3403 8888',
      url: 'https://www.brisbane.qld.gov.au/business-and-trade'
    },
    {
      authority: 'Business Queensland',
      type: 'State Government Support',
      url: 'https://www.business.qld.gov.au'
    }
  ],
  disclaimer: 'This information is for guidance only and should not be considered legal advice. Always verify current requirements with the relevant authorities.'
}

// Development interceptor - uncomment to use mock data during development
if (import.meta.env.DEV) {
  api.interceptors.response.use(
    response => response,
    async error => {
      // If API endpoint doesn't exist yet, return mock data
      if (error.response?.status === 404 && error.config.url?.includes('/triage/')) {
        console.info('🔧 Using mock triage response for development')
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800))
        
        return Promise.resolve({
          data: MOCK_TRIAGE_RESPONSE,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config
        } as AxiosResponse)
      }
      
      return Promise.reject(error)
    }
  )
}

/**
 * Composable for search suggestions with debouncing
 * @param initialQuery - Initial search query
 * @returns Object with suggestions state and search function
 */
export function useSearchSuggestions(initialQuery: string = '') {
  const suggestions: Ref<SearchSuggestion[]> = ref([])
  const isLoading = ref(false)
  const error = ref('')

  let debounceTimer: number | undefined

  /**
   * Search for query suggestions
   * @param query - Search query to get suggestions for
   * @example
   * const { searchSuggestions } = useSearchSuggestions()
   * await searchSuggestions('open a')
   */
  const searchSuggestions = async (query: string) => {
    if (!query.trim()) {
      suggestions.value = []
      return
    }

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = window.setTimeout(async () => {
      isLoading.value = true
      error.value = ''

      try {
        // For now, use filtered mock data
        // TODO: Replace with real API call when backend is ready
        await new Promise(resolve => setTimeout(resolve, 200)) // Simulate API call
        
        suggestions.value = MOCK_SUGGESTIONS
          .filter(suggestion => 
            suggestion.query.toLowerCase().includes(query.toLowerCase())
          )
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, 6)
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to load suggestions'
        console.error('Search suggestions error:', err)
      } finally {
        isLoading.value = false
      }
    }, 300) // 300ms debounce
  }

  return {
    suggestions,
    isLoading,
    error,
    searchSuggestions
  }
}

/**
 * Composable for triage API calls
 * @returns Object with triage state and search function
 */
export function useTriageSearch() {
  const result: Ref<TriageResponse | null> = ref(null)
  const isLoading = ref(false)
  const error = ref('')

  /**
   * Perform triage search
   * @param request - Triage request parameters
   * @example
   * const { performTriage } = useTriageSearch()
   * await performTriage({ query: 'open a café', address: 'Brisbane QLD' })
   * @throws {Error} When request fails or validation errors occur
   */
  const performTriage = async (request: TriageRequest): Promise<TriageResponse> => {
    if (!request.query.trim()) {
      throw new Error('Query is required')
    }

    isLoading.value = true
    error.value = ''
    result.value = null

    try {
      const response = await api.post<TriageResponse>('/v1/triage/demo-public', request)
      result.value = response.data
      return response.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Triage request failed'
      error.value = message
      throw new Error(message)
    } finally {
      isLoading.value = false
    }
  }

  return {
    result,
    isLoading,
    error,
    performTriage
  }
}