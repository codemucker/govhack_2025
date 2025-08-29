<template>
  <div class="timeline-chart">
    <div class="chart-header">
      <h3>{{ title }}</h3>
      <div class="chart-controls">
        <div class="view-controls">
          <button 
            v-for="view in viewModes"
            :key="view.value"
            @click="currentView = view.value"
            :class="['view-btn', { active: currentView === view.value }]"
          >
            {{ view.label }}
          </button>
        </div>
        <button @click="exportChart" class="export-btn">
          Export
        </button>
      </div>
    </div>
    
    <div class="chart-wrapper" ref="chartWrapper">
      <!-- Gantt Chart View -->
      <div v-if="currentView === 'gantt'" class="gantt-chart">
        <div class="gantt-header">
          <div class="gantt-labels">
            <div class="label-header">Requirements</div>
          </div>
          <div class="gantt-timeline">
            <div 
              v-for="week in timelineWeeks"
              :key="week"
              class="week-header"
            >
              Week {{ week }}
            </div>
          </div>
        </div>
        
        <div class="gantt-body">
          <div 
            v-for="(requirement, index) in processedRequirements"
            :key="requirement.id"
            class="gantt-row"
            :class="{ 'even': index % 2 === 0 }"
          >
            <div class="gantt-label">
              <div class="requirement-info">
                <span class="requirement-title">{{ requirement.title }}</span>
                <div class="requirement-meta">
                  <span class="jurisdiction">{{ requirement.jurisdiction }}</span>
                  <span class="status" :class="`status-${requirement.status.toLowerCase().replace(' ', '-')}`">
                    {{ requirement.status }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="gantt-timeline">
              <div 
                v-for="week in timelineWeeks"
                :key="week"
                class="week-cell"
                :class="{ 'active': isWeekActive(requirement, week) }"
              >
                <div 
                  v-if="isWeekActive(requirement, week)"
                  class="task-bar"
                  :class="[
                    `status-${requirement.status.toLowerCase().replace(' ', '-')}`,
                    { 'start': week === requirement.startWeek },
                    { 'end': week === requirement.endWeek }
                  ]"
                  :style="getTaskBarStyle(requirement, week)"
                >
                  <div class="task-progress" :style="{ width: requirement.progress + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Bar Chart View -->
      <div v-else-if="currentView === 'bar'" class="bar-chart-container">
        <Bar 
          :data="barChartData" 
          :options="barChartOptions"
          :height="chartHeight"
        />
      </div>
      
      <!-- Timeline View -->
      <div v-else class="timeline-view">
        <div class="timeline-container">
          <div 
            v-for="(phase, phaseIndex) in timelinePhases"
            :key="phase.id"
            class="timeline-phase"
          >
            <div class="phase-header">
              <h4>{{ phase.name }}</h4>
              <span class="phase-duration">{{ phase.duration }}</span>
            </div>
            
            <div class="phase-timeline">
              <div class="timeline-line" :class="{ 'completed': phase.completed }">
                <div class="phase-progress" :style="{ width: phase.progress + '%' }"></div>
              </div>
              
              <div 
                v-for="(milestone, index) in phase.milestones"
                :key="milestone.id"
                class="milestone"
                :class="[
                  `status-${milestone.status.toLowerCase()}`,
                  { 'current': milestone.current }
                ]"
                :style="{ left: milestone.position + '%' }"
                @click="selectMilestone(milestone)"
                @mouseover="showMilestoneTooltip($event, milestone)"
                @mouseleave="hideMilestoneTooltip"
              >
                <div class="milestone-icon">
                  <CheckIcon v-if="milestone.status === 'completed'" class="w-3 h-3" />
                  <ClockIcon v-else-if="milestone.status === 'in-progress'" class="w-3 h-3" />
                  <CircleIcon v-else class="w-3 h-3" />
                </div>
                <div class="milestone-label">{{ milestone.title }}</div>
              </div>
            </div>
            
            <div class="phase-requirements">
              <div 
                v-for="req in phase.requirements"
                :key="req.id"
                class="requirement-item"
                :class="{ 'completed': req.completed }"
              >
                <div class="requirement-checkbox">
                  <input 
                    type="checkbox" 
                    :checked="req.completed"
                    @change="toggleRequirement(req.id)"
                  />
                </div>
                <div class="requirement-details">
                  <span class="requirement-name">{{ req.title }}</span>
                  <span class="requirement-time">{{ req.estimatedTime }}</span>
                </div>
              </div>
            </div>
            
            <!-- Phase connector -->
            <div 
              v-if="phaseIndex < timelinePhases.length - 1"
              class="phase-connector"
              :class="{ 'active': phase.completed }"
            ></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Milestone details modal -->
    <div v-if="selectedMilestone" class="milestone-modal-overlay" @click="selectedMilestone = null">
      <div class="milestone-modal" @click.stop>
        <div class="modal-header">
          <h4>{{ selectedMilestone.title }}</h4>
          <button @click="selectedMilestone = null" class="close-btn">×</button>
        </div>
        <div class="modal-content">
          <div class="milestone-details">
            <div class="detail-row">
              <span class="label">Status:</span>
              <span class="value" :class="`status-${selectedMilestone.status.toLowerCase()}`">
                {{ selectedMilestone.status }}
              </span>
            </div>
            <div class="detail-row">
              <span class="label">Due Date:</span>
              <span class="value">{{ selectedMilestone.dueDate }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Estimated Time:</span>
              <span class="value">{{ selectedMilestone.estimatedTime }}</span>
            </div>
            <div v-if="selectedMilestone.dependencies" class="detail-row">
              <span class="label">Dependencies:</span>
              <div class="dependencies">
                <span 
                  v-for="dep in selectedMilestone.dependencies"
                  :key="dep"
                  class="dependency-tag"
                >
                  {{ dep }}
                </span>
              </div>
            </div>
          </div>
          <div v-if="selectedMilestone.description" class="milestone-description">
            <p>{{ selectedMilestone.description }}</p>
          </div>
          <div v-if="selectedMilestone.requirements" class="milestone-requirements">
            <h5>Required Documents/Steps:</h5>
            <ul>
              <li v-for="req in selectedMilestone.requirements" :key="req">{{ req }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Tooltip -->
    <div 
      v-if="tooltip.visible"
      ref="tooltip"
      class="timeline-tooltip"
      :style="{
        left: tooltip.x + 'px',
        top: tooltip.y + 'px'
      }"
    >
      <div class="tooltip-content">
        <strong>{{ tooltip.milestone?.title }}</strong>
        <div class="tooltip-meta">
          <span class="status">{{ tooltip.milestone?.status }}</span>
          <span class="time">{{ tooltip.milestone?.estimatedTime }}</span>
        </div>
        <small>{{ tooltip.milestone?.description }}</small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Bar } from 'vue-chartjs'
