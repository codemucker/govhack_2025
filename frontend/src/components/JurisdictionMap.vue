<template>
  <div class="jurisdiction-map">
    <div class="map-header">
      <h3>{{ title }}</h3>
      <div class="map-controls">
        <div class="legend">
          <div class="legend-item">
            <div class="color-box local"></div>
            <span>Local Council</span>
          </div>
          <div class="legend-item">
            <div class="color-box state"></div>
            <span>State/Territory</span>
          </div>
          <div class="legend-item">
            <div class="color-box federal"></div>
            <span>Federal</span>
          </div>
          <div class="legend-item">
            <div class="color-box overlap"></div>
            <span>Multiple Jurisdictions</span>
          </div>
        </div>
        <button @click="resetView" class="reset-btn">
          Reset View
        </button>
      </div>
    </div>
    
    <div class="map-container" ref="mapContainer">
      <svg 
        :width="mapDimensions.width" 
        :height="mapDimensions.height"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid meet"
        class="jurisdiction-svg"
      >
        <!-- Background -->
        <rect 
          width="800" 
          height="600" 
          fill="var(--color-background-soft)"
          stroke="var(--color-border)"
          stroke-width="1"
        />
        
        <!-- Grid lines for reference -->
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="var(--color-border)" stroke-width="0.5" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="800" height="600" fill="url(#grid)" />
        
        <!-- Jurisdiction regions -->
        <g class="regions">
          <g 
            v-for="region in regions" 
            :key="region.id"
            :class="['region', `jurisdiction-${region.jurisdiction.toLowerCase()}`, { 
              'active': selectedRegions.includes(region.id),
              'has-requirements': region.requirementCount > 0
            }]"
            @click="toggleRegion(region.id)"
            @mouseover="showTooltip($event, region)"
            @mouseleave="hideTooltip"
          >
            <!-- Different shapes based on jurisdiction type -->
            <polygon 
              v-if="region.jurisdiction === 'Local'"
              :points="region.coordinates"
              :fill="getRegionColor(region)"
              :stroke="getRegionBorderColor(region)"
              stroke-width="2"
              class="region-shape"
            />
            <rect 
              v-else-if="region.jurisdiction === 'State'"
              :x="region.bounds.x"
              :y="region.bounds.y"
              :width="region.bounds.width"
              :height="region.bounds.height"
              :fill="getRegionColor(region)"
              :stroke="getRegionBorderColor(region)"
              stroke-width="2"
              class="region-shape"
              rx="5"
            />
            <circle 
              v-else-if="region.jurisdiction === 'Federal'"
              :cx="region.center.x"
              :cy="region.center.y"
              :r="region.radius || 40"
              :fill="getRegionColor(region)"
              :stroke="getRegionBorderColor(region)"
              stroke-width="2"
              class="region-shape"
            />
            
            <!-- Region label -->
            <text 
              :x="region.labelPosition.x"
              :y="region.labelPosition.y"
              text-anchor="middle"
              class="region-label"
              :class="{ 'light-text': isDarkRegion(region) }"
            >
              {{ region.name }}
            </text>
            
            <!-- Requirement count badge -->
            <g v-if="region.requirementCount > 0" class="requirement-badge">
              <circle 
                :cx="region.labelPosition.x + 30"
                :cy="region.labelPosition.y - 10"
                r="12"
                fill="var(--color-primary)"
                stroke="white"
                stroke-width="2"
              />
              <text 
                :x="region.labelPosition.x + 30"
                :y="region.labelPosition.y - 6"
                text-anchor="middle"
                class="badge-text"
                fill="white"
                font-size="10"
                font-weight="bold"
              >
                {{ region.requirementCount }}
              </text>
            </g>
          </g>
        </g>
        
        <!-- Overlap indicators -->
        <g class="overlaps">
          <g 
            v-for="overlap in jurisdictionOverlaps"
            :key="overlap.id"
            class="overlap-indicator"
          >
            <path 
              :d="overlap.path"
              fill="var(--color-warning)"
              fill-opacity="0.3"
              stroke="var(--color-warning)"
              stroke-width="2"
              stroke-dasharray="5,5"
            />
            <circle 
              :cx="overlap.center.x"
              :cy="overlap.center.y"
              r="8"
              fill="var(--color-warning)"
            />
            <text 
              :x="overlap.center.x"
              :y="overlap.center.y + 3"
              text-anchor="middle"
              class="overlap-text"
              fill="white"
              font-size="12"
              font-weight="bold"
            >
              !
            </text>
          </g>
        </g>
      </svg>
      
      <!-- Tooltip -->
      <div 
        v-if="tooltip.visible"
        ref="tooltip"
        class="map-tooltip"
        :style="{
          left: tooltip.x + 'px',
          top: tooltip.y + 'px'
        }"
      >
        <div class="tooltip-header">
          <strong>{{ tooltip.region?.name }}</strong>
          <span class="jurisdiction-type">{{ tooltip.region?.jurisdiction }}</span>
        </div>
        <div class="tooltip-content">
          <div class="requirement-info">
            <span class="label">Requirements:</span>
            <span class="value">{{ tooltip.region?.requirementCount || 0 }}</span>
          </div>
          <div class="complexity-info">
            <span class="label">Complexity:</span>
            <span class="value" :class="`complexity-${tooltip.region?.complexity?.toLowerCase()}`">
              {{ tooltip.region?.complexity || 'Medium' }}
            </span>
          </div>
          <div v-if="tooltip.region?.estimatedTime" class="time-info">
            <span class="label">Est. Time:</span>
            <span class="value">{{ tooltip.region.estimatedTime }}</span>
          </div>
        </div>
        <div class="tooltip-footer">
          <small>Click to {{ selectedRegions.includes(tooltip.region?.id) ? 'deselect' : 'select' }}</small>
        </div>
      </div>
    </div>
    
    <!-- Selection summary -->
    <div v-if="selectedRegions.length > 0" class="selection-summary">
      <h4>Selected Jurisdictions ({{ selectedRegions.length }})</h4>
      <div class="selected-list">
        <div 
          v-for="regionId in selectedRegions"
          :key="regionId"
          class="selected-item"
        >
          <span class="region-name">{{ getRegionById(regionId)?.name }}</span>
          <span class="jurisdiction-type">{{ getRegionById(regionId)?.jurisdiction }}</span>
          <button @click="toggleRegion(regionId)" class="remove-btn">×</button>
        </div>
      </div>
      <div class="summary-stats">
        <div class="stat">
          <span class="label">Total Requirements:</span>
          <span class="value">{{ totalSelectedRequirements }}</span>
        </div>
        <div class="stat">
          <span class="label">Est. Total Time:</span>
          <span class="value">{{ estimatedTotalTime }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useCharts } from '../composables/useCharts'

