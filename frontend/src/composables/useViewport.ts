import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface ViewportSize {
  width: number
  height: number
}

export interface Breakpoints {
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
}

export type BreakpointKey = keyof Breakpoints
export type DeviceType = 'mobile' | 'tablet' | 'desktop'
export type Orientation = 'portrait' | 'landscape'

const DEFAULT_BREAKPOINTS: Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

export function useViewport(customBreakpoints?: Partial<Breakpoints>) {
  const breakpoints: Breakpoints = { ...DEFAULT_BREAKPOINTS, ...customBreakpoints }
  
  const viewportSize = ref<ViewportSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  })

  /**
   * Current device type based on screen width
   */
  const deviceType = computed((): DeviceType => {
    const width = viewportSize.value.width
    if (width < breakpoints.md) return 'mobile'
    if (width < breakpoints.lg) return 'tablet'
    return 'desktop'
  })

  /**
   * Screen orientation
   */
  const orientation = computed((): Orientation => {
    return viewportSize.value.width > viewportSize.value.height ? 'landscape' : 'portrait'
  })

  /**
   * Check if viewport is above a specific breakpoint
   */
  const isAbove = (breakpoint: BreakpointKey): boolean => {
    return viewportSize.value.width >= breakpoints[breakpoint]
  }

  /**
   * Check if viewport is below a specific breakpoint
   */
  const isBelow = (breakpoint: BreakpointKey): boolean => {
    return viewportSize.value.width < breakpoints[breakpoint]
  }

  /**
   * Check if viewport is between two breakpoints
   */
  const isBetween = (min: BreakpointKey, max: BreakpointKey): boolean => {
    const width = viewportSize.value.width
    return width >= breakpoints[min] && width < breakpoints[max]
  }

  /**
   * Breakpoint checks
   */
  const isMobile = computed(() => viewportSize.value.width < breakpoints.md)
  const isTablet = computed(() => isBetween('md', 'lg'))
  const isDesktop = computed(() => viewportSize.value.width >= breakpoints.lg)
  const isSmallScreen = computed(() => viewportSize.value.width < breakpoints.lg)
  const isLargeScreen = computed(() => viewportSize.value.width >= breakpoints.xl)

  /**
   * Responsive values - returns different values based on screen size
   */
  const responsive = <T>(values: {
    mobile?: T
    tablet?: T
    desktop?: T
    default: T
  }): T => {
    if (isMobile.value && values.mobile !== undefined) return values.mobile
    if (isTablet.value && values.tablet !== undefined) return values.tablet  
    if (isDesktop.value && values.desktop !== undefined) return values.desktop
    return values.default
  }

  /**
   * Get CSS classes based on current viewport
   */
  const getResponsiveClasses = () => {
    const classes = []
    
    classes.push(`device-${deviceType.value}`)
    classes.push(`orientation-${orientation.value}`)
    
    if (isMobile.value) classes.push('is-mobile')
    if (isTablet.value) classes.push('is-tablet')
    if (isDesktop.value) classes.push('is-desktop')
    if (isSmallScreen.value) classes.push('is-small-screen')
    if (isLargeScreen.value) classes.push('is-large-screen')
    
    return classes
  }

  /**
   * Calculate responsive grid columns
   */
  const getGridColumns = (config: {
    mobile?: number
    tablet?: number
    desktop?: number
    default: number
  }): number => {
    return responsive({
      mobile: config.mobile,
      tablet: config.tablet,
      desktop: config.desktop,
      default: config.default
    })
  }

  /**
   * Get responsive spacing value
   */
  const getSpacing = (config: {
    mobile?: string
    tablet?: string
    desktop?: string
    default: string
  }): string => {
    return responsive({
      mobile: config.mobile,
      tablet: config.tablet,
      desktop: config.desktop,
      default: config.default
    })
  }

  /**
   * Check if device has touch capability
   */
  const hasTouchCapability = computed(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  })

  /**
   * Check if device is likely mobile based on multiple factors
   */
  const isMobileDevice = computed(() => {
    return isMobile.value && hasTouchCapability.value
  })

  /**
   * Get safe area insets (for devices with notches)
   */
  const safeAreaInsets = computed(() => {
    if (typeof window === 'undefined' || !CSS.supports) {
      return { top: 0, right: 0, bottom: 0, left: 0 }
    }

    const style = getComputedStyle(document.documentElement)
    
    return {
      top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
      right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
      bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
      left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0')
    }
  })

  /**
   * Check if viewport is in a constrained space (like small height)
   */
  const isConstrainedHeight = computed(() => {
    return viewportSize.value.height < 600
  })

  /**
   * Get optimal container width for readability
   */
  const getOptimalContentWidth = (): string => {
    if (isMobile.value) return '100%'
    if (isTablet.value) return '90%'
    return 'min(90%, 1200px)'
  }

  /**
   * Update viewport size
   */
  const updateViewportSize = () => {
    viewportSize.value = {
      width: window.innerWidth,
      height: window.innerHeight
    }
  }

  /**
   * Debounced resize handler
   */
  let resizeTimeout: number | null = null
  const handleResize = () => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }
    
    resizeTimeout = window.setTimeout(() => {
      updateViewportSize()
      resizeTimeout = null
    }, 100)
  }

  /**
   * Media query utilities
   */
  const createMediaQuery = (query: string) => {
    if (typeof window === 'undefined') return null
    return window.matchMedia(query)
  }

  const watchMediaQuery = (
    query: string, 
    callback: (matches: boolean) => void
  ) => {
    const mediaQuery = createMediaQuery(query)
    if (!mediaQuery) return () => {}

    // Initial check
    callback(mediaQuery.matches)

    // Listen for changes
    const handler = (e: MediaQueryListEvent) => callback(e.matches)
    mediaQuery.addEventListener('change', handler)

    // Return cleanup function
    return () => mediaQuery.removeEventListener('change', handler)
  }

  /**
   * Scroll position utilities
   */
  const scrollPosition = ref({ x: 0, y: 0 })
  const isScrolledToTop = computed(() => scrollPosition.value.y === 0)
  const isScrolledToBottom = computed(() => {
    const threshold = 10 // Small threshold for floating point precision
    return (
      scrollPosition.value.y >= 
      document.documentElement.scrollHeight - window.innerHeight - threshold
    )
  })

  const updateScrollPosition = () => {
    scrollPosition.value = {
      x: window.pageXOffset || document.documentElement.scrollLeft,
      y: window.pageYOffset || document.documentElement.scrollTop
    }
  }

  /**
   * Smooth scroll utility
   */
  const scrollToTop = (smooth = true) => {
    window.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'auto'
    })
  }

  const scrollToElement = (
    element: HTMLElement | string, 
    options?: ScrollIntoViewOptions
  ) => {
    const target = typeof element === 'string' 
      ? document.querySelector(element) as HTMLElement
      : element

    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        ...options
      })
    }
  }

  // Set up event listeners
  onMounted(() => {
    if (typeof window === 'undefined') return

    updateViewportSize()
    updateScrollPosition()
    
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', updateScrollPosition, { passive: true })
  })

  onUnmounted(() => {
    if (typeof window === 'undefined') return

    window.removeEventListener('resize', handleResize)
    window.removeEventListener('scroll', updateScrollPosition)
    
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }
  })

  return {
    // Viewport dimensions
    viewportSize,
    
    // Device detection
    deviceType,
    orientation,
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen,
    isLargeScreen,
    isMobileDevice,
    hasTouchCapability,
    
    // Breakpoint utilities
    isAbove,
    isBelow,
    isBetween,
    breakpoints,
    
    // Responsive utilities
    responsive,
    getResponsiveClasses,
    getGridColumns,
    getSpacing,
    getOptimalContentWidth,
    
    // Layout utilities
    safeAreaInsets,
    isConstrainedHeight,
    
    // Media queries
    createMediaQuery,
    watchMediaQuery,
    
    // Scroll utilities
    scrollPosition,
    isScrolledToTop,
    isScrolledToBottom,
    scrollToTop,
    scrollToElement
  }
}