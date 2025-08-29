<template>
  <div class="confidence-meters">
    <div class="meters-header">
      <h3>{{ title }}</h3>
      <div class="header-controls">
        <div class="view-toggle">
          <button 
            @click="viewMode = 'grid'"
            :class="['toggle-btn', { active: viewMode === 'grid' }]"
          >
            Grid
          </button>
          <button 
            @click="viewMode = 'list'"
            :class="['toggle-btn', { active: viewMode === 'list' }]"
          >
            List
          </button>
        </div>
        <div class="confidence-legend">
          <div class="legend-item">
            <div class="legend-dot high"></div>
            <span>High (80%+)</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot medium"></div>
            <span>Medium (60-79%)</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot low"></div>
            <span>Low (&lt;60%)</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Grid View -->
    <div v-if="viewMode === 'grid'" class="confidence-grid">
      <div 
        v-for="item in confidenceItems"
        :key="item.id"
        class="confidence-card"
        :class="[`confidence-${getConfidenceLevel(item.confidence)}`]"
        @click="selectItem(item)"
      >
        <div class="card-header">
          <h4>{{ item.label }}</h4>
          <div class="confidence-badge" :class="getConfidenceLevel(item.confidence)">
            {{ formatConfidence(item.confidence) }}
          </div>
        </div>
        
        <!-- Circular Progress Meter -->
        <div class="circular-meter">
          <svg viewBox="0 0 120 120" class="progress-svg">
            <!-- Background circle -->
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="var(--meter-bg-color)"
              stroke-width="8"
            />
            <!-- Progress circle -->
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              :stroke="getConfidenceColor(item.confidence)"
              stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="getStrokeDashoffset(item.confidence)"
              class="progress-circle"
              :style="{ animationDelay: `${Math.random() * 0.5}s` }"
            />
            <!-- Center text -->
            <text
              x="60"
              y="60"
              text-anchor="middle"
              dominant-baseline="central"
              class="progress-text"
              :fill="getConfidenceColor(item.confidence)"
            >
              {{ Math.round(item.confidence * 100) }}%
            </text>
          </svg>
        </div>
        
        <div class="card-footer">
          <div class="confidence-details">
            <div class="detail-row">
              <span class="detail-label">Source:</span>
              <span class="detail-value">{{ item.source }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Last Updated:</span>
              <span class="detail-value">{{ formatDate(item.lastUpdated) }}</span>
            </div>
          </div>
          <div v-if="item.factors" class="confidence-factors">
            <div class="factors-label">Key Factors:</div>
            <div class="factors-list">
              <span 
                v-for="factor in item.factors.slice(0, 2)"
                :key="factor"
                class="factor-tag"
              >
                {{ factor }}
              </span>
              <span v-if="item.factors.length > 2" class="more-factors">
                +{{ item.factors.length - 2 }} more
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- List View -->
    <div v-else class="confidence-list">
      <div class="list-header">
        <div class="header-item">Item</div>
        <div class="header-confidence">Confidence</div>
        <div class="header-source">Source</div>
        <div class="header-trend">Trend</div>
        <div class="header-actions">Actions</div>
      </div>
      
      <div 
        v-for="item in sortedConfidenceItems"
        :key="item.id"
        class="list-row"
        :class="[`confidence-${getConfidenceLevel(item.confidence)}`]"
        @click="selectItem(item)"
      >
        <div class="row-item">
          <div class="item-info">
            <span class="item-label">{{ item.label }}</span>
            <span class="item-category">{{ item.category }}</span>
          </div>
        </div>
        
        <div class="row-confidence">
          <div class="linear-meter">
            <div 
              class="meter-fill"
              :style="{ 
                width: (item.confidence * 100) + '%',
                backgroundColor: getConfidenceColor(item.confidence)
              }"
            ></div>
          </div>
          <span class="confidence-percent">{{ formatConfidence(item.confidence) }}</span>
        </div>
        
        <div class="row-source">
          <span class="source-name">{{ item.source }}</span>
          <div class="source-details">
            <span class="data-points">{{ item.dataPoints || 0 }} data points</span>
          </div>
        </div>
        
        <div class="row-trend">
          <div class="trend-indicator" :class="getTrendClass(item.trend)">
            <TrendingUpIcon v-if="item.trend === 'up'" class="w-4 h-4" />
            <TrendingDownIcon v-else-if="item.trend === 'down'" class="w-4 h-4" />
            <MinusIcon v-else class="w-4 h-4" />
          </div>
          <span class="trend-change">{{ getTrendText(item.trend, item.trendValue) }}</span>
        </div>
        
        <div class="row-actions">
          <button 
            @click.stop="showDetails(item)"
            class="action-btn details-btn"
            title="View Details"
          >
            <EyeIcon class="w-4 h-4" />
          </button>
          <button 
            @click.stop="toggleWatch(item.id)"
            :class="['action-btn', 'watch-btn', { active: watchedItems.includes(item.id) }]"
            :title="watchedItems.includes(item.id) ? 'Unwatch' : 'Watch'"
          >
            <EyeIcon v-if="watchedItems.includes(item.id)" class="w-4 h-4" />
            <EyeSlashIcon v-else class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    
    <!-- Overall Confidence Summary -->
    <div class="confidence-summary">
      <h4>Overall Assessment</h4>
      <div class="summary-content">
        <div class="summary-meter">
          <div class="summary-label">Average Confidence</div>
          <div class="large-meter">
            <svg viewBox="0 0 160 160" class="summary-progress-svg">
              <!-- Background arc -->
              <path
                d="M 30 80 A 50 50 0 1 1 130 80"
                fill="none"
                stroke="var(--meter-bg-color)"
                stroke-width="12"
              />
              <!-- Progress arc -->
              <path
                :d="getSummaryArcPath(overallConfidence)"
                fill="none"
                :stroke="getConfidenceColor(overallConfidence)"
                stroke-width="12"
                stroke-linecap="round"
                class="summary-progress-arc"
              />
              <!-- Center text -->
              <text
                x="80"
                y="90"
                text-anchor="middle"
                class="summary-progress-text"
                :fill="getConfidenceColor(overallConfidence)"
              >
                {{ formatConfidence(overallConfidence) }}
              </text>
            </svg>
          </div>
        </div>
        
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-value high">{{ highConfidenceCount }}</span>
            <span class="stat-label">High Confidence</span>
          </div>
          <div class="stat-item">
            <span class="stat-value medium">{{ mediumConfidenceCount }}</span>
            <span class="stat-label">Medium Confidence</span>
          </div>
          <div class="stat-item">
            <span class="stat-value low">{{ lowConfidenceCount }}</span>
            <span class="stat-label">Low Confidence</span>
          </div>
        </div>
        
        <div class="summary-recommendations">
          <h5>Recommendations</h5>
          <ul class="recommendation-list">
            <li v-for="rec in recommendations" :key="rec">{{ rec }}</li>
          </ul>
        </div>
      </div>
    </div>
    
    <!-- Details Modal -->
    <div v-if="selectedItem" class="modal-overlay" @click="selectedItem = null">
      <div class="confidence-modal" @click.stop>
        <div class="modal-header">
          <h4>{{ selectedItem.label }} - Confidence Analysis</h4>
          <button @click="selectedItem = null" class="close-btn">×</button>
        </div>
        
        <div class="modal-content">
          <div class="confidence-breakdown">
            <div class="main-confidence">
              <div class="confidence-value">
                {{ formatConfidence(selectedItem.confidence) }}
              </div>
              <div class="confidence-description">
                {{ getConfidenceDescription(selectedItem.confidence) }}
              </div>
            </div>
            
            <div class="contributing-factors">
              <h5>Contributing Factors</h5>
              <div class="factors-grid">
                <div 
                  v-for="factor in selectedItem.detailedFactors || []"
                  :key="factor.name"
                  class="factor-item"
                >
                  <div class="factor-name">{{ factor.name }}</div>
                  <div class="factor-meter">
                    <div 
                      class="factor-fill"
                      :style="{ 
                        width: (factor.impact * 100) + '%',
                        backgroundColor: getFactorColor(factor.impact)
                      }"
                    ></div>
                  </div>
                  <div class="factor-impact">{{ Math.round(factor.impact * 100) }}%</div>
                </div>
              </div>
            </div>
            
            <div class="data-quality">
              <h5>Data Quality Metrics</h5>
              <div class="quality-metrics">
                <div class="metric">
                  <span class="metric-label">Data Freshness:</span>
                  <span class="metric-value">{{ selectedItem.dataFreshness || 'N/A' }}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Sample Size:</span>
                  <span class="metric-value">{{ selectedItem.dataPoints || 'N/A' }} points</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Source Reliability:</span>
                  <span class="metric-value">{{ selectedItem.sourceReliability || 'High' }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="selectedItem.explanation" class="confidence-explanation">
              <h5>Explanation</h5>
              <p>{{ selectedItem.explanation }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCharts } from '../composables/useCharts'
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  MinusIcon, 
  EyeIcon, 
  EyeSlashIcon 
} from '@heroicons/vue/24/solid'

