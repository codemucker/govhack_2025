<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="backdrop">
      <div
        v-if="isOpen"
        class="mobile-drawer-backdrop"
        @click="handleBackdropClick"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      />
    </Transition>

    <!-- Drawer -->
    <Transition name="drawer" :duration="300">
      <nav
        v-if="isOpen"
        ref="drawerRef"
        class="mobile-drawer"
        :class="[
          `drawer-${position}`,
          { 'drawer-overlay': overlay, 'drawer-push': !overlay }
        ]"
        role="navigation"
        :aria-label="$t('navigation.main_navigation')"
        :aria-hidden="!isOpen"
        @keydown="handleKeydown"
      >
        <!-- Header -->
        <div class="drawer-header" v-if="$slots.header || showDefaultHeader">
          <slot name="header">
            <div class="default-header">
              <h2 class="drawer-title">{{ title || $t('navigation.menu') }}</h2>
              <button
                @click="close"
                class="close-button"
                :aria-label="$t('navigation.close_menu')"
                type="button"
              >
                <XMarkIcon class="w-6 h-6" />
              </button>
            </div>
          </slot>
        </div>

        <!-- Content -->
        <div class="drawer-content" :class="{ 'has-header': $slots.header || showDefaultHeader }">
          <slot>
            <!-- Default navigation items -->
            <div class="nav-section" v-if="navigationItems.length > 0">
              <ul class="nav-list" role="list">
                <li v-for="item in navigationItems" :key="item.name" role="listitem">
                  <router-link
                    :to="item.to"
                    class="nav-link"
                    :class="{ 'active': isActiveRoute(item.to), 'disabled': item.disabled }"
                    @click="handleNavClick(item)"
                    :aria-current="isActiveRoute(item.to) ? 'page' : undefined"
                  >
                    <component 
                      :is="item.icon" 
                      class="nav-icon"
                      v-if="item.icon"
                    />
                    <span class="nav-text">{{ $t(item.label) }}</span>
                    <span 
                      v-if="item.badge && item.badge > 0"
                      class="nav-badge"
                      :aria-label="$t('navigation.notifications_count', { count: item.badge })"
                    >
                      {{ item.badge > 99 ? '99+' : item.badge }}
                    </span>
                    <ChevronRightIcon 
                      v-if="item.children"
                      class="nav-chevron"
                    />
                  </router-link>

                  <!-- Submenu -->
                  <Transition name="submenu">
                    <ul 
                      v-if="item.children && expandedItems.includes(item.name)"
                      class="nav-submenu"
                      role="list"
                    >
                      <li v-for="child in item.children" :key="child.name" role="listitem">
                        <router-link
                          :to="child.to"
                          class="nav-sublink"
                          :class="{ 'active': isActiveRoute(child.to) }"
                          @click="handleNavClick(child)"
                        >
                          <component 
                            :is="child.icon" 
                            class="nav-subicon"
                            v-if="child.icon"
                          />
                          <span class="nav-subtext">{{ $t(child.label) }}</span>
                        </router-link>
                      </li>
                    </ul>
                  </Transition>
                </li>
              </ul>
            </div>

            <!-- Divider -->
            <div class="drawer-divider" v-if="showActions"></div>

            <!-- Actions section -->
            <div class="actions-section" v-if="showActions">
              <slot name="actions">
                <div class="action-buttons">
                  <LanguageSelector 
                    compact
                    placement="top-left"
                    class="drawer-language-selector"
                  />
                </div>
              </slot>
            </div>
          </slot>
        </div>

        <!-- Footer -->
        <div class="drawer-footer" v-if="$slots.footer">
          <slot name="footer"></slot>
        </div>
      </nav>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { 
  XMarkIcon, 
  ChevronRightIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'
import { useI18n } from '../../composables/useI18n'
import { useScreenReader } from '../../composables/useScreenReader'
import { useAccessibility } from '../../composables/useAccessibility'
import { useTouch } from '../../composables/useTouch'
import LanguageSelector from '../LanguageSelector.vue'

interface NavItem {
  name: string
  to: string
  label: string
  icon?: any
  badge?: number
  disabled?: boolean
  children?: NavItem[]
  requiresAuth?: boolean
}

interface Props {
  isOpen: boolean
  position?: 'left' | 'right'
  overlay?: boolean
  title?: string
  showDefaultHeader?: boolean
  showActions?: boolean
  items?: NavItem[]
  closeOnRouteChange?: boolean
  swipeToClose?: boolean
  lockBodyScroll?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  position: 'left',
  overlay: true,
  title: '',
  showDefaultHeader: true,
  showActions: true,
  items: () => [],
  closeOnRouteChange: true,
  swipeToClose: true,
  lockBodyScroll: true
})

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  'nav-click': [item: NavItem]
  'close': []
  'open': []
}>()

const { t } = useI18n()
const { announce } = useScreenReader()
const { createFocusTrap, restoreFocus } = useAccessibility()
const route = useRoute()

const drawerRef = ref<HTMLElement>()
const expandedItems = ref<string[]>([])
const focusTrapId = ref<string>()

