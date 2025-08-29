<template>
  <div class="mobile-app-bar">
    <button
      ref="menuTrigger"
      @click="toggleMenu"
      :aria-expanded="isMenuOpen"
      :aria-label="$t('navigation.toggle_menu')"
      class="mobile-menu-trigger"
      :class="{ active: isMenuOpen }"
      type="button"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>

    <div class="app-bar-title">
      <router-link to="/" class="title-link">
        <h1>{{ $t('header.title') }}</h1>
      </router-link>
    </div>

    <div class="app-bar-actions">
      <!-- Language selector for mobile -->
      <LanguageSelector 
        compact 
        placement="bottom-right"
        class="mobile-language-selector"
      />
      
      <!-- Search button -->
      <button
        @click="openSearch"
        :aria-label="$t('common.search')"
        class="app-bar-action-btn"
        type="button"
      >
        <MagnifyingGlassIcon class="w-5 h-5" />
      </button>
    </div>

    <!-- Progress bar for loading states -->
    <div
      v-if="isLoading"
      class="mobile-progress-bar"
      role="progressbar"
      :aria-label="$t('common.loading')"
    >
      <div class="progress-fill"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/solid'
import { useI18n } from '../../composables/useI18n'
import { useScreenReader } from '../../composables/useScreenReader'
import LanguageSelector from '../LanguageSelector.vue'

interface Props {
  showBackButton?: boolean
  customTitle?: string
  hideActions?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showBackButton: false,
  customTitle: '',
  hideActions: false,
  loading: false
})

const emit = defineEmits<{
  'menu-toggle': [isOpen: boolean]
  'back-clicked': []
  'search-opened': []
}>()

// Mobile navigation state injected from parent
const mobileNavState = inject<{
  isMenuOpen: boolean
  toggleMenu: () => void
}>('mobileNavState', {
  isMenuOpen: false,
  toggleMenu: () => {}
})

const { t } = useI18n()
const { announce } = useScreenReader()
const router = useRouter()
const route = useRoute()

const menuTrigger = ref<HTMLButtonElement>()
const isLoading = ref(props.loading)

const isMenuOpen = computed(() => mobileNavState.isMenuOpen)

const pageTitle = computed(() => {
  if (props.customTitle) return props.customTitle
  
  // Generate title from route meta or name
  if (route.meta?.title) return t(route.meta.title as string)
  if (route.name) return t(`navigation.${route.name.toString().toLowerCase()}`)
  
  return t('header.title')
})

const toggleMenu = () => {
  mobileNavState.toggleMenu()
  emit('menu-toggle', isMenuOpen.value)
  
  // Announce menu state to screen readers
  const message = isMenuOpen.value 
    ? t('notifications.menu_opened', 'Menu opened')
    : t('notifications.menu_closed', 'Menu closed')
  
  setTimeout(() => {
    announce(message, { priority: 'low' })
  }, 100)
}

const goBack = () => {
  emit('back-clicked')
  
  // Try to go back in history, fallback to home
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
  
  announce(t('navigation.navigated_back', 'Navigated back'), { priority: 'low' })
}

const openSearch = () => {
  emit('search-opened')
  
  // Navigate to search page or trigger search modal
  if (route.path !== '/search') {
    router.push('/search')
  } else {
    // Focus search input if already on search page
    const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement
    if (searchInput) {
      searchInput.focus()
    }
  }
  
  announce(t('search.search_opened', 'Search opened'), { priority: 'low' })
}

const setLoadingState = (loading: boolean) => {
  isLoading.value = loading
  
  if (loading) {
    announce(t('common.loading'), { priority: 'low' })
  }
}

// Expose methods for parent components
defineExpose({
  setLoadingState,
  toggleMenu,
  goBack
})
</script>

