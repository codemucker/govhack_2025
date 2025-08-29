import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useErrorHandler, setupGlobalErrorHandler } from '../useErrorHandler'
import { testUtils } from '../../utils/testHelpers'

// Mock dependencies
vi.mock('../useI18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string, params?: any) => {
      if (params) {
        let result = fallback || key
        Object.keys(params).forEach(param => {
          result = result.replace(`{${param}}`, params[param])
        })
        return result
      }
      return fallback || key
    }
  })
}))

vi.mock('../useScreenReader', () => ({
  useScreenReader: () => ({
    announce: vi.fn()
  })
}))

describe('useErrorHandler', () => {
  let consoleMocks: any
  let errorHandler: ReturnType<typeof useErrorHandler>

  beforeEach(() => {
    consoleMocks = testUtils.mockConsole()
    errorHandler = useErrorHandler({
      enableLogging: true,
      enableAnalytics: true,
      maxRetries: 3
    })
  })

  afterEach(() => {
    consoleMocks.restore()
    vi.clearAllMocks()
  })

  describe('Error Creation', () => {
    it('creates error info from string', async () => {
      const errorInfo = await errorHandler.handleError('Test error message')

      expect(errorInfo.id).toBeTruthy()
      expect(errorInfo.type).toBe('error')
      expect(errorInfo.message).toBe('Test error message')
      expect(errorInfo.timestamp).toBeInstanceOf(Date)
    })

    it('creates error info from Error object', async () => {
      const error = new Error('Test error')
      error.stack = 'Error stack trace'
      
      const errorInfo = await errorHandler.handleError(error)

      expect(errorInfo.message).toBe('Test error')
      expect(errorInfo.stack).toBe('Error stack trace')
      expect(errorInfo.type).toBe('error')
    })

    it('includes context in error info', async () => {
      const context = {
        component: 'TestComponent',
        action: 'testAction',
        user: 'testUser'
      }

      const errorInfo = await errorHandler.handleError('Test error', context)

      expect(errorInfo.context).toMatchObject(context)
      expect(errorInfo.user).toBe('testUser')
    })

    it('generates unique error IDs', async () => {
      const error1 = await errorHandler.handleError('Error 1')
      const error2 = await errorHandler.handleError('Error 2')

      expect(error1.id).not.toBe(error2.id)
      expect(error1.id).toMatch(/^error_\d+_\d+$/)
      expect(error2.id).toMatch(/^error_\d+_\d+$/)
    })
  })

  describe('Error Classification', () => {
    it('identifies network errors correctly', async () => {
      const networkError = new Error('fetch failed')
      networkError.name = 'NetworkError'
      
      const errorInfo = await errorHandler.handleError(networkError)

      expect(errorInfo.title).toContain('Connection Error')
      expect(errorInfo.message).toContain('check your connection')
      expect(errorInfo.recoverable).toBe(true)
    })

    it('identifies validation errors correctly', async () => {
      const validationError = new Error('Validation failed')
      validationError.name = 'ValidationError'
      
      const errorInfo = await errorHandler.handleValidationError(validationError)

      expect(errorInfo.type).toBe('warning')
      expect(errorInfo.title).toContain('Validation Error')
    })

    it('identifies permission errors correctly', async () => {
      const permissionError = new Error('Permission denied')
      
      const errorInfo = await errorHandler.handleError(permissionError)

      expect(errorInfo.title).toContain('Permission Denied')
      expect(errorInfo.message).toContain('do not have permission')
      expect(errorInfo.recoverable).toBe(false)
    })

    it('handles timeout errors', async () => {
      const timeoutError = new Error('Request timeout')
      
      const errorInfo = await errorHandler.handleError(timeoutError)

      expect(errorInfo.message).toContain('took too long')
      expect(errorInfo.recoverable).toBe(true)
    })

    it('handles server errors', async () => {
      const serverError = new Error('Server error 500')
      
      const errorInfo = await errorHandler.handleError(serverError)

      expect(errorInfo.message).toContain('Server error')
      expect(errorInfo.recoverable).toBe(true)
    })
  })

  describe('Error Storage', () => {
    it('stores errors in local array', async () => {
      await errorHandler.handleError('Error 1')
      await errorHandler.handleError('Error 2')

      expect(errorHandler.errors.value).toHaveLength(2)
      expect(errorHandler.errors.value[0].message).toBe('Error 2') // Newest first
      expect(errorHandler.errors.value[1].message).toBe('Error 1')
    })

    it('limits error array size', async () => {
      const limitedHandler = useErrorHandler({ maxErrors: 2 })
      
      await limitedHandler.handleError('Error 1')
      await limitedHandler.handleError('Error 2')
      await limitedHandler.handleError('Error 3')

      expect(limitedHandler.errors.value).toHaveLength(2)
      expect(limitedHandler.errors.value[0].message).toBe('Error 3')
      expect(limitedHandler.errors.value[1].message).toBe('Error 2')
    })

    it('provides error statistics', async () => {
      await errorHandler.handleError('Error 1')
      await errorHandler.handleWarning('Warning 1')
      await errorHandler.handleSuccess('Success 1')

      const stats = errorHandler.errorStats.value

      expect(stats.total).toBe(3)
      expect(stats.errors).toBe(1)
      expect(stats.warnings).toBe(1)
      expect(stats.byCode.unknown).toBe(3) // No specific codes provided
    })
  })

  describe('Error Actions', () => {
    it('generates appropriate actions for recoverable errors', async () => {
      const networkError = new Error('Network failed')
      networkError.name = 'NetworkError'
      
      const errorInfo = await errorHandler.handleError(networkError)

      expect(errorInfo.actions).toBeDefined()
      expect(errorInfo.actions?.length).toBeGreaterThan(0)
      
      const hasRetryAction = errorInfo.actions?.some(action => 
        action.label.includes('Retry') || action.label.includes('retry')
      )
      expect(hasRetryAction).toBe(true)
    })

    it('generates dismiss action for all errors', async () => {
      const errorInfo = await errorHandler.handleError('Test error')

      const hasDismissAction = errorInfo.actions?.some(action => 
        action.label.includes('Dismiss') || action.label.includes('dismiss')
      )
      expect(hasDismissAction).toBe(true)
    })

    it('generates report action for errors', async () => {
      const errorInfo = await errorHandler.handleError('Test error')

      const hasReportAction = errorInfo.actions?.some(action => 
        action.label.includes('Report') || action.label.includes('report')
      )
      expect(hasReportAction).toBe(true)
    })
  })

  describe('Error Management', () => {
    it('clears specific error by ID', async () => {
      const error1 = await errorHandler.handleError('Error 1')
      const error2 = await errorHandler.handleError('Error 2')

      expect(errorHandler.errors.value).toHaveLength(2)

      errorHandler.clearError(error1.id)

      expect(errorHandler.errors.value).toHaveLength(1)
      expect(errorHandler.errors.value[0].id).toBe(error2.id)
    })

    it('clears all errors', async () => {
      await errorHandler.handleError('Error 1')
      await errorHandler.handleError('Error 2')

      expect(errorHandler.errors.value).toHaveLength(2)

      errorHandler.clearAllErrors()

      expect(errorHandler.errors.value).toHaveLength(0)
    })

    it('clears errors by type', async () => {
      await errorHandler.handleError('Error 1')
      await errorHandler.handleWarning('Warning 1')
      await errorHandler.handleSuccess('Success 1')

      expect(errorHandler.errors.value).toHaveLength(3)

      errorHandler.clearErrorsByType('error')

      expect(errorHandler.errors.value).toHaveLength(2)
      expect(errorHandler.errors.value.every(e => e.type !== 'error')).toBe(true)
    })

    it('clears old errors', async () => {
      const oldTime = Date.now() - 120000 // 2 minutes ago
      
      await errorHandler.handleError('Old error')
      // Manually set timestamp to be old
      errorHandler.errors.value[0].timestamp = new Date(oldTime)
      
      await errorHandler.handleError('New error')

      expect(errorHandler.errors.value).toHaveLength(2)

      errorHandler.clearOldErrors(60000) // Clear errors older than 1 minute

      expect(errorHandler.errors.value).toHaveLength(1)
      expect(errorHandler.errors.value[0].message).toBe('New error')
    })
  })

  describe('Error Patterns', () => {
    it('registers and matches error patterns', async () => {
      const customHandler = vi.fn().mockResolvedValue({
        id: 'custom_error',
        type: 'warning',
        title: 'Custom Error',
        message: 'Custom error handled',
        timestamp: new Date(),
        recoverable: false
      })

      errorHandler.registerErrorPattern({
        matcher: /custom error/i,
        handler: customHandler,
        priority: 10
      })

      await errorHandler.handleError('This is a custom error')

      expect(customHandler).toHaveBeenCalled()
    })

    it('uses pattern priority for matching', async () => {
      const lowPriorityHandler = vi.fn().mockResolvedValue({
        id: 'low_priority',
        type: 'error',
        title: 'Low Priority',
        message: 'Low priority handler',
        timestamp: new Date()
      })

      const highPriorityHandler = vi.fn().mockResolvedValue({
        id: 'high_priority',
        type: 'error',
        title: 'High Priority',
        message: 'High priority handler',
        timestamp: new Date()
      })

      errorHandler.registerErrorPattern({
        matcher: /test error/i,
        handler: lowPriorityHandler,
        priority: 1
      })

      errorHandler.registerErrorPattern({
        matcher: /test error/i,
        handler: highPriorityHandler,
        priority: 10
      })

      await errorHandler.handleError('test error')

      expect(highPriorityHandler).toHaveBeenCalled()
      expect(lowPriorityHandler).not.toHaveBeenCalled()
    })
  })

  describe('Context Management', () => {
    it('sets and uses error context', () => {
      const context = {
        component: 'TestComponent',
        user: 'testUser',
        route: '/test'
      }

      errorHandler.setErrorContext(context)

      // Context should be applied to new errors
      // This is tested indirectly through error creation
    })

    it('merges context with provided context', async () => {
      errorHandler.setErrorContext({
        component: 'GlobalComponent',
        user: 'globalUser'
      })

      const errorInfo = await errorHandler.handleError('Test error', {
        component: 'LocalComponent',
        action: 'localAction'
      })

      expect(errorInfo.context).toMatchObject({
        component: 'LocalComponent', // Local overrides global
        user: 'globalUser',
        action: 'localAction'
      })
    })
  })

  describe('Async Error Boundary', () => {
    it('handles successful operations', async () => {
      const successOperation = vi.fn().mockResolvedValue('success')

      const result = await errorHandler.withErrorBoundary(successOperation)

      expect(result).toBe('success')
      expect(successOperation).toHaveBeenCalled()
      expect(errorHandler.errors.value).toHaveLength(0)
    })

    it('handles failed operations', async () => {
      const failingOperation = vi.fn().mockRejectedValue(new Error('Operation failed'))

      const result = await errorHandler.withErrorBoundary(failingOperation)

      expect(result).toBeNull()
      expect(failingOperation).toHaveBeenCalled()
      expect(errorHandler.errors.value).toHaveLength(1)
      expect(errorHandler.errors.value[0].message).toBe('Operation failed')
    })

    it('retries failed operations', async () => {
      let callCount = 0
      const retryingOperation = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount < 3) {
          return Promise.reject(new Error('Temporary failure'))
        }
        return Promise.resolve('success on third try')
      })

      const result = await errorHandler.withErrorBoundary(
        retryingOperation,
        undefined,
        { retries: 3, retryDelay: 0 }
      )

      expect(result).toBe('success on third try')
      expect(retryingOperation).toHaveBeenCalledTimes(3)
    })

    it('gives up after max retries', async () => {
      const alwaysFailingOperation = vi.fn().mockRejectedValue(new Error('Always fails'))

      const result = await errorHandler.withErrorBoundary(
        alwaysFailingOperation,
        undefined,
        { retries: 2, retryDelay: 0 }
      )

      expect(result).toBeNull()
      expect(alwaysFailingOperation).toHaveBeenCalledTimes(3) // Initial + 2 retries
      expect(errorHandler.errors.value).toHaveLength(1)
    })
  })

  describe('Convenience Methods', () => {
    it('handles network errors specifically', async () => {
      const networkError = new Error('Network failure')
      
      const errorInfo = await errorHandler.handleNetworkError(networkError)

      expect(errorInfo.type).toBe('error')
      expect(errorInfo.recoverable).toBe(true)
    })

    it('handles validation errors as warnings', async () => {
      const validationError = new Error('Invalid input')
      
      const errorInfo = await errorHandler.handleValidationError(validationError)

      expect(errorInfo.type).toBe('warning')
    })

    it('handles warnings', async () => {
      const errorInfo = await errorHandler.handleWarning('Warning message')

      expect(errorInfo.type).toBe('warning')
      expect(errorInfo.message).toBe('Warning message')
    })

    it('handles success messages', async () => {
      const errorInfo = await errorHandler.handleSuccess('Success message')

      expect(errorInfo.type).toBe('success')
      expect(errorInfo.message).toBe('Success message')
    })

    it('handles info messages', async () => {
      const errorInfo = await errorHandler.handleInfo('Info message')

      expect(errorInfo.type).toBe('info')
      expect(errorInfo.message).toBe('Info message')
    })
  })

  describe('Configuration', () => {
    it('respects logging configuration', async () => {
      const noLogHandler = useErrorHandler({ enableLogging: false })
      
      await noLogHandler.handleError('Test error')

      // Console.error should not have been called
      expect(consoleMocks.mocks.error).not.toHaveBeenCalled()
    })

    it('respects analytics configuration', async () => {
      const noAnalyticsHandler = useErrorHandler({ enableAnalytics: false })
      
      // Mock gtag
      global.gtag = vi.fn()
      
      await noAnalyticsHandler.handleError('Test error')

      // gtag should not have been called
      expect(global.gtag).not.toHaveBeenCalled()
    })

    it('respects max retries configuration', async () => {
      const singleRetryHandler = useErrorHandler({ maxRetries: 1 })
      
      const errorInfo = await singleRetryHandler.handleError('Test error')

      expect(errorInfo.maxRetries).toBe(1)
    })
  })
})

