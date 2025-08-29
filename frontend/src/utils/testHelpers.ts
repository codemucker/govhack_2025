import { mount, VueWrapper, MountingOptions } from '@vue/test-utils'
import { createRouter, createWebHistory, Router } from 'vue-router'
import { vi, MockedFunction } from 'vitest'
import { nextTick } from 'vue'

/**
 * Enhanced test utilities for Vue.js testing with comprehensive helpers
 */

export interface TestRouterOptions {
  initialRoute?: string
  routes?: Array<{
    path: string
    name?: string
    component?: any
    meta?: any
  }>
}

export interface MockApiOptions {
  baseUrl?: string
  defaultDelay?: number
  defaultStatus?: number
}

export interface TestUserOptions {
  id?: string
  name?: string
  email?: string
  role?: string
  permissions?: string[]
}

/**
 * Create a test router with sensible defaults
 */
export function createTestRouter(options: TestRouterOptions = {}): Router {
  const { initialRoute = '/', routes = [] } = options

  const defaultRoutes = [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/search', name: 'search', component: { template: '<div>Search</div>' } },
    { path: '/documents', name: 'documents', component: { template: '<div>Documents</div>' } },
    { path: '/analytics', name: 'analytics', component: { template: '<div>Analytics</div>' } },
    { path: '/profile', name: 'profile', component: { template: '<div>Profile</div>' } },
    { path: '/settings', name: 'settings', component: { template: '<div>Settings</div>' } },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: { template: '<div>Not Found</div>' } }
  ]

  const router = createRouter({
    history: createWebHistory(),
    routes: [...defaultRoutes, ...routes]
  })

  // Navigate to initial route
  router.push(initialRoute)

  return router
}

/**
 * Create global mounting options with common test dependencies
 */
export function createMountOptions(options: {
  router?: Router
  mocks?: Record<string, any>
  provide?: Record<string, any>
  plugins?: any[]
} = {}): MountingOptions<any> {
  const { 
    router = createTestRouter(),
    mocks = {},
    provide = {},
    plugins = []
  } = options

  return {
    global: {
      plugins: [router, ...plugins],
      mocks: {
        $t: (key: string, fallback?: string, params?: any) => {
          // Simple i18n mock
          if (params) {
            let result = fallback || key
            Object.keys(params).forEach(param => {
              result = result.replace(`{${param}}`, params[param])
            })
            return result
          }
          return fallback || key
        },
        $route: router.currentRoute.value,
        $router: router,
        ...mocks
      },
      provide: {
        errorHandler: {
          handleError: vi.fn(),
          clearError: vi.fn(),
          clearAllErrors: vi.fn()
        },
        notifications: {
          success: vi.fn(),
          error: vi.fn(),
          warning: vi.fn(),
          info: vi.fn(),
          dismiss: vi.fn()
        },
        ...provide
      },
      stubs: {
        Teleport: true,
        Transition: false,
        TransitionGroup: false
      }
    }
  }
}

/**
 * Enhanced mount helper with common test setup
 */
export function mountComponent<T = any>(
  component: any,
  options: MountingOptions<T> & {
    router?: Router
    user?: TestUserOptions
    waitForRouter?: boolean
  } = {}
): Promise<VueWrapper<T>> {
  const { router, user, waitForRouter = true, ...mountOptions } = options

  const testRouter = router || createTestRouter()
  const mountOpts = createMountOptions({ router: testRouter })
  
  // Merge options
  const finalOptions = {
    ...mountOpts,
    ...mountOptions,
    global: {
      ...mountOpts.global,
      ...mountOptions.global,
      mocks: {
        ...mountOpts.global?.mocks,
        ...mountOptions.global?.mocks
      },
      provide: {
        ...mountOpts.global?.provide,
        ...mountOptions.global?.provide,
        // Mock user context if provided
        ...(user && {
          currentUser: {
            value: user
          }
        })
      }
    }
  }

  const wrapper = mount(component, finalOptions)

  // Wait for router to be ready if needed
  if (waitForRouter) {
    return testRouter.isReady().then(() => wrapper)
  }

  return Promise.resolve(wrapper)
}

/**
 * Mock fetch with flexible response options
 */
