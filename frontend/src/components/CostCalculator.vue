<template>
  <div class="cost-calculator">
    <div class="calculator-header">
      <h3>{{ title }}</h3>
      <div class="header-actions">
        <button @click="resetCalculator" class="reset-btn">
          Reset
        </button>
        <button @click="exportEstimate" class="export-btn">
          Export Estimate
        </button>
      </div>
    </div>
    
    <div class="calculator-content">
      <!-- Input Form -->
      <div class="cost-inputs">
        <div class="input-section">
          <h4>Business Details</h4>
          <div class="input-grid">
            <div class="input-group">
              <label for="business-type">Business Type</label>
              <select 
                id="business-type" 
                v-model="inputs.businessType"
                @change="recalculateCosts"
              >
                <option value="">Select business type</option>
                <option value="cafe">Café/Restaurant</option>
                <option value="retail">Retail Store</option>
                <option value="office">Office/Services</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="health">Health Services</option>
                <option value="education">Education</option>
                <option value="construction">Construction</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div class="input-group">
              <label for="business-size">Business Size</label>
              <select 
                id="business-size" 
                v-model="inputs.businessSize"
                @change="recalculateCosts"
              >
                <option value="">Select size</option>
                <option value="micro">Micro (1-4 employees)</option>
                <option value="small">Small (5-19 employees)</option>
                <option value="medium">Medium (20-199 employees)</option>
                <option value="large">Large (200+ employees)</option>
              </select>
            </div>
            
            <div class="input-group">
              <label for="location">Location</label>
              <select 
                id="location" 
                v-model="inputs.location"
                @change="recalculateCosts"
              >
                <option value="">Select location</option>
                <option value="sydney-cbd">Sydney CBD</option>
                <option value="sydney-inner">Sydney Inner</option>
                <option value="sydney-outer">Sydney Outer</option>
                <option value="melbourne-cbd">Melbourne CBD</option>
                <option value="melbourne-metro">Melbourne Metro</option>
                <option value="brisbane">Brisbane</option>
                <option value="perth">Perth</option>
                <option value="adelaide">Adelaide</option>
                <option value="regional">Regional Area</option>
              </select>
            </div>
            
            <div class="input-group">
              <label for="urgency">Urgency Level</label>
              <select 
                id="urgency" 
                v-model="inputs.urgency"
                @change="recalculateCosts"
              >
                <option value="standard">Standard Processing</option>
                <option value="priority">Priority (Rush Processing)</option>
                <option value="urgent">Urgent (Expedited)</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="input-section">
          <h4>Additional Options</h4>
          <div class="checkbox-grid">
            <label class="checkbox-item">
              <input 
                type="checkbox" 
                v-model="inputs.needsConsultant"
                @change="recalculateCosts"
              />
              <span class="checkmark"></span>
              <span class="label-text">Professional consultant assistance</span>
            </label>
            
            <label class="checkbox-item">
              <input 
                type="checkbox" 
                v-model="inputs.needsLegal"
                @change="recalculateCosts"
              />
              <span class="checkmark"></span>
              <span class="label-text">Legal review required</span>
            </label>
            
            <label class="checkbox-item">
              <input 
                type="checkbox" 
                v-model="inputs.hasComplexity"
                @change="recalculateCosts"
              />
              <span class="checkmark"></span>
              <span class="label-text">Complex requirements/multiple jurisdictions</span>
            </label>
            
            <label class="checkbox-item">
              <input 
                type="checkbox" 
                v-model="inputs.needsInspection"
                @change="recalculateCosts"
              />
              <span class="checkmark"></span>
              <span class="label-text">Physical inspections required</span>
            </label>
          </div>
        </div>
        
        <div class="input-section">
          <h4>Timeline Preferences</h4>
          <div class="input-grid">
            <div class="input-group">
              <label for="target-date">Target Completion Date</label>
              <input 
                id="target-date"
                type="date" 
                v-model="inputs.targetDate"
                @change="recalculateCosts"
                :min="minDate"
              />
            </div>
            
            <div class="input-group">
              <label for="flexibility">Timeline Flexibility</label>
              <select 
                id="flexibility" 
                v-model="inputs.flexibility"
                @change="recalculateCosts"
              >
                <option value="rigid">Fixed deadline</option>
                <option value="moderate">Some flexibility (±2 weeks)</option>
                <option value="flexible">Flexible (cost priority)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Cost Breakdown Display -->
      <div class="cost-display">
        <div class="cost-summary">
          <div class="summary-header">
            <h4>Cost Estimate</h4>
            <div class="confidence-indicator">
              <span class="confidence-label">Confidence:</span>
              <div 
                class="confidence-meter"
                :class="getConfidenceLevel(costEstimate.confidence)"
              >
                <div 
                  class="confidence-fill"
                  :style="{ width: (costEstimate.confidence * 100) + '%' }"
                ></div>
              </div>
              <span class="confidence-value">{{ Math.round(costEstimate.confidence * 100) }}%</span>
            </div>
          </div>
          
          <div class="cost-range">
            <div class="cost-item best-case">
              <span class="cost-label">Best Case</span>
              <span class="cost-value">{{ formatCurrency(costEstimate.minCost) }}</span>
            </div>
            <div class="cost-item most-likely">
              <span class="cost-label">Most Likely</span>
              <span class="cost-value primary">{{ formatCurrency(costEstimate.expectedCost) }}</span>
            </div>
            <div class="cost-item worst-case">
              <span class="cost-label">Worst Case</span>
              <span class="cost-value">{{ formatCurrency(costEstimate.maxCost) }}</span>
            </div>
          </div>
          
          <div class="cost-timeline">
            <div class="timeline-item">
              <span class="timeline-label">Estimated Timeline:</span>
              <span class="timeline-value">{{ costEstimate.estimatedTimeline }}</span>
            </div>
            <div class="timeline-item">
              <span class="timeline-label">Critical Path:</span>
              <span class="timeline-value">{{ costEstimate.criticalPath }}</span>
            </div>
          </div>
        </div>
        
        <!-- Detailed Cost Breakdown Chart -->
        <div class="cost-chart">
          <h5>Cost Breakdown</h5>
          <Doughnut 
            :data="chartData" 
            :options="chartOptions"
            class="chart-container"
          />
        </div>
        
        <!-- Detailed Cost Items -->
        <div class="cost-details">
          <h5>Detailed Breakdown</h5>
          <div class="cost-items">
            <div 
              v-for="category in costBreakdown"
              :key="category.name"
              class="cost-category"
              :class="{ 'expanded': expandedCategories.includes(category.name) }"
            >
              <div 
                class="category-header"
                @click="toggleCategory(category.name)"
              >
                <div class="category-info">
                  <span class="category-name">{{ category.name }}</span>
                  <span class="category-total">{{ formatCurrency(category.total) }}</span>
                </div>
                <div class="category-controls">
                  <span class="item-count">{{ category.items.length }} items</span>
                  <ChevronDownIcon 
                    class="expand-icon"
                    :class="{ 'rotated': expandedCategories.includes(category.name) }"
                  />
                </div>
              </div>
              
              <div class="category-items">
                <div 
                  v-for="item in category.items"
                  :key="item.name"
                  class="cost-item-detail"
                >
                  <div class="item-info">
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-description">{{ item.description }}</span>
                  </div>
                  <div class="item-costs">
                    <span class="item-cost">{{ formatCurrency(item.cost) }}</span>
                    <span v-if="item.range" class="item-range">
                      {{ formatCurrency(item.range.min) }} - {{ formatCurrency(item.range.max) }}
                    </span>
                  </div>
                  <div class="item-timeline">
                    <span class="item-time">{{ item.estimatedTime }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Risk Factors -->
        <div class="risk-factors">
          <h5>Risk Factors & Variables</h5>
          <div class="risk-items">
            <div 
              v-for="risk in riskFactors"
              :key="risk.factor"
              class="risk-item"
              :class="`risk-${risk.level.toLowerCase()}`"
            >
              <div class="risk-icon">
                <ExclamationTriangleIcon v-if="risk.level === 'High'" class="w-5 h-5" />
                <InformationCircleIcon v-else-if="risk.level === 'Medium'" class="w-5 h-5" />
                <CheckCircleIcon v-else class="w-5 h-5" />
              </div>
              <div class="risk-content">
                <div class="risk-header">
                  <span class="risk-factor">{{ risk.factor }}</span>
                  <span class="risk-level">{{ risk.level }} Risk</span>
                </div>
                <p class="risk-description">{{ risk.description }}</p>
                <div v-if="risk.mitigation" class="risk-mitigation">
                  <strong>Mitigation:</strong> {{ risk.mitigation }}
                </div>
              </div>
              <div v-if="risk.costImpact" class="risk-impact">
                <span class="impact-label">Cost Impact:</span>
                <span class="impact-value">{{ risk.costImpact }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Comparison Table -->
        <div class="cost-comparison">
          <h5>Scenario Comparison</h5>
          <div class="comparison-table">
            <div class="table-header">
              <div class="header-cell">Scenario</div>
              <div class="header-cell">Total Cost</div>
              <div class="header-cell">Timeline</div>
              <div class="header-cell">Risk Level</div>
              <div class="header-cell">Confidence</div>
            </div>
            
            <div 
              v-for="scenario in comparisonScenarios"
              :key="scenario.name"
              class="table-row"
              :class="{ 'recommended': scenario.recommended }"
            >
              <div class="table-cell scenario-name">
                {{ scenario.name }}
                <span v-if="scenario.recommended" class="recommended-badge">Recommended</span>
              </div>
              <div class="table-cell">{{ formatCurrency(scenario.cost) }}</div>
              <div class="table-cell">{{ scenario.timeline }}</div>
              <div class="table-cell">
                <span 
                  class="risk-badge"
                  :class="`risk-${scenario.risk.toLowerCase()}`"
                >
                  {{ scenario.risk }}
                </span>
              </div>
              <div class="table-cell">
                <div class="mini-confidence-meter">
                  <div 
                    class="mini-confidence-fill"
                    :style="{ width: (scenario.confidence * 100) + '%' }"
                  ></div>
                </div>
                <span class="confidence-percent">{{ Math.round(scenario.confidence * 100) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Export Modal -->
    <div v-if="showExportModal" class="modal-overlay" @click="showExportModal = false">
      <div class="export-modal" @click.stop>
        <div class="modal-header">
          <h4>Export Cost Estimate</h4>
          <button @click="showExportModal = false" class="close-btn">×</button>
        </div>
        
        <div class="modal-content">
          <div class="export-options">
            <label class="export-option">
              <input type="radio" v-model="exportFormat" value="pdf" />
              <span class="option-label">PDF Report</span>
              <span class="option-description">Comprehensive report with charts and breakdown</span>
            </label>
            
            <label class="export-option">
              <input type="radio" v-model="exportFormat" value="csv" />
              <span class="option-label">CSV Data</span>
              <span class="option-description">Raw cost data for spreadsheet analysis</span>
            </label>
            
            <label class="export-option">
              <input type="radio" v-model="exportFormat" value="json" />
              <span class="option-label">JSON Data</span>
              <span class="option-description">Structured data for API integration</span>
            </label>
          </div>
          
          <div class="export-actions">
            <button @click="showExportModal = false" class="cancel-btn">
              Cancel
            </button>
            <button @click="performExport" class="export-confirm-btn">
              Export {{ exportFormat.toUpperCase() }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { useCharts } from '../composables/useCharts'
import { useExport } from '../composables/useExport'
import { 
  ChevronDownIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  CheckCircleIcon 
} from '@heroicons/vue/24/solid'

interface CostItem {
  name: string
  description: string
  cost: number
  estimatedTime: string
  range?: {
    min: number
    max: number
  }
}

interface CostCategory {
  name: string
  total: number
  items: CostItem[]
}

interface RiskFactor {
  factor: string
  level: 'Low' | 'Medium' | 'High'
  description: string
  mitigation?: string
  costImpact?: string
}

interface ComparisonScenario {
  name: string
  cost: number
  timeline: string
  risk: string
  confidence: number
  recommended: boolean
}

interface CostInputs {
  businessType: string
  businessSize: string
  location: string
  urgency: string
  targetDate: string
  flexibility: string
  needsConsultant: boolean
  needsLegal: boolean
  hasComplexity: boolean
  needsInspection: boolean
}

interface Props {
  title?: string
  requirements?: any[]
  location?: string
  businessType?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Cost Calculator',
  requirements: () => [],
  location: '',
  businessType: ''
})

const emit = defineEmits<{
  'estimate-updated': [estimate: any]
  'export-requested': [data: any, format: string]
}>()

const { formatCurrency, createCostData, getDefaultOptions } = useCharts()
const { exportToPDF, exportToCSV, exportToJSON } = useExport()

const inputs = ref<CostInputs>({
  businessType: props.businessType,
  businessSize: '',
  location: props.location,
  urgency: 'standard',
  targetDate: '',
  flexibility: 'moderate',
  needsConsultant: false,
  needsLegal: false,
  hasComplexity: false,
  needsInspection: false
})

const expandedCategories = ref<string[]>([])
const showExportModal = ref(false)
const exportFormat = ref('pdf')

const minDate = computed(() => {
  const today = new Date()
  today.setDate(today.getDate() + 7) // Minimum 7 days from now
  return today.toISOString().split('T')[0]
})

// Mock cost calculation logic - would be replaced with real API calls
const costEstimate = computed(() => {
  let baseCost = 2500 // Base cost for standard processing
  let confidence = 0.8
  
  // Business type multipliers
  const typeMultipliers = {
    'cafe': 1.3,
    'retail': 1.0,
    'office': 0.8,
    'manufacturing': 1.8,
    'health': 2.2,
    'education': 1.5,
    'construction': 1.6,
    'other': 1.2
  }
  
  // Size multipliers
  const sizeMultipliers = {
    'micro': 0.7,
    'small': 1.0,
    'medium': 1.5,
    'large': 2.2
  }
  
  // Location multipliers
  const locationMultipliers = {
    'sydney-cbd': 1.4,
    'sydney-inner': 1.2,
    'sydney-outer': 1.0,
    'melbourne-cbd': 1.3,
    'melbourne-metro': 1.1,
    'brisbane': 0.9,
    'perth': 0.9,
    'adelaide': 0.8,
    'regional': 0.7
  }
  
  // Apply multipliers
  if (inputs.value.businessType) {
    baseCost *= typeMultipliers[inputs.value.businessType as keyof typeof typeMultipliers] || 1.0
  }
  
  if (inputs.value.businessSize) {
    baseCost *= sizeMultipliers[inputs.value.businessSize as keyof typeof sizeMultipliers] || 1.0
  }
  
  if (inputs.value.location) {
    baseCost *= locationMultipliers[inputs.value.location as keyof typeof locationMultipliers] || 1.0
  }
  
  // Urgency adjustments
  if (inputs.value.urgency === 'priority') {
    baseCost *= 1.3
  } else if (inputs.value.urgency === 'urgent') {
    baseCost *= 1.7
  }
  
  // Additional services
  if (inputs.value.needsConsultant) {
    baseCost += 1500
  }
  
  if (inputs.value.needsLegal) {
    baseCost += 2000
  }
  
  if (inputs.value.hasComplexity) {
    baseCost *= 1.4
    confidence *= 0.85
  }
  
  if (inputs.value.needsInspection) {
    baseCost += 800
  }
  
  // Timeline flexibility affects cost
  if (inputs.value.flexibility === 'rigid') {
    baseCost *= 1.2
    confidence *= 0.9
  } else if (inputs.value.flexibility === 'flexible') {
    baseCost *= 0.9
    confidence *= 1.1
  }
  
  // Calculate range
  const minCost = baseCost * 0.8
  const maxCost = baseCost * 1.4
  
  // Timeline estimation
  let timelineWeeks = 4
  if (inputs.value.businessType === 'manufacturing') timelineWeeks = 8
  if (inputs.value.businessType === 'health') timelineWeeks = 10
  if (inputs.value.hasComplexity) timelineWeeks += 2
  if (inputs.value.urgency === 'urgent') timelineWeeks = Math.max(2, timelineWeeks / 2)
  
  return {
    minCost: Math.round(minCost),
    expectedCost: Math.round(baseCost),
    maxCost: Math.round(maxCost),
    confidence: Math.min(1.0, confidence),
    estimatedTimeline: `${timelineWeeks}-${timelineWeeks + 2} weeks`,
    criticalPath: inputs.value.needsLegal ? 'Legal Review' : 'Council Approval'
  }
})

const costBreakdown = computed((): CostCategory[] => {
  return [
    {
      name: 'Government Fees',
      total: 850,
      items: [
        {
          name: 'Development Application Fee',
          description: 'Local council DA processing fee',
          cost: 450,
          estimatedTime: '2-3 weeks',
          range: { min: 350, max: 650 }
        },
        {
          name: 'Building Certificate Fee',
          description: 'Building compliance certification',
          cost: 200,
          estimatedTime: '1 week'
        },
        {
          name: 'License Registration Fee',
          description: 'Business license registration',
          cost: 200,
          estimatedTime: '3-5 days'
        }
      ]
    },
    {
      name: 'Professional Services',
      total: inputs.value.needsConsultant ? 1500 : 0,
      items: inputs.value.needsConsultant ? [
        {
          name: 'Planning Consultant',
          description: 'Professional planning assistance',
          cost: 1200,
          estimatedTime: '1-2 weeks'
        },
        {
          name: 'Document Preparation',
          description: 'Professional document preparation',
          cost: 300,
          estimatedTime: '3-5 days'
        }
      ] : []
    },
    {
      name: 'Legal Services',
      total: inputs.value.needsLegal ? 2000 : 0,
      items: inputs.value.needsLegal ? [
        {
          name: 'Legal Review',
          description: 'Legal documentation review',
          cost: 1500,
          estimatedTime: '1 week'
        },
        {
          name: 'Compliance Consultation',
          description: 'Legal compliance consultation',
          cost: 500,
          estimatedTime: '2-3 days'
        }
      ] : []
    },
    {
      name: 'Inspections & Assessments',
      total: inputs.value.needsInspection ? 800 : 400,
      items: [
        {
          name: 'Site Inspection',
          description: inputs.value.needsInspection ? 'Professional site inspection' : 'Basic compliance check',
          cost: inputs.value.needsInspection ? 400 : 200,
          estimatedTime: '1-2 days'
        },
        {
          name: 'Assessment Report',
          description: 'Official assessment documentation',
          cost: inputs.value.needsInspection ? 400 : 200,
          estimatedTime: '3-5 days'
        }
      ]
    },
    {
      name: 'Miscellaneous',
      total: 350,
      items: [
        {
          name: 'Application Processing',
          description: 'Administrative processing fees',
          cost: 150,
          estimatedTime: 'Included'
        },
        {
          name: 'Documentation & Copies',
          description: 'Required documentation and copies',
          cost: 100,
          estimatedTime: '1-2 days'
        },
        {
          name: 'Contingency Buffer',
          description: 'Buffer for unexpected costs',
          cost: 100,
          estimatedTime: 'As needed'
        }
      ]
    }
  ].filter(category => category.total > 0)
})

const riskFactors = computed((): RiskFactor[] => {
  const risks: RiskFactor[] = []
  
  if (inputs.value.hasComplexity) {
    risks.push({
      factor: 'Multi-jurisdictional Complexity',
      level: 'High',
      description: 'Complex requirements across multiple jurisdictions may cause delays and additional costs.',
      mitigation: 'Early engagement with all relevant authorities and professional consultant assistance.',
      costImpact: '+20-40%'
    })
  }
  
  if (inputs.value.urgency === 'urgent') {
    risks.push({
      factor: 'Expedited Processing Risk',
      level: 'Medium',
      description: 'Rush processing may not be available for all requirements, potentially causing bottlenecks.',
      mitigation: 'Identify critical path items early and apply expedited processing selectively.',
      costImpact: '+30-70%'
    })
  }
  
  if (inputs.value.businessType === 'health' || inputs.value.businessType === 'manufacturing') {
    risks.push({
      factor: 'Specialized Regulatory Requirements',
      level: 'High',
      description: 'Industry-specific regulations may require additional approvals and inspections.',
      mitigation: 'Engage industry-specific consultants and plan for extended timelines.',
      costImpact: '+40-80%'
    })
  }
  
  if (!inputs.value.needsConsultant && inputs.value.hasComplexity) {
    risks.push({
      factor: 'Self-Application Risk',
      level: 'Medium',
      description: 'Applying without professional assistance may result in delays due to incomplete or incorrect applications.',
      mitigation: 'Consider professional consultation for at least initial planning phase.',
      costImpact: '+10-25% (delays)'
    })
  }
  
  // Always include some standard risks
  risks.push({
    factor: 'Processing Time Variability',
    level: 'Low',
    description: 'Government processing times can vary based on workload and application complexity.',
    mitigation: 'Build buffer time into project planning and maintain regular communication with authorities.',
    costImpact: '+5-15%'
  })
  
  return risks
})

const comparisonScenarios = computed((): ComparisonScenario[] => {
  const base = costEstimate.value.expectedCost
  
  return [
    {
      name: 'Budget Option',
      cost: base * 0.75,
      timeline: '8-12 weeks',
      risk: 'Medium',
      confidence: 0.65,
      recommended: false
    },
    {
      name: 'Balanced Approach',
      cost: base,
      timeline: '6-8 weeks',
      risk: 'Low',
      confidence: costEstimate.value.confidence,
      recommended: true
    },
    {
      name: 'Premium Service',
      cost: base * 1.35,
      timeline: '3-4 weeks',
      risk: 'Low',
      confidence: 0.9,
      recommended: false
    }
  ]
})

const chartData = computed(() => {
  return createCostData(costBreakdown.value.map(cat => ({
    category: cat.name,
    amount: cat.total
  })))
})

const chartOptions = computed(() => {
  return {
    ...getDefaultOptions('Cost Breakdown'),
    plugins: {
      ...getDefaultOptions('Cost Breakdown').plugins,
      legend: {
        display: true,
        position: 'bottom' as const
      }
    },
    maintainAspectRatio: false
  }
})

const getConfidenceLevel = (confidence: number): string => {
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.6) return 'medium'
  return 'low'
}

const toggleCategory = (categoryName: string) => {
  const index = expandedCategories.value.indexOf(categoryName)
  if (index === -1) {
    expandedCategories.value.push(categoryName)
  } else {
    expandedCategories.value.splice(index, 1)
  }
}

const recalculateCosts = () => {
  // Trigger reactivity - costs are computed
  emit('estimate-updated', costEstimate.value)
}

const resetCalculator = () => {
  inputs.value = {
    businessType: props.businessType,
    businessSize: '',
    location: props.location,
    urgency: 'standard',
    targetDate: '',
    flexibility: 'moderate',
    needsConsultant: false,
    needsLegal: false,
    hasComplexity: false,
    needsInspection: false
  }
  expandedCategories.value = []
}

const exportEstimate = () => {
  showExportModal.value = true
}

const performExport = async () => {
  const exportData = {
    inputs: inputs.value,
    estimate: costEstimate.value,
    breakdown: costBreakdown.value,
    risks: riskFactors.value,
    scenarios: comparisonScenarios.value,
    timestamp: new Date().toISOString()
  }
  
  try {
    switch (exportFormat.value) {
      case 'pdf':
        await exportToPDF(exportData, 'cost-estimate')
        break
      case 'csv':
        exportToCSV(exportData, 'cost-estimate')
        break
      case 'json':
        exportToJSON(exportData, 'cost-estimate')
        break
    }
    
    emit('export-requested', exportData, exportFormat.value)
    showExportModal.value = false
  } catch (error) {
    console.error('Export failed:', error)
  }
}

// Initialize with first category expanded
onMounted(() => {
  if (costBreakdown.value.length > 0) {
    expandedCategories.value = [costBreakdown.value[0].name]
  }
  
  // Set default target date to 2 months from now
  const defaultDate = new Date()
  defaultDate.setMonth(defaultDate.getMonth() + 2)
  inputs.value.targetDate = defaultDate.toISOString().split('T')[0]
})

// Watch for prop changes
watch([() => props.businessType, () => props.location], ([newType, newLocation]) => {
  if (newType && newType !== inputs.value.businessType) {
    inputs.value.businessType = newType
    recalculateCosts()
  }
  if (newLocation && newLocation !== inputs.value.location) {
    inputs.value.location = newLocation
    recalculateCosts()
  }
}, { immediate: true })
</script>

<style scoped>
.cost-calculator {
  @apply bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg;
}

.calculator-header {
  @apply flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4;
}

.calculator-header h3 {
  @apply text-xl font-semibold text-gray-900 dark:text-white;
}

.header-actions {
  @apply flex gap-3;
}

.reset-btn {
  @apply px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
         rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm;
}

.export-btn {
  @apply px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm;
}

.calculator-content {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-8;
}

/* Input Form Styles */
.cost-inputs {
  @apply space-y-6;
}

.input-section {
  @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-4;
}

.input-section h4 {
  @apply font-semibold text-gray-900 dark:text-white mb-4;
}

.input-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.input-group {
  @apply space-y-2;
}

.input-group label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.input-group select,
.input-group input {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
         focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.checkbox-grid {
  @apply space-y-3;
}

.checkbox-item {
  @apply flex items-center gap-3 cursor-pointer;
}

.checkbox-item input[type="checkbox"] {
  @apply w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500;
}

.label-text {
  @apply text-sm text-gray-700 dark:text-gray-300;
}

/* Cost Display Styles */
.cost-display {
  @apply space-y-6;
}

.cost-summary {
  @apply bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 
         rounded-lg p-6 border border-blue-200 dark:border-blue-800;
}

.summary-header {
  @apply flex justify-between items-center mb-4;
}

.summary-header h4 {
  @apply font-semibold text-gray-900 dark:text-white;
}

.confidence-indicator {
  @apply flex items-center gap-2;
}

.confidence-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.confidence-meter {
  @apply w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.confidence-fill {
  @apply h-full transition-all duration-1000 ease-out rounded-full;
}

.confidence-meter.high .confidence-fill {
  @apply bg-green-500;
}

.confidence-meter.medium .confidence-fill {
  @apply bg-yellow-500;
}

.confidence-meter.low .confidence-fill {
  @apply bg-red-500;
}

.confidence-value {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.cost-range {
  @apply grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4;
}

.cost-item {
  @apply text-center;
}

.cost-label {
  @apply block text-sm text-gray-600 dark:text-gray-400 mb-1;
}

.cost-value {
  @apply text-xl font-bold text-gray-900 dark:text-white;
}

.cost-value.primary {
  @apply text-blue-600 dark:text-blue-400;
}

.cost-timeline {
  @apply grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-blue-200 dark:border-blue-700;
}

.timeline-item {
  @apply flex justify-between;
}

.timeline-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.timeline-value {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

/* Chart Styles */
.cost-chart {
  @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-4;
}

.cost-chart h5 {
  @apply font-semibold text-gray-900 dark:text-white mb-4;
}

.chart-container {
  @apply h-64;
}

/* Detailed Breakdown */
.cost-details {
  @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-4;
}

.cost-details h5 {
  @apply font-semibold text-gray-900 dark:text-white mb-4;
}

.cost-category {
  @apply border border-gray-200 dark:border-gray-700 rounded-lg mb-3 overflow-hidden;
}

.category-header {
  @apply p-4 bg-white dark:bg-gray-900 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800
         flex justify-between items-center transition-colors;
}

.category-info {
  @apply flex justify-between items-center flex-1;
}

.category-name {
  @apply font-medium text-gray-900 dark:text-white;
}

.category-total {
  @apply font-bold text-blue-600 dark:text-blue-400;
}

.category-controls {
  @apply flex items-center gap-2 ml-4;
}

.item-count {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.expand-icon {
  @apply w-5 h-5 text-gray-400 transition-transform;
}

.expand-icon.rotated {
  @apply transform rotate-180;
}

.category-items {
  @apply max-h-0 overflow-hidden transition-all duration-300;
}

.cost-category.expanded .category-items {
  @apply max-h-96;
}

.cost-item-detail {
  @apply grid grid-cols-3 gap-4 p-4 border-t border-gray-100 dark:border-gray-800
         hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors;
}

.item-info {
  @apply space-y-1;
}

.item-name {
  @apply font-medium text-gray-900 dark:text-white text-sm;
}

.item-description {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.item-costs {
  @apply text-center space-y-1;
}

.item-cost {
  @apply font-medium text-gray-900 dark:text-white text-sm;
}

.item-range {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.item-timeline {
  @apply text-right;
}

.item-time {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

/* Risk Factors */
.risk-factors {
  @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-4;
}

.risk-factors h5 {
  @apply font-semibold text-gray-900 dark:text-white mb-4;
}

.risk-items {
  @apply space-y-3;
}

.risk-item {
  @apply flex gap-3 p-3 rounded-lg border-l-4;
}

.risk-item.risk-high {
  @apply bg-red-50 dark:bg-red-900/20 border-l-red-500;
}

.risk-item.risk-medium {
  @apply bg-yellow-50 dark:bg-yellow-900/20 border-l-yellow-500;
}

.risk-item.risk-low {
  @apply bg-green-50 dark:bg-green-900/20 border-l-green-500;
}

.risk-icon {
  @apply flex-shrink-0 mt-0.5;
}

.risk-item.risk-high .risk-icon {
  @apply text-red-500;
}

.risk-item.risk-medium .risk-icon {
  @apply text-yellow-500;
}

.risk-item.risk-low .risk-icon {
  @apply text-green-500;
}

.risk-content {
  @apply flex-1;
}

.risk-header {
  @apply flex justify-between items-start mb-2;
}

.risk-factor {
  @apply font-medium text-gray-900 dark:text-white;
}

.risk-level {
  @apply text-sm px-2 py-1 rounded;
}

.risk-item.risk-high .risk-level {
  @apply bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300;
}

.risk-item.risk-medium .risk-level {
  @apply bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300;
}

.risk-item.risk-low .risk-level {
  @apply bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300;
}

.risk-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-2;
}

.risk-mitigation {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.risk-impact {
  @apply text-right;
}

.impact-label {
  @apply text-xs text-gray-500 dark:text-gray-400 block;
}

.impact-value {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

/* Comparison Table */
.cost-comparison {
  @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-4;
}

.cost-comparison h5 {
  @apply font-semibold text-gray-900 dark:text-white mb-4;
}

.comparison-table {
  @apply border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden;
}

.table-header {
  @apply grid grid-cols-5 gap-4 p-3 bg-white dark:bg-gray-900 font-medium text-sm
         text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700;
}

.table-row {
  @apply grid grid-cols-5 gap-4 p-3 border-b border-gray-100 dark:border-gray-800
         last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors;
}

.table-row.recommended {
  @apply bg-blue-50 dark:bg-blue-900/20;
}

.table-cell {
  @apply text-sm;
}

.scenario-name {
  @apply font-medium text-gray-900 dark:text-white relative;
}

.recommended-badge {
  @apply absolute -top-1 -right-8 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full;
}

.risk-badge {
  @apply text-xs px-2 py-1 rounded;
}

.risk-badge.risk-low {
  @apply bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300;
}

.risk-badge.risk-medium {
  @apply bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300;
}

.risk-badge.risk-high {
  @apply bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300;
}

.mini-confidence-meter {
  @apply w-12 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden inline-block mr-2;
}

.mini-confidence-fill {
  @apply h-full bg-blue-500 transition-all duration-1000 ease-out rounded-full;
}

.confidence-percent {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

/* Export Modal */
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.export-modal {
  @apply bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4;
}

.modal-header {
  @apply flex justify-between items-center mb-4;
}

.modal-header h4 {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.close-btn {
  @apply text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl;
}

.export-options {
  @apply space-y-4 mb-6;
}

.export-option {
  @apply flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 
         rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700;
}

.export-option input[type="radio"] {
  @apply mt-1;
}

.option-label {
  @apply font-medium text-gray-900 dark:text-white;
}

.option-description {
  @apply text-sm text-gray-500 dark:text-gray-400 block;
}

.export-actions {
  @apply flex gap-3 justify-end;
}

.cancel-btn {
  @apply px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
         rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors;
}

.export-confirm-btn {
  @apply px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors;
}

/* Responsive */
@media (max-width: 1024px) {
  .calculator-content {
    @apply grid-cols-1;
  }
}

@media (max-width: 768px) {
  .cost-calculator {
    @apply p-4;
  }
  
  .calculator-header {
    @apply flex-col items-stretch;
  }
  
  .input-grid {
    @apply grid-cols-1;
  }
  
  .cost-range {
    @apply grid-cols-1 gap-2;
  }
  
  .cost-item-detail {
    @apply grid-cols-1 gap-2;
  }
  
  .table-header,
  .table-row {
    @apply grid-cols-3 gap-2 text-xs;
  }
  
  .table-header .header-cell:nth-child(4),
  .table-header .header-cell:nth-child(5),
  .table-row .table-cell:nth-child(4),
  .table-row .table-cell:nth-child(5) {
    @apply hidden;
  }
}
</style>