import { ref, nextTick } from 'vue'

interface FocusTrapOptions {
  initialFocus?: string
  restoreOnUnmount?: boolean
  allowOutsideClick?: boolean
}

interface AccessibilityState {
  focusTraps: Map<string, HTMLElement[]>
  announcements: string[]
  highContrast: boolean
  reducedMotion: boolean
  fontSize: 'normal' | 'large' | 'extra-large'
}

let trapId = 0
const state = ref<AccessibilityState>({
  focusTraps: new Map(),
  announcements: [],
  highContrast: false,
  reducedMotion: false,
  fontSize: 'normal'
})

export function useAccessibility() {
  /**
   * Generate unique accessible IDs
   */
  let idCounter = 0
  const generateId = (prefix = 'accessible'): string => {
    return `${prefix}-${Date.now()}-${++idCounter}`
  }

  /**
   * Create focus trap for modal/overlay components
   */
  const createFocusTrap = (
    container: HTMLElement | string, 
    options: FocusTrapOptions = {}
  ): string => {
    const element = typeof container === 'string' 
      ? document.querySelector(container) as HTMLElement
      : container

    if (!element) {
      console.warn('Focus trap container not found')
      return ''
    }

    const id = `trap-${++trapId}`
    const focusableElements = getFocusableElements(element)
    
    if (focusableElements.length === 0) {
      console.warn('No focusable elements found in focus trap')
      return id
    }

    state.value.focusTraps.set(id, focusableElements)

    // Set initial focus
    const initialElement = options.initialFocus 
      ? element.querySelector(options.initialFocus) as HTMLElement
      : focusableElements[0]
    
    if (initialElement) {
      nextTick(() => initialElement.focus())
    }

    // Add keyboard event listeners
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        handleTabKey(event, focusableElements)
      } else if (event.key === 'Escape') {
        if (options.allowOutsideClick !== false) {
          removeFocusTrap(id)
        }
      }
    }

    element.addEventListener('keydown', handleKeyDown)
    
    // Store cleanup function
    const cleanup = () => {
      element.removeEventListener('keydown', handleKeyDown)
      state.value.focusTraps.delete(id)
    }

    // Store cleanup function on the element for later use
    ;(element as any)._focusTrapCleanup = cleanup

    return id
  }

  /**
   * Remove focus trap and optionally restore focus
   */
  const removeFocusTrap = (id: string, restoreElement?: HTMLElement) => {
    state.value.focusTraps.delete(id)
    
    if (restoreElement) {
      nextTick(() => restoreElement.focus())
    }
  }

  /**
   * Get all focusable elements within a container
   */
  const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter((el): el is HTMLElement => {
        const element = el as HTMLElement
        return element.offsetWidth > 0 && 
               element.offsetHeight > 0 && 
               !element.hidden &&
               window.getComputedStyle(element).visibility !== 'hidden'
      })
  }

  /**
   * Handle tab key navigation within focus trap
   */
  const handleTabKey = (event: KeyboardEvent, focusableElements: HTMLElement[]) => {
    const currentIndex = focusableElements.indexOf(event.target as HTMLElement)
    
    if (event.shiftKey) {
      // Shift + Tab (backward)
      const prevIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1
      focusableElements[prevIndex].focus()
    } else {
      // Tab (forward)  
      const nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1
      focusableElements[nextIndex].focus()
    }
    
    event.preventDefault()
  }

  /**
   * Announce message to screen readers
   */
  const announceToScreenReader = (
    message: string, 
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    // Find or create announcement container
    let announcer = document.getElementById('screen-reader-announcer')
    
    if (!announcer) {
      announcer = document.createElement('div')
      announcer.id = 'screen-reader-announcer'
      announcer.setAttribute('aria-live', priority)
      announcer.setAttribute('aria-atomic', 'true')
      announcer.className = 'sr-only'
      announcer.style.cssText = `
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      `
      document.body.appendChild(announcer)
    }

    // Update aria-live if priority changed
    if (announcer.getAttribute('aria-live') !== priority) {
      announcer.setAttribute('aria-live', priority)
    }

    // Clear and set new message
    announcer.textContent = ''
    setTimeout(() => {
      announcer!.textContent = message
      state.value.announcements.push(`${new Date().toISOString()}: ${message}`)
    }, 100)
  }

  /**
   * Check color contrast ratio
   */
  const checkColorContrast = (foreground: string, background: string): number => {
    const getLuminance = (color: string): number => {
      const rgb = hexToRgb(color)
      if (!rgb) return 0

      const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
        c = c / 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      })

      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }

    const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null
    }

    const l1 = getLuminance(foreground)
    const l2 = getLuminance(background)
    const brightest = Math.max(l1, l2)
    const darkest = Math.min(l1, l2)

    return (brightest + 0.05) / (darkest + 0.05)
  }

  /**
   * Set ARIA attributes on an element
   */
  const setAriaAttributes = (
    element: HTMLElement, 
    attributes: Record<string, string | boolean | number>
  ) => {
    Object.entries(attributes).forEach(([key, value]) => {
      if (value === false || value === null || value === undefined) {
        element.removeAttribute(key.startsWith('aria-') ? key : `aria-${key}`)
      } else {
        element.setAttribute(
          key.startsWith('aria-') ? key : `aria-${key}`, 
          String(value)
        )
      }
    })
  }

  /**
   * Create skip link for navigation
   */
  const createSkipLink = (target: string, text: string): HTMLElement => {
    const skipLink = document.createElement('a')
    skipLink.href = `#${target}`
    skipLink.textContent = text
    skipLink.className = 'skip-link'
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 1000;
      border-radius: 4px;
      transition: top 0.2s;
    `

    // Show on focus
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px'
    })

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px'
    })

    return skipLink
  }

  /**
   * Manage accessible form validation
   */
  const setFormValidation = (
    input: HTMLElement,
    isValid: boolean,
    message?: string
  ) => {
    const errorId = `${input.id}-error`
    
    if (isValid) {
      input.setAttribute('aria-invalid', 'false')
      input.removeAttribute('aria-describedby')
      
      // Remove error message
      const existingError = document.getElementById(errorId)
      if (existingError) {
        existingError.remove()
      }
    } else {
      input.setAttribute('aria-invalid', 'true')
      
      if (message) {
        input.setAttribute('aria-describedby', errorId)
        
        // Create or update error message
        let errorElement = document.getElementById(errorId)
        if (!errorElement) {
          errorElement = document.createElement('div')
          errorElement.id = errorId
          errorElement.className = 'form-error'
          errorElement.setAttribute('role', 'alert')
          errorElement.setAttribute('aria-live', 'assertive')
          input.parentNode?.insertBefore(errorElement, input.nextSibling)
        }
        
        errorElement.textContent = message
      }
    }
  }

  /**
   * Create accessible tooltip
   */
  const createTooltip = (
    trigger: HTMLElement,
    content: string,
    options: { placement?: 'top' | 'bottom' | 'left' | 'right' } = {}
  ) => {
    const tooltipId = generateId('tooltip')
    
    // Set ARIA attributes on trigger
    trigger.setAttribute('aria-describedby', tooltipId)
    
    const tooltip = document.createElement('div')
    tooltip.id = tooltipId
    tooltip.className = 'accessible-tooltip'
    tooltip.textContent = content
    tooltip.setAttribute('role', 'tooltip')
    
    // Basic positioning styles
    tooltip.style.cssText = `
      position: absolute;
      background: #333;
      color: #fff;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 1000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s;
    `

    document.body.appendChild(tooltip)

    // Position tooltip
    const updatePosition = () => {
      const triggerRect = trigger.getBoundingClientRect()
      const tooltipRect = tooltip.getBoundingClientRect()
      const { placement = 'top' } = options

      let top: number, left: number

      switch (placement) {
        case 'bottom':
          top = triggerRect.bottom + 5
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
          break
        case 'left':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
          left = triggerRect.left - tooltipRect.width - 5
          break
        case 'right':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
          left = triggerRect.right + 5
          break
        default: // top
          top = triggerRect.top - tooltipRect.height - 5
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
          break
      }

      tooltip.style.top = `${top}px`
      tooltip.style.left = `${left}px`
    }

    // Show/hide handlers
    const show = () => {
      updatePosition()
      tooltip.style.opacity = '1'
    }

    const hide = () => {
      tooltip.style.opacity = '0'
    }

    // Event listeners
    trigger.addEventListener('mouseenter', show)
    trigger.addEventListener('mouseleave', hide)
    trigger.addEventListener('focus', show)
    trigger.addEventListener('blur', hide)

    // Cleanup function
    return () => {
      trigger.removeEventListener('mouseenter', show)
      trigger.removeEventListener('mouseleave', hide)
      trigger.removeEventListener('focus', show)
      trigger.removeEventListener('blur', hide)
      trigger.removeAttribute('aria-describedby')
      tooltip.remove()
    }
  }

  /**
   * Accessibility preferences management
   */
  const setHighContrast = (enabled: boolean) => {
    state.value.highContrast = enabled
    document.documentElement.classList.toggle('high-contrast', enabled)
    localStorage.setItem('accessibility-high-contrast', String(enabled))
  }

  const setReducedMotion = (enabled: boolean) => {
    state.value.reducedMotion = enabled
    document.documentElement.classList.toggle('reduced-motion', enabled)
    localStorage.setItem('accessibility-reduced-motion', String(enabled))
  }

  const setFontSize = (size: 'normal' | 'large' | 'extra-large') => {
    state.value.fontSize = size
    document.documentElement.classList.remove('font-large', 'font-extra-large')
    if (size !== 'normal') {
      document.documentElement.classList.add(`font-${size}`)
    }
    localStorage.setItem('accessibility-font-size', size)
  }

  /**
   * Initialize accessibility preferences from storage
   */
  const initializeAccessibility = () => {
    // Load saved preferences
    const highContrast = localStorage.getItem('accessibility-high-contrast') === 'true'
    const reducedMotion = localStorage.getItem('accessibility-reduced-motion') === 'true' 
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fontSize = (localStorage.getItem('accessibility-font-size') as any) || 'normal'

    setHighContrast(highContrast)
    setReducedMotion(reducedMotion)
    setFontSize(fontSize)

    // Listen for system preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)')
      .addEventListener('change', (e) => setReducedMotion(e.matches))
  }

  return {
    // Core utilities
    generateId,
    announceToScreenReader,
    checkColorContrast,
    setAriaAttributes,
    
    // Focus management
    createFocusTrap,
    removeFocusTrap,
    getFocusableElements,
    
    // UI helpers
    createSkipLink,
    createTooltip,
    setFormValidation,
    
    // Preferences
    setHighContrast,
    setReducedMotion,
    setFontSize,
    initializeAccessibility,
    
    // State
    state: state.value
  }
}