export function mockFetch(options: MockApiOptions = {}) {
  const { baseUrl = '', defaultDelay = 0, defaultStatus = 200 } = options

  const mockResponses = new Map<string, any>()
  const mockErrors = new Map<string, Error>()

  const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`
    
    // Simulate network delay
    if (defaultDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, defaultDelay))
    }

    // Check for mock errors
    const error = mockErrors.get(fullUrl) || mockErrors.get(url)
    if (error) {
      throw error
    }

    // Check for mock responses
    const response = mockResponses.get(fullUrl) || mockResponses.get(url)
    if (response) {
      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status || defaultStatus,
        statusText: response.statusText || 'OK',
        json: () => Promise.resolve(response.data),
        text: () => Promise.resolve(JSON.stringify(response.data)),
        blob: () => Promise.resolve(new Blob([JSON.stringify(response.data)])),
        headers: new Headers(response.headers || {}),
        clone: () => ({ ...response })
      }
    }

    // Default response
    return {
      ok: true,
      status: defaultStatus,
      statusText: 'OK',
      json: () => Promise.resolve({}),
      text: () => Promise.resolve('{}'),
      blob: () => Promise.resolve(new Blob(['{}'])),
      headers: new Headers(),
      clone: () => ({})
    }
  })

  // Helper methods
  const setResponse = (url: string, data: any, options: { status?: number; statusText?: string; headers?: Record<string, string> } = {}) => {
    mockResponses.set(url, {
      data,
      status: options.status || defaultStatus,
      statusText: options.statusText,
      headers: options.headers
    })
  }

  const setError = (url: string, error: Error) => {
    mockErrors.set(url, error)
  }

  const clearMocks = () => {
    mockResponses.clear()
    mockErrors.clear()
    fetchMock.mockClear()
  }

  // Install mock
  global.fetch = fetchMock as any

  return {
    fetch: fetchMock,
    setResponse,
    setError,
    clearMocks,
    responses: mockResponses,
    errors: mockErrors
  }
}

/**
 * Test data factories
 */
export const factories = {
  user: (overrides: Partial<TestUserOptions> = {}): TestUserOptions => ({
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    permissions: ['read'],
    ...overrides
  }),

  document: (overrides: any = {}) => ({
    id: '1',
    title: 'Test Document',
    content: 'This is a test document',
    author: 'Test Author',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'published',
    ...overrides
  }),

  searchResult: (overrides: any = {}) => ({
    id: '1',
    title: 'Test Result',
    description: 'This is a test search result',
    url: '/test-result',
    score: 0.95,
    metadata: {},
    ...overrides
  }),

  errorInfo: (overrides: any = {}) => ({
    id: 'error_1',
    type: 'error',
    title: 'Test Error',
    message: 'This is a test error',
    timestamp: new Date(),
    recoverable: true,
    ...overrides
  }),

  notification: (overrides: any = {}) => ({
    id: 'notification_1',
    type: 'info',
    message: 'Test notification',
    timestamp: new Date(),
    read: false,
    ...overrides
  })
}

/**
 * Common test utilities
 */
export const testUtils = {
  /**
   * Wait for the next tick and any pending promises
   */
  async waitForNextTick() {
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
  },

  /**
   * Wait for an element to appear
   */
  async waitForElement(wrapper: VueWrapper<any>, selector: string, timeout = 1000): Promise<void> {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      await this.waitForNextTick()
      if (wrapper.find(selector).exists()) {
        return
      }
    }
    throw new Error(`Element ${selector} not found within ${timeout}ms`)
  },

  /**
   * Wait for an element to disappear
   */
  async waitForElementToDisappear(wrapper: VueWrapper<any>, selector: string, timeout = 1000): Promise<void> {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      await this.waitForNextTick()
      if (!wrapper.find(selector).exists()) {
        return
      }
    }
    throw new Error(`Element ${selector} still exists after ${timeout}ms`)
  },

  /**
   * Simulate user interaction with proper event handling
   */
  async userClick(wrapper: VueWrapper<any>, selector: string): Promise<void> {
    const element = wrapper.find(selector)
    if (!element.exists()) {
      throw new Error(`Element ${selector} not found`)
    }
    await element.trigger('click')
    await this.waitForNextTick()
  },

  /**
   * Simulate user input
   */
  async userType(wrapper: VueWrapper<any>, selector: string, text: string): Promise<void> {
    const element = wrapper.find(selector)
    if (!element.exists()) {
      throw new Error(`Element ${selector} not found`)
    }
    await element.setValue(text)
    await this.waitForNextTick()
  },

  /**
   * Simulate keyboard events
   */
  async userKeyPress(wrapper: VueWrapper<any>, selector: string, key: string, options: any = {}): Promise<void> {
    const element = wrapper.find(selector)
    if (!element.exists()) {
      throw new Error(`Element ${selector} not found`)
    }
    await element.trigger('keydown', { key, ...options })
    await this.waitForNextTick()
  },

  /**
   * Simulate touch events
   */
  async userTouch(wrapper: VueWrapper<any>, selector: string, touches: Array<{ clientX: number; clientY: number }>): Promise<void> {
    const element = wrapper.find(selector)
    if (!element.exists()) {
      throw new Error(`Element ${selector} not found`)
    }
    await element.trigger('touchstart', { touches })
    await this.waitForNextTick()
  },

  /**
   * Mock console methods for testing
   */
  mockConsole() {
    const originalMethods = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    }

    const mocks = {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn()
    }

    // Replace console methods
    Object.entries(mocks).forEach(([method, mock]) => {
      (console as any)[method] = mock
    })

    return {
      mocks,
      restore: () => {
        Object.entries(originalMethods).forEach(([method, original]) => {
          (console as any)[method] = original
        })
      }
    }
  },

  /**
   * Mock localStorage for testing
   */
  mockLocalStorage() {
    const storage = new Map<string, string>()

    const mockStorage = {
      getItem: vi.fn((key: string) => storage.get(key) || null),
      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value)
      }),
      removeItem: vi.fn((key: string) => {
        storage.delete(key)
      }),
      clear: vi.fn(() => {
        storage.clear()
      }),
      key: vi.fn((index: number) => {
        const keys = Array.from(storage.keys())
        return keys[index] || null
      }),
      get length() {
        return storage.size
      }
    }

    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true
    })

    return mockStorage
  },

  /**
   * Mock IntersectionObserver
   */
  mockIntersectionObserver() {
    const mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn()
    }

    global.IntersectionObserver = vi.fn().mockImplementation(() => mockObserver)

    return mockObserver
  },

  /**
   * Mock ResizeObserver
   */
  mockResizeObserver() {
    const mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn()
    }

    global.ResizeObserver = vi.fn().mockImplementation(() => mockObserver)

    return mockObserver
  },

  /**
   * Mock matchMedia for responsive testing
   */
  mockMatchMedia(matches = false) {
    const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia
    })

    return mockMatchMedia
  },

  /**
   * Create a mock component for testing
   */
  createMockComponent(name: string, props: string[] = []) {
    return {
      name,
      props,
      template: `<div data-testid="${name.toLowerCase()}-mock"><slot /></div>`
    }
  }
}

/**
 * Accessibility testing helpers
 */
export const a11yUtils = {
  /**
   * Check if element has proper ARIA attributes
   */
  hasAriaLabel(wrapper: VueWrapper<any>, selector: string): boolean {
    const element = wrapper.find(selector)
    return element.exists() && (
      element.attributes('aria-label') !== undefined ||
      element.attributes('aria-labelledby') !== undefined
    )
  },

  /**
   * Check if element has proper role
   */
  hasRole(wrapper: VueWrapper<any>, selector: string, role: string): boolean {
    const element = wrapper.find(selector)
    return element.exists() && element.attributes('role') === role
  },

  /**
   * Check if element is keyboard accessible
   */
  isKeyboardAccessible(wrapper: VueWrapper<any>, selector: string): boolean {
    const element = wrapper.find(selector)
    if (!element.exists()) return false

    const tabIndex = element.attributes('tabindex')
    const tagName = element.element.tagName.toLowerCase()
    
    // Interactive elements are naturally focusable
    const interactiveElements = ['a', 'button', 'input', 'select', 'textarea']
    
    return interactiveElements.includes(tagName) || 
           (tabIndex !== undefined && parseInt(tabIndex) >= 0)
  },

  /**
   * Check if element has sufficient color contrast (basic check)
   */
  async hasSufficientContrast(element: Element): Promise<boolean> {
    // This is a simplified check - in a real app you'd use a library like axe-core
    const styles = window.getComputedStyle(element)
    const color = styles.color
    const backgroundColor = styles.backgroundColor
    
    // Basic check - ensure colors are defined
    return color !== 'initial' && backgroundColor !== 'initial'
  }
}

/**
 * Performance testing helpers
 */
export const performanceUtils = {
  /**
   * Measure component render time
   */
  async measureRenderTime(mountFn: () => Promise<VueWrapper<any>>): Promise<number> {
    const start = performance.now()
    await mountFn()
    const end = performance.now()
    return end - start
  },

  /**
   * Measure interaction response time
   */
  async measureInteractionTime(
    wrapper: VueWrapper<any>,
    interaction: () => Promise<void>
  ): Promise<number> {
    const start = performance.now()
    await interaction()
    await testUtils.waitForNextTick()
    const end = performance.now()
    return end - start
  }
}

/**
 * Setup and teardown helpers
 */
export function setupTestEnvironment() {
  // Mock common global APIs
  testUtils.mockLocalStorage()
  testUtils.mockIntersectionObserver()
  testUtils.mockResizeObserver()
  testUtils.mockMatchMedia()

  // Mock navigator APIs
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true
  })

  Object.defineProperty(navigator, 'maxTouchPoints', {
    writable: true,
    value: 0
  })

  // Mock URL constructor if not available
  if (typeof URL === 'undefined') {
    global.URL = class URL {
      constructor(public href: string) {}
      toString() { return this.href }
    }
  }
}

export function cleanupTestEnvironment() {
  vi.clearAllMocks()
  vi.restoreAllMocks()
}