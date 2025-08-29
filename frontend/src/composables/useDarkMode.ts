import { ref, watch } from 'vue'

const isDarkMode = ref(false)
const STORAGE_KEY = 'legalease-dark-mode'

/**
 * Composable for dark mode theme management
 * Provides reactive dark mode state with localStorage persistence
 * @returns Object with dark mode state and toggle function
 * @example
 * const { isDarkMode, toggleDarkMode } = useDarkMode()
 * toggleDarkMode() // Switches theme and updates DOM
 */
export function useDarkMode() {
  /**
   * Initialize dark mode from localStorage or system preference
   */
  const initializeDarkMode = () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    
    if (stored !== null) {
      // Use stored preference
      isDarkMode.value = stored === 'true'
    } else {
      // Use system preference if available
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        isDarkMode.value = true
      }
    }
    
    updateDOMClasses()
  }

  /**
   * Update DOM classes based on dark mode state
   */
  const updateDOMClasses = () => {
    const html = document.documentElement
    
    if (isDarkMode.value) {
      html.classList.add('dark')
      html.setAttribute('data-theme', 'dark')
    } else {
      html.classList.remove('dark')
      html.setAttribute('data-theme', 'light')
    }
  }

  /**
   * Toggle dark mode state
   * Updates localStorage and DOM classes
   */
  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value
    localStorage.setItem(STORAGE_KEY, String(isDarkMode.value))
    updateDOMClasses()
  }

  /**
   * Set dark mode to specific value
   * @param value - Boolean indicating if dark mode should be enabled
   */
  const setDarkMode = (value: boolean) => {
    isDarkMode.value = value
    localStorage.setItem(STORAGE_KEY, String(value))
    updateDOMClasses()
  }

  // Watch for system preference changes
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only apply system preference if user hasn't explicitly set a preference
      if (localStorage.getItem(STORAGE_KEY) === null) {
        isDarkMode.value = e.matches
        updateDOMClasses()
      }
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange)
    } else {
      // Legacy browsers
      mediaQuery.addListener(handleSystemThemeChange)
    }
  }

  // Initialize on first use
  if (typeof window !== 'undefined') {
    initializeDarkMode()
  }

  return {
    isDarkMode,
    toggleDarkMode,
    setDarkMode
  }
}