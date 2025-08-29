import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useDarkMode } from '../useDarkMode'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

// Mock matchMedia
const matchMediaMock = vi.fn((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
}))

describe('useDarkMode', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Setup global mocks
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    })
    
    Object.defineProperty(window, 'matchMedia', {
      value: matchMediaMock,
      writable: true
    })
    
    // Reset document
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with light mode by default', () => {
    localStorageMock.getItem.mockReturnValue(null)
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      addListener: vi.fn()
    })

    const { isDarkMode } = useDarkMode()
    
    expect(isDarkMode.value).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('should initialize with dark mode from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('true')
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      addListener: vi.fn()
    })

    const { isDarkMode } = useDarkMode()
    
    expect(isDarkMode.value).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('should initialize with system preference when no localStorage value', () => {
    localStorageMock.getItem.mockReturnValue(null)
    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      addListener: vi.fn()
    })

    const { isDarkMode } = useDarkMode()
    
    expect(isDarkMode.value).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('should toggle dark mode', () => {
    localStorageMock.getItem.mockReturnValue('false')
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      addListener: vi.fn()
    })

    const { isDarkMode, toggleDarkMode } = useDarkMode()
    
    expect(isDarkMode.value).toBe(false)
    
    toggleDarkMode()
    
    expect(isDarkMode.value).toBe(true)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('legalease-dark-mode', 'true')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('should set dark mode to specific value', () => {
    localStorageMock.getItem.mockReturnValue('false')
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      addListener: vi.fn()
    })

    const { isDarkMode, setDarkMode } = useDarkMode()
    
    expect(isDarkMode.value).toBe(false)
    
    setDarkMode(true)
    
    expect(isDarkMode.value).toBe(true)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('legalease-dark-mode', 'true')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('should handle system theme changes when no explicit preference is set', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    let changeHandler: (e: any) => void
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn((event, handler) => {
        if (event === 'change') {
          changeHandler = handler
        }
      }),
      addListener: vi.fn()
    }
    
    matchMediaMock.mockReturnValue(mockMediaQuery)

    // Initialize with system preference false
    const { isDarkMode } = useDarkMode()
    
    // Should start with system preference (false)
    expect(isDarkMode.value).toBe(false)
    
    // Now simulate system theme change to dark
    // First need to reset localStorage to ensure no stored preference
    localStorageMock.getItem.mockReturnValue(null)
    changeHandler!({ matches: true })
    
    expect(isDarkMode.value).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should not respond to system theme changes when explicit preference is set', () => {
    localStorageMock.getItem.mockReturnValue('false')
    
    let changeHandler: (e: any) => void
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn((event, handler) => {
        if (event === 'change') {
          changeHandler = handler
        }
      }),
      addListener: vi.fn()
    }
    
    matchMediaMock.mockReturnValue(mockMediaQuery)

    const { isDarkMode } = useDarkMode()
    
    expect(isDarkMode.value).toBe(false)
    
    // Simulate system theme change to dark - should be ignored
    changeHandler!({ matches: true })
    
    expect(isDarkMode.value).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should handle legacy browsers without addEventListener', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    let changeHandler: (e: any) => void
    const mockMediaQuery = {
      matches: false,
      addEventListener: undefined, // Legacy browser
      addListener: vi.fn((handler) => {
        changeHandler = handler
      })
    }
    
    matchMediaMock.mockReturnValue(mockMediaQuery)

    const { isDarkMode } = useDarkMode()
    
    expect(isDarkMode.value).toBe(false)
    expect(mockMediaQuery.addListener).toHaveBeenCalled()
  })
})