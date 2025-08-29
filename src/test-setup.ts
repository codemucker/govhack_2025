import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import { setupTestEnvironment } from './utils/testHelpers'

/**
 * Global test setup file
 * This file is run before all tests
 */

// Setup test environment
setupTestEnvironment()

// Configure Vue Test Utils
config.global.mocks = {
  // Mock i18n
  $t: (key: string, fallback?: string, params?: any) => {
    if (params) {
      let result = fallback || key
      Object.keys(params).forEach(param => {
        result = result.replace(`{${param}}`, params[param])
      })
      return result
    }
    return fallback || key
  },
  
  // Mock router
  $route: {
    path: '/',
    name: 'home',
    params: {},
    query: {},
    meta: {}
  },
  
  $router: {
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    go: vi.fn(),
    currentRoute: {
      value: {
        path: '/',
        name: 'home',
        params: {},
        query: {},
        meta: {}
      }
    }
  }
}

// Global stubs for common components
config.global.stubs = {
  // Teleport components
  Teleport: true,
  
  // Common external components
  RouterLink: {
    template: '<a><slot /></a>',
    props: ['to']
  },
  RouterView: {
    template: '<div><slot /></div>'
  }
}

// Global provides for dependency injection
config.global.provide = {
  // Error handler
  errorHandler: {
    handleError: vi.fn(),
    clearError: vi.fn(),
    clearAllErrors: vi.fn(),
    errors: { value: [] },
    activeErrors: { value: [] }
  },
  
  // Notifications
  notifications: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
    notifications: { value: [] },
    activeNotifications: { value: [] }
  },
  
  // Screen reader
  screenReader: {
    announce: vi.fn()
  }
}

// Mock environment variables for tests
process.env.NODE_ENV = 'test'