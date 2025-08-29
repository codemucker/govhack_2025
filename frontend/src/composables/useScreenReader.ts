import { ref, nextTick } from 'vue'

interface LiveRegionOptions {
  politeness?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all'
  busy?: boolean
}

interface ProgressUpdateOptions {
  value?: number
  max?: number
  text?: string
  valueText?: string
}

export function useScreenReader() {
  const announcements = ref<Array<{ message: string; timestamp: Date; type: string }>>([])
  const liveRegions = ref<Map<string, HTMLElement>>(new Map())

  /**
   * Create or get a live region for announcements
   */
  const createLiveRegion = (
    id: string, 
    options: LiveRegionOptions = {}
  ): HTMLElement => {
    const existing = liveRegions.value.get(id)
    if (existing) return existing

    const {
      politeness = 'polite',
      atomic = true,
      relevant = 'all',
      busy = false
    } = options

    const region = document.createElement('div')
    region.id = `live-region-${id}`
    region.setAttribute('aria-live', politeness)
    region.setAttribute('aria-atomic', String(atomic))
    region.setAttribute('aria-relevant', relevant)
    region.setAttribute('aria-busy', String(busy))
    
    // Screen reader only styles
    region.className = 'sr-only'
    region.style.cssText = `
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

    document.body.appendChild(region)
    liveRegions.value.set(id, region)

    return region
  }

  /**
   * Announce message to screen readers
   */
  const announce = (
    message: string, 
    options: { 
      priority?: 'low' | 'high'
      region?: string
      delay?: number
    } = {}
  ) => {
    const {
      priority = 'low',
      region = 'default',
      delay = 100
    } = options

    const politeness = priority === 'high' ? 'assertive' : 'polite'
    const liveRegion = createLiveRegion(region, { politeness })

    // Clear region first, then announce after delay
    liveRegion.textContent = ''
    
    setTimeout(() => {
      liveRegion.textContent = message
      announcements.value.push({
        message,
        timestamp: new Date(),
        type: priority
      })
    }, delay)
  }

  /**
   * Announce loading states
   */
  const announceLoading = (isLoading: boolean, message?: string) => {
    if (isLoading) {
      announce(message || 'Loading, please wait...', { priority: 'high', region: 'status' })
    } else {
      announce('Loading complete', { priority: 'low', region: 'status' })
    }
  }

  /**
   * Announce form validation results
   */
  const announceValidation = (
    isValid: boolean, 
    message: string, 
    fieldLabel?: string
  ) => {
    const prefix = fieldLabel ? `${fieldLabel}: ` : ''
    const status = isValid ? 'Valid' : 'Error'
    
    announce(
      `${prefix}${status}. ${message}`, 
      { priority: 'high', region: 'validation' }
    )
  }

  /**
   * Announce search results
   */
  const announceSearchResults = (count: number, query?: string) => {
    let message = ''
    
    if (count === 0) {
      message = query ? `No results found for "${query}"` : 'No results found'
    } else if (count === 1) {
      message = query ? `1 result found for "${query}"` : '1 result found'
    } else {
      message = query ? `${count} results found for "${query}"` : `${count} results found`
    }
    
    announce(message, { priority: 'high', region: 'search' })
  }

  /**
   * Announce navigation changes
   */
  const announceNavigation = (pageName: string, breadcrumb?: string[]) => {
    let message = `Navigated to ${pageName}`
    
    if (breadcrumb && breadcrumb.length > 0) {
      message += `. Navigation: ${breadcrumb.join(' > ')}`
    }
    
    announce(message, { region: 'navigation' })
  }

  /**
   * Announce progress updates
   */
  const announceProgress = (options: ProgressUpdateOptions) => {
    const { value, max, text, valueText } = options
    
    let message = ''
    
    if (valueText) {
      message = valueText
    } else if (typeof value === 'number' && typeof max === 'number') {
      const percentage = Math.round((value / max) * 100)
      message = `Progress: ${percentage}% complete`
    } else if (text) {
      message = text
    }
    
    if (message) {
      announce(message, { region: 'progress' })
    }
  }

  /**
   * Announce modal/dialog state changes
   */
  const announceModal = (action: 'opened' | 'closed', title?: string) => {
    let message = ''
    
    if (action === 'opened') {
      message = title ? `Dialog opened: ${title}` : 'Dialog opened'
    } else {
      message = 'Dialog closed'
    }
    
    announce(message, { priority: 'high', region: 'dialog' })
  }

  /**
   * Announce table/list updates
   */
  const announceTableUpdate = (
    type: 'sorted' | 'filtered' | 'updated',
    details?: string
  ) => {
    let message = ''
    
    switch (type) {
      case 'sorted':
        message = `Table sorted${details ? ` by ${details}` : ''}`
        break
      case 'filtered':
        message = `Table filtered${details ? `: ${details}` : ''}`
        break
      case 'updated':
        message = `Table updated${details ? `: ${details}` : ''}`
        break
    }
    
    announce(message, { region: 'table' })
  }

  /**
   * Create accessible status updates for dynamic content
   */
  const createStatusRegion = (containerId: string) => {
    const container = document.getElementById(containerId)
    if (!container) {
      console.warn(`Status region container ${containerId} not found`)
      return
    }

    const statusRegion = document.createElement('div')
    statusRegion.setAttribute('role', 'status')
    statusRegion.setAttribute('aria-live', 'polite')
    statusRegion.setAttribute('aria-atomic', 'true')
    statusRegion.className = 'sr-only'
    statusRegion.style.cssText = `
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

    container.appendChild(statusRegion)
    
    return {
      update: (message: string) => {
        statusRegion.textContent = message
      },
      clear: () => {
        statusRegion.textContent = ''
      },
      remove: () => {
        statusRegion.remove()
      }
    }
  }

  /**
   * Enhanced ARIA labeling helpers
   */
  const setAriaLabel = (element: HTMLElement, label: string) => {
    element.setAttribute('aria-label', label)
  }

  const setAriaDescription = (element: HTMLElement, description: string, id?: string) => {
    const descId = id || `desc-${Date.now()}`
    
    // Create description element if it doesn't exist
    let descElement = document.getElementById(descId)
    if (!descElement) {
      descElement = document.createElement('div')
      descElement.id = descId
      descElement.className = 'sr-only'
      descElement.style.cssText = `
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
      document.body.appendChild(descElement)
    }
    
    descElement.textContent = description
    element.setAttribute('aria-describedby', descId)
    
    return descId
  }

  /**
   * Announce chart/visualization data
   */
  const announceChartData = (
    chartType: string,
    dataPoints: Array<{ label: string; value: number | string }>,
    summary?: string
  ) => {
    let message = `${chartType} with ${dataPoints.length} data points.`
    
    if (summary) {
      message += ` ${summary}`
    }
    
    // Add key data points
    if (dataPoints.length <= 5) {
      const dataText = dataPoints
        .map(point => `${point.label}: ${point.value}`)
        .join(', ')
      message += ` Data: ${dataText}.`
    } else {
      // For large datasets, provide summary
      message += ` Use table view for detailed data.`
    }
    
    announce(message, { region: 'chart' })
  }

  /**
   * Announce confidence/progress meters
   */
  const announceConfidenceMeter = (
    label: string,
    confidence: number,
    level: 'high' | 'medium' | 'low'
  ) => {
    const percentage = Math.round(confidence * 100)
    const message = `${label}: ${percentage}% confidence, ${level} level`
    
    announce(message, { region: 'confidence' })
  }

  /**
   * Create accessible data table announcements
   */
  const announceTableNavigation = (
    row: number,
    col: number,
    totalRows: number,
    totalCols: number,
    cellContent?: string
  ) => {
    let message = `Row ${row} of ${totalRows}, column ${col} of ${totalCols}`
    
    if (cellContent) {
      message += `, ${cellContent}`
    }
    
    announce(message, { region: 'table-nav', delay: 50 })
  }

  /**
   * Announce drag and drop operations
   */
  const announceDragDrop = (
    action: 'start' | 'move' | 'drop' | 'cancel',
    itemLabel?: string,
    targetLabel?: string
  ) => {
    let message = ''
    
    switch (action) {
      case 'start':
        message = `Started dragging${itemLabel ? ` ${itemLabel}` : ''}`
        break
      case 'move':
        message = `Moving${itemLabel ? ` ${itemLabel}` : ''}${targetLabel ? ` over ${targetLabel}` : ''}`
        break
      case 'drop':
        message = `Dropped${itemLabel ? ` ${itemLabel}` : ''}${targetLabel ? ` on ${targetLabel}` : ''}`
        break
      case 'cancel':
        message = `Cancelled dragging${itemLabel ? ` ${itemLabel}` : ''}`
        break
    }
    
    announce(message, { priority: 'high', region: 'dragdrop' })
  }

  /**
   * Clean up live regions
   */
  const cleanup = () => {
    liveRegions.value.forEach(region => {
      region.remove()
    })
    liveRegions.value.clear()
  }

  return {
    // Core announcement functions
    announce,
    createLiveRegion,
    createStatusRegion,
    
    // Specific announcement types
    announceLoading,
    announceValidation,
    announceSearchResults,
    announceNavigation,
    announceProgress,
    announceModal,
    announceTableUpdate,
    announceTableNavigation,
    announceChartData,
    announceConfidenceMeter,
    announceDragDrop,
    
    // ARIA helpers
    setAriaLabel,
    setAriaDescription,
    
    // State and cleanup
    announcements,
    cleanup
  }
}