import { useCharts } from '../composables/useCharts'
import { CheckIcon, ClockIcon, CircleIcon } from '@heroicons/vue/24/solid'

interface Requirement {
  id: string
  title: string
  jurisdiction: string
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked'
  estimatedTime: string
  startWeek?: number
  endWeek?: number
  progress: number
  dependencies?: string[]
  completed: boolean
}

interface Milestone {
  id: string
  title: string
  status: 'completed' | 'in-progress' | 'pending'
  position: number
  dueDate: string
  estimatedTime: string
  current: boolean
  description?: string
  requirements?: string[]
  dependencies?: string[]
}

interface TimelinePhase {
  id: string
  name: string
  duration: string
  completed: boolean
  progress: number
  milestones: Milestone[]
  requirements: Requirement[]
}

interface Props {
  title?: string
  requirements?: Requirement[]
  showGantt?: boolean
  timelineWeeks?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Requirements Timeline',
  requirements: () => [],
  showGantt: true,
  timelineWeeks: 12
})

const emit = defineEmits<{
  'milestone-selected': [milestone: Milestone]
  'requirement-toggled': [requirementId: string, completed: boolean]
  'export-requested': [data: any]
}>()

const { getDefaultOptions, createTimelineData, getChartHeight, colorPalette } = useCharts()

const chartWrapper = ref<HTMLDivElement>()
const tooltip = ref<HTMLDivElement>()
const currentView = ref<'timeline' | 'gantt' | 'bar'>('timeline')
const selectedMilestone = ref<Milestone | null>(null)

const viewModes = [
  { label: 'Timeline', value: 'timeline' },
  { label: 'Gantt', value: 'gantt' },
  { label: 'Chart', value: 'bar' }
]

const tooltipInfo = ref({
  visible: false,
  x: 0,
  y: 0,
  milestone: null as Milestone | null
})