interface JurisdictionRegion {
  id: string
  name: string
  jurisdiction: 'Local' | 'State' | 'Federal'
  coordinates?: string
  bounds?: { x: number; y: number; width: number; height: number }
  center?: { x: number; y: number }
  radius?: number
  labelPosition: { x: number; y: number }
  requirementCount: number
  complexity: 'Low' | 'Medium' | 'High'
  estimatedTime: string
  color?: string
}

interface JurisdictionOverlap {
  id: string
  regions: string[]
  path: string
  center: { x: number; y: number }
  type: 'conflict' | 'shared'
}

interface MapTooltip {
  visible: boolean
  x: number
  y: number
  region?: JurisdictionRegion
}

interface Props {
  title?: string
  searchResults?: any[]
  selectedJurisdictions?: string[]
  showOverlaps?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Jurisdiction Map',
  searchResults: () => [],
  selectedJurisdictions: () => [],
  showOverlaps: true
})

const emit = defineEmits<{
  'jurisdictions-changed': [jurisdictions: string[]]
  'region-selected': [region: JurisdictionRegion]
}>()

const { colorPalette } = useCharts()

const mapContainer = ref<HTMLDivElement>()
const tooltip = ref<HTMLDivElement>()
const selectedRegions = ref<string[]>([...props.selectedJurisdictions])

