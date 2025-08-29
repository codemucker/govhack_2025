<template>
  <div v-if="isOpen" class="export-dialog-overlay" @click.self="close">
    <div class="export-dialog" role="dialog" aria-modal="true" aria-labelledby="export-title">
      <div class="dialog-header">
        <h2 id="export-title" class="dialog-title">Export Results</h2>
        <button
          @click="close"
          class="close-button"
          aria-label="Close export dialog"
          type="button"
        >
          ✕
        </button>
      </div>

      <div class="dialog-content">
        <div class="export-options">
          <h3>Choose Export Format</h3>
          
          <div class="format-options">
            <label
              v-for="format in exportFormats"
              :key="format.id"
              class="format-option"
              :class="{ 'selected': selectedFormat === format.id }"
            >
              <input
                type="radio"
                :value="format.id"
                v-model="selectedFormat"
                class="format-radio"
                name="export-format"
              />
              <div class="format-content">
                <div class="format-icon">{{ format.icon }}</div>
                <div class="format-info">
                  <h4 class="format-title">{{ format.title }}</h4>
                  <p class="format-description">{{ format.description }}</p>
                  <div class="format-features">
                    <span
                      v-for="feature in format.features"
                      :key="feature"
                      class="feature-tag"
                    >
                      {{ feature }}
                    </span>
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        <div class="export-settings">
          <h3>Export Settings</h3>
          
          <div class="setting-group">
            <label class="setting-label">
              <input
                type="text"
                v-model="customFilename"
                class="filename-input"
                placeholder="Enter custom filename (optional)"
              />
              <span class="input-label">Custom Filename</span>
            </label>
          </div>

          <div class="setting-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="includeMetadata"
                class="setting-checkbox"
              />
              <span class="checkbox-text">Include metadata and timestamps</span>
            </label>
          </div>

          <div class="setting-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="includeConflicts"
                class="setting-checkbox"
              />
              <span class="checkbox-text">Include conflict warnings</span>
            </label>
          </div>

          <div v-if="selectedFormat === 'pdf'" class="setting-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="pdfOptions.includeCover"
                class="setting-checkbox"
              />
              <span class="checkbox-text">Include cover page</span>
            </label>
          </div>

          <div v-if="selectedFormat === 'pdf'" class="setting-group">
            <label class="setting-label">
              <select v-model="pdfOptions.pageSize" class="setting-select">
                <option value="a4">A4</option>
                <option value="letter">US Letter</option>
                <option value="legal">Legal</option>
              </select>
              <span class="input-label">Page Size</span>
            </label>
          </div>
        </div>

        <div v-if="preview" class="export-preview">
          <h3>Preview</h3>
          <div class="preview-content">
            <div class="preview-stats">
              <span class="stat-item">
                <strong>{{ preview.requirementCount }}</strong> requirements
              </span>
              <span class="stat-item">
                <strong>{{ preview.conflictCount }}</strong> conflicts
              </span>
              <span class="stat-item">
                <strong>{{ preview.pageCount }}</strong> pages (est.)
              </span>
            </div>
            <div class="preview-filename">
              <strong>Filename:</strong> {{ generateFilename() }}
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <div class="export-progress" v-if="isExporting">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${exportProgress}%` }"></div>
          </div>
          <span class="progress-text">{{ exportProgressText }}</span>
        </div>

        <div class="footer-actions" v-else>
          <button
            @click="close"
            class="btn btn-secondary"
            type="button"
          >
            Cancel
          </button>

          <button
            @click="startPreview"
            class="btn btn-ghost"
            :disabled="!selectedFormat"
            type="button"
          >
            <span class="btn-icon">👁️</span>
            Preview
          </button>

          <button
            @click="startExport"
            class="btn btn-primary"
            :disabled="!selectedFormat || isExporting"
            type="button"
          >
            <span class="btn-icon">📥</span>
            Export {{ selectedFormat.toUpperCase() }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useExport, type ExportData, type ExportFormat } from '../composables/useExport'

interface Props {
  isOpen: boolean
  searchData: ExportData['searchQuery']
  results: ExportData['results']
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'close': []
  'export-complete': [filename: string, format: ExportFormat]
  'export-error': [error: string]
}>()

const { exportResults, isExporting, exportProgress } = useExport()

// Export settings
const selectedFormat = ref<ExportFormat>('pdf')
const customFilename = ref('')
const includeMetadata = ref(true)
const includeConflicts = ref(true)

// PDF-specific options
const pdfOptions = ref({
  includeCover: true,
  pageSize: 'a4' as 'a4' | 'letter' | 'legal'
})

// Preview data
const preview = ref<{
  requirementCount: number
  conflictCount: number
  pageCount: number
} | null>(null)

// Export format definitions
const exportFormats = [
  {
    id: 'pdf' as ExportFormat,
    title: 'PDF Report',
    description: 'Professional formatted report suitable for printing and sharing',
    icon: '📄',
    features: ['Print-ready', 'Professional layout', 'Includes graphics']
  },
  {
    id: 'json' as ExportFormat,
    title: 'JSON Data',
    description: 'Structured data format for developers and integrations',
    icon: '🔧',
    features: ['Machine readable', 'API compatible', 'Complete data']
  },
  {
    id: 'csv' as ExportFormat,
    title: 'CSV Spreadsheet',
    description: 'Tabular format for Excel and data analysis tools',
    icon: '📊',
    features: ['Excel compatible', 'Easy filtering', 'Data analysis']
  },
  {
    id: 'html' as ExportFormat,
    title: 'HTML Document',
    description: 'Web-optimized format with responsive design',
    icon: '🌐',
    features: ['Web compatible', 'Responsive design', 'Interactive links']
  }
]

/**
 * Progress text based on current export stage
 */
const exportProgressText = computed(() => {
  if (exportProgress.value === 0) return 'Preparing export...'
  if (exportProgress.value < 30) return 'Gathering data...'
  if (exportProgress.value < 60) return 'Formatting content...'
  if (exportProgress.value < 90) return 'Generating file...'
  return 'Finalizing export...'
})

/**
 * Generate filename based on settings
 */
const generateFilename = (): string => {
  if (customFilename.value.trim()) {
    const cleanName = customFilename.value.trim().replace(/[^a-zA-Z0-9\-_]/g, '-')
    return `${cleanName}.${selectedFormat.value}`
  }
  
  const timestamp = new Date().toISOString().split('T')[0]
  const query = props.searchData.query 
    ? props.searchData.query.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 20)
    : 'requirements'
  
  return `legalease-${query}-${timestamp}.${selectedFormat.value}`
}

/**
 * Update preview when settings change
 */
const updatePreview = () => {
  preview.value = {
    requirementCount: props.results.requirements.length,
    conflictCount: includeConflicts.value ? props.results.conflicts.length : 0,
    pageCount: estimatePageCount()
  }
}

/**
 * Estimate page count for preview
 */
const estimatePageCount = (): number => {
  if (selectedFormat.value !== 'pdf') return 1
  
  const basePages = 2 // Header, summary, footer
  const requirementPages = Math.ceil(props.results.requirements.length / 3) // ~3 requirements per page
  const conflictPages = includeConflicts.value 
    ? Math.ceil(props.results.conflicts.length / 2) // ~2 conflicts per page
    : 0
  
  return basePages + requirementPages + conflictPages
}

/**
 * Start the export process
 */
const startExport = async () => {
  try {
    const exportData: ExportData = {
      searchQuery: props.searchData,
      results: {
        ...props.results,
        conflicts: includeConflicts.value ? props.results.conflicts : []
      },
      metadata: {
        exportedAt: Date.now(),
        exportedBy: 'LegalEase User',
        version: '1.0'
      }
    }

    const success = await exportResults(exportData, {
      format: selectedFormat.value,
      filename: generateFilename(),
      includeMetadata: includeMetadata.value
    })

    if (success) {
      emit('export-complete', generateFilename(), selectedFormat.value)
      close()
    } else {
      emit('export-error', 'Export failed. Please try again.')
    }
  } catch (error) {
    emit('export-error', error instanceof Error ? error.message : 'Unknown export error')
  }
}

/**
 * Start preview mode
 */
const startPreview = () => {
  // This would open a new window/tab with preview content
  // For now, we'll just show a notification
  updatePreview()
  
  // In a real implementation, this would generate preview content
  if (selectedFormat.value === 'html') {
    // Could open HTML preview in new window
    console.log('Opening HTML preview...')
  } else {
    // Could show PDF preview or other format preview
    console.log(`Opening ${selectedFormat.value.toUpperCase()} preview...`)
  }
}

/**
 * Close the dialog
 */
const close = () => {
  emit('close')
}

/**
 * Handle escape key
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.isOpen && !isExporting.value) {
    close()
  }
}

// Watch for changes and update preview
watch([selectedFormat, includeConflicts, includeMetadata], updatePreview, { immediate: true })

// Add keyboard listener when dialog is open
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleKeydown)
    updatePreview()
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<style scoped>
.export-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.export-dialog {
  background: var(--bg-primary);
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  animation: dialog-enter 0.2s ease;
}

@keyframes dialog-enter {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Header */
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-color);
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-button {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 0.25rem;
  font-size: 1.125rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

/* Content */
.dialog-content {
  padding: 2rem;
  max-height: 60vh;
  overflow-y: auto;
}

.dialog-content h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.export-options {
  margin-bottom: 2rem;
}

/* Format Options */
.format-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.format-option {
  display: flex;
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-secondary);
}

.format-option:hover {
  border-color: var(--primary-color);
  background: var(--hover-bg);
}

.format-option.selected {
  border-color: var(--primary-color);
  background: var(--active-bg);
}

.format-radio {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.format-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  width: 100%;
}

.format-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.format-info {
  flex: 1;
}

.format-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.format-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.format-features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.feature-tag {
  padding: 0.25rem 0.5rem;
  background: var(--primary-light);
  color: var(--primary-color);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Export Settings */
.export-settings {
  margin-bottom: 2rem;
}

.setting-group {
  margin-bottom: 1rem;
}

.setting-label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.filename-input,
.setting-select {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.filename-input:focus,
.setting-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.setting-checkbox {
  width: 16px;
  height: 16px;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  background: var(--bg-primary);
  cursor: pointer;
}

.checkbox-text {
  font-size: 0.875rem;
  color: var(--text-primary);
  line-height: 1.4;
}

/* Preview */
.export-preview {
  padding: 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
}

.preview-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.stat-item {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.preview-filename {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-family: monospace;
  background: var(--bg-primary);
  padding: 0.5rem;
  border-radius: 0.25rem;
  word-break: break-all;
}

/* Footer */
.dialog-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.export-progress {
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-hover));
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.footer-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
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

.btn-ghost {
  background: transparent;
  border-color: transparent;
  color: var(--text-secondary);
}

.btn-ghost:hover {
  background: var(--hover-bg);
  border-color: var(--border-color);
}

.btn-icon {
  font-size: 1rem;
}

/* Responsive Design */
@media (max-width: 640px) {
  .export-dialog {
    margin: 0;
    border-radius: 0;
    height: 100vh;
    max-height: 100vh;
  }
  
  .dialog-header {
    padding: 1rem;
  }
  
  .dialog-content {
    padding: 1rem;
  }
  
  .dialog-footer {
    padding: 1rem;
  }
  
  .format-content {
    flex-direction: column;
    gap: 0.75rem;
    text-align: center;
  }
  
  .footer-actions {
    flex-direction: column-reverse;
  }
  
  .preview-stats {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>