// Mock timeline data - would come from props/API in real app
const timelinePhases = ref<TimelinePhase[]>([
  {
    id: 'planning',
    name: 'Planning & Research',
    duration: '1-2 weeks',
    completed: true,
    progress: 100,
    milestones: [
      {
        id: 'research-complete',
        title: 'Research Complete',
        status: 'completed',
        position: 25,
        dueDate: '2025-02-15',
        estimatedTime: '1 week',
        current: false,
        description: 'Complete research on all applicable regulations',
        requirements: ['Identify relevant councils', 'Map jurisdiction requirements', 'Document fee structures']
      },
      {
        id: 'permits-identified',
        title: 'Permits Identified',
        status: 'completed',
        position: 75,
        dueDate: '2025-02-22',
        estimatedTime: '1 week',
        current: false,
        description: 'Identify all required permits and licenses'
      }
    ],
    requirements: [
      {
        id: 'req-1',
        title: 'Identify business classification',
        jurisdiction: 'Federal',
        status: 'completed',
        estimatedTime: '2 days',
        progress: 100,
        completed: true
      }
    ]
  },
  {
    id: 'applications',
    name: 'Application Submission',
    duration: '2-4 weeks',
    completed: false,
    progress: 60,
    milestones: [
      {
        id: 'council-app',
        title: 'Council Application',
        status: 'in-progress',
        position: 30,
        dueDate: '2025-03-08',
        estimatedTime: '2 weeks',
        current: true,
        description: 'Submit development application to local council',
        dependencies: ['research-complete']
      },
      {
        id: 'state-permits',
        title: 'State Permits',
        status: 'pending',
        position: 70,
        dueDate: '2025-03-15',
        estimatedTime: '1 week',
        current: false,
        description: 'Apply for state-level permits and approvals'
      }
    ],
    requirements: [
      {
        id: 'req-2',
        title: 'Development application',
        jurisdiction: 'Local',
        status: 'in-progress',
        estimatedTime: '2 weeks',
        progress: 60,
        completed: false
      }
    ]
  },
  {
    id: 'approval',
    name: 'Approval & Compliance',
    duration: '3-6 weeks',
    completed: false,
    progress: 20,
    milestones: [
      {
        id: 'inspections',
        title: 'Inspections Scheduled',
        status: 'pending',
        position: 40,
        dueDate: '2025-04-01',
        estimatedTime: '2 weeks',
        current: false,
        description: 'Schedule and complete required inspections'
      },
      {
        id: 'final-approval',
        title: 'Final Approval',
        status: 'pending',
        position: 85,
        dueDate: '2025-04-15',
        estimatedTime: '1 week',
        current: false,
        description: 'Receive final approval to commence operations'
      }
    ],
    requirements: [
      {
        id: 'req-3',
        title: 'Building inspection',
        jurisdiction: 'Local',
        status: 'not-started',
        estimatedTime: '1 week',
        progress: 0,
        completed: false
      }
    ]
  }
])

// Generate mock requirements with timeline data
const processedRequirements = computed(() => {
  const baseRequirements = props.requirements.length > 0 ? props.requirements : [
    {
      id: 'dev-app',
      title: 'Development Application',
      jurisdiction: 'City of Sydney',
      status: 'in-progress',
      estimatedTime: '2-3 weeks',
      progress: 65,
      startWeek: 1,
      endWeek: 3,
      completed: false
    },
    {
      id: 'food-license',
      title: 'Food Business License',
      jurisdiction: 'NSW Health',
      status: 'not-started',
      estimatedTime: '1-2 weeks',
      progress: 0,
      startWeek: 3,
      endWeek: 4,
      completed: false
    },
    {
      id: 'abn-registration',
      title: 'ABN Registration',
      jurisdiction: 'ATO',
      status: 'completed',
      estimatedTime: '1 day',
      progress: 100,
      startWeek: 1,
      endWeek: 1,
      completed: true
    },
    {
      id: 'liquor-license',
      title: 'Liquor License',
      jurisdiction: 'Liquor & Gaming NSW',
      status: 'blocked',
      estimatedTime: '4-6 weeks',
      progress: 10,
      startWeek: 5,
      endWeek: 10,
      completed: false
    }
  ]
  
  return baseRequirements.map(req => ({
    ...req,
    startWeek: req.startWeek || 1,
    endWeek: req.endWeek || 2
  }))
})

const timelineWeeks = computed(() => {
  return Array.from({ length: props.timelineWeeks }, (_, i) => i + 1)
})

const barChartData = computed(() => {
  return createTimelineData(processedRequirements.value)
})

const barChartOptions = computed(() => {
  return {
    ...getDefaultOptions(props.title),
    indexAxis: 'y' as const,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Estimated Time (Weeks)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Requirements'
        }
      }
    }
  }
})