<style scoped>
.mobile-app-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-4);
  z-index: 1000;
  padding-top: max(0px, env(safe-area-inset-top));
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.mobile-menu-trigger {
  width: 44px;
  height: 44px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  gap: 4px;
  -webkit-tap-highlight-color: transparent;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.mobile-menu-trigger:hover,
.mobile-menu-trigger:focus {
  background-color: var(--color-background-muted);
}

.mobile-menu-trigger:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.mobile-menu-trigger span {
  width: 20px;
  height: 2px;
  background: var(--color-text);
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  transform-origin: center;
  border-radius: 1px;
}

.mobile-menu-trigger.active span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.mobile-menu-trigger.active span:nth-child(2) {
  opacity: 0;
  transform: scaleX(0);
}

.mobile-menu-trigger.active span:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -5px);
}

.app-bar-title {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 var(--space-4);
  min-width: 0;
}

.title-link {
  text-decoration: none;
  color: inherit;
  display: flex;
  align-items: center;
  min-width: 0;
}

.title-link:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

.app-bar-title h1 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.app-bar-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.app-bar-action-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 8px;
  color: var(--color-text);
  cursor: pointer;
  transition: background-color 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.app-bar-action-btn:hover,
.app-bar-action-btn:focus {
  background-color: var(--color-background-muted);
}

.app-bar-action-btn:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.app-bar-action-btn:active {
  transform: scale(0.95);
}

.mobile-language-selector {
  margin-right: var(--space-1);
}

.back-button {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: none;
  border: none;
  border-radius: 8px;
  color: var(--color-text);
  cursor: pointer;
  transition: background-color 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  font-size: 0.875rem;
}

.back-button:hover,
.back-button:focus {
  background-color: var(--color-background-muted);
}

.back-button:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Progress bar */
.mobile-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-background-muted);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  animation: indeterminate 1.5s linear infinite;
  transform-origin: left;
}

@keyframes indeterminate {
  0% {
    transform: scaleX(0) translateX(-100%);
  }
  50% {
    transform: scaleX(0.6) translateX(0);
  }
  100% {
    transform: scaleX(0) translateX(100%);
  }
}

/* RTL support */
.rtl .mobile-menu-trigger.active span:nth-child(1) {
  transform: rotate(-45deg) translate(5px, -5px);
}

.rtl .mobile-menu-trigger.active span:nth-child(3) {
  transform: rotate(45deg) translate(5px, 5px);
}

.rtl .app-bar-actions {
  flex-direction: row-reverse;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .mobile-app-bar {
    background: rgba(17, 24, 39, 0.9);
    border-bottom-color: var(--color-border-dark);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .mobile-app-bar {
    border-bottom-width: 2px;
  }
  
  .mobile-menu-trigger:focus,
  .app-bar-action-btn:focus,
  .back-button:focus {
    outline-width: 3px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .mobile-menu-trigger span,
  .app-bar-action-btn,
  .back-button {
    transition: none;
  }
  
  .progress-fill {
    animation: none;
    width: 100%;
  }
}

/* Tablet adjustments */
@media (min-width: 768px) and (max-width: 1023px) {
  .mobile-app-bar {
    height: 64px;
    padding: 0 var(--space-6);
  }
  
  .app-bar-title h1 {
    font-size: 1.25rem;
  }
  
  .mobile-menu-trigger,
  .app-bar-action-btn {
    width: 48px;
    height: 48px;
  }
}

/* Safe area adjustments for devices with notches */
@supports (padding-top: env(safe-area-inset-top)) {
  .mobile-app-bar {
    height: calc(56px + env(safe-area-inset-top));
  }
}

/* Landscape orientation adjustments */
@media (max-height: 500px) and (orientation: landscape) {
  .mobile-app-bar {
    height: 48px;
    padding-top: 0;
  }
  
  .app-bar-title h1 {
    font-size: 1rem;
  }
  
  .mobile-menu-trigger,
  .app-bar-action-btn {
    width: 40px;
    height: 40px;
  }
  
  .mobile-menu-trigger span {
    width: 18px;
  }
}
</style>