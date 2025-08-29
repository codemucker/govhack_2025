<template>
  <div class="language-selector" :class="{ 'rtl': isRTL }">
    <div class="selector-container">
      <button
        ref="triggerRef"
        @click="toggleDropdown"
        @keydown="handleTriggerKeydown"
        :aria-expanded="isOpen"
        :aria-haspopup="true"
        :aria-label="$t('accessibility.language_selection')"
        class="language-trigger"
        type="button"
      >
        <div class="current-language">
          <span class="language-flag">{{ getCurrentFlag() }}</span>
          <span class="language-name">{{ getCurrentLanguageName() }}</span>
        </div>
        <ChevronDownIcon 
          class="chevron-icon" 
          :class="{ 'rotated': isOpen }"
          aria-hidden="true"
        />
      </button>

      <Transition name="dropdown">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          class="language-dropdown"
          role="listbox"
          :aria-label="$t('accessibility.language_selection')"
          @keydown="handleDropdownKeydown"
        >
          <div
            v-for="(language, index) in availableLanguages"
            :key="language.code"
            :ref="el => setOptionRef(el, index)"
            role="option"
            :aria-selected="language.code === currentLocale"
            :class="[
              'language-option',
              {
                'selected': language.code === currentLocale,
                'focused': focusedIndex === index
              }
            ]"
            @click="selectLanguage(language.code)"
            @mouseenter="focusedIndex = index"
          >
            <span class="language-flag">{{ getLanguageFlag(language.code) }}</span>
            <div class="language-info">
              <span class="language-native">{{ language.nativeName }}</span>
              <span class="language-english">{{ getEnglishName(language.code) }}</span>
            </div>
            <CheckIcon 
              v-if="language.code === currentLocale"
              class="check-icon"
              aria-hidden="true"
            />
          </div>
        </div>
      </Transition>
    </div>

    <!-- Screen reader announcements -->
    <div
      ref="announcementRef"
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
    >
      {{ announcement }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { ChevronDownIcon, CheckIcon } from '@heroicons/vue/24/solid'
import { useI18n } from '../composables/useI18n'
import { useAccessibility } from '../composables/useAccessibility'
import { useScreenReader } from '../composables/useScreenReader'
import type { SupportLocale } from '../plugins/i18n'

interface Props {
  compact?: boolean
  showFlags?: boolean
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  showFlags: true,
  placement: 'bottom-left'
})

const emit = defineEmits<{
  'language-changed': [locale: SupportLocale]
}>()

const { 
  currentLocale, 
  availableLanguages, 
  changeLanguage, 
  getLanguageDisplayName,
  isRTL,
  t
} = useI18n()

const { createFocusTrap, removeFocusTrap } = useAccessibility()
const { announce } = useScreenReader()

// Template refs
const triggerRef = ref<HTMLButtonElement>()
const dropdownRef = ref<HTMLDivElement>()
const announcementRef = ref<HTMLDivElement>()
const optionRefs = ref<HTMLElement[]>([])

// Component state
const isOpen = ref(false)
const focusedIndex = ref(-1)
const announcement = ref('')
const focusTrapId = ref<string>('')

// Language flag mappings
const languageFlags = {
  en: '🇺🇸',
  zh: '🇨🇳', 
  ar: '🇸🇦'
} as const

// English language names
const englishNames = {
  en: 'English',
  zh: 'Chinese',
  ar: 'Arabic'
} as const

const getCurrentFlag = (): string => {
  return props.showFlags ? languageFlags[currentLocale.value] || '🌐' : ''
}

const getCurrentLanguageName = (): string => {
  return props.compact 
    ? currentLocale.value.toUpperCase()
    : getLanguageDisplayName(currentLocale.value)
}

const getLanguageFlag = (locale: SupportLocale): string => {
  return props.showFlags ? languageFlags[locale] || '🌐' : ''
}

const getEnglishName = (locale: SupportLocale): string => {
  return englishNames[locale] || locale
}

const setOptionRef = (el: any, index: number) => {
  if (el) {
    optionRefs.value[index] = el
  }
}