// Touch handling for swipe to close
const startX = ref(0)
const currentX = ref(0)
const isDragging = ref(false)
const dragThreshold = 50

// Default navigation items
const defaultNavItems: NavItem[] = [
  {
    name: 'home',
    to: '/',
    label: 'navigation.home',
    icon: HomeIcon
  },
  {
    name: 'search',
    to: '/search',
    label: 'navigation.search',
    icon: MagnifyingGlassIcon
  },
  {
    name: 'documents',
    to: '/documents',
    label: 'navigation.documents',
    icon: DocumentTextIcon
  },
  {
    name: 'analytics',
    to: '/analytics',
    label: 'navigation.analytics',
    icon: ChartBarIcon
  },
  {
    name: 'profile',
    to: '/profile',
    label: 'navigation.profile',
    icon: UserIcon
  },
  {
    name: 'settings',
    to: '/settings',
    label: 'navigation.settings',
    icon: Cog6ToothIcon
  },
  {
    name: 'help',
    to: '/help',
    label: 'navigation.help',
    icon: QuestionMarkCircleIcon
  }
]

// Use provided items or defaults
const navigationItems = computed(() => {
  return props.items.length > 0 ? props.items : defaultNavItems
})

// Check if route is active
const isActiveRoute = (to: string): boolean => {
  if (to === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(to)
}

// Handle navigation click
const handleNavClick = (item: NavItem) => {
  if (item.disabled) return

  // Handle expandable items
  if (item.children) {
    toggleExpanded(item.name)
    return
  }

  emit('nav-click', item)
  
  if (props.closeOnRouteChange) {
    close()
  }

  // Announce navigation
  const currentLabel = t(item.label)
  announce(t('navigation.navigated_to', { page: currentLabel }), { priority: 'low' })
}

// Toggle expanded state for items with children
const toggleExpanded = (itemName: string) => {
  const index = expandedItems.value.indexOf(itemName)
  if (index > -1) {
    expandedItems.value.splice(index, 1)
  } else {
    expandedItems.value.push(itemName)
  }
}

// Close drawer
const close = () => {
  emit('update:isOpen', false)
  emit('close')
}

// Open drawer
const open = () => {
  emit('update:isOpen', true)
  emit('open')
}

// Handle backdrop click
const handleBackdropClick = () => {
  if (props.overlay) {
    close()
  }
}

// Handle keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    close()
    event.preventDefault()
  }
}

// Touch handlers for swipe to close
const handleTouchStart = (event: TouchEvent) => {
  if (!props.swipeToClose) return
  
  startX.value = event.touches[0].clientX
  isDragging.value = false
}

const handleTouchMove = (event: TouchEvent) => {
  if (!props.swipeToClose) return
  
  currentX.value = event.touches[0].clientX
  const diff = currentX.value - startX.value
  
  // Detect swipe direction based on drawer position
  const isClosingSwipe = props.position === 'left' ? diff < -dragThreshold : diff > dragThreshold
  
  if (Math.abs(diff) > 10) {
    isDragging.value = true
  }
  
  if (isClosingSwipe && isDragging.value) {
    event.preventDefault()
  }
}

const handleTouchEnd = () => {
  if (!props.swipeToClose || !isDragging.value) return
  
  const diff = currentX.value - startX.value
  const isClosingSwipe = props.position === 'left' ? diff < -dragThreshold : diff > dragThreshold
  
  if (isClosingSwipe) {
    close()
  }
  
  isDragging.value = false
  startX.value = 0
  currentX.value = 0
}

// Body scroll lock
const lockBodyScroll = () => {
  if (!props.lockBodyScroll) return
  document.body.style.overflow = 'hidden'
}

const unlockBodyScroll = () => {
  if (!props.lockBodyScroll) return
  document.body.style.overflow = ''
}

// Watch for open/close state changes
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    lockBodyScroll()
    
    // Set up focus trap
    await nextTick()
    if (drawerRef.value) {
      focusTrapId.value = createFocusTrap(drawerRef.value, {
        initialFocus: '.close-button, .nav-link',
        returnFocus: true
      })
    }
    
    announce(t('navigation.menu_opened'), { priority: 'low' })
  } else {
    unlockBodyScroll()
    
    // Clean up focus trap
    if (focusTrapId.value) {
      restoreFocus(focusTrapId.value)
      focusTrapId.value = undefined
    }
    
    announce(t('navigation.menu_closed'), { priority: 'low' })
  }
})

// Close on route change
watch(() => route.path, () => {
  if (props.closeOnRouteChange && props.isOpen) {
    close()
  }
})

// Cleanup on unmount
onUnmounted(() => {
  unlockBodyScroll()
  if (focusTrapId.value) {
    restoreFocus(focusTrapId.value)
  }
})
</script>

<style scoped>
.mobile-drawer-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.mobile-drawer {
  position: fixed;
  top: 0;
  bottom: 0;
  width: min(85vw, 320px);
  background: var(--color-background);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-right: 1px solid var(--color-border);
}

.drawer-left {
  left: 0;
  border-right: 1px solid var(--color-border);
  border-left: none;
}

