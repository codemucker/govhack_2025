<template>
  <Teleport to="body">
    <div 
      class="notification-container"
      :class="[
        `position-${config.position}`,
        { 'animate': config.animations }
      ]"
      aria-live="polite"
      aria-label="Notifications"
      role="region"
    >
      <TransitionGroup
        name="toast"
        tag="div"
        class="toast-group"
      >
        <div
          v-for="notification in displayedNotifications"
          :key="notification.id"
          class="toast"
          :class="[
            `toast-${notification.type}`,
            { 
              'toast-persistent': notification.persistent,
              'toast-with-progress': notification.progress !== undefined,
              'toast-dismissible': !notification.persistent
            }
          ]"
          :role="notification.type === 'error' ? 'alert' : 'status'"
          :aria-live="notification.type === 'error' ? 'assertive' : 'polite'"
        >
          <!-- Toast content -->
          <div class="toast-content">
            <!-- Icon -->
            <div class="toast-icon" :class="`icon-${notification.type}`">
              <component 
                :is="getToastIcon(notification.type)"
                class="w-5 h-5"
              />
            </div>

            <!-- Message content -->
            <div class="toast-message">
              <!-- Title -->
              <h4 v-if="notification.title" class="toast-title">
                {{ notification.title }}
              </h4>
              
              <!-- Message -->
              <p class="toast-text">{{ notification.message }}</p>

              <!-- Progress bar -->
              <div 
                v-if="notification.progress !== undefined"
                class="toast-progress-bar"
                role="progressbar"
                :aria-valuenow="notification.progress"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-label="$t('notifications.progress', 'Progress: {progress}%', { progress: notification.progress })"
              >
                <div 
                  class="progress-fill"
                  :style="{ width: `${notification.progress}%` }"
                ></div>
              </div>

              <!-- Timestamp -->
              <time 
                v-if="config.showTimestamp"
                class="toast-timestamp"
                :datetime="notification.timestamp.toISOString()"
              >
                {{ formatTimestamp(notification.timestamp) }}
              </time>
            </div>

            <!-- Actions -->
            <div v-if="notification.actions && notification.actions.length > 0" class="toast-actions">
              <button
                v-for="action in notification.actions.slice(0, 2)"
                :key="action.label"
                @click="handleAction(action, notification)"
                class="toast-action-btn"
                :class="action.variant || 'secondary'"
                :disabled="action.loading"
                type="button"
              >
                <LoadingSpinner v-if="action.loading" class="w-3 h-3" />
                {{ action.label }}
              </button>
            </div>

            <!-- Dismiss button -->
            <button
              v-if="config.allowDismiss && !notification.persistent"
              @click="dismiss(notification.id)"
              class="toast-dismiss"
              :aria-label="$t('notifications.dismiss', 'Dismiss notification')"
              type="button"
            >
              <XMarkIcon class="w-4 h-4" />
            </button>
          </div>

          <!-- Auto-dismiss timer indicator -->
          <div 
            v-if="notification.duration && !notification.persistent"
            class="toast-timer"
            :style="{ 
              animationDuration: `${notification.duration}ms`,
              animationPlayState: isHovered(notification.id) ? 'paused' : 'running'
            }"
          ></div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Notification sound -->
    <audio
      v-if="soundEnabled"
      ref="notificationSound"
      preload="auto"
      style="display: none"
    >
      <source :src="currentSoundUrl" type="audio/mp3" />
    </audio>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import { useNotifications } from '../composables/useNotifications'
import { useI18n } from '../composables/useI18n'
import LoadingSpinner from './LoadingSpinner.vue'

interface Props {
  maxVisible?: number
  soundEnabled?: boolean
  pauseOnHover?: boolean
  enableSwipeGestures?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxVisible: 5,
  soundEnabled: true,
  pauseOnHover: true,
  enableSwipeGestures: true
})

const { t } = useI18n()
const { 
  activeNotifications, 
  dismiss, 
  config,
  updateConfig
} = useNotifications()

const hoveredToasts = ref(new Set<string>())
const notificationSound = ref<HTMLAudioElement>()
const currentSoundUrl = ref('')

// Display only the most recent notifications
const displayedNotifications = computed(() => {
  return activeNotifications.value.slice(0, props.maxVisible)
})

