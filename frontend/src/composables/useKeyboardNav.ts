import { ref, onMounted, onUnmounted } from 'vue'

interface KeyboardNavOptions {
  selector?: string
  direction?: 'horizontal' | 'vertical' | 'both'
  wrap?: boolean
  skipDisabled?: boolean
  homeEnd?: boolean
}

interface RovingTabindexOptions {
  containerSelector: string
  itemSelector: string
  initialIndex?: number
  orientation?: 'horizontal' | 'vertical' | 'both'
  wrap?: boolean
}

export function useKeyboardNav() {
  const activeElement = ref<HTMLElement | null>(null)
  const keyboardListeners = ref<Map<string, () => void>>(new Map())

  /**
   * Set up arrow key navigation for a group of elements
   */
  const useArrowNavigation = (
    container: HTMLElement | string,
    options: KeyboardNavOptions = {}
  ) => {
    const {
      selector = '[tabindex="0"], button, input, select, textarea, a[href]',
      direction = 'both',
      wrap = true,
      skipDisabled = true,
      homeEnd = true
    } = options

    const containerElement = typeof container === 'string'
      ? document.querySelector(container) as HTMLElement
      : container

    if (!containerElement) {
      console.warn('Keyboard navigation container not found')
      return () => {}
    }

    const getNavigableElements = (): HTMLElement[] => {
      const elements = Array.from(containerElement.querySelectorAll(selector)) as HTMLElement[]
      return skipDisabled 
        ? elements.filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-disabled'))
        : elements
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const elements = getNavigableElements()
      if (elements.length === 0) return

      const currentIndex = elements.indexOf(event.target as HTMLElement)
      if (currentIndex === -1) return

      let nextIndex = currentIndex

      switch (event.key) {
        case 'ArrowLeft':
          if (direction === 'horizontal' || direction === 'both') {
            nextIndex = currentIndex - 1
            if (nextIndex < 0) {
              nextIndex = wrap ? elements.length - 1 : 0
            }
            event.preventDefault()
          }
          break

        case 'ArrowRight':
          if (direction === 'horizontal' || direction === 'both') {
            nextIndex = currentIndex + 1
            if (nextIndex >= elements.length) {
              nextIndex = wrap ? 0 : elements.length - 1
            }
            event.preventDefault()
          }
          break

        case 'ArrowUp':
          if (direction === 'vertical' || direction === 'both') {
            nextIndex = currentIndex - 1
            if (nextIndex < 0) {
              nextIndex = wrap ? elements.length - 1 : 0
            }
            event.preventDefault()
          }
          break

        case 'ArrowDown':
          if (direction === 'vertical' || direction === 'both') {
            nextIndex = currentIndex + 1
            if (nextIndex >= elements.length) {
              nextIndex = wrap ? 0 : elements.length - 1
            }
            event.preventDefault()
          }
          break

        case 'Home':
          if (homeEnd) {
            nextIndex = 0
            event.preventDefault()
          }
          break

        case 'End':
          if (homeEnd) {
            nextIndex = elements.length - 1
            event.preventDefault()
          }
          break

        default:
          return
      }

      if (nextIndex !== currentIndex) {
        elements[nextIndex].focus()
        activeElement.value = elements[nextIndex]
      }
    }

    containerElement.addEventListener('keydown', handleKeyDown)

    // Cleanup function
    return () => {
      containerElement.removeEventListener('keydown', handleKeyDown)
    }
  }

  /**
   * Implement roving tabindex pattern for complex widgets
   */
  const useRovingTabindex = (options: RovingTabindexOptions) => {
    const {
      containerSelector,
      itemSelector,
      initialIndex = 0,
      orientation = 'both',
      wrap = true
    } = options

    const container = document.querySelector(containerSelector) as HTMLElement
    if (!container) {
      console.warn('Roving tabindex container not found')
      return () => {}
    }

    let currentIndex = initialIndex

    const updateTabindexes = () => {
      const items = Array.from(container.querySelectorAll(itemSelector)) as HTMLElement[]
      
      items.forEach((item, index) => {
        if (index === currentIndex) {
          item.setAttribute('tabindex', '0')
          item.classList.add('keyboard-focused')
        } else {
          item.setAttribute('tabindex', '-1')
          item.classList.remove('keyboard-focused')
        }
      })
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const items = Array.from(container.querySelectorAll(itemSelector)) as HTMLElement[]
      if (items.length === 0) return

      const target = event.target as HTMLElement
      const targetIndex = items.indexOf(target)
      if (targetIndex === -1) return

      let nextIndex = targetIndex

      switch (event.key) {
        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'both') {
            nextIndex = targetIndex - 1
            if (nextIndex < 0) {
              nextIndex = wrap ? items.length - 1 : 0
            }
            event.preventDefault()
          }
          break

        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'both') {
            nextIndex = targetIndex + 1
            if (nextIndex >= items.length) {
              nextIndex = wrap ? 0 : items.length - 1
            }
            event.preventDefault()
          }
          break

        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'both') {
            nextIndex = targetIndex - 1
            if (nextIndex < 0) {
              nextIndex = wrap ? items.length - 1 : 0
            }
            event.preventDefault()
          }
          break

        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'both') {
            nextIndex = targetIndex + 1
            if (nextIndex >= items.length) {
              nextIndex = wrap ? 0 : items.length - 1
            }
            event.preventDefault()
          }
          break

        case 'Home':
          nextIndex = 0
          event.preventDefault()
          break

        case 'End':
          nextIndex = items.length - 1
          event.preventDefault()
          break

        default:
          return
      }

      if (nextIndex !== targetIndex) {
        currentIndex = nextIndex
        updateTabindexes()
        items[nextIndex].focus()
      }
    }

    // Set up focus event handler for click navigation
    const handleFocus = (event: Event) => {
      const items = Array.from(container.querySelectorAll(itemSelector)) as HTMLElement[]
      const focusedIndex = items.indexOf(event.target as HTMLElement)
      if (focusedIndex !== -1) {
        currentIndex = focusedIndex
        updateTabindexes()
      }
    }

    // Initialize
    updateTabindexes()
    container.addEventListener('keydown', handleKeyDown)
    container.addEventListener('focus', handleFocus, true)

    // Cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      container.removeEventListener('focus', handleFocus, true)
    }
  }

  /**
   * Handle modal/overlay keyboard interactions
   */
  const useModalKeyboard = (
    container: HTMLElement,
    onClose?: () => void,
    options: { closeOnEscape?: boolean } = {}
  ) => {
    const { closeOnEscape = true } = options

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          if (closeOnEscape && onClose) {
            onClose()
            event.preventDefault()
          }
          break

        case 'Tab':
          // Focus trap is handled by useAccessibility
          break
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }

  /**
   * Add keyboard shortcuts with visual indicators
   */
  const useKeyboardShortcuts = (shortcuts: Record<string, () => void>) => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = [
        event.ctrlKey ? 'ctrl' : '',
        event.altKey ? 'alt' : '',
        event.shiftKey ? 'shift' : '',
        event.key.toLowerCase()
      ].filter(Boolean).join('+')

      if (shortcuts[key]) {
        shortcuts[key]()
        event.preventDefault()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    keyboardListeners.value.set('shortcuts', () => {
      document.removeEventListener('keydown', handleKeyDown)
    })

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      keyboardListeners.value.delete('shortcuts')
    }
  }

  /**
   * Create accessible dropdown/combobox keyboard navigation
   */
  const useComboboxKeyboard = (
    trigger: HTMLElement,
    dropdown: HTMLElement,
    items: HTMLElement[],
    options: {
      onSelect?: (item: HTMLElement, index: number) => void
      onClose?: () => void
      typeToSelect?: boolean
    } = {}
  ) => {
    let selectedIndex = -1
    let typeBuffer = ''
    let typeTimeout: number | null = null

    const {
      onSelect,
      onClose,
      typeToSelect = true
    } = options

    const updateSelection = (index: number) => {
      // Remove previous selection
      items.forEach(item => {
        item.classList.remove('keyboard-selected')
        item.setAttribute('aria-selected', 'false')
      })

      // Set new selection
      if (index >= 0 && index < items.length) {
        selectedIndex = index
        items[index].classList.add('keyboard-selected')
        items[index].setAttribute('aria-selected', 'true')
        
        // Scroll into view
        items[index].scrollIntoView({ block: 'nearest' })
        
        // Update aria-activedescendant on trigger
        trigger.setAttribute('aria-activedescendant', items[index].id || '')
      } else {
        selectedIndex = -1
        trigger.removeAttribute('aria-activedescendant')
      }
    }

    const handleTriggerKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          if (dropdown.style.display === 'none') {
            // Open dropdown
            dropdown.style.display = 'block'
            trigger.setAttribute('aria-expanded', 'true')
          }
          updateSelection(Math.min(selectedIndex + 1, items.length - 1))
          break

        case 'ArrowUp':
          event.preventDefault()
          if (dropdown.style.display === 'none') {
            // Open dropdown
            dropdown.style.display = 'block'
            trigger.setAttribute('aria-expanded', 'true')
          }
          updateSelection(Math.max(selectedIndex - 1, 0))
          break

        case 'Enter':
        case ' ':
          event.preventDefault()
          if (dropdown.style.display === 'none') {
            dropdown.style.display = 'block'
            trigger.setAttribute('aria-expanded', 'true')
          } else if (selectedIndex >= 0) {
            onSelect?.(items[selectedIndex], selectedIndex)
          }
          break

        case 'Escape':
          event.preventDefault()
          dropdown.style.display = 'none'
          trigger.setAttribute('aria-expanded', 'false')
          updateSelection(-1)
          onClose?.()
          break

        case 'Home':
          if (dropdown.style.display !== 'none') {
            event.preventDefault()
            updateSelection(0)
          }
          break

        case 'End':
          if (dropdown.style.display !== 'none') {
            event.preventDefault()
            updateSelection(items.length - 1)
          }
          break

        default:
          if (typeToSelect && dropdown.style.display !== 'none' && event.key.length === 1) {
            handleTypeToSelect(event.key)
          }
          break
      }
    }

    const handleTypeToSelect = (char: string) => {
      if (typeTimeout) {
        clearTimeout(typeTimeout)
      }

      typeBuffer += char.toLowerCase()

      // Find matching item
      const matchingIndex = items.findIndex(item => 
        item.textContent?.toLowerCase().startsWith(typeBuffer)
      )

      if (matchingIndex >= 0) {
        updateSelection(matchingIndex)
      }

      // Clear buffer after 1 second
      typeTimeout = window.setTimeout(() => {
        typeBuffer = ''
        typeTimeout = null
      }, 1000)
    }

    const handleDropdownClick = (event: Event) => {
      const target = event.target as HTMLElement
      const itemIndex = items.indexOf(target)
      if (itemIndex >= 0) {
        onSelect?.(items[itemIndex], itemIndex)
      }
    }

    // Set up event listeners
    trigger.addEventListener('keydown', handleTriggerKeyDown)
    dropdown.addEventListener('click', handleDropdownClick)

    // Initialize ARIA attributes
    trigger.setAttribute('role', 'combobox')
    trigger.setAttribute('aria-expanded', 'false')
    trigger.setAttribute('aria-haspopup', 'listbox')
    dropdown.setAttribute('role', 'listbox')
    
    items.forEach((item, index) => {
      item.setAttribute('role', 'option')
      item.setAttribute('aria-selected', 'false')
      if (!item.id) {
        item.id = `combobox-option-${index}`
      }
    })

    // Cleanup function
    return () => {
      trigger.removeEventListener('keydown', handleTriggerKeyDown)
      dropdown.removeEventListener('click', handleDropdownClick)
      if (typeTimeout) {
        clearTimeout(typeTimeout)
      }
    }
  }

  /**
   * Enhanced tab navigation with skip links
   */
  const useSkipNavigation = (skipLinks: Array<{ target: string; label: string }>) => {
    const skipContainer = document.createElement('div')
    skipContainer.className = 'skip-navigation'
    skipContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      z-index: 9999;
    `

    skipLinks.forEach(({ target, label }) => {
      const link = document.createElement('a')
      link.href = `#${target}`
      link.textContent = label
      link.className = 'skip-link'
      link.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px 12px;
        text-decoration: none;
        border-radius: 4px;
        font-weight: 500;
        transition: top 0.2s;
        border: 2px solid #fff;
      `

      // Show on focus
      link.addEventListener('focus', () => {
        link.style.top = '6px'
      })

      link.addEventListener('blur', () => {
        link.style.top = '-40px'
      })

      // Handle click
      link.addEventListener('click', (e) => {
        e.preventDefault()
        const targetElement = document.getElementById(target)
        if (targetElement) {
          targetElement.focus()
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })

      skipContainer.appendChild(link)
    })

    document.body.insertBefore(skipContainer, document.body.firstChild)

    return () => {
      skipContainer.remove()
    }
  }

  /**
   * Cleanup all keyboard listeners
   */
  const cleanup = () => {
    keyboardListeners.value.forEach(cleanup => cleanup())
    keyboardListeners.value.clear()
  }

  // Cleanup on unmount
  onUnmounted(() => {
    cleanup()
  })

  return {
    // Navigation patterns
    useArrowNavigation,
    useRovingTabindex,
    useModalKeyboard,
    useComboboxKeyboard,
    useSkipNavigation,
    
    // Shortcuts
    useKeyboardShortcuts,
    
    // State
    activeElement,
    
    // Cleanup
    cleanup
  }
}