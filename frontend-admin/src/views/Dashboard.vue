<template>
  <div class="dashboard">
    <h1>📊 Dashboard</h1>
    
    <div v-if="loading" class="loading">
      Loading dashboard data...
    </div>

    <div v-else>
      <!-- Statistics Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats?.total_documents || 0 }}</div>
          <div class="stat-label">Total Documents</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats?.unique_jurisdictions || 0 }}</div>
          <div class="stat-label">Jurisdictions</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats?.unique_document_types || 0 }}</div>
          <div class="stat-label">Document Types</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats?.synthetic_documents || 0 }}</div>
          <div class="stat-label">Synthetic Docs</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ formatBytes(stats?.total_content_size || 0) }}</div>
          <div class="stat-label">Total Content Size</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ totalQueries }}</div>
          <div class="stat-label">Total Queries</div>
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
import { ref, onMounted } from 'vue'
import type { DocumentStats, JurisdictionInfo, TagsResponse, Query, DatabaseHealth } from '../types'

const loading = ref(true)
const stats = ref<DocumentStats | null>(null)
const health = ref<DatabaseHealth | null>(null)
const jurisdictions = ref<JurisdictionInfo[]>([])
const topTags = ref<{ tag: string; count: number }[]>([])
const recentQueries = ref<Query[]>([])
const totalQueries = ref(0)

const loadDashboardData = async () => {
  try {
    loading.value = true
    
    // Load all dashboard data in parallel
    const [statsRes, healthRes, jurisdictionsRes, tagsRes, queriesRes] = await Promise.all([
      fetch('/api/admin/stats'),
      fetch('/api/admin/health'),
      fetch('/api/admin/jurisdictions'),
      fetch('/api/admin/tags?limit=50'),
      fetch('/api/admin/queries?limit=20')
    ])

    stats.value = await statsRes.json()
    health.value = await healthRes.json()
    jurisdictions.value = await jurisdictionsRes.json()
    
    const tagsData: TagsResponse = await tagsRes.json()
    topTags.value = tagsData.tags

    recentQueries.value = await queriesRes.json()
    totalQueries.value = recentQueries.value.length

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

const getTagSize = (count: number): number => {
  const maxCount = Math.max(...topTags.value.map(t => t.count))
  const minSize = 0.8
  const maxSize = 1.2
  return minSize + (count / maxCount) * (maxSize - minSize)
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard h1 {
  margin-bottom: 2rem;
  color: #2c5aa0;
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