// Get appropriate icon for notification type
const getToastIcon = (type: string) => {
  switch (type) {
    case 'success':
      return CheckCircleIcon
    case 'error':
      return XCircleIcon
    case 'warning':
      return ExclamationTriangleIcon
    case 'info':
    default:
      return InformationCircleIcon
  }
}

// Check if toast is currently hovered
const isHovered = (notificationId: string): boolean => {
  return hoveredToasts.value.has(notificationId)
}

// Handle action button clicks
const handleAction = async (action: any, notification: any) => {
  try {
    action.loading = true
    await action.action()
  } catch (error) {
    console.error('Action failed:', error)
  } finally {
    action.loading = false
  }
}

// Format timestamp for display
const formatTimestamp = (timestamp: Date): string => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  
  // Less than a minute ago
  if (diff < 60000) {
    return t('notifications.just_now', 'Just now')
  }
  
  // Less than an hour ago
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return t('notifications.minutes_ago', '{count}m ago', { count: minutes })
  }
  
  // Less than a day ago
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return t('notifications.hours_ago', '{count}h ago', { count: hours })
  }
  
  // Use full date
  return timestamp.toLocaleDateString()
}

// Play notification sound
const playSound = async (type: string) => {
  if (!props.soundEnabled || !notificationSound.value) return
  
  try {
    // Reset and play sound
    notificationSound.value.currentTime = 0
    await notificationSound.value.play()
  } catch (error) {
    // Silent fail for audio playback issues
  }
}

// Handle mouse events for pause on hover
const handleMouseEnter = (notificationId: string) => {
  if (props.pauseOnHover) {
    hoveredToasts.value.add(notificationId)
  }
}

const handleMouseLeave = (notificationId: string) => {
  if (props.pauseOnHover) {
    hoveredToasts.value.delete(notificationId)
  }
}

// Touch/swipe gesture handling
const handleTouchStart = (event: TouchEvent, notificationId: string) => {
  if (!props.enableSwipeGestures) return
  
  const touch = event.touches[0]
  const startX = touch.clientX
  const startTime = Date.now()
  
  const handleTouchMove = (moveEvent: TouchEvent) => {
    const moveTouch = moveEvent.touches[0]
    const deltaX = moveTouch.clientX - startX
    const element = event.currentTarget as HTMLElement
    
    // Apply transform for visual feedback
    if (Math.abs(deltaX) > 10) {
      element.style.transform = `translateX(${deltaX}px)`
      element.style.opacity = `${Math.max(0.3, 1 - Math.abs(deltaX) / 200)}`
    }
  }
  
  const handleTouchEnd = (endEvent: TouchEvent) => {
    const endTouch = endEvent.changedTouches[0]
    const deltaX = endTouch.clientX - startX
    const deltaTime = Date.now() - startTime
    const element = event.currentTarget as HTMLElement
    
    // Clean up event listeners
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
    
    // Check for swipe gesture
    const isSwipe = Math.abs(deltaX) > 100 && deltaTime < 300
    
    if (isSwipe) {
      // Dismiss on swipe
      dismiss(notificationId)
    } else {
      // Reset position
      element.style.transform = ''
      element.style.opacity = ''
    }
  }
  
  document.addEventListener('touchmove', handleTouchMove, { passive: true })
  document.addEventListener('touchend', handleTouchEnd, { passive: true })
}

// Watch for new notifications to play sounds
watch(activeNotifications, (newNotifications, oldNotifications) => {
  if (newNotifications.length > (oldNotifications?.length || 0)) {
    const latestNotification = newNotifications[0]
    if (latestNotification) {
      playSound(latestNotification.type)
    }
  }
}, { deep: true })
</script>

<style scoped>
.notification-container {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  max-width: min(400px, 90vw);
}

/* Position variants */
.position-top-right {
  top: var(--space-4);
  right: var(--space-4);
}

.position-top-left {
  top: var(--space-4);
  left: var(--space-4);
}

.position-top-center {
  top: var(--space-4);
  left: 50%;
  transform: translateX(-50%);
}

.position-bottom-right {
  bottom: var(--space-4);
  right: var(--space-4);
}

.position-bottom-left {
  bottom: var(--space-4);
  left: var(--space-4);
}