describe('setupGlobalErrorHandler', () => {
  let originalUnhandledRejection: any
  let originalError: any

  beforeEach(() => {
    // Store original event handlers
    originalUnhandledRejection = window.onunhandledrejection
    originalError = window.onerror
  })

  afterEach(() => {
    // Restore original event handlers
    window.onunhandledrejection = originalUnhandledRejection
    window.onerror = originalError
    vi.clearAllMocks()
  })

  it('sets up global error handlers', () => {
    const globalHandler = setupGlobalErrorHandler()

    expect(globalHandler).toBeDefined()
    expect(typeof globalHandler.handleError).toBe('function')
  })

  it('handles unhandled promise rejections', async () => {
    const globalHandler = setupGlobalErrorHandler()
    const handleErrorSpy = vi.spyOn(globalHandler, 'handleError')

    // Simulate unhandled rejection
    const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
      promise: Promise.reject(new Error('Unhandled rejection')),
      reason: new Error('Unhandled rejection')
    })

    window.dispatchEvent(rejectionEvent)
    await nextTick()

    expect(handleErrorSpy).toHaveBeenCalled()
  })

  it('handles JavaScript errors', async () => {
    const globalHandler = setupGlobalErrorHandler()
    const handleErrorSpy = vi.spyOn(globalHandler, 'handleError')

    // Simulate JavaScript error
    const errorEvent = new ErrorEvent('error', {
      message: 'JavaScript error',
      filename: 'test.js',
      lineno: 1,
      colno: 1,
      error: new Error('JavaScript error')
    })

    window.dispatchEvent(errorEvent)
    await nextTick()

    expect(handleErrorSpy).toHaveBeenCalled()
  })
})