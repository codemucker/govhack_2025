import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useProgress } from '../useProgress'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

describe('useProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    })
    
    // Mock Date.now for consistent testing
    vi.spyOn(Date, 'now').mockReturnValue(1234567890000)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with default progress state', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { progress, progressPercentage } = useProgress()
    
    expect(progress.currentStep).toBe('business-type')
    expect(progress.steps).toHaveLength(5)
    expect(progressPercentage()).toBe(0)
    expect(progress.searchData.query).toBe('')
  })

  it('should restore progress from localStorage', () => {
    const storedProgress = {
      currentStep: 'location',
      startTime: 1234567890000,
      lastSaved: 1234567890000,
      searchData: {
        businessType: 'Restaurant',
        address: 'Sydney NSW',
        query: 'restaurant business',
        requirements: ['licenses']
      },
      steps: [
        { name: 'business-type', completed: true, visited: true, data: {} },
        { name: 'location', completed: false, visited: true, data: {} },
        { name: 'requirements', completed: false, visited: false, data: {} },
        { name: 'review', completed: false, visited: false, data: {} },
        { name: 'results', completed: false, visited: false, data: {} }
      ]
    }
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedProgress))
    
    const { progress } = useProgress()
    
    expect(progress.currentStep).toBe('location')
    expect(progress.searchData.businessType).toBe('Restaurant')
    expect(progress.steps[0].completed).toBe(true)
  })

  it('should clear expired progress', () => {
    const expiredProgress = {
      currentStep: 'location',
      startTime: Date.now() - (8 * 24 * 60 * 60 * 1000), // 8 days ago
      steps: []
    }
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredProgress))
    
    const { progress } = useProgress()
    
    expect(progress.currentStep).toBe('business-type') // Reset to default
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('legalease-search-progress')
  })

  it('should calculate progress percentage correctly', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { progress, progressPercentage, completeCurrentStep, nextStep } = useProgress()
    
    expect(progressPercentage()).toBe(0)
    
    // Complete first step
    completeCurrentStep()
    expect(progressPercentage()).toBe(20) // 1 out of 5 steps
    
    // Move to next and complete
    nextStep()
    completeCurrentStep()
    expect(progressPercentage()).toBe(40) // 2 out of 5 steps
  })

  it('should navigate between steps correctly', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { progress, goToStep, nextStep, previousStep } = useProgress()
    
    expect(progress.currentStep).toBe('business-type')
    
    // Navigate to specific step
    const success = goToStep('location')
    expect(success).toBe(true)
    expect(progress.currentStep).toBe('location')
    
    // Navigate forward
    nextStep()
    expect(progress.currentStep).toBe('requirements')
    
    // Navigate backward
    previousStep()
    expect(progress.currentStep).toBe('location')
  })

  it('should prevent navigation to non-sequential unvisited steps', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { canNavigateToStep } = useProgress()
    
    // Can navigate to first step
    expect(canNavigateToStep('business-type')).toBe(true)
    
    // Can navigate to next step in sequence
    expect(canNavigateToStep('location')).toBe(true)
    
    // Cannot jump ahead to non-sequential steps
    expect(canNavigateToStep('review')).toBe(false)
  })

  it('should update step data correctly', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { updateStepData, getStep } = useProgress()
    
    updateStepData('business-type', { businessType: 'Cafe' })
    
    const step = getStep('business-type')
    expect(step?.data.businessType).toBe('Cafe')
  })

  it('should update search data correctly', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { progress, updateSearchData } = useProgress()
    
    updateSearchData({
      businessType: 'Restaurant',
      address: 'Sydney NSW'
    })
    
    expect(progress.searchData.businessType).toBe('Restaurant')
    expect(progress.searchData.address).toBe('Sydney NSW')
  })

  it('should export and import progress data', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { exportProgress, importProgress, updateSearchData } = useProgress()
    
    updateSearchData({ businessType: 'Cafe' })
    
    const exported = exportProgress()
    expect(exported.version).toBe('1.0')
    expect(exported.searchData.businessType).toBe('Cafe')
    expect(exported.exportedAt).toBeDefined()
    
    // Import should work with valid data
    const success = importProgress(exported)
    expect(success).toBe(true)
  })

  it('should determine wizard completion status', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { isWizardComplete, completeCurrentStep, nextStep } = useProgress()
    
    expect(isWizardComplete()).toBe(false)
    
    // Complete all steps
    for (let i = 0; i < 5; i++) {
      completeCurrentStep()
      nextStep()
    }
    
    expect(isWizardComplete()).toBe(true)
  })

  it('should debounce saving to localStorage', async () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { updateSearchData } = useProgress()
    
    // Make multiple rapid updates
    updateSearchData({ businessType: 'Cafe' })
    updateSearchData({ address: 'Sydney' })
    updateSearchData({ query: 'test' })
    
    // localStorage.setItem should not be called immediately
    expect(localStorageMock.setItem).not.toHaveBeenCalled()
    
    // Wait for debounce timeout
    await new Promise(resolve => setTimeout(resolve, 2100))
    
    // Now it should be called
    expect(localStorageMock.setItem).toHaveBeenCalled()
  })
})