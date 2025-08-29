import { ref, computed, inject, provide } from 'vue'
import { useI18n } from './useI18n'
import { useScreenReader } from './useScreenReader'

export interface ErrorInfo {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  message: string
  code?: string
  timestamp: Date
  context?: Record<string, any>
  stack?: string
  user?: string
  retryCount?: number
  maxRetries?: number
  recoverable?: boolean
  actions?: ErrorAction[]
}

export interface ErrorAction {
  label: string
  action: () => void | Promise<void>
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
}

export interface ErrorHandlerOptions {
  maxErrors?: number
  enableLogging?: boolean
  enableAnalytics?: boolean
  autoRetry?: boolean
  retryDelay?: number
  maxRetries?: number
  enableNotifications?: boolean
}

export interface ErrorPattern {
  matcher: RegExp | ((error: Error) => boolean)
  handler: (error: Error, context?: any) => ErrorInfo | Promise<ErrorInfo>
  priority?: number
}

export interface ErrorContext {
  component?: string
  action?: string
  user?: string
  route?: string
  metadata?: Record<string, any>
}

const DEFAULT_OPTIONS: Required<ErrorHandlerOptions> = {
  maxErrors: 100,
  enableLogging: true,
  enableAnalytics: true,
  autoRetry: false,
  retryDelay: 1000,
  maxRetries: 3,
  enableNotifications: true
}

// Global error store
const globalErrors = ref<ErrorInfo[]>([])
const errorPatterns = ref<ErrorPattern[]>([])
const errorContext = ref<ErrorContext>({})

