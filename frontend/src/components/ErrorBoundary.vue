<template>
  <div class="error-boundary">
    <!-- Error state -->
    <div 
      v-if="hasError" 
      class="error-state"
      role="alert"
      :aria-live="errorInfo?.type === 'error' ? 'assertive' : 'polite'"
    >
      <div class="error-container">
        <!-- Error icon -->
        <div class="error-icon" :class="`error-${errorInfo?.type || 'error'}`">
          <component 
            :is="getErrorIcon()" 
            class="w-12 h-12"
            :class="getErrorIconClass()"
          />
        </div>

        <!-- Error content -->
        <div class="error-content">
          <h2 class="error-title">
            {{ errorInfo?.title || $t('errors.boundary.title', 'Something went wrong') }}
          </h2>
          
          <p class="error-message">
            {{ errorInfo?.message || $t('errors.boundary.message', 'An unexpected error occurred. Please try refreshing the page.') }}
          </p>

          <!-- Error details (development only) -->
          <details 
            v-if="showDetails && errorInfo?.stack" 
            class="error-details"
          >
            <summary class="details-summary">
              {{ $t('errors.boundary.details', 'Technical Details') }}
            </summary>
            <pre class="error-stack">{{ errorInfo.stack }}</pre>
          </details>

          <!-- Error context -->
          <div 
            v-if="showContext && errorInfo?.context" 
            class="error-context"
          >
            <h4>{{ $t('errors.boundary.context', 'Context') }}</h4>
            <ul class="context-list">
              <li v-for="(value, key) in errorInfo.context" :key="key">
                <strong>{{ key }}:</strong> {{ value }}
              </li>
            </ul>
          </div>

          <!-- Error actions -->
          <div class="error-actions">
            <button
              @click="retry"
              class="action-button primary"
              :disabled="retrying"
              type="button"
            >
              <ArrowPathIcon 
                class="w-4 h-4" 
                :class="{ 'animate-spin': retrying }"
              />
              {{ retrying ? $t('errors.boundary.retrying', 'Retrying...') : $t('errors.boundary.retry', 'Try Again') }}
            </button>

            <button
              @click="goHome"
              class="action-button secondary"
              type="button"
            >
              <HomeIcon class="w-4 h-4" />
              {{ $t('errors.boundary.home', 'Go Home') }}
            </button>

            <button
              v-if="showReportButton"
              @click="reportError"
              class="action-button secondary"
              :disabled="reporting"
              type="button"
            >
              <ExclamationTriangleIcon class="w-4 h-4" />
              {{ reporting ? $t('errors.boundary.reporting', 'Reporting...') : $t('errors.boundary.report', 'Report Issue') }}
            </button>

            <button
              v-if="errorInfo?.recoverable"
              @click="recover"
              class="action-button secondary"
              type="button"
            >
              <WrenchScrewdriverIcon class="w-4 h-4" />
              {{ $t('errors.boundary.recover', 'Attempt Recovery') }}
            </button>
          </div>

          <!-- Alternative actions -->
          <div v-if="alternativeActions.length > 0" class="alternative-actions">
            <h4>{{ $t('errors.boundary.alternatives', 'You can also:') }}</h4>
            <ul class="action-list">
              <li v-for="action in alternativeActions" :key="action.label">
                <button
                  @click="action.handler"
                  class="action-link"
                  type="button"
                >
                  {{ action.label }}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Offline indicator -->
      <div v-if="isOffline" class="offline-indicator">
        <WifiIcon class="w-4 h-4" />
        {{ $t('errors.boundary.offline', 'You appear to be offline') }}
      </div>
    </div>

    <!-- Normal content -->
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'
import {
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  HomeIcon,
  WrenchScrewdriverIcon,
  WifiIcon
} from '@heroicons/vue/24/outline'
import { useI18n } from '../composables/useI18n'
import { useErrorHandler } from '../composables/useErrorHandler'
import { useNotifications } from '../composables/useNotifications'
import { useScreenReader } from '../composables/useScreenReader'

interface Props {
  fallbackComponent?: any
  showDetails?: boolean
  showContext?: boolean
  showReportButton?: boolean
  enableRetry?: boolean
  enableRecovery?: boolean
  onError?: (error: Error, instance: any) => void
  onRecover?: () => void | Promise<void>
  maxRetries?: number
  retryDelay?: number
  isolate?: boolean
}

interface AlternativeAction {
  label: string
  handler: () => void
}

const props = withDefaults(defineProps<Props>(), {
  fallbackComponent: undefined,
  showDetails: false, // Only show in development
  showContext: false,
  showReportButton: true,
  enableRetry: true,
  enableRecovery: true,
  maxRetries: 3,
  retryDelay: 1000,
  isolate: false
})

const emit = defineEmits<{
  'error': [error: Error, instance: any]
  'recover': []
  'retry': [attempt: number]
}>()

const { t } = useI18n()
const { handleError } = useErrorHandler()
const { error: notifyError } = useNotifications()
const { announce } = useScreenReader()
const router = useRouter()

