<template>
  <nav 
    class="mobile-bottom-nav"
    :class="{ 'has-safe-area': hasSafeArea }"
    role="navigation"
    :aria-label="$t('navigation.main_navigation')"
  >
    <div class="nav-items">
      <router-link
        v-for="item in navItems"
        :key="item.name"
        :to="item.to"
        class="nav-item"
        :class="{ active: isActiveRoute(item.to) }"
        :aria-label="$t(item.label)"
        @click="handleNavClick(item)"
      >
        <component 
          :is="item.icon" 
          class="nav-icon"
          :class="{ active: isActiveRoute(item.to) }"
        />
        <span class="nav-label">{{ $t(item.label) }}</span>
        
        <!-- Badge for notifications -->
        <span 
          v-if="item.badge && item.badge > 0"
          class="nav-badge"
          :aria-label="$t('navigation.notifications_count', { count: item.badge })"
        >
          {{ item.badge > 99 ? '99+' : item.badge }}
        </span>
      </router-link>
    </div>

    <!-- Floating action button overlay -->
    <button
      v-if="showFab"
      @click="handleFabClick"
      class="floating-action-btn"
      :aria-label="fabLabel || $t('navigation.main_action')"
      type="button"
    >
      <component :is="fabIcon" class="fab-icon" />
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  UserIcon,
  PlusIcon
} from '@heroicons/vue/24/outline'
import {
  HomeIcon as HomeSolidIcon,
  MagnifyingGlassIcon as MagnifyingSolidIcon,
  DocumentTextIcon as DocumentSolidIcon,
  ChartBarIcon as ChartSolidIcon,
  UserIcon as UserSolidIcon
} from '@heroicons/vue/24/solid'
import { useI18n } from '../../composables/useI18n'
import { useScreenReader } from '../../composables/useScreenReader'
import { useViewport } from '../../composables/useViewport'

interface NavItem {
  name: string
  to: string
  label: string
  icon: any
  activeIcon?: any
  badge?: number
  requiresAuth?: boolean
}

interface Props {
  items?: NavItem[]
  showFab?: boolean
  fabIcon?: any
  fabLabel?: string
  maxItems?: number
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  showFab: false,
  fabIcon: PlusIcon,
  fabLabel: '',
  maxItems: 5
})

const emit = defineEmits<{
  'nav-click': [item: NavItem]
  'fab-click': []
}>()

const { t } = useI18n()
const { announce } = useScreenReader()
const { safeAreaInsets } = useViewport()
const route = useRoute()
const router = useRouter()

// Check for safe area support
const hasSafeArea = computed(() => {
  return safeAreaInsets.value.bottom > 0
})

// Default navigation items if none provided
const defaultNavItems: NavItem[] = [
  {
    name: 'home',
    to: '/',
    label: 'navigation.home',
    icon: HomeIcon,
    activeIcon: HomeSolidIcon
  },
  {
    name: 'search',
    to: '/search',
    label: 'navigation.search',
    icon: MagnifyingGlassIcon,
    activeIcon: MagnifyingSolidIcon
  },
  {
    name: 'documents',
    to: '/documents',
    label: 'navigation.documents',
    icon: DocumentTextIcon,
    activeIcon: DocumentSolidIcon
  },
  {
    name: 'analytics',
    to: '/analytics',
    label: 'navigation.analytics',
    icon: ChartBarIcon,
    activeIcon: ChartSolidIcon
  },
  {
    name: 'profile',
    to: '/profile',
    label: 'navigation.profile',
    icon: UserIcon,
    activeIcon: UserSolidIcon
  }
]

// Use provided items or defaults, limited by maxItems
const navItems = computed(() => {
  const items = props.items.length > 0 ? props.items : defaultNavItems
  return items.slice(0, props.maxItems)
})

// Check if route is active
const isActiveRoute = (to: string): boolean => {
  if (to === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(to)
}

// Get appropriate icon (active/inactive)
const getNavIcon = (item: NavItem) => {
  return isActiveRoute(item.to) && item.activeIcon ? item.activeIcon : item.icon
}

// Handle navigation click
const handleNavClick = (item: NavItem) => {
  emit('nav-click', item)
  
  // Announce navigation to screen readers
  const currentLabel = t(item.label)
  announce(t('navigation.navigated_to', { page: currentLabel }), { priority: 'low' })
  
  // Add haptic feedback if available
  if (navigator.vibrate) {
    navigator.vibrate([10])
  }
}

// Handle FAB click
const handleFabClick = () => {
  emit('fab-click')
  
  // Haptic feedback
  if (navigator.vibrate) {
    navigator.vibrate([15])
  }
}
</script>

<style scoped>
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-background);
  border-top: 1px solid var(--color-border);
  padding: var(--space-2) var(--space-4) var(--space-2);
  z-index: 1000;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.mobile-bottom-nav.has-safe-area {
  padding-bottom: max(var(--space-2), env(safe-area-inset-bottom));
}

