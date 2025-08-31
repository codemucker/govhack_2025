<template>
  <div class="document-details">
    <div class="header-actions">
      <router-link to="/documents" class="btn btn-secondary">← Back to Documents</router-link>
      <div class="view-options" v-if="document">
        <a :href="document.url" target="_blank" class="btn btn-primary">
          🔗 View Original Source
        </a>
        <button @click="toggleContentView" class="btn btn-secondary">
          {{ showCachedContent ? '👁️ Hide Cached Content' : '📄 Show Cached Content' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      Loading document details...
    </div>

    <div v-else-if="document">
      <h1>📄 Document Details</h1>

      <div class="card">
        <h2>Document Information</h2>
        <div class="details-grid">
          <div class="detail-item">
            <strong>URL:</strong>
            <a :href="document.url" target="_blank" class="url-link">
              {{ document.url }}
            </a>
          </div>
          <div class="detail-item">
            <strong>Jurisdiction:</strong> {{ document.jurisdiction.toUpperCase() }}
          </div>
          <div class="detail-item">
            <strong>Document Type:</strong> {{ document.document_type }}
          </div>
          <div class="detail-item">
            <strong>Synthetic:</strong>
            <span :class="document.synthetic ? 'synthetic-yes' : 'synthetic-no'">
              {{ document.synthetic ? 'Yes' : 'No' }}
            </span>
          </div>
          <div class="detail-item">
            <strong>Content Length:</strong> {{ formatBytes(document.content_length) }}
          </div>
          <div class="detail-item">
            <strong>Content Hash:</strong>
            <code>{{ document.content_hash }}</code>
          </div>
          <div class="detail-item">
            <strong>Created:</strong> {{ formatDate(document.created_at) }}
          </div>
          <div class="detail-item">
            <strong>Updated:</strong> {{ formatDate(document.updated_at) }}
          </div>
        </div>

        <div v-if="document.tags && document.tags.length > 0" class="tags-section">
          <strong>Tags:</strong>
          <div class="tags-container">
            <span v-for="tag in document.tags" :key="tag" class="tag">
              {{ tag }}
            </span>
          </div>
        </div>
      </div>

      <div class="card" v-if="document.content_preview">
        <h2>Content Preview</h2>
        <div class="content-preview">
          <pre>{{ document.content_preview }}</pre>
          <div v-if="document.content_length > 1000" class="preview-note">
            Showing first 1000 characters. Full content has {{ document.content_length.toLocaleString() }} characters.
          </div>
        </div>
      </div>

      <div class="card" v-if="showCachedContent && document.cached_content">
        <h2>Cached Content</h2>
        <div class="cached-content">
          <pre>{{ document.cached_content }}</pre>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { DocumentDetails } from '../types'

interface Props {
  url: string
}

const props = defineProps<Props>()

const loading = ref(true)
const document = ref<DocumentDetails | null>(null)
const error = ref<string | null>(null)
const showCachedContent = ref(false)

const loadDocument = async () => {
  try {
    loading.value = true
    error.value = null
    
    const response = await fetch(`/api/admin/documents/${encodeURIComponent(props.url)}`)
    
    if (!response.ok) {
      throw new Error(`Document not found: ${response.statusText}`)
    }
    
    document.value = await response.json()
    
  } catch (err) {
    console.error('Error loading document:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load document'
  } finally {
    loading.value = false
  }
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

const toggleContentView = () => {
  showCachedContent.value = !showCachedContent.value
}

onMounted(() => {
  loadDocument()
})
</script>

<style scoped>
.document-details h1 {
  margin-bottom: 2rem;
  color: #2c5aa0;
}

.header-actions {
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.view-options {
  display: flex;
  gap: 0.5rem;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item strong {
  color: #2c5aa0;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.url-link {
  color: #2c5aa0;
  text-decoration: none;
  word-break: break-all;
}

.url-link:hover {
  text-decoration: underline;
}

.synthetic-yes {
  color: #e67e22;
  font-weight: bold;
}

.synthetic-no {
  color: #27ae60;
  font-weight: bold;
}

.tags-section {
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
}

.tags-container {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.content-preview {
  background: #f8fafc;
  border-radius: 4px;
  padding: 1rem;
  border: 1px solid #e2e8f0;
}

.content-preview pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.85rem;
  line-height: 1.4;
  margin: 0;
  color: #2c3e50;
}

.preview-note {
  margin-top: 1rem;
  padding: 0.5rem;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #856404;
}

.cached-content {
  background: #f0f9ff;
  border-radius: 4px;
  padding: 1rem;
  border: 1px solid #bae6fd;
  max-height: 600px;
  overflow-y: auto;
}

.cached-content pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.85rem;
  line-height: 1.4;
  margin: 0;
  color: #1e40af;
}

@media (max-width: 768px) {
  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>