.position-bottom-center {
  bottom: var(--space-4);
  left: 50%;
  transform: translateX(-50%);
}

.toast-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.toast {
  pointer-events: all;
  background: var(--color-background);
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--color-border);
  overflow: hidden;
  position: relative;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.toast-content {
  display: flex;
  align-items: flex-start;
  padding: var(--space-4);
  gap: var(--space-3);
  position: relative;
}

/* Toast type colors */
.toast-success {
  border-left: 4px solid var(--color-success);
}

.toast-error {
  border-left: 4px solid var(--color-error);
}

.toast-warning {
  border-left: 4px solid var(--color-warning);
}

.toast-info {
  border-left: 4px solid var(--color-info);
}

/* Icons */
.toast-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.icon-success {
  color: var(--color-success);
}

.icon-error {
  color: var(--color-error);
}

.icon-warning {
  color: var(--color-warning);
}

.icon-info {
  color: var(--color-info);
}

/* Message content */
.toast-message {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--color-text);
  margin: 0 0 var(--space-1) 0;
  line-height: 1.4;
}

.toast-text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.4;
  word-wrap: break-word;
}

.toast-progress-bar {
  width: 100%;
  height: 4px;
  background: var(--color-background-muted);
  border-radius: 2px;
  margin-top: var(--space-3);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
  border-radius: 2px;
}

.toast-timestamp {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin-top: var(--space-2);
  display: block;
}

/* Actions */
.toast-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.toast-action-btn {
  padding: var(--space-2) var(--space-3);
  border-radius: 6px;
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.toast-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toast-action-btn.primary {
  background: var(--color-primary);
  color: white;
}

.toast-action-btn.primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.toast-action-btn.secondary {
  background: var(--color-background-muted);
  color: var(--color-text);
}

.toast-action-btn.secondary:hover:not(:disabled) {
  background: var(--color-background-hover);
}

.toast-action-btn.danger {
  background: var(--color-error);
  color: white;
}

.toast-action-btn.danger:hover:not(:disabled) {
  background: var(--color-error-hover);
}

/* Dismiss button */
.toast-dismiss {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 6px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.toast-dismiss:hover {
  background: var(--color-background-muted);
  color: var(--color-text);
}

.toast-dismiss:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

/* Timer indicator */
.toast-timer {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--color-primary);
  animation: toast-timer linear forwards;
}

@keyframes toast-timer {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

/* Transitions */
.animate .toast-enter-active,
.animate .toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate .toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.animate .toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
  margin-bottom: calc(-1 * (var(--space-4) + var(--space-3)));
}

/* Left position animations */
.position-top-left.animate .toast-enter-from,
.position-bottom-left.animate .toast-enter-from {
  transform: translateX(-100%);
}

.position-top-left.animate .toast-leave-to,
.position-bottom-left.animate .toast-leave-to {
  transform: translateX(-100%);
}

/* Center position animations */
.position-top-center.animate .toast-enter-from,
.position-bottom-center.animate .toast-enter-from {
  transform: translateX(-50%) translateY(-100%);
}

.position-top-center.animate .toast-leave-to,
.position-bottom-center.animate .toast-leave-to {
  transform: translateX(-50%) translateY(-100%);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .toast {
    background: rgba(31, 41, 55, 0.95);
    border-color: var(--color-border-dark);
  }
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .notification-container {
    max-width: calc(100vw - var(--space-4));
    left: var(--space-2) !important;
    right: var(--space-2) !important;
    transform: none !important;
  }

  .toast-content {
    padding: var(--space-3);
  }

  .toast-actions {
    flex-direction: column;
  }

  .toast-action-btn {
    justify-content: center;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .toast {
    border-width: 2px;
  }
  
  .toast-dismiss:focus {
    outline-width: 3px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .animate .toast-enter-active,
  .animate .toast-leave-active {
    transition: none;
  }
  
  .toast-timer {
    animation: none;
  }
  
  .progress-fill {
    transition: none;
  }
}

/* RTL support */
.rtl .toast {
  border-left: none;
  border-right: 4px solid;
}

.rtl .toast-dismiss {
  right: auto;
  left: var(--space-2);
}

.rtl.animate .toast-enter-from {
  transform: translateX(-100%);
}

.rtl.animate .toast-leave-to {
  transform: translateX(-100%);
}
</style>