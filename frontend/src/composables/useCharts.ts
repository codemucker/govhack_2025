import { ref, computed } from 'vue'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement,
  BarElement,
  ArcElement,
  TimeScale
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement,
  BarElement,
  ArcElement,
  TimeScale
)

export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  borderWidth?: number
}

export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface ChartOptions {
  responsive?: boolean
  maintainAspectRatio?: boolean
  plugins?: {
    title?: {
      display: boolean
      text: string
    }
    legend?: {
      display: boolean
      position?: 'top' | 'bottom' | 'left' | 'right'
    }
    tooltip?: {
      enabled: boolean
      callbacks?: any
    }
  }
  scales?: any
  animation?: {
    duration?: number
    easing?: string
  }
}

/**
 * Composable for chart utilities and theming
 * Provides consistent styling and configuration across all charts
 */
export function useCharts() {
  const isDarkMode = ref(false)

  /**
   * Default color palette for charts
   */
  const colorPalette = {
    primary: '#059669',
    secondary: '#0ea5e9',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#6366f1',
    light: '#f3f4f6',
    dark: '#1f2937'
  }

  /**
   * Get color palette based on current theme
   */
  const getThemeColors = computed(() => {
    const baseColors = [
      colorPalette.primary,
      colorPalette.secondary,
      colorPalette.success,
      colorPalette.warning,
      colorPalette.info,
      colorPalette.danger
    ]

    if (isDarkMode.value) {
      return {
        colors: baseColors,
        background: baseColors.map(color => color + '20'), // 20% opacity
        text: '#f9fafb',
        gridLines: '#374151',
        tooltipBackground: '#1f2937'
      }
    }

    return {
      colors: baseColors,
      background: baseColors.map(color => color + '10'), // 10% opacity  
      text: '#1f2937',
      gridLines: '#e5e7eb',
      tooltipBackground: '#ffffff'
    }
  })

  /**
   * Generate confidence level colors
   */
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return colorPalette.success
    if (confidence >= 0.6) return colorPalette.warning
    return colorPalette.danger
  }

  /**
   * Generate default chart options
   */
  const getDefaultOptions = (title?: string): ChartOptions => {
    const theme = getThemeColors.value

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: !!title,
          text: title || ''
        },
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          enabled: true,
          callbacks: {
            labelTextColor: () => theme.text
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: theme.gridLines
          },
          ticks: {
            color: theme.text
          }
        },
        y: {
          grid: {
            color: theme.gridLines
          },
          ticks: {
            color: theme.text
          }
        }
      },
      animation: {
        duration: 750,
        easing: 'easeInOutQuart'
      }
    }
  }

  /**
   * Create timeline chart data
   */
  const createTimelineData = (
    requirements: Array<{
      title: string
      estimatedTime: string
      status: string
    }>
  ): ChartData => {
    const theme = getThemeColors.value
    
    const labels = requirements.map(req => req.title)
    const timeData = requirements.map(req => {
      // Convert estimated time strings to numbers (in weeks)
      const timeStr = req.estimatedTime.toLowerCase()
      if (timeStr.includes('week')) {
        const weeks = parseInt(timeStr.match(/\d+/)?.[0] || '1')
        return weeks
      }
      if (timeStr.includes('month')) {
        const months = parseInt(timeStr.match(/\d+/)?.[0] || '1')
        return months * 4 // Convert months to weeks
      }
      return 2 // Default 2 weeks
    })

    const backgroundColors = requirements.map(req => {
      switch (req.status.toLowerCase()) {
        case 'completed':
          return colorPalette.success
        case 'in progress':
          return colorPalette.warning
        default:
          return colorPalette.primary
      }
    })

    return {
      labels,
      datasets: [{
        label: 'Estimated Time (Weeks)',
        data: timeData,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors,
        borderWidth: 1
      }]
    }
  }

  /**
   * Create confidence meter data
   */
  const createConfidenceData = (
    items: Array<{
      label: string
      confidence: number
    }>
  ): ChartData => {
    const labels = items.map(item => item.label)
    const confidenceData = items.map(item => item.confidence * 100)
    const colors = items.map(item => getConfidenceColor(item.confidence))

    return {
      labels,
      datasets: [{
        label: 'Confidence %',
        data: confidenceData,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 2
      }]
    }
  }

  /**
   * Create jurisdiction distribution data
   */
  const createJurisdictionData = (
    requirements: Array<{
      jurisdiction: string
      count?: number
    }>
  ): ChartData => {
    const jurisdictionCounts = requirements.reduce((acc, req) => {
      acc[req.jurisdiction] = (acc[req.jurisdiction] || 0) + (req.count || 1)
      return acc
    }, {} as Record<string, number>)

    const labels = Object.keys(jurisdictionCounts)
    const data = Object.values(jurisdictionCounts)
    const theme = getThemeColors.value

    return {
      labels,
      datasets: [{
        label: 'Requirements by Jurisdiction',
        data,
        backgroundColor: theme.background,
        borderColor: theme.colors,
        borderWidth: 2
      }]
    }
  }

  /**
   * Create cost breakdown data
   */
  const createCostData = (
    costBreakdown: Array<{
      category: string
      amount: number
    }>
  ): ChartData => {
    const labels = costBreakdown.map(item => item.category)
    const data = costBreakdown.map(item => item.amount)
    const theme = getThemeColors.value

    return {
      labels,
      datasets: [{
        label: 'Cost Breakdown ($)',
        data,
        backgroundColor: theme.background,
        borderColor: theme.colors,
        borderWidth: 2
      }]
    }
  }

  /**
   * Export chart as image
   */
  const exportChart = (chartRef: any, filename: string): void => {
    if (!chartRef?.chart) return

    const canvas = chartRef.chart.canvas as HTMLCanvasElement
    const url = canvas.toDataURL('image/png')
    
    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = url
    link.click()
  }

  /**
   * Update theme for existing charts
   */
  const updateTheme = (darkMode: boolean): void => {
    isDarkMode.value = darkMode
  }

  /**
   * Format number as currency
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount)
  }

  /**
   * Format confidence percentage
   */
  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`
  }

  /**
   * Get chart height based on data size and type
   */
  const getChartHeight = (dataLength: number, chartType: string): number => {
    const baseHeight = 300
    
    if (chartType === 'bar' && dataLength > 5) {
      return Math.max(baseHeight, dataLength * 40)
    }
    
    return baseHeight
  }

  return {
    // Theme utilities
    getThemeColors,
    getConfidenceColor,
    updateTheme,
    
    // Chart configuration
    getDefaultOptions,
    getChartHeight,
    
    // Data creators
    createTimelineData,
    createConfidenceData,
    createJurisdictionData,
    createCostData,
    
    // Utilities
    exportChart,
    formatCurrency,
    formatConfidence,
    
    // Color palette
    colorPalette
  }
}