const chartHeight = computed(() => {
  return getChartHeight(processedRequirements.value.length, 'bar')
})

const tooltip = computed(() => tooltipInfo.value)

const isWeekActive = (requirement: Requirement, week: number): boolean => {
  return week >= requirement.startWeek! && week <= requirement.endWeek!
}

const getTaskBarStyle = (requirement: Requirement, week: number) => {
  const isFirst = week === requirement.startWeek
  const isLast = week === requirement.endWeek
  
  return {
    borderRadius: isFirst && isLast ? '4px' : 
                  isFirst ? '4px 0 0 4px' : 
                  isLast ? '0 4px 4px 0' : '0'
  }
}

const selectMilestone = (milestone: Milestone) => {
  selectedMilestone.value = milestone
  emit('milestone-selected', milestone)
}

const toggleRequirement = (requirementId: string) => {
  // Find requirement and toggle completion
  const requirement = processedRequirements.value.find(r => r.id === requirementId)
  if (requirement) {
    requirement.completed = !requirement.completed
    requirement.progress = requirement.completed ? 100 : 0
    emit('requirement-toggled', requirementId, requirement.completed)
  }
  
  // Also check timeline phases
  timelinePhases.value.forEach(phase => {
    const req = phase.requirements.find(r => r.id === requirementId)
    if (req) {
      req.completed = !req.completed
      req.progress = req.completed ? 100 : 0
    }
  })
}

const showMilestoneTooltip = (event: MouseEvent, milestone: Milestone) => {
  const rect = chartWrapper.value?.getBoundingClientRect()
  if (!rect) return
  
  tooltipInfo.value = {
    visible: true,
    x: event.clientX - rect.left + 10,
    y: event.clientY - rect.top - 10,
    milestone
  }
}

const hideMilestoneTooltip = () => {
  tooltipInfo.value = {
    visible: false,
    x: 0,
    y: 0,
    milestone: null
  }
}

const exportChart = () => {
  const exportData = {
    view: currentView.value,
    requirements: processedRequirements.value,
    phases: timelinePhases.value,
    chartData: currentView.value === 'bar' ? barChartData.value : null
  }
  
  emit('export-requested', exportData)
}

onMounted(() => {
  // Any initialization logic
})
</script>

<style scoped>
.timeline-chart {
  @apply bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg;
}

.chart-header {
  @apply flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4;
}

.chart-header h3 {
  @apply text-xl font-semibold text-gray-900 dark:text-white;
}

.chart-controls {
  @apply flex flex-col sm:flex-row gap-4 items-start sm:items-center;
}

.view-controls {
  @apply flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden;
}

.view-btn {
  @apply px-4 py-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300
         border-r border-gray-300 dark:border-gray-600 last:border-r-0
         hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm;
}

.view-btn.active {
  @apply bg-blue-500 text-white;
}

.export-btn {
  @apply px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm;
}

.chart-wrapper {
  @apply relative;
}

/* Gantt Chart Styles */
.gantt-chart {
  @apply border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden;
}

.gantt-header {
  @apply flex bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700;
}

.gantt-labels {
  @apply w-80 border-r border-gray-200 dark:border-gray-700;
}

.label-header {
  @apply p-4 font-semibold text-gray-900 dark:text-white;
}

.gantt-timeline {
  @apply flex-1 flex;
}

.week-header {
  @apply flex-1 p-2 text-center text-sm font-medium text-gray-600 dark:text-gray-300
         border-r border-gray-200 dark:border-gray-700 last:border-r-0 min-w-0;
}

.gantt-body {
  @apply max-h-96 overflow-y-auto;
}

.gantt-row {
  @apply flex border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800;
}

.gantt-row.even {
  @apply bg-gray-25 dark:bg-gray-900;
}

.gantt-label {
  @apply w-80 p-4 border-r border-gray-200 dark:border-gray-700;
}

.requirement-info {
  @apply space-y-1;
}

.requirement-title {
  @apply font-medium text-gray-900 dark:text-white text-sm;
}

.requirement-meta {
  @apply flex gap-2;
}

.jurisdiction {
  @apply text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded;
}

.status {
  @apply text-xs px-2 py-1 rounded;
}

.status-completed {
  @apply bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300;
}

.status-in-progress {
  @apply bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300;
}

.status-not-started {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300;
}

.status-blocked {
  @apply bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300;
}

.week-cell {
  @apply flex-1 p-1 border-r border-gray-200 dark:border-gray-700 last:border-r-0 min-h-12;
}

.task-bar {
  @apply h-full rounded relative overflow-hidden;
}