interface ConfidenceItem {
  id: string
  label: string
  category: string
  confidence: number
  source: string
  lastUpdated: string
  trend: 'up' | 'down' | 'stable'
  trendValue?: number
  factors?: string[]
  detailedFactors?: Array<{
    name: string
    impact: number
  }>
  dataPoints?: number
  dataFreshness?: string
  sourceReliability?: string
  explanation?: string
}

interface Props {
  title?: string
  items?: ConfidenceItem[]
  showSummary?: boolean
  defaultView?: 'grid' | 'list'
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confidence Meters',
  items: () => [],
  showSummary: true,
  defaultView: 'grid'
})

const emit = defineEmits<{
  'item-selected': [item: ConfidenceItem]
  'confidence-changed': [itemId: string, confidence: number]
}>()

const { getConfidenceColor, formatConfidence } = useCharts()

const viewMode = ref<'grid' | 'list'>(props.defaultView)
const selectedItem = ref<ConfidenceItem | null>(null)
const watchedItems = ref<string[]>([])

// Mock confidence data - would come from props/API in real app
const confidenceItems = computed((): ConfidenceItem[] => {
  return props.items.length > 0 ? props.items : [
    {
      id: 'local-council-reqs',
      label: 'Local Council Requirements',
      category: 'Planning',
      confidence: 0.85,
      source: 'City of Sydney API',
      lastUpdated: '2025-08-29T10:30:00',
      trend: 'up',
      trendValue: 5,
      factors: ['Complete data coverage', 'Recent API updates', 'Historical accuracy'],
      detailedFactors: [
        { name: 'Data Coverage', impact: 0.9 },
        { name: 'Update Frequency', impact: 0.8 },
        { name: 'Historical Accuracy', impact: 0.85 }
      ],
      dataPoints: 1250,
      dataFreshness: '2 hours ago',
      sourceReliability: 'High',
      explanation: 'High confidence based on direct API access to council systems with frequent updates and comprehensive coverage.'
    },
    {
      id: 'state-permits',
      label: 'State Permits & Licenses',
      category: 'Compliance',
      confidence: 0.72,
      source: 'NSW Planning Portal',
      lastUpdated: '2025-08-29T09:15:00',
      trend: 'stable',
      trendValue: 0,
      factors: ['Good API coverage', 'Some data gaps', 'Regular updates'],
      detailedFactors: [
        { name: 'API Coverage', impact: 0.75 },
        { name: 'Data Completeness', impact: 0.68 },
        { name: 'Update Timeliness', impact: 0.74 }
      ],
      dataPoints: 890,
      dataFreshness: '4 hours ago',
      sourceReliability: 'Medium-High',
      explanation: 'Medium-high confidence with good coverage but some data gaps in specialty permits.'
    },
    {
      id: 'federal-reqs',
      label: 'Federal Requirements',
      category: 'Business Registration',
      confidence: 0.91,
      source: 'ABLIS Database',
      lastUpdated: '2025-08-29T11:00:00',
      trend: 'up',
      trendValue: 3,
      factors: ['Comprehensive database', 'Daily updates', 'High accuracy'],
      detailedFactors: [
        { name: 'Database Coverage', impact: 0.95 },
        { name: 'Update Frequency', impact: 0.88 },
        { name: 'Data Accuracy', impact: 0.92 }
      ],
      dataPoints: 2100,
      dataFreshness: '30 minutes ago',
      sourceReliability: 'Very High',
      explanation: 'Very high confidence due to comprehensive federal database with excellent maintenance.'
    },
    {
      id: 'industry-specific',
      label: 'Industry-Specific Rules',
      category: 'Sector Regulations',
      confidence: 0.58,
      source: 'Multiple Sources',
      lastUpdated: '2025-08-29T08:45:00',
      trend: 'down',
      trendValue: -8,
      factors: ['Fragmented sources', 'Inconsistent updates', 'Complex regulations'],
      detailedFactors: [
        { name: 'Source Consistency', impact: 0.45 },
        { name: 'Data Fragmentation', impact: 0.62 },
        { name: 'Regulatory Complexity', impact: 0.55 }
      ],
      dataPoints: 340,
      dataFreshness: '12 hours ago',
      sourceReliability: 'Medium',
      explanation: 'Lower confidence due to fragmented data sources and complex, rapidly changing industry regulations.'
    },
    {
      id: 'cost-estimates',
      label: 'Cost Estimates',
      category: 'Financial',
      confidence: 0.67,
      source: 'Fee Schedules',
      lastUpdated: '2025-08-29T07:30:00',
      trend: 'stable',
      trendValue: 1,
      factors: ['Official fee schedules', 'Variable processing fees', 'Outdated estimates'],
      detailedFactors: [
        { name: 'Official Fees', impact: 0.8 },
        { name: 'Processing Costs', impact: 0.55 },
        { name: 'Time Estimates', impact: 0.65 }
      ],
      dataPoints: 680,
      dataFreshness: '6 hours ago',
      sourceReliability: 'Medium-High',
      explanation: 'Moderate confidence with good fee schedule data but variable processing costs and time estimates.'
    },
    {
      id: 'timeline-predictions',
      label: 'Timeline Predictions',
      category: 'Planning',
      confidence: 0.43,
      source: 'Historical Data',
      lastUpdated: '2025-08-29T06:00:00',
      trend: 'down',
      trendValue: -12,
      factors: ['Limited historical data', 'Variable processing times', 'External dependencies'],
      detailedFactors: [
        { name: 'Historical Patterns', impact: 0.48 },
        { name: 'Process Variability', impact: 0.35 },
        { name: 'External Factors', impact: 0.42 }
      ],
      dataPoints: 150,
      dataFreshness: '18 hours ago',
      sourceReliability: 'Low-Medium',
      explanation: 'Low confidence in timeline predictions due to high variability in processing times and external dependencies.'
    }
  ]
})

