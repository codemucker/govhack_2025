import { ref, onMounted, onUnmounted } from 'vue'

export interface TouchPoint {
  x: number
  y: number
  identifier: number
}

export interface SwipeDirection {
  horizontal: 'left' | 'right' | null
  vertical: 'up' | 'down' | null
}

export interface SwipeEvent {
  direction: SwipeDirection
  distance: { x: number; y: number }
  duration: number
  velocity: { x: number; y: number }
  startPoint: TouchPoint
  endPoint: TouchPoint
}

export interface PinchEvent {
  scale: number
  center: { x: number; y: number }
  distance: number
}

export interface TouchHoldEvent {
  point: TouchPoint
  duration: number
}

export interface TouchOptions {
  swipeThreshold?: number
  swipeVelocityThreshold?: number
  holdDuration?: number
  pinchThreshold?: number
  preventScroll?: boolean
  hapticFeedback?: boolean
}

const DEFAULT_OPTIONS: Required<TouchOptions> = {
  swipeThreshold: 50, // Minimum distance in pixels
  swipeVelocityThreshold: 0.3, // Minimum velocity
  holdDuration: 500, // Milliseconds
  pinchThreshold: 10, // Minimum scale change
  preventScroll: false,
  hapticFeedback: true
}

export function useTouch(element?: HTMLElement, options: TouchOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options }
  
  // Touch state
  const isTouch = ref(false)
  const touchPoints = ref<TouchPoint[]>([])
  const startTime = ref<number>(0)
  const startPoints = ref<TouchPoint[]>([])
  const holdTimer = ref<number | null>(null)
  const initialDistance = ref<number>(0)
  
  // Event callbacks
  const swipeCallbacks = ref<Array<(event: SwipeEvent) => void>>([])
  const pinchCallbacks = ref<Array<(event: PinchEvent) => void>>([])
  const holdCallbacks = ref<Array<(event: TouchHoldEvent) => void>>([])
  const tapCallbacks = ref<Array<(point: TouchPoint) => void>>([])
  const doubleTapCallbacks = ref<Array<(point: TouchPoint) => void>>([])
  
  // Double tap detection
  let lastTapTime = 0
  const doubleTapThreshold = 300 // ms

  /**
   * Calculate distance between two points
   */
  const calculateDistance = (point1: TouchPoint, point2: TouchPoint): number => {
    const dx = point2.x - point1.x
    const dy = point2.y - point1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Get center point between multiple touches
   */
  const getCenterPoint = (points: TouchPoint[]): { x: number; y: number } => {
    if (points.length === 0) return { x: 0, y: 0 }
    
    const sum = points.reduce(
      (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
      { x: 0, y: 0 }
    )
    
    return {
      x: sum.x / points.length,
      y: sum.y / points.length
    }
  }

  /**
   * Convert Touch to TouchPoint
   */
  const touchToPoint = (touch: Touch): TouchPoint => ({
    x: touch.clientX,
    y: touch.clientY,
    identifier: touch.identifier
  })

  /**
   * Trigger haptic feedback if supported
   */
  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!config.hapticFeedback || !navigator.vibrate) return
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    }
    
    navigator.vibrate(patterns[type])
  }

  /**
   * Handle touch start
   */
  const handleTouchStart = (event: TouchEvent) => {
    if (config.preventScroll) {
      event.preventDefault()
    }
    
    isTouch.value = true
    startTime.value = Date.now()
    
    // Convert touches to points
    const points: TouchPoint[] = Array.from(event.touches).map(touchToPoint)
    touchPoints.value = points
    startPoints.value = [...points]
    
    // Calculate initial distance for pinch detection
    if (points.length >= 2) {
      initialDistance.value = calculateDistance(points[0], points[1])
    }
    
    // Set up hold detection
    if (holdCallbacks.value.length > 0) {
      holdTimer.value = window.setTimeout(() => {
        if (startPoints.value.length > 0) {
          const holdEvent: TouchHoldEvent = {
            point: startPoints.value[0],
            duration: config.holdDuration
          }
          
          holdCallbacks.value.forEach(callback => callback(holdEvent))
          triggerHapticFeedback('medium')
        }
      }, config.holdDuration)
    }
  }

  /**
   * Handle touch move
   */
  const handleTouchMove = (event: TouchEvent) => {
    if (!isTouch.value || touchPoints.value.length === 0) return
    
    if (config.preventScroll) {
      event.preventDefault()
    }
    
    const points: TouchPoint[] = Array.from(event.touches).map(touchToPoint)
    touchPoints.value = points
    
    // Clear hold timer on move
    if (holdTimer.value) {
      clearTimeout(holdTimer.value)
      holdTimer.value = null
    }
    
    // Handle pinch gesture
    if (points.length >= 2 && startPoints.value.length >= 2) {
      const currentDistance = calculateDistance(points[0], points[1])
      const scale = currentDistance / initialDistance.value
      
      if (Math.abs(scale - 1) > config.pinchThreshold / 100) {
        const center = getCenterPoint(points)
        const pinchEvent: PinchEvent = {
          scale,
          center,
          distance: currentDistance
        }
        
        pinchCallbacks.value.forEach(callback => callback(pinchEvent))
      }
    }
  }

  /**
   * Handle touch end
   */
  const handleTouchEnd = (event: TouchEvent) => {
    if (!isTouch.value || startPoints.value.length === 0) return
    
    const endTime = Date.now()
    const duration = endTime - startTime.value
    const endPoints: TouchPoint[] = Array.from(event.changedTouches).map(touchToPoint)
    
    // Clear hold timer
    if (holdTimer.value) {
      clearTimeout(holdTimer.value)
      holdTimer.value = null
    }
    
    // Handle single touch gestures
    if (startPoints.value.length === 1 && endPoints.length === 1) {
      const startPoint = startPoints.value[0]
      const endPoint = endPoints[0]
      
      const distance = {
        x: endPoint.x - startPoint.x,
        y: endPoint.y - startPoint.y
      }
      
      const totalDistance = Math.abs(distance.x) + Math.abs(distance.y)
      
      // Check for tap vs swipe
      if (totalDistance < config.swipeThreshold) {
        // Handle tap
        const currentTime = Date.now()
        const timeSinceLastTap = currentTime - lastTapTime
        
        if (timeSinceLastTap < doubleTapThreshold) {
          // Double tap
          doubleTapCallbacks.value.forEach(callback => callback(endPoint))
          triggerHapticFeedback('light')
        } else {
          // Single tap
          tapCallbacks.value.forEach(callback => callback(endPoint))
        }
        
        lastTapTime = currentTime
      } else {
        // Handle swipe
        const velocity = {
          x: distance.x / duration,
          y: distance.y / duration
        }
        
        const totalVelocity = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
        
        if (totalVelocity >= config.swipeVelocityThreshold) {
          const direction: SwipeDirection = {
            horizontal: Math.abs(distance.x) > Math.abs(distance.y) 
              ? (distance.x > 0 ? 'right' : 'left')
              : null,
            vertical: Math.abs(distance.y) > Math.abs(distance.x)
              ? (distance.y > 0 ? 'down' : 'up')
              : null
          }
          
          const swipeEvent: SwipeEvent = {
            direction,
            distance,
            duration,
            velocity,
            startPoint,
            endPoint
          }
          
          swipeCallbacks.value.forEach(callback => callback(swipeEvent))
          triggerHapticFeedback('light')
        }
      }
    }
    
    // Reset touch state
    isTouch.value = false
    touchPoints.value = []
    startPoints.value = []
    initialDistance.value = 0
  }

  /**
   * Register swipe callback
   */
  const onSwipe = (
    callback: (event: SwipeEvent) => void,
    directions?: Array<'up' | 'down' | 'left' | 'right'>
  ) => {
    const wrappedCallback = (event: SwipeEvent) => {
      if (!directions) {
        callback(event)
        return
      }
      
      const { horizontal, vertical } = event.direction
      if (
        (horizontal && directions.includes(horizontal)) ||
        (vertical && directions.includes(vertical))
      ) {
        callback(event)
      }
    }
    
    swipeCallbacks.value.push(wrappedCallback)
    
    // Return unsubscribe function
    return () => {
      const index = swipeCallbacks.value.indexOf(wrappedCallback)
      if (index > -1) {
        swipeCallbacks.value.splice(index, 1)
      }
    }
  }

  /**
   * Register pinch callback
   */
  const onPinch = (callback: (event: PinchEvent) => void) => {
    pinchCallbacks.value.push(callback)
    
    return () => {
      const index = pinchCallbacks.value.indexOf(callback)
      if (index > -1) {
        pinchCallbacks.value.splice(index, 1)
      }
    }
  }

  /**
   * Register hold callback
   */
  const onTouchHold = (callback: (event: TouchHoldEvent) => void) => {
    holdCallbacks.value.push(callback)
    
    return () => {
      const index = holdCallbacks.value.indexOf(callback)
      if (index > -1) {
        holdCallbacks.value.splice(index, 1)
      }
    }
  }

  /**
   * Register tap callback
   */
  const onTap = (callback: (point: TouchPoint) => void) => {
    tapCallbacks.value.push(callback)
    
    return () => {
      const index = tapCallbacks.value.indexOf(callback)
      if (index > -1) {
        tapCallbacks.value.splice(index, 1)
      }
    }
  }

  /**
   * Register double tap callback
   */
  const onDoubleTap = (callback: (point: TouchPoint) => void) => {
    doubleTapCallbacks.value.push(callback)
    
    return () => {
      const index = doubleTapCallbacks.value.indexOf(callback)
      if (index > -1) {
        doubleTapCallbacks.value.splice(index, 1)
      }
    }
  }

  /**
   * Enable haptic feedback
   */
  const enableHapticFeedback = (enabled: boolean = true) => {
    config.hapticFeedback = enabled
  }

  /**
   * Set up touch event listeners
   */
  const setupTouchListeners = (target?: HTMLElement) => {
    const element = target || document.documentElement
    
    element.addEventListener('touchstart', handleTouchStart, { passive: !config.preventScroll })
    element.addEventListener('touchmove', handleTouchMove, { passive: !config.preventScroll })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }

  /**
   * Pull to refresh utility
   */
  const setupPullToRefresh = (
    callback: () => void | Promise<void>,
    threshold: number = 100
  ) => {
    let startY = 0
    let currentY = 0
    let isRefreshing = false
    
    const handlePullStart = (event: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = event.touches[0].clientY
      }
    }
    
    const handlePullMove = (event: TouchEvent) => {
      if (window.scrollY === 0 && startY > 0) {
        currentY = event.touches[0].clientY
        const pullDistance = currentY - startY
        
        if (pullDistance > threshold && !isRefreshing) {
          event.preventDefault()
        }
      }
    }
    
    const handlePullEnd = async () => {
      if (window.scrollY === 0 && startY > 0) {
        const pullDistance = currentY - startY
        
        if (pullDistance > threshold && !isRefreshing) {
          isRefreshing = true
          triggerHapticFeedback('medium')
          
          try {
            await callback()
          } finally {
            isRefreshing = false
          }
        }
      }
      
      startY = 0
      currentY = 0
    }
    
    document.addEventListener('touchstart', handlePullStart, { passive: true })
    document.addEventListener('touchmove', handlePullMove, { passive: false })
    document.addEventListener('touchend', handlePullEnd, { passive: true })
    
    return () => {
      document.removeEventListener('touchstart', handlePullStart)
      document.removeEventListener('touchmove', handlePullMove)
      document.removeEventListener('touchend', handlePullEnd)
    }
  }

  // Set up listeners on mount
  let cleanup: (() => void) | null = null

  onMounted(() => {
    if (typeof window !== 'undefined') {
      cleanup = setupTouchListeners(element)
    }
  })

  onUnmounted(() => {
    cleanup?.()
    
    if (holdTimer.value) {
      clearTimeout(holdTimer.value)
    }
  })

  return {
    // State
    isTouch,
    touchPoints,
    
    // Event handlers
    onSwipe,
    onPinch,
    onTouchHold,
    onTap,
    onDoubleTap,
    
    // Utilities
    enableHapticFeedback,
    triggerHapticFeedback,
    setupTouchListeners,
    setupPullToRefresh,
    
    // Configuration
    config
  }
}