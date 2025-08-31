<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>📊 Real-Time Dashboard</h1>
      <div class="refresh-indicator" :class="{ active: isRefreshing }">
        <span class="refresh-dot"></span>
        <span class="refresh-text">{{ isRefreshing ? 'Updating...' : `Last update: ${lastUpdateTime}` }}</span>
      </div>
    </div>
    
    <div v-if="loading" class="loading">
      Loading dashboard data...
    </div>

    <div v-else>
      <!-- Live Statistics Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ liveStats?.totals?.documents || 0 }}</div>
          <div class="stat-label">Total Documents</div>
          <div class="stat-change" v-if="liveStats?.recent?.documents_last_10min">
            +{{ liveStats.recent.documents_last_10min }} last 10min
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ liveStats?.totals?.queries || 0 }}</div>
          <div class="stat-label">Total Queries</div>
          <div class="stat-change" v-if="liveStats?.recent?.queries_last_hour">
            +{{ liveStats.recent.queries_last_hour }} last hour
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ liveStats?.performance?.avg_execution_time || 0 }}ms</div>
          <div class="stat-label">Avg Response Time</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ liveStats?.performance?.avg_tokens_used || 0 }}</div>
          <div class="stat-label">Avg Tokens Used</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ (liveStats?.performance?.avg_confidence || 0).toFixed(3) }}</div>
          <div class="stat-label">Avg Confidence</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ Math.round((liveStats?.performance?.relevant_queries || 0) / Math.max(1, (liveStats?.performance?.relevant_queries || 0) + (liveStats?.performance?.irrelevant_queries || 0)) * 100) }}%</div>
          <div class="stat-label">Relevance Rate</div>
        </div>
      </div>

      <!-- Real-Time Activity Feed -->
      <div class="card">
        <h2>🚀 Live Activity Feed</h2>
        <div class="activity-controls">
          <label class="auto-scroll-toggle">
            <input type="checkbox" v-model="autoScroll" />
            Auto-scroll to new activity
          </label>
          <button @click="clearActivity" class="btn btn-secondary btn-small">Clear</button>
        </div>
        <div class="activity-feed" ref="activityFeed">
          <div v-if="recentActivity.length === 0" class="no-activity">
            No recent activity
          </div>
          <div v-for="activity in recentActivity" :key="activity.id + activity.timestamp" class="activity-item" :class="activity.type">
            <div class="activity-header">
              <span class="activity-type">{{ activity.type === 'query' ? '🤔' : '📄' }}</span>
              <span class="activity-title">{{ truncateText(activity.title, 60) }}</span>
              <span class="activity-time">{{ formatTimeAgo(activity.timestamp) }}</span>
            </div>
            <div class="activity-details" v-if="activity.type === 'query'">
              <span class="activity-location">{{ activity.location || 'Unknown' }}</span>
              <span class="activity-metric">{{ activity.execution_time }}ms</span>
              <span class="activity-metric">{{ activity.tokens_used }} tokens</span>
              <span class="activity-confidence" :class="getConfidenceClass(activity.confidence)">
                {{ (activity.confidence * 100).toFixed(0) }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Database Health -->
      <div class="card">
        <h2>🔍 Database Health</h2>
        <div v-if="health">
          <div class="health-status" :class="health.health_status">
            Status: {{ health.health_status.toUpperCase() }}
          </div>
          <div class="health-details">
            <p><strong>Last Updated:</strong> {{ formatDate(health.last_updated) }}</p>
            <p v-if="health.database_stats">
              <strong>Cache Files:</strong> {{ health.cache_stats?.files || 0 }} files 
              ({{ health.cache_stats?.totalSize || 0 }}KB)
            </p>
          </div>
        </div>
      </div>

      <!-- Top Jurisdictions -->
      <div class="card">
        <h2>🌏 Top Jurisdictions</h2>
        <div v-if="jurisdictions.length > 0">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Jurisdiction</th>
                  <th>Documents</th>
                  <th>Document Types</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="jurisdiction in jurisdictions.slice(0, 10)" :key="jurisdiction.jurisdiction">
                  <td>{{ jurisdiction.jurisdiction.toUpperCase() }}</td>
                  <td>{{ jurisdiction.document_count }}</td>
                  <td>{{ jurisdiction.document_types }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="loading">No jurisdiction data available</div>
      </div>

      <!-- Top Tags -->
      <div class="card">
        <h2>🏷️ Top Tags</h2>
        <div v-if="topTags.length > 0">
          <div class="tags-container">
            <span 
              v-for="tag in topTags.slice(0, 20)" 
              :key="tag.tag" 
              class="tag tag-large"
              :style="{ fontSize: getTagSize(tag.count) + 'rem' }"
            >
              {{ tag.tag }} ({{ tag.count }})
            </span>
          </div>
        </div>
        <div v-else class="loading">No tag data available</div>
      </div>

      <!-- Recent Queries -->
      <div class="card">
        <h2>❓ Recent Queries</h2>
        <div v-if="recentQueries.length > 0">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Jurisdiction</th>
                  <th>Sources</th>
                  <th>Confidence</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="query in recentQueries.slice(0, 10)" :key="query.id">
                  <td class="question-cell">{{ truncate(query.question, 80) }}</td>
                  <td>{{ query.jurisdiction.toUpperCase() }}</td>
                  <td>{{ query.sources_count }}</td>
                  <td>{{ query.confidence?.toFixed(2) || 'N/A' }}</td>
                  <td>{{ formatDate(query.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="loading">No query data available</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import type { DocumentStats, JurisdictionInfo, TagsResponse, Query, DatabaseHealth } from '../types'

// Real-time state
const loading = ref(true)
const isRefreshing = ref(false)
const lastUpdateTime = ref('--:--')
const liveStats = ref<any>(null)
const recentActivity = ref<any[]>([])
const autoScroll = ref(true)
const activityFeed = ref<HTMLElement | null>(null)

// Original dashboard state (keep for compatibility)
const stats = ref<DocumentStats | null>(null)
const health = ref<DatabaseHealth | null>(null)
const jurisdictions = ref<JurisdictionInfo[]>([])
const topTags = ref<{ tag: string; count: number }[]>([])
const recentQueries = ref<Query[]>([])
const totalQueries = ref(0)

// Polling state
let pollInterval: ReturnType<typeof setInterval> | null = null
let lastActivityTimestamp = ''

// Real-time data loading functions
const loadLiveStats = async () => {
  try {
    isRefreshing.value = true
    const response = await fetch('/api/admin/stats/live')
    if (response.ok) {
      liveStats.value = await response.json()
      lastUpdateTime.value = new Date().toLocaleTimeString()
    }
  } catch (error) {
    console.error('Error loading live stats:', error)
  } finally {
    isRefreshing.value = false
  }
}

const loadRecentActivity = async () => {
  try {
    const params = new URLSearchParams()
    if (lastActivityTimestamp) {
      params.append('since', lastActivityTimestamp)
    }
    
    const response = await fetch(`/api/admin/activity/recent?limit=50&${params}`)
    if (response.ok) {
      const newActivity = await response.json()
      
      if (newActivity.length > 0) {
        // Add new activities to the beginning
        recentActivity.value = [...newActivity, ...recentActivity.value].slice(0, 100) // Keep last 100 items
        
        // Update timestamp for next poll
        lastActivityTimestamp = newActivity[0].timestamp
        
        // Auto-scroll to new activity if enabled
        if (autoScroll.value && activityFeed.value) {
          await nextTick()
          activityFeed.value.scrollTop = 0
        }
      }
    }
  } catch (error) {
    console.error('Error loading recent activity:', error)
  }
}

const loadDashboardData = async () => {
  try {
    loading.value = true
    
    // Load initial data
    await Promise.all([
      loadLiveStats(),
      loadRecentActivity()
    ])
    
    // Also load static dashboard data in parallel for the remaining sections
    const [healthRes, jurisdictionsRes, tagsRes] = await Promise.all([
      fetch('/api/admin/health'),
      fetch('/api/admin/jurisdictions'),
      fetch('/api/admin/tags?limit=50')
    ])

    if (healthRes.ok) {
      health.value = await healthRes.json()
    }

    if (jurisdictionsRes.ok) {
      jurisdictions.value = await jurisdictionsRes.json()
    }

    if (tagsRes.ok) {
      const tagsData: TagsResponse = await tagsRes.json()
      topTags.value = tagsData.tags
    }

  } catch (error) {
    console.error('Error loading dashboard data:', error)
  } finally {
    loading.value = false
  }
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

const truncate = (text: string, length: number): string => {
  return text.length > length ? text.substring(0, length) + '...' : text
}

const truncateText = (text: string, maxLength: number): string => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const formatTimeAgo = (timestamp: string): string => {
  const now = new Date()
  const time = new Date(timestamp)
  const diffMs = now.getTime() - time.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  
  if (diffSecs < 60) return `${diffSecs}s ago`
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return time.toLocaleDateString()
}

const getConfidenceClass = (confidence: number): string => {
  if (confidence >= 0.8) return 'confidence-high'
  if (confidence >= 0.6) return 'confidence-medium'
  return 'confidence-low'
}

const getTagSize = (count: number): number => {
  const maxCount = Math.max(...topTags.value.map(t => t.count))
  const minSize = 0.8
  const maxSize = 1.2
  return minSize + (count / maxCount) * (maxSize - minSize)
}

const clearActivity = () => {
  recentActivity.value = []
  lastActivityTimestamp = ''
}

const startPolling = () => {
  // Poll every 3 seconds for stats and activity
  pollInterval = setInterval(async () => {
    await Promise.all([
      loadLiveStats(),
      loadRecentActivity()
    ])
  }, 3000)
}

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

onMounted(async () => {
  await loadDashboardData()
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.dashboard h1 {
  margin-bottom: 2rem;
  color: #2c5aa0;
}

/* Real-time dashboard styles */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.refresh-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.refresh-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  transition: background-color 0.3s;
}

.refresh-indicator.active .refresh-dot {
  background: #4CAF50;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}

.stat-change {
  font-size: 0.75rem;
  color: #4CAF50;
  margin-top: 0.25rem;
}

/* Activity feed styles */
.activity-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.auto-scroll-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.btn-small {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

.activity-feed {
  max-height: 400px;
  overflow-y: auto;
  padding: 0.5rem;
  background: #fafafa;
  border-radius: 4px;
}

.no-activity {
  text-align: center;
  color: #999;
  padding: 2rem;
  font-style: italic;
}

.activity-item {
  background: white;
  border-radius: 4px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  animation: slideInTop 0.3s ease-out;
}

@keyframes slideInTop {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.activity-item.query {
  border-left: 4px solid #2c5aa0;
}

.activity-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.activity-type {
  font-size: 1.2rem;
}

.activity-title {
  flex: 1;
  font-weight: 500;
  color: #2c3e50;
}

.activity-time {
  font-size: 0.8rem;
  color: #666;
}

.activity-details {
  display: flex;
  gap: 1rem;
  align-items: center;
  font-size: 0.85rem;
}

.activity-location {
  color: #e67e22;
  font-weight: 500;
}

.activity-metric {
  color: #666;
  background: #f0f0f0;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
}

.activity-confidence {
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-weight: bold;
}

.confidence-high {
  background: #d4edda;
  color: #155724;
}

.confidence-medium {
  background: #fff3cd;
  color: #856404;
}

.confidence-low {
  background: #f8d7da;
  color: #721c24;
}

.health-status {
  font-size: 1.1rem;
  font-weight: bold;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  display: inline-block;
}

.health-status.healthy {
  background: #d4edda;
  color: #155724;
}

.health-status.error {
  background: #f8d7da;
  color: #721c24;
}

.health-details p {
  margin: 0.5rem 0;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-large {
  font-weight: 500;
  padding: 0.5rem 0.75rem;
}

.question-cell {
  max-width: 300px;
  word-wrap: break-word;
}
</style>