const hasError = ref(false)
const errorInfo = ref<any>(null)
const retrying = ref(false)
const reporting = ref(false)
const retryCount = ref(0)
const isOffline = ref(!navigator.onLine)

// Show details in development mode
const showDetails = computed(() => {
  return props.showDetails || import.meta.env.DEV
})

// Show context in development mode
const showContext = computed(() => {
  return props.showContext || import.meta.env.DEV
})

// Alternative actions based on error type and context
const alternativeActions = computed((): AlternativeAction[] => {
  const actions: AlternativeAction[] = []

  if (errorInfo.value?.context?.component) {
    actions.push({
      label: t('errors.boundary.refresh_page', 'Refresh the page'),
      handler: () => window.location.reload()
    })
  }

  if (router.currentRoute.value.path !== '/') {
    actions.push({
      label: t('errors.boundary.go_back', 'Go back'),
      handler: () => router.back()
    })
  }

  actions.push({
    label: t('errors.boundary.clear_data', 'Clear app data and restart'),
    handler: clearAppData
  })

  return actions
})

// Get appropriate error icon
const getErrorIcon = () => {
  switch (errorInfo.value?.type) {
    case 'warning':
      return ExclamationTriangleIcon
    case 'info':
      return InformationCircleIcon
    case 'success':
      return CheckCircleIcon
    default:
      return XCircleIcon
  }
}

// Get error icon CSS class
const getErrorIconClass = () => {
  switch (errorInfo.value?.type) {
    case 'warning':
      return 'text-amber-500'
    case 'info':
      return 'text-blue-500'
    case 'success':
      return 'text-green-500'
    default:
      return 'text-red-500'
  }
}

// Handle errors caught by the boundary
onErrorCaptured((error: Error, instance: any, info: string) => {
  console.error('Error boundary caught error:', error, info)
  
  hasError.value = true
  retryCount.value = 0

  // Create error info
  errorInfo.value = {
    type: 'error',
    title: getErrorTitle(error),
    message: getErrorMessage(error),
    stack: error.stack,
    context: {
      component: instance?.$?.type?.name || 'Unknown',
      info,
      route: router.currentRoute.value.path,
      timestamp: new Date().toISOString()
    },
    recoverable: isRecoverableError(error)
  }

  // Handle with error handler
  handleError(error, errorInfo.value.context, { notify: false })

  // Emit error event
  emit('error', error, instance)
  
  // Call custom error handler
  props.onError?.(error, instance)

  // Announce error to screen readers
  announce(
    t('errors.boundary.announced', 'Error: {message}', { 
      message: errorInfo.value.message 
    }),
    { priority: 'assertive' }
  )

  // Prevent the error from propagating further if isolated
  return props.isolate
})

// Get user-friendly error title
const getErrorTitle = (error: Error): string => {
  if (error.name === 'ChunkLoadError') {
    return t('errors.boundary.chunk_load_title', 'Update Required')
  }
  
  if (error.message.includes('Loading chunk')) {
    return t('errors.boundary.chunk_load_title', 'Update Required')
  }

  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    return t('errors.boundary.network_title', 'Connection Error')
  }

  return t('errors.boundary.title', 'Something went wrong')
}

// Get user-friendly error message
const getErrorMessage = (error: Error): string => {
  if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
    return t('errors.boundary.chunk_load_message', 'The app has been updated. Please refresh the page to continue.')
  }

  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    return t('errors.boundary.network_message', 'Please check your connection and try again.')
  }

  if (error.message.includes('hydration')) {
    return t('errors.boundary.hydration_message', 'There was a problem loading the page. Please refresh to continue.')
  }

  return error.message || t('errors.boundary.message', 'An unexpected error occurred. Please try refreshing the page.')
}

// Check if error is recoverable
const isRecoverableError = (error: Error): boolean => {
  // Network errors are usually recoverable
  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    return true
  }

  // Chunk loading errors require refresh, not retry
  if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
    return false
  }

  // Component errors might be recoverable
  return true
}

// Retry the failed operation
const retry = async () => {
  if (retryCount.value >= props.maxRetries) {
    notifyError(t('errors.boundary.max_retries', 'Maximum retry attempts reached'))
    return
  }

  retrying.value = true
  retryCount.value++

  try {
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, props.retryDelay))

    // Clear error state to re-render content
    hasError.value = false
    errorInfo.value = null

    emit('retry', retryCount.value)

    // Announce retry to screen readers
    announce(
      t('errors.boundary.retry_announced', 'Retrying... Attempt {count}', { 
        count: retryCount.value 
      }),
      { priority: 'polite' }
    )

  } catch (retryError) {
    console.error('Retry failed:', retryError)
    hasError.value = true
  } finally {
    retrying.value = false
  }
}

// Attempt to recover from error
const recover = async () => {
  try {
    // Call custom recovery handler
    await props.onRecover?.()

    // Clear error state
    hasError.value = false
    errorInfo.value = null
    retryCount.value = 0

    emit('recover')

    // Announce recovery to screen readers
    announce(
      t('errors.boundary.recovered', 'Error recovered successfully'),
      { priority: 'polite' }
    )

  } catch (recoveryError) {
    console.error('Recovery failed:', recoveryError)
    notifyError(t('errors.boundary.recovery_failed', 'Recovery attempt failed'))
  }
}