const sortedConfidenceItems = computed(() => {
  return [...confidenceItems.value].sort((a, b) => b.confidence - a.confidence)
})

const overallConfidence = computed(() => {
  if (confidenceItems.value.length === 0) return 0
  const total = confidenceItems.value.reduce((sum, item) => sum + item.confidence, 0)
  return total / confidenceItems.value.length
})

const highConfidenceCount = computed(() => {
  return confidenceItems.value.filter(item => item.confidence >= 0.8).length
})

const mediumConfidenceCount = computed(() => {
  return confidenceItems.value.filter(item => item.confidence >= 0.6 && item.confidence < 0.8).length
})

const lowConfidenceCount = computed(() => {
  return confidenceItems.value.filter(item => item.confidence < 0.6).length
})

const recommendations = computed(() => {
  const recs = []
  
  if (lowConfidenceCount.value > 0) {
    recs.push(`Review ${lowConfidenceCount.value} low-confidence areas for data improvement`)
  }
  
  if (overallConfidence.value < 0.7) {
    recs.push('Consider additional data sources to improve overall confidence')
  }
  
  const trendingDown = confidenceItems.value.filter(item => item.trend === 'down')
  if (trendingDown.length > 0) {
    recs.push(`Monitor ${trendingDown.length} declining confidence areas`)
  }
  
  if (recs.length === 0) {
    recs.push('Confidence levels are good - maintain current data quality')
  }
  
  return recs
})

