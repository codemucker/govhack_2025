import { ref, computed, nextTick } from 'vue'
import { useI18n } from './useI18n'
import { useScreenReader } from './useScreenReader'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  persistent?: boolean
  actions?: NotificationAction[]
  icon?: any
  progress?: number
  timestamp: Date
  read?: boolean
  category?: string
  metadata?: Record<string, any>
}

export interface NotificationAction {
  label: string
  action: () => void | Promise<void>
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
}

export interface NotificationOptions {
  maxNotifications?: number
  defaultDuration?: number
  enablePersistence?: boolean
  enableSound?: boolean
  enableBadges?: boolean
  stackNewest?: boolean
  groupSimilar?: boolean
  enableUndoAction?: boolean
}

export interface NotificationConfig {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  theme?: 'light' | 'dark' | 'system'
  animations?: boolean
  showTimestamp?: boolean
  allowDismiss?: boolean
}

const DEFAULT_OPTIONS: Required<NotificationOptions> = {
  maxNotifications: 50,
  defaultDuration: 5000,
  enablePersistence: true,
  enableSound: true,
  enableBadges: true,
  stackNewest: true,
  groupSimilar: true,
  enableUndoAction: false
}

const DEFAULT_CONFIG: Required<NotificationConfig> = {
  position: 'top-right',
  theme: 'system',
  animations: true,
  showTimestamp: false,
  allowDismiss: true
}

// Global notification store
const globalNotifications = ref<Notification[]>([])
const notificationConfig = ref<Required<NotificationConfig>>({ ...DEFAULT_CONFIG })

let notificationIdCounter = 0
const generateNotificationId = () => `notification_${Date.now()}_${++notificationIdCounter}`

// Sound notifications
const playNotificationSound = (type: Notification['type']) => {
  if (!('Audio' in window)) return

  const sounds = {
    success: 'data:audio/wav;base64,UklGRvIAAABXQVZFZm10IAAAAAAQAAABAAAAQEAAAEAAAAAACAABAQAA',
    error: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IAAAAAAQAAABAAAAQEAAAEAAAAAACAABAQAA',
    warning: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IAAAAAAQAAABAAAAQEAAAEAAAAAACAABAQAA',
    info: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IAAAAAAQAAABAAAAQEAAAEAAAAAACAABAQAA'
  }

  try {
    const audio = new Audio(sounds[type])
    audio.volume = 0.3
    audio.play().catch(() => {
      // Silent fail for audio playback issues
    })
  } catch (error) {
    // Silent fail for audio creation issues
  }
}