const mapDimensions = ref({
  width: 800,
  height: 600
})

const tooltip_info = ref<MapTooltip>({
  visible: false,
  x: 0,
  y: 0
})

// Mock jurisdiction regions data - in real app would come from API
const regions = ref<JurisdictionRegion[]>([
  // Local councils (polygons)
  {
    id: 'sydney-city',
    name: 'City of Sydney',
    jurisdiction: 'Local',
    coordinates: '100,150 200,120 250,200 180,250 120,220',
    labelPosition: { x: 175, y: 185 },
    requirementCount: 8,
    complexity: 'High',
    estimatedTime: '4-6 weeks'
  },
  {
    id: 'randwick',
    name: 'Randwick Council',
    jurisdiction: 'Local',
    coordinates: '250,200 350,180 380,280 280,300',
    labelPosition: { x: 315, y: 240 },
    requirementCount: 5,
    complexity: 'Medium',
    estimatedTime: '3-4 weeks'
  },
  {
    id: 'waverley',
    name: 'Waverley Council',
    jurisdiction: 'Local',
    coordinates: '180,250 250,200 280,300 200,320',
    labelPosition: { x: 240, y: 270 },
    requirementCount: 4,
    complexity: 'Medium',
    estimatedTime: '2-3 weeks'
  },
  {
    id: 'inner-west',
    name: 'Inner West Council',
    jurisdiction: 'Local',
    coordinates: '50,200 100,150 120,220 70,280',
    labelPosition: { x: 85, y: 215 },
    requirementCount: 6,
    complexity: 'Medium',
    estimatedTime: '3-5 weeks'
  },
  
  // State regions (rectangles)
  {
    id: 'nsw-planning',
    name: 'NSW Planning',
    jurisdiction: 'State',
    bounds: { x: 450, y: 100, width: 200, height: 150 },
    labelPosition: { x: 550, y: 175 },
    requirementCount: 12,
    complexity: 'High',
    estimatedTime: '6-8 weeks'
  },
  {
    id: 'nsw-heritage',
    name: 'NSW Heritage',
    jurisdiction: 'State',
    bounds: { x: 450, y: 280, width: 200, height: 120 },
    labelPosition: { x: 550, y: 340 },
    requirementCount: 3,
    complexity: 'Low',
    estimatedTime: '1-2 weeks'
  },
  
  // Federal regions (circles)
  {
    id: 'acma',
    name: 'ACMA',
    jurisdiction: 'Federal',
    center: { x: 150, y: 450 },
    radius: 50,
    labelPosition: { x: 150, y: 450 },
    requirementCount: 2,
    complexity: 'Low',
    estimatedTime: '1-2 weeks'
  },
  {
    id: 'austrade',
    name: 'Austrade',
    jurisdiction: 'Federal',
    center: { x: 350, y: 480 },
    radius: 45,
    labelPosition: { x: 350, y: 480 },
    requirementCount: 4,
    complexity: 'Medium',
    estimatedTime: '2-4 weeks'
  },
  {
    id: 'asic',
    name: 'ASIC',
    jurisdiction: 'Federal',
    center: { x: 550, y: 450 },
    radius: 60,
    labelPosition: { x: 550, y: 450 },
    requirementCount: 7,
    complexity: 'High',
    estimatedTime: '4-6 weeks'
  }
])

// Mock overlap data
const jurisdictionOverlaps = ref<JurisdictionOverlap[]>([
  {
    id: 'heritage-overlap',
    regions: ['sydney-city', 'nsw-heritage'],
    path: 'M180,200 L220,180 L240,220 L200,240 Z',
    center: { x: 210, y: 210 },
    type: 'shared'
  },
  {
    id: 'planning-conflict',
    regions: ['randwick', 'nsw-planning'],
    path: 'M320,200 L350,190 L370,220 L340,230 Z',
    center: { x: 345, y: 210 },
    type: 'conflict'
  }
])

