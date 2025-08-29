import { ref, reactive, watch } from 'vue'

export interface WizardStep {
  name: string
  label: string
  completed: boolean
  visited: boolean
  data: Record<string, any>
}

export interface ProgressState {
  currentStep: string
  steps: WizardStep[]
  startTime: number
  lastSaved: number
  searchData: {
    query: string
    address: string
    businessType: string
    requirements: string[]
  }
}

const STORAGE_KEY = 'legalease-search-progress'
const EXPIRY_DAYS = 7

/**
 * Composable for managing wizard progress and persistence
 * Automatically saves progress to localStorage and provides
 * step navigation and completion tracking
 */
export function useProgress() {
  const progress = reactive<ProgressState>({
    currentStep: 'business-type',
    steps: [
      {
        name: 'business-type',
        label: 'Business Type',
        completed: false,
        visited: false,
        data: {}
      },
      {
        name: 'location',
        label: 'Location',
        completed: false,
        visited: false,
        data: {}
      },
      {
        name: 'requirements',
        label: 'Requirements',
        completed: false,
        visited: false,
        data: {}
      },
      {
        name: 'review',
        label: 'Review',
        completed: false,
        visited: false,
        data: {}
      },
      {
        name: 'results',
        label: 'Results',
        completed: false,
        visited: false,
        data: {}
      }
    ],
    startTime: Date.now(),
    lastSaved: 0,
    searchData: {
      query: '',
      address: '',
      businessType: '',
      requirements: []
    }
  })

  const isLoading = ref(false)
  const saveTimeout = ref<NodeJS.Timeout>()

  /**
   * Initialize progress from localStorage or start fresh
   */
  const initializeProgress = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        
        // Check if progress has expired
        const ageInDays = (Date.now() - parsed.startTime) / (1000 * 60 * 60 * 24)
        if (ageInDays > EXPIRY_DAYS) {
          clearProgress()
          return
        }
        
        // Restore progress
        Object.assign(progress, parsed)
      }
    } catch (error) {
      console.warn('Failed to restore progress:', error)
      clearProgress()
    }
  }

  /**
   * Save progress to localStorage with debouncing
   */
  const saveProgress = () => {
    if (saveTimeout.value) {
      clearTimeout(saveTimeout.value)
    }
    
    saveTimeout.value = setTimeout(() => {
      try {
        progress.lastSaved = Date.now()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
      } catch (error) {
        console.warn('Failed to save progress:', error)
      }
    }, 2000) // 2 second debounce
  }

  /**
   * Clear stored progress
   */
  const clearProgress = () => {
    localStorage.removeItem(STORAGE_KEY)
    
    // Reset to initial state
    progress.currentStep = 'business-type'
    progress.startTime = Date.now()
    progress.lastSaved = 0
    progress.searchData = {
      query: '',
      address: '',
      businessType: '',
      requirements: []
    }
    
    progress.steps.forEach(step => {
      step.completed = false
      step.visited = false
      step.data = {}
    })
  }

  /**
   * Get current step index
   */
  const currentStepIndex = () => {
    return progress.steps.findIndex(step => step.name === progress.currentStep)
  }

  /**
   * Get progress percentage (0-100)
   */
  const progressPercentage = () => {
    const completedSteps = progress.steps.filter(step => step.completed).length
    return Math.round((completedSteps / progress.steps.length) * 100)
  }

  /**
   * Navigate to specific step
   */
  const goToStep = (stepName: string) => {
    const stepIndex = progress.steps.findIndex(step => step.name === stepName)
    if (stepIndex === -1) return false
    
    const step = progress.steps[stepIndex]
    
    // Mark current step as visited
    const currentStep = progress.steps.find(s => s.name === progress.currentStep)
    if (currentStep) {
      currentStep.visited = true
    }
    
    progress.currentStep = stepName
    step.visited = true
    
    saveProgress()
    return true
  }

  /**
   * Navigate to next step
   */
  const nextStep = () => {
    const currentIndex = currentStepIndex()
    if (currentIndex < progress.steps.length - 1) {
      const nextStepName = progress.steps[currentIndex + 1].name
      return goToStep(nextStepName)
    }
    return false
  }

  /**
   * Navigate to previous step
   */
  const previousStep = () => {
    const currentIndex = currentStepIndex()
    if (currentIndex > 0) {
      const prevStepName = progress.steps[currentIndex - 1].name
      return goToStep(prevStepName)
    }
    return false
  }

  /**
   * Mark current step as completed
   */
  const completeCurrentStep = () => {
    const currentStep = progress.steps.find(step => step.name === progress.currentStep)
    if (currentStep) {
      currentStep.completed = true
      currentStep.visited = true
      saveProgress()
    }
  }

  /**
   * Update step data
   */
  const updateStepData = (stepName: string, data: Record<string, any>) => {
    const step = progress.steps.find(s => s.name === stepName)
    if (step) {
      step.data = { ...step.data, ...data }
      saveProgress()
    }
  }

  /**
   * Update search data
   */
  const updateSearchData = (data: Partial<ProgressState['searchData']>) => {
    Object.assign(progress.searchData, data)
    saveProgress()
  }

  /**
   * Get step by name
   */
  const getStep = (stepName: string) => {
    return progress.steps.find(step => step.name === stepName)
  }

  /**
   * Check if step can be navigated to (visited or sequential)
   */
  const canNavigateToStep = (stepName: string) => {
    const stepIndex = progress.steps.findIndex(step => step.name === stepName)
    const step = progress.steps[stepIndex]
    
    if (step.visited) return true
    
    // Can navigate to next unvisited step in sequence
    const currentIndex = currentStepIndex()
    return stepIndex <= currentIndex + 1
  }

  /**
   * Get wizard completion status
   */
  const isWizardComplete = () => {
    return progress.steps.every(step => step.completed)
  }

  /**
   * Export progress data for backup/sharing
   */
  const exportProgress = () => {
    return {
      ...progress,
      exportedAt: Date.now(),
      version: '1.0'
    }
  }

  /**
   * Import progress data
   */
  const importProgress = (data: any) => {
    try {
      if (data.version === '1.0' && data.steps && data.searchData) {
        Object.assign(progress, data)
        saveProgress()
        return true
      }
    } catch (error) {
      console.warn('Failed to import progress:', error)
    }
    return false
  }

  // Watch for changes and auto-save
  watch(
    () => progress,
    () => saveProgress(),
    { deep: true }
  )

  // Initialize on first use
  initializeProgress()

  return {
    progress,
    isLoading,
    
    // Navigation
    currentStepIndex,
    progressPercentage,
    goToStep,
    nextStep,
    previousStep,
    canNavigateToStep,
    
    // Step management
    completeCurrentStep,
    updateStepData,
    updateSearchData,
    getStep,
    
    // Wizard state
    isWizardComplete,
    
    // Persistence
    saveProgress,
    clearProgress,
    exportProgress,
    importProgress
  }
}