const toggleDropdown = () => {
  if (isOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}

const openDropdown = async () => {
  isOpen.value = true
  focusedIndex.value = availableLanguages.value.findIndex(
    lang => lang.code === currentLocale.value
  )
  
  await nextTick()
  
  if (dropdownRef.value && triggerRef.value) {
    // Create focus trap
    focusTrapId.value = createFocusTrap(dropdownRef.value)
    
    // Position dropdown
    positionDropdown()
    
    // Focus current language option
    if (focusedIndex.value >= 0) {
      optionRefs.value[focusedIndex.value]?.focus()
    }
  }
  
  // Announce to screen readers
  announce(t('accessibility.language_selection'), { priority: 'low' })
}

const closeDropdown = () => {
  isOpen.value = false
  focusedIndex.value = -1
  
  if (focusTrapId.value) {
    removeFocusTrap(focusTrapId.value, triggerRef.value)
    focusTrapId.value = ''
  }
  
  // Return focus to trigger
  nextTick(() => {
    triggerRef.value?.focus()
  })
}

const positionDropdown = () => {
  if (!dropdownRef.value || !triggerRef.value) return
  
  const trigger = triggerRef.value
  const dropdown = dropdownRef.value
  const triggerRect = trigger.getBoundingClientRect()
  const dropdownRect = dropdown.getBoundingClientRect()
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  }
  
  // Reset position
  dropdown.style.top = ''
  dropdown.style.bottom = ''
  dropdown.style.left = ''
  dropdown.style.right = ''
  
  // Determine vertical position
  const spaceBelow = viewport.height - triggerRect.bottom
  const spaceAbove = triggerRect.top
  const dropdownHeight = dropdownRect.height
  
  const placeAbove = props.placement.startsWith('top') || 
    (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight)
  
  if (placeAbove) {
    dropdown.style.bottom = `${viewport.height - triggerRect.top}px`
  } else {
    dropdown.style.top = `${triggerRect.bottom}px`
  }
  
  // Determine horizontal position
  const placeRight = props.placement.endsWith('right') || isRTL.value
  const spaceRight = viewport.width - triggerRect.right
  const spaceLeft = triggerRect.left
  const dropdownWidth = dropdownRect.width
  
  if (placeRight && spaceRight >= dropdownWidth) {
    dropdown.style.right = `${viewport.width - triggerRect.right}px`
  } else if (!placeRight && spaceLeft >= dropdownWidth) {
    dropdown.style.left = `${triggerRect.left}px`
  } else {
    // Default to left alignment, adjusting if needed
    const leftPosition = Math.max(8, Math.min(
      triggerRect.left, 
      viewport.width - dropdownWidth - 8
    ))
    dropdown.style.left = `${leftPosition}px`
  }
}

const selectLanguage = async (locale: SupportLocale) => {
  if (locale === currentLocale.value) {
    closeDropdown()
    return
  }
  
  try {
    const success = await changeLanguage(locale)
    
    if (success) {
      // Announce language change
      const languageName = getLanguageDisplayName(locale)
      announcement.value = t('notifications.language_changed').replace(
        '{language}', 
        languageName
      )
      
      emit('language-changed', locale)
      
      // Small delay before closing to ensure announcement is heard
      setTimeout(() => {
        closeDropdown()
      }, 100)
    }
  } catch (error) {
    console.error('Failed to change language:', error)
    announcement.value = t('errors.generic')
  }
}

const handleTriggerKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowUp':
    case 'Enter':
    case ' ':
      event.preventDefault()
      openDropdown()
      break
      
    case 'Escape':
      if (isOpen.value) {
        event.preventDefault()
        closeDropdown()
      }
      break
  }
}

const handleDropdownKeydown = (event: KeyboardEvent) => {
  const maxIndex = availableLanguages.value.length - 1
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      focusedIndex.value = Math.min(focusedIndex.value + 1, maxIndex)
      optionRefs.value[focusedIndex.value]?.focus()
      break
      
    case 'ArrowUp':
      event.preventDefault()
      focusedIndex.value = Math.max(focusedIndex.value - 1, 0)
      optionRefs.value[focusedIndex.value]?.focus()
      break
      
    case 'Home':
      event.preventDefault()
      focusedIndex.value = 0
      optionRefs.value[0]?.focus()
      break
      
    case 'End':
      event.preventDefault()
      focusedIndex.value = maxIndex
      optionRefs.value[maxIndex]?.focus()
      break
      
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (focusedIndex.value >= 0) {
        selectLanguage(availableLanguages.value[focusedIndex.value].code)
      }
      break
      
    case 'Escape':
      event.preventDefault()
      closeDropdown()
      break
      
    default:
      // Type-to-select functionality
      handleTypeToSelect(event.key)
      break
  }
}

let typeBuffer = ''
let typeTimeout: number | null = null