const tooltip_visible = computed(() => tooltip_info.value)

const totalSelectedRequirements = computed(() => {
  return selectedRegions.value.reduce((total, regionId) => {
    const region = getRegionById(regionId)
    return total + (region?.requirementCount || 0)
  }, 0)
})

const estimatedTotalTime = computed(() => {
  if (selectedRegions.value.length === 0) return '0 weeks'
  
  // Calculate rough time estimate
  const maxWeeks = Math.max(
    ...selectedRegions.value.map(regionId => {
      const region = getRegionById(regionId)
      const timeStr = region?.estimatedTime || '2 weeks'
      const match = timeStr.match(/(\d+)-?(\d+)?/)
      return match ? parseInt(match[2] || match[1]) : 2
    })
  )
  
  return `${maxWeeks}-${maxWeeks + 2} weeks`
})

const getRegionColor = (region: JurisdictionRegion): string => {
  const isSelected = selectedRegions.value.includes(region.id)
  const baseColor = {
    'Local': colorPalette.primary,
    'State': colorPalette.secondary,
    'Federal': colorPalette.info
  }[region.jurisdiction]
  
  return isSelected ? baseColor : baseColor + '40' // 40% opacity when not selected
}

const getRegionBorderColor = (region: JurisdictionRegion): string => {
  const isSelected = selectedRegions.value.includes(region.id)
  const baseColor = {
    'Local': colorPalette.primary,
    'State': colorPalette.secondary,
    'Federal': colorPalette.info
  }[region.jurisdiction]
  
  return isSelected ? baseColor : baseColor + '80' // 80% opacity when not selected
}

const isDarkRegion = (region: JurisdictionRegion): boolean => {
  const isSelected = selectedRegions.value.includes(region.id)
  return isSelected && (region.jurisdiction === 'Local' || region.jurisdiction === 'Federal')
}

const getRegionById = (id: string): JurisdictionRegion | undefined => {
  return regions.value.find(r => r.id === id)
}

const toggleRegion = (regionId: string) => {
  const index = selectedRegions.value.indexOf(regionId)
  if (index === -1) {
    selectedRegions.value.push(regionId)
  } else {
    selectedRegions.value.splice(index, 1)
  }
  
  const region = getRegionById(regionId)
  if (region) {
    emit('region-selected', region)
  }
  
  emit('jurisdictions-changed', [...selectedRegions.value])
}

const showTooltip = (event: MouseEvent, region: JurisdictionRegion) => {
  const rect = mapContainer.value?.getBoundingClientRect()
  if (!rect) return
  
  tooltip_info.value = {
    visible: true,
    x: event.clientX - rect.left + 10,
    y: event.clientY - rect.top - 10,
    region
  }
}

const hideTooltip = () => {
  tooltip_info.value = {
    visible: false,
    x: 0,
    y: 0
  }
}

const resetView = () => {
  selectedRegions.value = []
  emit('jurisdictions-changed', [])
}

const updateMapDimensions = () => {
  if (!mapContainer.value) return
  
  const rect = mapContainer.value.getBoundingClientRect()
  mapDimensions.value = {
    width: Math.min(800, rect.width),
    height: Math.min(600, rect.height * 0.75)
  }
}

onMounted(() => {
  updateMapDimensions()
  window.addEventListener('resize', updateMapDimensions)
  
  // Initialize with any pre-selected jurisdictions
  selectedRegions.value = [...props.selectedJurisdictions]
})
</script>

<style scoped>
.jurisdiction-map {
  @apply bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg;
}

.map-header {
  @apply flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4;
}

.map-header h3 {
  @apply text-xl font-semibold text-gray-900 dark:text-white;
}