.task-bar.status-completed {
  @apply bg-green-500;
}

.task-bar.status-in-progress {
  @apply bg-yellow-500;
}

.task-bar.status-not-started {
  @apply bg-gray-300 dark:bg-gray-600;
}

.task-bar.status-blocked {
  @apply bg-red-500;
}

.task-progress {
  @apply h-full bg-white bg-opacity-20 transition-all duration-300;
}

/* Timeline View Styles */
.timeline-view {
  @apply space-y-8;
}

.timeline-container {
  @apply relative;
}

.timeline-phase {
  @apply relative;
}

.phase-header {
  @apply flex justify-between items-center mb-4;
}

.phase-header h4 {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.phase-duration {
  @apply text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full;
}

.phase-timeline {
  @apply relative mb-4;
}

.timeline-line {
  @apply h-2 bg-gray-200 dark:bg-gray-700 rounded-full relative overflow-hidden;
}

.timeline-line.completed {
  @apply bg-green-200 dark:bg-green-800;
}

.phase-progress {
  @apply h-full bg-blue-500 transition-all duration-500 rounded-full;
}

.milestone {
  @apply absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 cursor-pointer;
}

.milestone-icon {
  @apply w-6 h-6 rounded-full border-2 flex items-center justify-center text-white transition-all;
}

.milestone.status-completed .milestone-icon {
  @apply bg-green-500 border-green-500;
}

.milestone.status-in-progress .milestone-icon {
  @apply bg-yellow-500 border-yellow-500;
}

.milestone.status-pending .milestone-icon {
  @apply bg-gray-300 dark:bg-gray-600 border-gray-300 dark:border-gray-600;
}

.milestone.current .milestone-icon {
  @apply scale-125 shadow-lg;
}

.milestone-label {
  @apply absolute top-8 left-1/2 transform -translate-x-1/2 text-xs text-center
         bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-md whitespace-nowrap
         opacity-0 transition-opacity;
}

.milestone:hover .milestone-label {
  @apply opacity-100;
}

.phase-requirements {
  @apply space-y-2 pl-4;
}

.requirement-item {
  @apply flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg;
}

.requirement-item.completed {
  @apply bg-green-50 dark:bg-green-900/20;
}

.requirement-checkbox input {
  @apply w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500;
}

.requirement-details {
  @apply flex-1 flex justify-between items-center;
}

.requirement-name {
  @apply text-gray-900 dark:text-white;
}

.requirement-item.completed .requirement-name {
  @apply line-through text-gray-500 dark:text-gray-400;
}

.requirement-time {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.phase-connector {
  @apply absolute left-4 top-full w-0.5 h-8 bg-gray-300 dark:bg-gray-600 -mt-2;
}

.phase-connector.active {
  @apply bg-blue-500;
}

/* Bar Chart Container */
.bar-chart-container {
  @apply min-h-96;
}

/* Modal Styles */
.milestone-modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.milestone-modal {
  @apply bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 max-h-96 overflow-y-auto;
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

.milestone-details {
  @apply space-y-3 mb-4;
}

.detail-row {
  @apply flex justify-between;
}

.label {
  @apply text-gray-500 dark:text-gray-400;
}

.value {
  @apply text-gray-900 dark:text-white font-medium;
}

.dependencies {
  @apply flex flex-wrap gap-1;
}

.dependency-tag {
  @apply text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded;
}

.milestone-description {
  @apply mb-4;
}

.milestone-requirements h5 {
  @apply font-medium text-gray-900 dark:text-white mb-2;
}

.milestone-requirements ul {
  @apply list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1;
}

/* Tooltip */
.timeline-tooltip {
  @apply absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border 
         border-gray-200 dark:border-gray-600 p-3 max-w-xs pointer-events-none;
}

.tooltip-content strong {
  @apply text-gray-900 dark:text-white;
}

.tooltip-meta {
  @apply flex gap-2 mt-1;
}

.tooltip-meta .status {
  @apply text-xs px-2 py-1 rounded;
}

.tooltip-meta .time {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.tooltip-content small {
  @apply text-gray-600 dark:text-gray-400 mt-2 block;
}

/* Responsive */
@media (max-width: 768px) {
  .timeline-chart {
    @apply p-4;
  }
  
  .chart-header {
    @apply flex-col items-stretch;
  }
  
  .chart-controls {
    @apply flex-col;
  }
  
  .gantt-labels {
    @apply w-60;
  }
  
  .week-header {
    @apply text-xs p-1;
  }
}
</style>