export function useNotifications(options: NotificationOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const { t } = useI18n()
  const { announce } = useScreenReader()

  const notifications = ref<Notification[]>([])

  /**
   * All notifications (local + global)
   */
  const allNotifications = computed(() => {
    const combined = [...globalNotifications.value, ...notifications.value]
    return config.stackNewest 
      ? combined.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      : combined.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  })

  /**
   * Active notifications (not dismissed)
   */
  const activeNotifications = computed(() => {
    return allNotifications.value.slice(0, config.maxNotifications)
  })

  /**
   * Unread notifications count
   */
  const unreadCount = computed(() => {
    return allNotifications.value.filter(n => !n.read).length
  })

  /**
   * Notifications by type
   */
  const notificationsByType = computed(() => {
    return allNotifications.value.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1
      return acc
    }, {} as Record<Notification['type'], number>)
  })

  /**
   * Notifications by category
   */
  const notificationsByCategory = computed(() => {
    return allNotifications.value.reduce((acc, notification) => {
      const category = notification.category || 'general'
      if (!acc[category]) acc[category] = []
      acc[category].push(notification)
      return acc
    }, {} as Record<string, Notification[]>)
  })

  /**
   * Create notification
   */
  const createNotification = (
    type: Notification['type'],
    message: string,
    options: Partial<Omit<Notification, 'id' | 'type' | 'message' | 'timestamp'>> = {}
  ): Notification => {
    const notification: Notification = {
      id: generateNotificationId(),
      type,
      message,
      duration: options.persistent ? undefined : (options.duration || config.defaultDuration),
      timestamp: new Date(),
      read: false,
      ...options
    }

    // Add default actions
    if (!notification.actions) {
      notification.actions = []
    }

    // Add dismiss action if not persistent
    if (!notification.persistent && notificationConfig.value.allowDismiss) {
      notification.actions.push({
        label: t('notifications.dismiss', 'Dismiss'),
        action: () => dismiss(notification.id),
        variant: 'secondary'
      })
    }

    return notification
  }

  /**
   * Show notification
   */
  const notify = async (
    type: Notification['type'],
    message: string,
    options: Partial<Omit<Notification, 'id' | 'type' | 'message' | 'timestamp'>> = {}
  ): Promise<Notification> => {
    const notification = createNotification(type, message, options)

    // Check for similar notifications if grouping is enabled
    if (config.groupSimilar) {
      const existingIndex = notifications.value.findIndex(n => 
        n.type === type && 
        n.message === message && 
        n.category === notification.category
      )

      if (existingIndex > -1) {
        // Update existing notification instead of creating new one
        const existing = notifications.value[existingIndex]
        existing.timestamp = new Date()
        existing.read = false
        
        // Move to front if stacking newest
        if (config.stackNewest) {
          notifications.value.splice(existingIndex, 1)
          notifications.value.unshift(existing)
        }
        
        return existing
      }
    }

    // Add to notifications array
    if (config.stackNewest) {
      notifications.value.unshift(notification)
    } else {
      notifications.value.push(notification)
    }

    // Also add to global notifications for toast display
    if (config.stackNewest) {
      globalNotifications.value.unshift(notification)
    } else {
      globalNotifications.value.push(notification)
    }

    // Limit array sizes
    if (notifications.value.length > config.maxNotifications) {
      notifications.value = notifications.value.slice(0, config.maxNotifications)
    }
    if (globalNotifications.value.length > config.maxNotifications) {
      globalNotifications.value = globalNotifications.value.slice(0, config.maxNotifications)
    }

    // Play sound
    if (config.enableSound) {
      playNotificationSound(type)
    }

    // Announce to screen readers
    const priority = type === 'error' ? 'assertive' : 'polite'
    announce(
      t('notifications.announced', '{type}: {message}', {
        type: t(`notifications.types.${type}`, type),
        message
      }),
      { priority }
    )

    // Auto-dismiss after duration
    if (notification.duration) {
      setTimeout(() => {
        dismiss(notification.id)
      }, notification.duration)
    }

    // Update browser badge if supported
    if (config.enableBadges && 'setAppBadge' in navigator) {
      try {
        await navigator.setAppBadge(unreadCount.value)
      } catch (error) {
        // Silent fail for badge API
      }
    }

    return notification
  }

  /**
   * Specific notification methods
   */
  const success = (message: string, options?: Partial<Notification>) =>
    notify('success', message, options)

  const error = (message: string, options?: Partial<Notification>) =>
    notify('error', message, { ...options, persistent: options?.persistent ?? true })

  const warning = (message: string, options?: Partial<Notification>) =>
    notify('warning', message, options)

  const info = (message: string, options?: Partial<Notification>) =>
    notify('info', message, options)

  /**
   * Progress notification
   */
  const progress = (
    message: string, 
    progress: number, 
    options?: Partial<Notification>
  ) => {
    const id = options?.id || generateNotificationId()
    const existing = notifications.value.find(n => n.id === id)

    if (existing) {
      existing.message = message
      existing.progress = Math.max(0, Math.min(100, progress))
      existing.timestamp = new Date()
      
      // Complete the progress notification
      if (progress >= 100) {
        existing.type = 'success'
        existing.progress = undefined
        
        // Auto-dismiss completed progress
        setTimeout(() => dismiss(id), 2000)
      }
      
      return existing
    } else {
      return notify('info', message, {
        ...options,
        id,
        progress: Math.max(0, Math.min(100, progress)),
        persistent: progress < 100
      })
    }
  }

  /**
   * Undo notification
   */
  const undoable = async (
    message: string,
    undoAction: () => void | Promise<void>,
    options: Partial<Notification> = {}
  ) => {
    if (!config.enableUndoAction) {
      return notify('info', message, options)
    }

    const undoNotification = await notify('success', message, {
      ...options,
      duration: 8000, // Longer duration for undo
      actions: [
        {
          label: t('notifications.undo', 'Undo'),
          action: async () => {
            try {
              await undoAction()
              dismiss(undoNotification.id)
              notify('info', t('notifications.undone', 'Action undone'))
            } catch (error) {
              notify('error', t('notifications.undo_failed', 'Failed to undo action'))
            }
          },
          variant: 'primary'
        },
        ...options.actions || []
      ]
    })

    return undoNotification
  }

  /**
   * Dismiss notification
   */
  const dismiss = async (notificationId: string) => {
    // Remove from local notifications
    const localIndex = notifications.value.findIndex(n => n.id === notificationId)
    if (localIndex > -1) {
      notifications.value.splice(localIndex, 1)
    }

    // Remove from global notifications
    const globalIndex = globalNotifications.value.findIndex(n => n.id === notificationId)
    if (globalIndex > -1) {
      globalNotifications.value.splice(globalIndex, 1)
    }

    // Update badge count
    if (config.enableBadges && 'setAppBadge' in navigator) {
      try {
        const count = unreadCount.value
        if (count > 0) {
          await navigator.setAppBadge(count)
        } else {
          await navigator.clearAppBadge()
        }
      } catch (error) {
        // Silent fail for badge API
      }
    }
  }

  /**
   * Dismiss all notifications
   */
  const dismissAll = async () => {
    notifications.value.splice(0)
    globalNotifications.value.splice(0)

    if (config.enableBadges && 'clearAppBadge' in navigator) {
      try {
        await navigator.clearAppBadge()
      } catch (error) {
        // Silent fail for badge API
      }
    }
  }

  /**
   * Dismiss notifications by type
   */
  const dismissByType = (type: Notification['type']) => {
    notifications.value = notifications.value.filter(n => n.type !== type)
    globalNotifications.value = globalNotifications.value.filter(n => n.type !== type)
  }

  /**
   * Dismiss notifications by category
   */
  const dismissByCategory = (category: string) => {
    notifications.value = notifications.value.filter(n => n.category !== category)
    globalNotifications.value = globalNotifications.value.filter(n => n.category !== category)
  }

  /**
   * Mark notification as read
   */
  const markAsRead = (notificationId: string) => {
    const notification = notifications.value.find(n => n.id === notificationId) ||
                        globalNotifications.value.find(n => n.id === notificationId)
    
    if (notification) {
      notification.read = true
    }
  }

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = () => {
    [...notifications.value, ...globalNotifications.value].forEach(n => {
      n.read = true
    })
  }

  /**
   * Get notification by ID
   */
  const getNotification = (notificationId: string): Notification | undefined => {
    return allNotifications.value.find(n => n.id === notificationId)
  }

  /**
   * Update notification configuration
   */
  const updateConfig = (config: Partial<NotificationConfig>) => {
    notificationConfig.value = { ...notificationConfig.value, ...config }
  }

  /**
   * Clear old notifications
   */
  const clearOldNotifications = (olderThan: number = 86400000) => { // 24 hours default
    const cutoff = new Date(Date.now() - olderThan)
    notifications.value = notifications.value.filter(n => n.timestamp > cutoff)
    globalNotifications.value = globalNotifications.value.filter(n => n.timestamp > cutoff)
  }

  /**
   * Persist notifications to localStorage
   */
  const persistNotifications = () => {
    if (!config.enablePersistence) return

    try {
      const data = {
        notifications: notifications.value,
        timestamp: Date.now()
      }
      localStorage.setItem('app_notifications', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to persist notifications:', error)
    }
  }

  /**
   * Restore notifications from localStorage
   */
  const restoreNotifications = () => {
    if (!config.enablePersistence) return

    try {
      const data = localStorage.getItem('app_notifications')
      if (!data) return

      const parsed = JSON.parse(data)
      const notifications = parsed.notifications.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }))

      // Only restore recent notifications (last 24 hours)
      const cutoff = Date.now() - 86400000
      const recentNotifications = notifications.filter((n: Notification) => 
        n.timestamp.getTime() > cutoff
      )

      notifications.value = recentNotifications
    } catch (error) {
      console.warn('Failed to restore notifications:', error)
    }
  }

  // Restore notifications on initialization
  if (typeof window !== 'undefined') {
    restoreNotifications()
  }

  return {
    // State
    notifications: allNotifications,
    activeNotifications,
    unreadCount,
    notificationsByType,
    notificationsByCategory,

    // Config
    config: notificationConfig,
    updateConfig,

    // Core methods
    notify,
    success,
    error,
    warning,
    info,
    progress,
    undoable,

    // Management
    dismiss,
    dismissAll,
    dismissByType,
    dismissByCategory,
    markAsRead,
    markAllAsRead,
    getNotification,

    // Utilities
    clearOldNotifications,
    persistNotifications,
    restoreNotifications
  }
}

// Global notifications setup
export const globalNotifications = {
  notifications: globalNotifications,
  config: notificationConfig
}