.drawer-right {
  right: 0;
  border-left: 1px solid var(--color-border);
  border-right: none;
}

/* Header */
.drawer-header {
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-muted);
  flex-shrink: 0;
}

.default-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.drawer-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.close-button {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 8px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-button:hover,
.close-button:focus {
  background: var(--color-background-muted);
  color: var(--color-text);
}

.close-button:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Content */
.drawer-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: var(--space-4) 0;
}

.drawer-content.has-header {
  padding-top: 0;
}

/* Navigation */
.nav-section {
  padding: var(--space-4) 0;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  text-decoration: none;
  color: var(--color-text);
  transition: all 0.2s ease;
  gap: var(--space-3);
  min-height: var(--touch-target-comfortable);
  position: relative;
}

.nav-link:hover,
.nav-link:focus {
  background: var(--color-background-muted);
  color: var(--color-primary);
}

.nav-link:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.nav-link.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-right: 3px solid var(--color-primary);
}

.drawer-right .nav-link.active {
  border-right: none;
  border-left: 3px solid var(--color-primary);
}

.nav-link.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.nav-icon {
  width: 24px;
  height: 24px;
  stroke-width: 1.5;
  flex-shrink: 0;
}

.nav-text {
  flex: 1;
  font-weight: 500;
  min-width: 0;
}

.nav-badge {
  background: var(--color-error);
  color: white;
  border-radius: 10px;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  font-weight: 600;
  padding: 0 4px;
}

.nav-chevron {
  width: 16px;
  height: 16px;
  stroke-width: 2;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

/* Submenu */
.nav-submenu {
  list-style: none;
  padding: 0;
  margin: 0;
  background: var(--color-background-muted);
}

.nav-sublink {
  display: flex;
  align-items: center;
  padding: var(--space-2) var(--space-4) var(--space-2) var(--space-12);
  text-decoration: none;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
  gap: var(--space-3);
  font-size: var(--text-sm);
}

.nav-sublink:hover,
.nav-sublink:focus {
  background: var(--color-background);
  color: var(--color-text);
}

.nav-sublink.active {
  color: var(--color-primary);
  font-weight: 500;
}

.nav-subicon {
  width: 18px;
  height: 18px;
  stroke-width: 1.5;
  flex-shrink: 0;
}

.nav-subtext {
  flex: 1;
}

/* Divider */
.drawer-divider {
  height: 1px;
  background: var(--color-border);
  margin: var(--space-4) var(--space-4);
}

/* Actions */
.actions-section {
  padding: var(--space-4);
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.drawer-language-selector {
  align-self: flex-start;
}

/* Footer */
.drawer-footer {
  padding: var(--space-4);
  border-top: 1px solid var(--color-border);
  background: var(--color-background-muted);
  flex-shrink: 0;
}

/* Transitions */
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.3s ease;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-left.drawer-enter-from,
.drawer-left.drawer-leave-to {
  transform: translateX(-100%);
}

.drawer-right.drawer-enter-from,
.drawer-right.drawer-leave-to {
  transform: translateX(100%);
}

.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  max-height: 0;
}

.submenu-enter-to,
.submenu-leave-from {
  opacity: 1;
  max-height: 500px;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .mobile-drawer {
    background: rgba(17, 24, 39, 0.98);
    border-color: var(--color-border-dark);
  }
  
  .drawer-header,
  .drawer-footer,
  .nav-submenu {
    background: rgba(31, 41, 55, 0.8);
  }
}

/* RTL support */
.rtl .drawer-left {
  left: auto;
  right: 0;
  border-left: 1px solid var(--color-border);
  border-right: none;
}

.rtl .drawer-right {
  right: auto;
  left: 0;
  border-right: 1px solid var(--color-border);
  border-left: none;
}

.rtl .nav-link.active {
  border-right: none;
  border-left: 3px solid var(--color-primary);
}

.rtl .drawer-right .nav-link.active {
  border-left: none;
  border-right: 3px solid var(--color-primary);
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .mobile-drawer {
    border-width: 2px;
  }
  
  .nav-link:focus,
  .close-button:focus {
    outline-width: 3px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .backdrop-enter-active,
  .backdrop-leave-active,
  .drawer-enter-active,
  .drawer-leave-active,
  .submenu-enter-active,
  .submenu-leave-active,
  .nav-link,
  .nav-chevron,
  .close-button {
    transition: none;
  }
}

/* Tablet adjustments */
@media (min-width: 768px) and (max-width: 1023px) {
  .mobile-drawer {
    width: min(70vw, 400px);
  }
  
  .drawer-title {
    font-size: var(--text-xl);
  }
  
  .nav-link {
    padding: var(--space-4) var(--space-6);
  }
  
  .nav-icon {
    width: 28px;
    height: 28px;
  }
  
  .nav-text {
    font-size: var(--text-lg);
  }
}

/* Very small screens */
@media (max-width: 320px) {
  .mobile-drawer {
    width: 90vw;
  }
  
  .nav-link {
    padding: var(--space-2) var(--space-3);
  }
  
  .nav-text {
    font-size: var(--text-sm);
  }
}
</style>