.nav-items {
  display: flex;
  justify-content: space-around;
  align-items: center;
  max-width: 100%;
  margin: 0 auto;
}

.nav-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2);
  text-decoration: none;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
  border-radius: 12px;
  min-width: var(--touch-target-min);
  min-height: var(--touch-target-min);
  gap: var(--space-1);
  -webkit-tap-highlight-color: transparent;
  flex: 1;
  max-width: 80px;
}

.nav-item:hover,
.nav-item:focus {
  background-color: var(--color-background-muted);
  color: var(--color-text);
  transform: translateY(-2px);
}

.nav-item:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.nav-item.active {
  color: var(--color-primary);
}

.nav-item:active {
  transform: translateY(0) scale(0.95);
}

.nav-icon {
  width: 24px;
  height: 24px;
  stroke-width: 1.5;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.nav-icon.active {
  stroke-width: 2;
  transform: scale(1.1);
}

.nav-label {
  font-size: var(--text-xs);
  font-weight: 500;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  margin-top: 1px;
}

.nav-item.active .nav-label {
  font-weight: 600;
}

.nav-badge {
  position: absolute;
  top: 0;
  right: 8px;
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
  line-height: 1;
  padding: 0 4px;
  border: 2px solid var(--color-background);
}

.floating-action-btn {
  position: absolute;
  right: var(--space-4);
  top: -28px;
  width: 56px;
  height: 56px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.floating-action-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.floating-action-btn:focus {
  outline: 3px solid var(--color-primary-light);
  outline-offset: 2px;
}

.floating-action-btn:active {
  transform: scale(0.95);
}

.fab-icon {
  width: 24px;
  height: 24px;
  stroke-width: 2;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .mobile-bottom-nav {
    background: rgba(17, 24, 39, 0.95);
    border-top-color: var(--color-border-dark);
  }
  
  .nav-badge {
    border-color: rgba(17, 24, 39, 0.95);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .mobile-bottom-nav {
    border-top-width: 2px;
  }
  
  .nav-item:focus {
    outline-width: 3px;
  }
  
  .floating-action-btn:focus {
    outline-width: 4px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .nav-item,
  .nav-icon,
  .floating-action-btn {
    transition: none;
  }
  
  .nav-item:hover,
  .nav-item:focus {
    transform: none;
  }
  
  .nav-item:active,
  .floating-action-btn:active {
    transform: none;
  }
  
  .nav-icon.active {
    transform: none;
  }
}

/* Landscape orientation adjustments */
@media (max-height: 500px) and (orientation: landscape) {
  .mobile-bottom-nav {
    padding: var(--space-1) var(--space-4);
  }
  
  .nav-item {
    padding: var(--space-1);
    gap: 2px;
  }
  
  .nav-icon {
    width: 20px;
    height: 20px;
  }
  
  .nav-label {
    font-size: 10px;
  }
  
  .floating-action-btn {
    width: 48px;
    height: 48px;
    top: -24px;
  }
  
  .fab-icon {
    width: 20px;
    height: 20px;
  }
}

/* RTL support */
.rtl .floating-action-btn {
  right: auto;
  left: var(--space-4);
}

/* Tablet adjustments */
@media (min-width: 768px) and (max-width: 1023px) {
  .nav-items {
    max-width: 600px;
    gap: var(--space-4);
  }
  
  .nav-item {
    max-width: 100px;
    padding: var(--space-3);
  }
  
  .nav-icon {
    width: 28px;
    height: 28px;
  }
  
  .nav-label {
    font-size: var(--text-sm);
  }
  
  .floating-action-btn {
    width: 64px;
    height: 64px;
    right: var(--space-6);
    top: -32px;
  }
  
  .fab-icon {
    width: 28px;
    height: 28px;
  }
}

/* Very small screens */
@media (max-width: 320px) {
  .nav-item {
    padding: var(--space-1);
    min-width: 40px;
    gap: 1px;
  }
  
  .nav-icon {
    width: 20px;
    height: 20px;
  }
  
  .nav-label {
    font-size: 10px;
  }
  
  .floating-action-btn {
    width: 48px;
    height: 48px;
    right: var(--space-3);
  }
}
</style>