.map-controls {
  @apply flex flex-col sm:flex-row gap-4 items-start sm:items-center;
}

.legend {
  @apply flex flex-wrap gap-3;
}

.legend-item {
  @apply flex items-center gap-2;
}

.color-box {
  @apply w-4 h-4 rounded border-2;
}

.color-box.local {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.color-box.state {
  background-color: var(--color-secondary);
  border-color: var(--color-secondary);
}

.color-box.federal {
  background-color: var(--color-info);
  border-color: var(--color-info);
}

.color-box.overlap {
  background-color: var(--color-warning);
  border-color: var(--color-warning);
  opacity: 0.6;
}

.legend-item span {
  @apply text-sm text-gray-600 dark:text-gray-300;
}

.reset-btn {
  @apply px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
         rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm;
}

.map-container {
  @apply relative bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden;
  min-height: 400px;
}

.jurisdiction-svg {
  @apply w-full h-auto;
}

.region {
  @apply cursor-pointer transition-all duration-200;
}

.region:hover .region-shape {
  @apply drop-shadow-lg;
  filter: brightness(1.1);
}

.region.active .region-shape {
  @apply drop-shadow-xl;
  filter: brightness(1.2);
}

.region-label {
  @apply text-sm font-medium pointer-events-none;
  fill: var(--color-text);
}

.region-label.light-text {
  fill: white;
}

.requirement-badge {
  @apply pointer-events-none;
}

.badge-text {
  @apply font-bold;
}

.map-tooltip {
  @apply absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border 
         border-gray-200 dark:border-gray-600 p-4 max-w-xs pointer-events-none;
}

.tooltip-header {
  @apply flex justify-between items-start mb-2;
}

.tooltip-header strong {
  @apply text-gray-900 dark:text-white;
}

.jurisdiction-type {
  @apply text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 
         text-gray-600 dark:text-gray-300 ml-2;
}

.tooltip-content {
  @apply space-y-1;
}

.requirement-info,
.complexity-info,
.time-info {
  @apply flex justify-between text-sm;
}

.label {
  @apply text-gray-500 dark:text-gray-400;
}

.value {
  @apply text-gray-900 dark:text-white font-medium;
}

.complexity-low {
  @apply text-green-600 dark:text-green-400;
}

.complexity-medium {
  @apply text-yellow-600 dark:text-yellow-400;
}

.complexity-high {
  @apply text-red-600 dark:text-red-400;
}

.tooltip-footer {
  @apply mt-2 pt-2 border-t border-gray-200 dark:border-gray-600;
}

.tooltip-footer small {
  @apply text-gray-500 dark:text-gray-400;
}

.selection-summary {
  @apply mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border 
         border-blue-200 dark:border-blue-800;
}

.selection-summary h4 {
  @apply text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3;
}

.selected-list {
  @apply space-y-2 mb-4;
}

.selected-item {
  @apply flex items-center justify-between p-2 bg-white dark:bg-gray-800 
         rounded border border-blue-200 dark:border-blue-700;
}

.region-name {
  @apply font-medium text-gray-900 dark:text-white;
}

.jurisdiction-type {
  @apply text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 
         text-gray-600 dark:text-gray-300;
}

.remove-btn {
  @apply w-6 h-6 flex items-center justify-center rounded-full 
         bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400
         hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm;
}

.summary-stats {
  @apply flex gap-6 pt-3 border-t border-blue-200 dark:border-blue-700;
}

.stat {
  @apply flex flex-col;
}

.stat .label {
  @apply text-sm text-blue-600 dark:text-blue-300;
}

.stat .value {
  @apply text-lg font-semibold text-blue-900 dark:text-blue-100;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .jurisdiction-map {
    @apply p-4;
  }
  
  .map-header {
    @apply flex-col items-stretch;
  }
  
  .map-controls {
    @apply flex-col;
  }
  
  .legend {
    @apply grid grid-cols-2 gap-2;
  }
}
</style>