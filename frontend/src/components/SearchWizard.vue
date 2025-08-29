<template>
  <div class="search-wizard">
    <div class="wizard-container">
      <!-- Progress Header -->
      <div class="wizard-header">
        <div class="progress-section">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${progress.progressPercentage()}%` }"
            ></div>
          </div>
          <span class="progress-text">
            {{ progress.progressPercentage() }}% Complete
          </span>
        </div>

        <!-- Step Navigation -->
        <nav class="step-nav" role="tablist">
          <button
            v-for="(step, index) in progress.progress.steps"
            :key="step.name"
            class="step-nav-item"
            :class="{
              'active': step.name === progress.progress.currentStep,
              'completed': step.completed,
              'visited': step.visited,
              'disabled': !progress.canNavigateToStep(step.name)
            }"
            :disabled="!progress.canNavigateToStep(step.name)"
            @click="handleStepNavigation(step.name)"
            :aria-label="`Step ${index + 1}: ${step.label}`"
            role="tab"
            :aria-selected="step.name === progress.progress.currentStep"
          >
            <span class="step-number">
              <span v-if="step.completed" class="step-check">✓</span>
              <span v-else>{{ index + 1 }}</span>
            </span>
            <span class="step-label">{{ step.label }}</span>
          </button>
        </nav>
      </div>

      <!-- Step Content -->
      <div class="wizard-content">
        <transition name="step" mode="out-in">
          <WizardStep
            :key="progress.progress.currentStep"
            :step="progress.progress.currentStep"
            :progress="progress"
            @step-complete="handleStepComplete"
            @next-step="handleNextStep"
            @previous-step="handlePreviousStep"
          />
        </transition>
      </div>

      <!-- Navigation Footer -->
      <div class="wizard-footer">
        <div class="footer-actions">
          <button
            v-if="progress.currentStepIndex() > 0"
            @click="handlePreviousStep"
            class="btn btn-secondary"
            type="button"
          >
            <span class="btn-icon">←</span>
            Previous
          </button>

          <div class="footer-center">
            <button
              @click="handleSaveProgress"
              class="btn btn-ghost"
              :disabled="progress.isLoading"
              type="button"
            >
              <span class="btn-icon">💾</span>
              {{ lastSaved ? `Saved ${lastSavedText}` : 'Save Progress' }}
            </button>

            <button
              @click="handleClearProgress"
              class="btn btn-ghost btn-danger"
              type="button"
            >
              <span class="btn-icon">🗑️</span>
              Clear
            </button>
          </div>

          <button
            v-if="progress.currentStepIndex() < progress.progress.steps.length - 1"
            @click="handleNextStep"
            class="btn btn-primary"
            :disabled="!canProceedToNext"
            type="button"
          >
            Next
            <span class="btn-icon">→</span>
          </button>

          <button
            v-else-if="progress.isWizardComplete()"
            @click="handleFinishWizard"
            class="btn btn-success"
            type="button"
          >
            <span class="btn-icon">✓</span>
            Finish
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useProgress } from '../composables/useProgress'
import WizardStep from './WizardStep.vue'

const emit = defineEmits<{
  'wizard-complete': [data: any]
  'wizard-cancelled': []
}>()

const progress = useProgress()
const lastSaved = ref<number>(0)
const saveInterval = ref<NodeJS.Timeout>()

/**
 * Text representation of when progress was last saved
 */
const lastSavedText = computed(() => {
  if (!lastSaved.value) return ''
  
  const now = Date.now()
  const diff = now - lastSaved.value
  
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
})

/**
 * Check if user can proceed to next step
 */
const canProceedToNext = computed(() => {
  const currentStep = progress.getStep(progress.progress.currentStep)
  return currentStep?.completed || false
})

/**
 * Handle step navigation from nav bar
 */
const handleStepNavigation = (stepName: string) => {
  if (progress.canNavigateToStep(stepName)) {
    progress.goToStep(stepName)
  }
}

/**
 * Handle step completion
 */
const handleStepComplete = (stepData: any) => {
  progress.completeCurrentStep()
  progress.updateStepData(progress.progress.currentStep, stepData)
  
  // Auto-advance to next step if not on last step
  if (progress.currentStepIndex() < progress.progress.steps.length - 1) {
    setTimeout(() => {
      handleNextStep()
    }, 500) // Small delay for visual feedback
  }
}

/**
 * Handle next step navigation
 */
const handleNextStep = () => {
  if (canProceedToNext.value) {
    progress.nextStep()
  }
}

/**
 * Handle previous step navigation
 */
const handlePreviousStep = () => {
  progress.previousStep()
}

/**
 * Handle manual save
 */
const handleSaveProgress = () => {
  progress.saveProgress()
  lastSaved.value = Date.now()
}

/**
 * Handle clear progress
 */
const handleClearProgress = () => {
  if (confirm('Are you sure you want to clear all progress? This cannot be undone.')) {
    progress.clearProgress()
  }
}

/**
 * Handle wizard completion
 */
const handleFinishWizard = () => {
  const wizardData = {
    searchData: progress.progress.searchData,
    steps: progress.progress.steps,
    completedAt: Date.now(),
    duration: Date.now() - progress.progress.startTime
  }
  
  emit('wizard-complete', wizardData)
}

/**
 * Handle keyboard shortcuts
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (event.metaKey || event.ctrlKey) {
    switch (event.key) {
      case 's':
        event.preventDefault()
        handleSaveProgress()
        break
      case 'ArrowLeft':
        event.preventDefault()
        handlePreviousStep()
        break
      case 'ArrowRight':
        if (canProceedToNext.value) {
          event.preventDefault()
          handleNextStep()
        }
        break
    }
  }
}

/**
 * Update last saved time periodically
 */
const updateLastSavedTime = () => {
  if (progress.progress.lastSaved > lastSaved.value) {
    lastSaved.value = progress.progress.lastSaved
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  lastSaved.value = progress.progress.lastSaved
  
  // Update saved time every 30 seconds
  saveInterval.value = setInterval(updateLastSavedTime, 30000)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (saveInterval.value) {
    clearInterval(saveInterval.value)
  }
})
</script>

<style scoped>
.search-wizard {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.wizard-container {
  background: var(--bg-primary);
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

/* Progress Header */
.wizard-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 2rem 2rem 0;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-hover));
  transition: width 0.5s ease;
  border-radius: 4px;
}

.progress-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 100px;
  text-align: right;
}

/* Step Navigation */
.step-nav {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 1rem;
}

.step-nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: max-content;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.step-nav-item:hover:not(.disabled) {
  background: var(--hover-bg);
  border-color: var(--primary-color);
  color: var(--text-primary);
}

.step-nav-item.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.step-nav-item.completed {
  background: var(--active-bg);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.step-nav-item.visited:not(.active):not(.completed) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.step-nav-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: currentColor;
  color: var(--bg-primary);
  font-size: 0.75rem;
  font-weight: 600;
}

.step-nav-item.active .step-number {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.step-nav-item.completed .step-number {
  background: var(--primary-color);
  color: white;
}

.step-check {
  font-size: 0.875rem;
}

.step-label {
  font-weight: 500;
  white-space: nowrap;
}

/* Content */
.wizard-content {
  padding: 2rem;
  min-height: 400px;
}

/* Step Transitions */
.step-enter-active,
.step-leave-active {
  transition: all 0.3s ease;
}

.step-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.step-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Footer */
.wizard-footer {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  padding: 1.5rem 2rem;
}

.footer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.footer-center {
  display: flex;
  gap: 0.5rem;
}

/* Button Styles */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--button-bg);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn:hover:not(:disabled) {
  background: var(--button-hover-bg);
  border-color: var(--primary-color);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
}

.btn-secondary {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}

.btn-success {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
  border-color: #059669;
}

.btn-ghost {
  background: transparent;
  border-color: transparent;
  color: var(--text-secondary);
}

.btn-ghost:hover {
  background: var(--hover-bg);
  border-color: var(--border-color);
}

.btn-danger {
  color: #ef4444;
}

.btn-danger:hover {
  background: #fef2f2;
  border-color: #ef4444;
  color: #dc2626;
}

.btn-icon {
  font-size: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .search-wizard {
    padding: 1rem 0.5rem;
  }
  
  .wizard-header {
    padding: 1.5rem 1rem 0;
  }
  
  .wizard-content {
    padding: 1.5rem 1rem;
  }
  
  .wizard-footer {
    padding: 1rem;
  }
  
  .footer-actions {
    flex-direction: column;
    gap: 1rem;
  }
  
  .footer-center {
    order: -1;
    justify-content: center;
  }
  
  .step-nav {
    gap: 0.5rem;
  }
  
  .step-nav-item {
    flex-direction: column;
    padding: 0.5rem;
    text-align: center;
  }
  
  .step-label {
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .progress-section {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .progress-text {
    text-align: center;
    min-width: auto;
  }
  
  .step-nav {
    justify-content: center;
  }
}
</style>