// Navigate to home page
const goHome = () => {
  router.push('/').catch(() => {
    // If navigation fails, reload the page
    window.location.href = '/'
  })
}

// Report error to external service
const reportError = async () => {
  reporting.value = true

  try {
    // Simulate error reporting
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In a real app, this would send the error to your error reporting service
    console.log('Reporting error:', errorInfo.value)

    notifyError(t('errors.boundary.report_success', 'Error report sent successfully'))
  } catch (reportingError) {
    console.error('Error reporting failed:', reportingError)
    notifyError(t('errors.boundary.report_failed', 'Failed to send error report'))
  } finally {
    reporting.value = false
  }
}

// Clear app data and restart
const clearAppData = async () => {
  try {
    // Clear localStorage
    localStorage.clear()
    
    // Clear sessionStorage
    sessionStorage.clear()

    // Clear IndexedDB if available
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases()
      await Promise.all(
        databases.map(db => {
          if (db.name) {
            return new Promise((resolve, reject) => {
              const deleteReq = indexedDB.deleteDatabase(db.name!)
              deleteReq.onsuccess = () => resolve(undefined)
              deleteReq.onerror = () => reject(deleteReq.error)
            })
          }
        })
      )
    }

    // Reload the page
    window.location.reload()
  } catch (error) {
    console.error('Failed to clear app data:', error)
    // Fallback to simple reload
    window.location.reload()
  }
}

// Listen for online/offline status
onMounted(() => {
  const updateOnlineStatus = () => {
    isOffline.value = !navigator.onLine
  }

  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)

  return () => {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)
  }
})
</script>

<style scoped>
.error-boundary {
  height: 100%;
  width: 100%;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: var(--space-8);
  text-align: center;
}

.error-container {
  max-width: 600px;
  width: 100%;
}

.error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-6);
}

.error-icon.error-error {
  color: var(--color-error);
}

.error-icon.error-warning {
  color: var(--color-warning);
}

.error-icon.error-info {
  color: var(--color-info);
}

.error-icon.error-success {
  color: var(--color-success);
}

.error-content {
  text-align: left;
}

.error-title {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--space-4);
  text-align: center;
}

.error-message {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-6);
  line-height: 1.6;
  text-align: center;
}

.error-details {
  margin-bottom: var(--space-6);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.details-summary {
  padding: var(--space-3) var(--space-4);
  background: var(--color-background-muted);
  font-weight: 600;
  cursor: pointer;
  user-select: none;
}

.details-summary:hover {
  background: var(--color-background-hover);
}

.error-stack {
  padding: var(--space-4);
  background: var(--color-background-code);
  color: var(--color-text-code);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  overflow-x: auto;
  white-space: pre-wrap;
  margin: 0;
  border: none;
}

.error-context {
  margin-bottom: var(--space-6);
  padding: var(--space-4);
  background: var(--color-background-muted);
  border-radius: 8px;
}

.error-context h4 {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--text-base);
  font-weight: 600;
}

.context-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.context-list li {
  padding: var(--space-1) 0;
  font-size: var(--text-sm);
  font-family: var(--font-mono);
}

.error-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: var(--space-6);
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  min-height: var(--touch-target-min);
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-button.primary {
  background: var(--color-primary);
  color: white;
}

.action-button.primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.action-button.primary:focus {
  outline: 2px solid var(--color-primary-light);
  outline-offset: 2px;
}

.action-button.secondary {
  background: var(--color-background-muted);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.action-button.secondary:hover:not(:disabled) {
  background: var(--color-background-hover);
}

.action-button.secondary:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.alternative-actions {
  text-align: center;
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-4);
}

.alternative-actions h4 {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.action-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: center;
}

.action-link {
  background: none;
  border: none;
  color: var(--color-primary);
  text-decoration: underline;
  cursor: pointer;
  font-size: var(--text-sm);
  padding: var(--space-1);
  border-radius: 4px;
}

.action-link:hover {
  color: var(--color-primary-hover);
  background: var(--color-primary-light);
  text-decoration: none;
}

.action-link:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.offline-indicator {
  position: fixed;
  bottom: var(--space-4);
  right: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--color-warning);
  color: white;
  border-radius: 8px;
  font-size: var(--text-sm);
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Responsive design */
@media (max-width: 640px) {
  .error-state {
    padding: var(--space-4);
    min-height: 300px;
  }

  .error-title {
    font-size: var(--text-xl);
  }

  .error-message {
    font-size: var(--text-base);
  }

  .error-actions {
    flex-direction: column;
    align-items: center;
  }

  .action-button {
    width: 100%;
    max-width: 280px;
    justify-content: center;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .error-stack {
    background: var(--color-background-dark);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .action-button {
    border-width: 2px;
  }
  
  .action-button:focus {
    outline-width: 3px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .action-button {
    transition: none;
  }
  
  .animate-spin {
    animation: none;
  }
}
</style>