const handleTypeToSelect = (char: string) => {
  if (char.length !== 1) return
  
  if (typeTimeout) {
    clearTimeout(typeTimeout)
  }
  
  typeBuffer += char.toLowerCase()
  
  // Find matching language
  const matchIndex = availableLanguages.value.findIndex(lang =>
    lang.nativeName.toLowerCase().startsWith(typeBuffer) ||
    getEnglishName(lang.code).toLowerCase().startsWith(typeBuffer)
  )
  
  if (matchIndex >= 0) {
    focusedIndex.value = matchIndex
    optionRefs.value[matchIndex]?.focus()
  }
  
  // Clear buffer after 1 second
  typeTimeout = window.setTimeout(() => {
    typeBuffer = ''
    typeTimeout = null
  }, 1000)
}

const handleClickOutside = (event: MouseEvent) => {
  if (!isOpen.value) return
  
  const target = event.target as Element
  if (
    dropdownRef.value && 
    !dropdownRef.value.contains(target) &&
    triggerRef.value &&
    !triggerRef.value.contains(target)
  ) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', positionDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', positionDropdown)
  
  if (typeTimeout) {
    clearTimeout(typeTimeout)
  }
  
  if (focusTrapId.value) {
    removeFocusTrap(focusTrapId.value)
  }
})
</script>

<style scoped>
.language-selector {
  @apply relative inline-block;
}

.selector-container {
  @apply relative;
}

.language-trigger {
  @apply flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 
         border border-gray-300 dark:border-gray-600 rounded-lg
         hover:bg-gray-50 dark:hover:bg-gray-700 
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
         transition-colors cursor-pointer min-w-0;
}

.current-language {
  @apply flex items-center gap-2 min-w-0;
}

.language-flag {
  @apply text-lg flex-shrink-0;
}

.language-name {
  @apply text-sm font-medium text-gray-900 dark:text-white truncate;
}

.chevron-icon {
  @apply w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform flex-shrink-0;
}

.chevron-icon.rotated {
  @apply transform rotate-180;
}

.language-dropdown {
  @apply absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg
         border border-gray-200 dark:border-gray-700 py-2 min-w-48
         max-h-64 overflow-auto;
}

.language-option {
  @apply flex items-center gap-3 px-4 py-3 cursor-pointer
         hover:bg-gray-50 dark:hover:bg-gray-700
         focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none
         transition-colors;
}

.language-option.selected {
  @apply bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100;
}

.language-option.focused {
  @apply bg-gray-100 dark:bg-gray-600;
}

.language-option.selected.focused {
  @apply bg-blue-100 dark:bg-blue-900/30;
}

.language-info {
  @apply flex-1 min-w-0;
}

.language-native {
  @apply block text-sm font-medium text-gray-900 dark:text-white;
}

.language-english {
  @apply block text-xs text-gray-500 dark:text-gray-400;
}

.check-icon {
  @apply w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0;
}

/* RTL adjustments */
.rtl .language-trigger {
  @apply flex-row-reverse;
}

.rtl .current-language {
  @apply flex-row-reverse;
}

.rtl .language-option {
  @apply flex-row-reverse text-right;
}

/* Dropdown animation */
.dropdown-enter-active {
  @apply transition-all duration-200 ease-out;
}

.dropdown-leave-active {
  @apply transition-all duration-150 ease-in;
}

.dropdown-enter-from {
  @apply opacity-0 transform scale-95 -translate-y-1;
}

.dropdown-leave-to {
  @apply opacity-0 transform scale-95 -translate-y-1;
}

/* Screen reader only */
.sr-only {
  @apply absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0;
  clip: rect(0, 0, 0, 0);
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .language-trigger {
    @apply border-2;
  }
  
  .language-option:hover,
  .language-option:focus {
    @apply bg-black text-white;
  }
  
  .language-option.selected {
    @apply bg-blue-700 text-white;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .chevron-icon,
  .dropdown-enter-active,
  .dropdown-leave-active {
    @apply transition-none;
  }
}

/* Compact mode */
.language-selector.compact .language-trigger {
  @apply px-2 py-1;
}

.language-selector.compact .language-name {
  @apply text-xs;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .language-dropdown {
    @apply min-w-40;
  }
  
  .language-option {
    @apply px-3 py-2;
  }
  
  .language-native {
    @apply text-xs;
  }
  
  .language-english {
    @apply hidden;
  }
}
</style>