const circumference = 2 * Math.PI * 45

const getConfidenceLevel = (confidence: number): 'high' | 'medium' | 'low' => {
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.6) return 'medium'
  return 'low'
}

const getStrokeDashoffset = (confidence: number): number => {
  return circumference - (confidence * circumference)
}

const getSummaryArcPath = (confidence: number): string => {
  const angle = confidence * 180 // Half circle
  const radians = (angle - 90) * (Math.PI / 180)
  const x = 80 + 50 * Math.cos(radians)
  const y = 80 + 50 * Math.sin(radians)
  
  const largeArcFlag = angle > 90 ? 1 : 0
  
  return `M 30 80 A 50 50 0 ${largeArcFlag} 1 ${x} ${y}`
}

const getConfidenceDescription = (confidence: number): string => {
  if (confidence >= 0.9) return 'Very High Confidence'
  if (confidence >= 0.8) return 'High Confidence'
  if (confidence >= 0.7) return 'Good Confidence'
  if (confidence >= 0.6) return 'Medium Confidence'
  if (confidence >= 0.5) return 'Low Confidence'
  return 'Very Low Confidence'
}

const getFactorColor = (impact: number): string => {
  return getConfidenceColor(impact)
}

const getTrendClass = (trend: string): string => {
  return {
    'up': 'trend-up',
    'down': 'trend-down',
    'stable': 'trend-stable'
  }[trend] || 'trend-stable'
}

