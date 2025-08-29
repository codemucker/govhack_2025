import { vi } from 'vitest'

/**
 * Test helper utilities for LegalEase backend testing
 */

export function setupTestEnvironment() {
  // Mock fetch for API calls
  global.fetch = vi.fn() as any

  // Mock console methods to reduce test noise
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
  
  // Keep console.error for actual test failures
  const originalError = console.error
  vi.spyOn(console, 'error').mockImplementation((message, ...args) => {
    // Allow through legitimate test errors
    if (typeof message === 'string' && message.includes('Test failed')) {
      originalError(message, ...args)
    }
  })

  // Mock Date for consistent testing
  const mockDate = new Date('2025-01-01T00:00:00.000Z')
  vi.setSystemTime(mockDate)

  // Mock process.env for tests
  process.env.NODE_ENV = 'test'
  process.env.OPENAI_API_KEY = 'test-key'
}

export function createMockResponse(data: any, options: { status?: number; statusText?: string } = {}) {
  return {
    ok: (options.status || 200) >= 200 && (options.status || 200) < 300,
    status: options.status || 200,
    statusText: options.statusText || 'OK',
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Headers(),
    url: 'https://test.example.com'
  }
}

export function createMockTriageRequest() {
  return {
    query: 'I want to open a cafe in Brisbane, what permits do I need?',
    address: 'Brisbane, QLD',
    context: {
      location: 'Brisbane, QLD',
      userPreferences: {
        detailLevel: 'detailed' as const
      }
    }
  }
}

export function createMockTriageResponse() {
  return {
    success: true,
    query: {
      raw: 'I want to open a cafe in Brisbane, what permits do I need?',
      location: {
        address: 'Brisbane, QLD',
        state: 'Queensland',
        council: 'Brisbane City Council',
        country: 'Australia'
      },
      assumptions: ['New business (not transferring existing licence)'],
      processedKeywords: ['cafe', 'brisbane', 'permits', 'business']
    },
    jurisdictions: [
      {
        name: 'Brisbane City Council',
        level: 'local' as const,
        confidence: 0.95,
        authority: 'Brisbane City Council'
      },
      {
        name: 'Queensland Government', 
        level: 'state' as const,
        confidence: 0.90,
        authority: 'Queensland'
      },
      {
        name: 'Australian Government',
        level: 'federal' as const,
        confidence: 0.85,
        authority: 'Commonwealth of Australia'
      }
    ],
    requirements: [
      {
        title: 'Business Registration & ABN',
        authority: 'Australian Business Register',
        mandatory: true,
        estimatedCost: '$40-$500',
        estimatedTimeframe: '1-3 weeks',
        actions: [
          {
            step: 1,
            desc: 'Register business name with ASIC (if applicable)',
            link: 'https://asic.gov.au/for-business/registering-a-business-name',
            timeframe: '1-2 days',
            cost: '$40-$100',
            priority: 'high' as const
          }
        ],
        notes: ['Required before applying for other permits']
      }
    ],
    contacts: [
      {
        authority: 'Australian Business Register',
        type: 'Business Registration Support',
        phone: '13 72 26',
        url: 'https://abr.business.gov.au',
        operatingHours: 'Monday to Friday, 8:00am to 6:00pm AEST'
      }
    ],
    confidence: 0.92,
    disclaimer: '⚠️ IMPORTANT: This information is general in nature and should not be considered legal advice.',
    estimatedComplexity: 'medium' as const,
    totalEstimatedCost: '$240-$1300',
    totalEstimatedTimeframe: '3-9 weeks',
    nextSteps: [
      'Register business name with ASIC (if applicable) (Australian Business Register)',
      'Apply for Australian Business Number (ABN) (Australian Business Register)'
    ],
    warningsAndRisks: [
      'Requirements may vary by location and circumstances',
      'Always verify current requirements with relevant authorities before proceeding'
    ]
  }
}

export function mockFetchSuccess(data: any, status: number = 200) {
  return vi.mocked(global.fetch).mockResolvedValueOnce(
    createMockResponse(data, { status }) as any
  )
}

export function mockFetchError(message: string, status: number = 500) {
  return vi.mocked(global.fetch).mockRejectedValueOnce(
    new Error(message)
  )
}

export function resetAllMocks() {
  vi.clearAllMocks()
  vi.resetAllMocks()
}