let errorIdCounter = 0
const generateErrorId = () => `error_${Date.now()}_${++errorIdCounter}`

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const { t } = useI18n()
  const { announce } = useScreenReader()

  const errors = ref<ErrorInfo[]>([])
  const isLoading = ref(false)

  /**
   * Active errors (not cleared)
   */
  const activeErrors = computed(() => {
    return [...globalErrors.value, ...errors.value].filter(error => 
      error.type === 'error' || error.type === 'warning'
    )
  })

  /**
   * Recent notifications (success/info messages)
   */
  const notifications = computed(() => {
    return [...globalErrors.value, ...errors.value].filter(error => 
      error.type === 'success' || error.type === 'info'
    )
  })

  /**
   * Error statistics
   */
  const errorStats = computed(() => {
    const allErrors = [...globalErrors.value, ...errors.value]
    return {
      total: allErrors.length,
      errors: allErrors.filter(e => e.type === 'error').length,
      warnings: allErrors.filter(e => e.type === 'warning').length,
      byCode: allErrors.reduce((acc, error) => {
        const code = error.code || 'unknown'
        acc[code] = (acc[code] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  })

  /**
   * Create standardized error info
   */
  const createErrorInfo = (
    error: Error | string,
    type: ErrorInfo['type'] = 'error',
    context?: ErrorContext
  ): ErrorInfo => {
    const errorObj = typeof error === 'string' ? new Error(error) : error
    const mergedContext = { ...errorContext.value, ...context }

    return {
      id: generateErrorId(),
      type,
      title: getErrorTitle(errorObj, type),
      message: getErrorMessage(errorObj),
      code: getErrorCode(errorObj),
      timestamp: new Date(),
      context: mergedContext,
      stack: errorObj.stack,
      user: mergedContext.user,
      retryCount: 0,
      maxRetries: config.maxRetries,
      recoverable: isRecoverableError(errorObj),
      actions: getErrorActions(errorObj, type)
    }
  }

  /**
   * Get user-friendly error title
   */
  const getErrorTitle = (error: Error, type: ErrorInfo['type']): string => {
    // Check for custom error titles
    if ('title' in error && typeof error.title === 'string') {
      return error.title
    }

    // Network errors
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return t('errors.network.title', 'Connection Error')
    }

    // Validation errors
    if (error.name === 'ValidationError') {
      return t('errors.validation.title', 'Validation Error')
    }

    // Permission errors
    if (error.message.includes('Permission') || error.message.includes('Unauthorized')) {
      return t('errors.permission.title', 'Permission Denied')
    }

    // Default titles by type
    const titles = {
      error: t('errors.generic.title', 'An Error Occurred'),
      warning: t('errors.warning.title', 'Warning'),
      info: t('errors.info.title', 'Information'),
      success: t('errors.success.title', 'Success')
    }

    return titles[type]
  }

  /**
   * Get user-friendly error message
   */
  const getErrorMessage = (error: Error): string => {
    // Check for custom error messages
    if ('userMessage' in error && typeof error.userMessage === 'string') {
      return error.userMessage
    }

    // Network errors
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return t('errors.network.message', 'Please check your connection and try again.')
    }

    // Timeout errors
    if (error.message.includes('timeout')) {
      return t('errors.timeout.message', 'The request took too long. Please try again.')
    }

    // Server errors
    if (error.message.includes('500')) {
      return t('errors.server.message', 'Server error. Please try again later.')
    }

    // Permission errors
    if (error.message.includes('Permission') || error.message.includes('Unauthorized')) {
      return t('errors.permission.message', 'You do not have permission to perform this action.')
    }

    // Fallback to original message or generic
    return error.message || t('errors.generic.message', 'Something went wrong. Please try again.')
  }

  /**
   * Extract error code from error object
   */
  const getErrorCode = (error: Error): string | undefined => {
    if ('code' in error && typeof error.code === 'string') {
      return error.code
    }
    if ('status' in error && typeof error.status === 'number') {
      return error.status.toString()
    }
    return undefined
  }

  /**
   * Check if error is recoverable (can be retried)
   */
  const isRecoverableError = (error: Error): boolean => {
    // Network errors are usually recoverable
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return true
    }

    // Timeout errors are recoverable
    if (error.message.includes('timeout')) {
      return true
    }

    // Server errors (5xx) are potentially recoverable
    if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
      return true
    }

    // Client errors (4xx) are usually not recoverable
    if (error.message.includes('400') || error.message.includes('404') || error.message.includes('403')) {
      return false
    }

    return false
  }

  /**
   * Get context-appropriate actions for error
   */
  const getErrorActions = (error: Error, type: ErrorInfo['type']): ErrorAction[] => {
    const actions: ErrorAction[] = []

    // Add retry action for recoverable errors
    if (isRecoverableError(error) && type === 'error') {
      actions.push({
        label: t('errors.actions.retry', 'Retry'),
        action: () => handleRetry(error),
        variant: 'primary'
      })
    }

    // Add dismiss action for all errors
    actions.push({
      label: t('errors.actions.dismiss', 'Dismiss'),
      action: () => clearError(error),
      variant: 'secondary'
    })

    // Add report action for errors
    if (type === 'error') {
      actions.push({
        label: t('errors.actions.report', 'Report Issue'),
        action: () => reportError(error),
        variant: 'secondary'
      })
    }

    return actions
  }

  /**
   * Handle error with pattern matching
   */
  const handleError = async (
    error: Error | string,
    context?: ErrorContext,
    options?: { notify?: boolean; log?: boolean; type?: ErrorInfo['type'] }
  ): Promise<ErrorInfo> => {
    const opts = { notify: true, log: true, type: 'error' as const, ...options }
    
    try {
      // Convert to Error object if string
      const errorObj = typeof error === 'string' ? new Error(error) : error

      // Check for matching patterns
      const pattern = errorPatterns.value
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .find(p => {
          if (p.matcher instanceof RegExp) {
            return p.matcher.test(errorObj.message)
          }
          return p.matcher(errorObj)
        })

      let errorInfo: ErrorInfo

      if (pattern) {
        errorInfo = await pattern.handler(errorObj, context)
      } else {
        errorInfo = createErrorInfo(errorObj, opts.type, context)
      }

      // Add to local errors array
      errors.value.unshift(errorInfo)

      // Add to global errors if needed
      if (opts.notify) {
        globalErrors.value.unshift(errorInfo)
      }

      // Limit array size
      if (errors.value.length > config.maxErrors) {
        errors.value = errors.value.slice(0, config.maxErrors)
      }
      if (globalErrors.value.length > config.maxErrors) {
        globalErrors.value = globalErrors.value.slice(0, config.maxErrors)
      }

      // Log error
      if (config.enableLogging && opts.log) {
        logError(errorInfo)
      }

      // Send to analytics
      if (config.enableAnalytics) {
        trackError(errorInfo)
      }

      // Announce to screen readers for important errors
      if (opts.notify && (errorInfo.type === 'error' || errorInfo.type === 'warning')) {
        announce(
          t('errors.announced', 'Error: {message}', { message: errorInfo.message }),
          { priority: 'assertive' }
        )
      }

      // Auto-retry if configured and applicable
      if (config.autoRetry && errorInfo.recoverable && (errorInfo.retryCount || 0) < config.maxRetries) {
        setTimeout(() => {
          handleRetry(errorObj, errorInfo.id)
        }, config.retryDelay)
      }

      return errorInfo

    } catch (handlerError) {
      console.error('Error in error handler:', handlerError)
      
      // Fallback error info
      const fallbackError: ErrorInfo = {
        id: generateErrorId(),
        type: 'error',
        title: t('errors.handler.title', 'Error Handler Failed'),
        message: t('errors.handler.message', 'An error occurred while processing another error.'),
        timestamp: new Date(),
        recoverable: false
      }

      errors.value.unshift(fallbackError)
      return fallbackError
    }
  }

  /**
   * Handle specific error types
   */
  const handleNetworkError = (error: Error, context?: ErrorContext) => 
    handleError(error, context, { type: 'error' })

  const handleValidationError = (error: Error, context?: ErrorContext) =>
    handleError(error, context, { type: 'warning' })

  const handleWarning = (message: string, context?: ErrorContext) =>
    handleError(message, context, { type: 'warning' })

  const handleSuccess = (message: string, context?: ErrorContext) =>
    handleError(message, context, { type: 'success' })

  const handleInfo = (message: string, context?: ErrorContext) =>
    handleError(message, context, { type: 'info' })

  /**
   * Retry error handling
   */
  const handleRetry = async (originalError: Error, errorId?: string) => {
    const errorInfo = errors.value.find(e => e.id === errorId)
    
    if (errorInfo) {
      errorInfo.retryCount = (errorInfo.retryCount || 0) + 1
      
      if (errorInfo.retryCount >= config.maxRetries) {
        errorInfo.recoverable = false
        return
      }
    }

    // Implement retry logic here
    // This would typically re-execute the failed operation
    console.log('Retrying operation for error:', originalError.message)
  }

  /**
   * Clear specific error
   */
  const clearError = (errorOrId: Error | string) => {
    const id = typeof errorOrId === 'string' 
      ? errorOrId 
      : errors.value.find(e => e.message === errorOrId.message)?.id

    if (id) {
      const localIndex = errors.value.findIndex(e => e.id === id)
      if (localIndex > -1) {
        errors.value.splice(localIndex, 1)
      }

      const globalIndex = globalErrors.value.findIndex(e => e.id === id)
      if (globalIndex > -1) {
        globalErrors.value.splice(globalIndex, 1)
      }
    }
  }

  /**
   * Clear all errors
   */
  const clearAllErrors = () => {
    errors.value.splice(0)
    globalErrors.value.splice(0)
  }

  /**
   * Clear errors by type
   */
  const clearErrorsByType = (type: ErrorInfo['type']) => {
    errors.value = errors.value.filter(e => e.type !== type)
    globalErrors.value = globalErrors.value.filter(e => e.type !== type)
  }

  /**
   * Clear old errors
   */
  const clearOldErrors = (olderThan: number = 60000) => {
    const cutoff = new Date(Date.now() - olderThan)
    errors.value = errors.value.filter(e => e.timestamp > cutoff)
    globalErrors.value = globalErrors.value.filter(e => e.timestamp > cutoff)
  }

  /**
   * Log error to console/external service
   */
  const logError = (errorInfo: ErrorInfo) => {
    const logData = {
      ...errorInfo,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: errorInfo.timestamp.toISOString()
    }

    if (errorInfo.type === 'error') {
      console.error('[Error Handler]', logData)
    } else if (errorInfo.type === 'warning') {
      console.warn('[Error Handler]', logData)
    } else {
      console.info('[Error Handler]', logData)
    }
  }

  /**
   * Track error for analytics
   */
  const trackError = (errorInfo: ErrorInfo) => {
    // Implement analytics tracking here
    if (typeof gtag !== 'undefined') {
      gtag('event', 'exception', {
        description: errorInfo.message,
        fatal: errorInfo.type === 'error'
      })
    }
  }

  /**
   * Report error to external service
   */
  const reportError = async (error: Error) => {
    // Implement error reporting here
    console.log('Reporting error:', error.message)
    
    try {
      // Example: Send to error reporting service
      // await fetch('/api/errors/report', {
      //   method: 'POST',
      //   body: JSON.stringify({ error: error.message, stack: error.stack })
      // })
      
      handleSuccess(t('errors.report.success', 'Error report sent successfully.'))
    } catch (reportError) {
      handleError(t('errors.report.failed', 'Failed to send error report.'))
    }
  }

  /**
   * Register error pattern
   */
  const registerErrorPattern = (pattern: ErrorPattern) => {
    errorPatterns.value.push(pattern)
  }

  /**
   * Set error context
   */
  const setErrorContext = (context: Partial<ErrorContext>) => {
    errorContext.value = { ...errorContext.value, ...context }
  }

  /**
   * Async error boundary
   */
  const withErrorBoundary = async <T>(
    operation: () => Promise<T>,
    context?: ErrorContext,
    options?: { retries?: number; retryDelay?: number }
  ): Promise<T | null> => {
    const opts = { retries: config.maxRetries, retryDelay: config.retryDelay, ...options }
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= opts.retries; attempt++) {
      try {
        isLoading.value = true
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        if (attempt === opts.retries) {
          await handleError(lastError, context)
          break
        }

        // Wait before retry
        if (attempt < opts.retries) {
          await new Promise(resolve => setTimeout(resolve, opts.retryDelay))
        }
      } finally {
        isLoading.value = false
      }
    }

    return null
  }

  return {
    // State
    errors: computed(() => errors.value),
    activeErrors,
    notifications,
    errorStats,
    isLoading,

    // Error handling
    handleError,
    handleNetworkError,
    handleValidationError,
    handleWarning,
    handleSuccess,
    handleInfo,

    // Management
    clearError,
    clearAllErrors,
    clearErrorsByType,
    clearOldErrors,
    handleRetry,

    // Configuration
    registerErrorPattern,
    setErrorContext,

    // Utilities
    withErrorBoundary,
    reportError,

    // Config
    config
  }
}

// Global error handler setup
export function setupGlobalErrorHandler() {
  const errorHandler = useErrorHandler({ enableLogging: true, enableAnalytics: true })

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleError(event.reason, { component: 'global', action: 'unhandled_rejection' })
    event.preventDefault()
  })

  // Handle JavaScript errors
  window.addEventListener('error', (event) => {
    errorHandler.handleError(
      event.error || new Error(event.message), 
      { 
        component: 'global', 
        action: 'javascript_error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      }
    )
  })

  // Provide globally
  provide('errorHandler', errorHandler)

  return errorHandler
}

// Composable for consuming global error handler
export function useGlobalErrorHandler() {
  const globalHandler = inject<ReturnType<typeof useErrorHandler>>('errorHandler')
  
  if (!globalHandler) {
    console.warn('Global error handler not found. Make sure to call setupGlobalErrorHandler in your app setup.')
    return useErrorHandler()
  }

  return globalHandler
}