const getTrendText = (trend: string, value?: number): string => {
  if (trend === 'stable') return 'Stable'
  const changeText = value ? `${Math.abs(value)}%` : ''
  return trend === 'up' ? `+${changeText}` : `-${changeText}`
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

const selectItem = (item: ConfidenceItem) => {
  selectedItem.value = item
  emit('item-selected', item)
}

const showDetails = (item: ConfidenceItem) => {
  selectedItem.value = item
}

const toggleWatch = (itemId: string) => {
  const index = watchedItems.value.indexOf(itemId)
  if (index === -1) {
    watchedItems.value.push(itemId)
  } else {
    watchedItems.value.splice(index, 1)
  }
}
</script>

<style scoped>
.confidence-meters {
  @apply bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg;
}

.meters-header {
  @apply flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4;
}

.meters-header h3 {
  @apply text-xl font-semibold text-gray-900 dark:text-white;
}

.header-controls {
  @apply flex flex-col sm:flex-row gap-4 items-start sm:items-center;
}

.view-toggle {
  @apply flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden;
}

.toggle-btn {
  @apply px-4 py-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300
         border-r border-gray-300 dark:border-gray-600 last:border-r-0
         hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm;
}

.toggle-btn.active {
  @apply bg-blue-500 text-white;
}

.confidence-legend {
  @apply flex flex-wrap gap-3;
}

.legend-item {
  @apply flex items-center gap-2;
}

.legend-dot {
  @apply w-3 h-3 rounded-full;
}

.legend-dot.high {
  @apply bg-green-500;
}

.legend-dot.medium {
  @apply bg-yellow-500;
}

.legend-dot.low {
  @apply bg-red-500;
}

.legend-item span {
  @apply text-sm text-gray-600 dark:text-gray-300;
}

/* Grid View */
.confidence-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8;
}

.confidence-card {
  @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-6 cursor-pointer
         transition-all duration-200 hover:shadow-md border-l-4;
}

.confidence-card.confidence-high {
  @apply border-l-green-500 hover:bg-green-50 dark:hover:bg-green-900/10;
}

.confidence-card.confidence-medium {
  @apply border-l-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/10;
}

.confidence-card.confidence-low {
  @apply border-l-red-500 hover:bg-red-50 dark:hover:bg-red-900/10;
}

.card-header {
  @apply flex justify-between items-start mb-4;
}

.card-header h4 {
  @apply font-semibold text-gray-900 dark:text-white text-sm;
}

.confidence-badge {
  @apply px-2 py-1 rounded text-xs font-bold text-white;
}

.confidence-badge.high {
  @apply bg-green-500;
}

.confidence-badge.medium {
  @apply bg-yellow-500;
}

.confidence-badge.low {
  @apply bg-red-500;
}

.circular-meter {
  @apply w-24 h-24 mx-auto mb-4;
}

.progress-svg {
  @apply w-full h-full transform -rotate-90;
}

.progress-circle {
  @apply transition-all duration-1000 ease-out;
  animation: drawCircle 1.5s ease-out forwards;
}

.progress-text {
  @apply text-sm font-bold transform rotate-90;
  transform-origin: center;
}

.card-footer {
  @apply space-y-3;
}

.confidence-details {
  @apply space-y-1;
}

.detail-row {
  @apply flex justify-between text-xs;
}

.detail-label {
  @apply text-gray-500 dark:text-gray-400;
}

.detail-value {
  @apply text-gray-700 dark:text-gray-300;
}

.confidence-factors {
  @apply pt-2 border-t border-gray-200 dark:border-gray-700;
}

.factors-label {
  @apply text-xs font-medium text-gray-600 dark:text-gray-400 mb-2;
}

.factors-list {
  @apply flex flex-wrap gap-1;
}

.factor-tag {
  @apply text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded;
}

.more-factors {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

/* List View */
.confidence-list {
  @apply border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-8;
}

.list-header {
  @apply grid grid-cols-5 gap-4 p-4 bg-gray-50 dark:bg-gray-800 font-medium text-sm
         text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700;
}

.list-row {
  @apply grid grid-cols-5 gap-4 p-4 border-b border-gray-100 dark:border-gray-800 
         hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors
         last:border-b-0;
}

.row-item {
  @apply space-y-1;
}

.item-info {
  @apply flex flex-col;
}

.item-label {
  @apply font-medium text-gray-900 dark:text-white text-sm;
}

.item-category {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.row-confidence {
  @apply flex items-center gap-3;
}

.linear-meter {
  @apply flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.meter-fill {
  @apply h-full transition-all duration-1000 ease-out rounded-full;
  animation: fillMeter 1.5s ease-out forwards;
}

.confidence-percent {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300 w-12 text-right;
}

.row-source {
  @apply space-y-1;
}

.source-name {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.source-details {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.row-trend {
  @apply flex items-center gap-2;
}

.trend-indicator {
  @apply p-1 rounded-full;
}

.trend-indicator.trend-up {
  @apply bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400;
}

.trend-indicator.trend-down {
  @apply bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400;
}

.trend-indicator.trend-stable {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400;
}

.trend-change {
  @apply text-sm font-medium;
}

.row-actions {
  @apply flex gap-2;
}

.action-btn {
  @apply p-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400
         hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors;
}

.watch-btn.active {
  @apply bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400;
}

/* Summary Section */
.confidence-summary {
  @apply bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 
         rounded-lg p-6 border border-blue-200 dark:border-blue-800;
}

.confidence-summary h4 {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-4;
}

.summary-content {
  @apply grid grid-cols-1 lg:grid-cols-3 gap-6;
}

.summary-meter {
  @apply text-center;
}

.summary-label {
  @apply text-sm font-medium text-gray-600 dark:text-gray-400 mb-2;
}

.large-meter {
  @apply w-32 h-20 mx-auto;
}

.summary-progress-svg {
  @apply w-full h-full;
}

.summary-progress-arc {
  @apply transition-all duration-1500 ease-out;
}

.summary-progress-text {
  @apply text-lg font-bold;
}

.summary-stats {
  @apply space-y-3;
}

.stat-item {
  @apply flex justify-between items-center;
}

.stat-value {
  @apply text-2xl font-bold;
}

.stat-value.high {
  @apply text-green-600 dark:text-green-400;
}

.stat-value.medium {
  @apply text-yellow-600 dark:text-yellow-400;
}

.stat-value.low {
  @apply text-red-600 dark:text-red-400;
}

.stat-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.summary-recommendations h5 {
  @apply font-medium text-gray-900 dark:text-white mb-2;
}

.recommendation-list {
  @apply list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1;
}

/* Modal */
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.confidence-modal {
  @apply bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto;
}

.modal-header {
  @apply flex justify-between items-center mb-6;
}

.modal-header h4 {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.close-btn {
  @apply text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl;
}

.confidence-breakdown {
  @apply space-y-6;
}

.main-confidence {
  @apply text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg;
}

.confidence-value {
  @apply text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2;
}

.confidence-description {
  @apply text-gray-600 dark:text-gray-400;
}

.contributing-factors h5,
.data-quality h5,
.confidence-explanation h5 {
  @apply font-semibold text-gray-900 dark:text-white mb-3;
}

.factors-grid {
  @apply space-y-3;
}

.factor-item {
  @apply grid grid-cols-3 gap-4 items-center;
}

.factor-name {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.factor-meter {
  @apply h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.factor-fill {
  @apply h-full transition-all duration-1000 ease-out rounded-full;
}

.factor-impact {
  @apply text-sm font-medium text-gray-600 dark:text-gray-400 text-right;
}

.quality-metrics {
  @apply space-y-2;
}

.metric {
  @apply flex justify-between text-sm;
}

.metric-label {
  @apply text-gray-600 dark:text-gray-400;
}

.metric-value {
  @apply font-medium text-gray-900 dark:text-white;
}

/* Animations */
@keyframes drawCircle {
  from {
    stroke-dashoffset: 282.74; /* Full circumference */
  }
  to {
    stroke-dashoffset: var(--final-offset);
  }
}

@keyframes fillMeter {
  from {
    width: 0%;
  }
  to {
    width: var(--final-width);
  }
}

/* CSS Variables for theming */
:root {
  --meter-bg-color: #e5e7eb;
}

.dark {
  --meter-bg-color: #374151;
}

/* Responsive */
@media (max-width: 768px) {
  .confidence-meters {
    @apply p-4;
  }
  
  .meters-header {
    @apply flex-col items-stretch;
  }
  
  .header-controls {
    @apply flex-col;
  }
  
  .confidence-grid {
    @apply grid-cols-1;
  }
  
  .list-header,
  .list-row {
    @apply grid-cols-3 gap-2 text-xs;
  }
  
  .list-header .header-trend,
  .list-header .header-actions,
  .list-row .row-trend,
  .list-row .row-actions {
    @apply hidden;
  }
  
  .summary-content {
    @apply grid-cols-1 gap-4;
  }
}
</style>