<template>
  <div class="documents">
    <h1>📄 Documents</h1>
    
    <!-- Search and Filters -->
    <div class="card">
      <input 
        v-model="searchQuery" 
        @input="onSearchChange"
        class="search-box" 
        placeholder="Search documents by URL, tags, or content..."
      />
      
      <div class="filters">
        <select v-model="selectedJurisdiction" @change="loadDocuments" class="filter-select">
          <option value="">All Jurisdictions</option>
          <option v-for="jurisdiction in availableJurisdictions" :key="jurisdiction" :value="jurisdiction">
            {{ jurisdiction.toUpperCase() }}
          </option>
        </select>
        
        <select v-model="selectedDocumentType" @change="loadDocuments" class="filter-select">
          <option value="">All Document Types</option>
          <option v-for="type in availableDocumentTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
        
        <select v-model="selectedSynthetic" @change="loadDocuments" class="filter-select">
          <option value="">All Documents</option>
          <option value="false">Real Documents</option>
          <option value="true">Synthetic Documents</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">
      Loading documents...
    </div>

    <div v-else>
      <!-- Documents Table -->
      <div class="card">
        <div class="table-header">
          <div class="header-left">
            <h2>Documents ({{ pagination?.total || 0 }} total)</h2>
            <div class="purge-controls">
              <button 
                @click="showPurgeModal = true" 
                class="btn btn-danger"
                :disabled="documents.length === 0"
              >
                🗑️ Purge Documents
              </button>
            </div>
          </div>
          <div class="pagination-controls">
            <button 
              @click="prevPage" 
              :disabled="currentPage <= 1"
              class="btn btn-secondary"
            >
              Previous
            </button>
            <span class="page-info">
              Page {{ currentPage }} of {{ pagination?.pages || 1 }}
            </span>
            <button 
              @click="nextPage" 
              :disabled="currentPage >= (pagination?.pages || 1)"
              class="btn btn-secondary"
            >
              Next
            </button>
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>URL</th>
                <th>Jurisdiction</th>
                <th>Type</th>
                <th>Tags</th>
                <th>Size</th>
                <th>Synthetic</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="document in documents" :key="document.url">
                <td class="url-cell">
                  <a :href="document.url" target="_blank" class="url-link">
                    {{ truncateUrl(document.url) }}
                  </a>
                </td>
                <td>{{ document.jurisdiction.toUpperCase() }}</td>
                <td>{{ document.document_type }}</td>
                <td class="tags-cell">
                  <span v-for="tag in document.tags.slice(0, 3)" :key="tag" class="tag">
                    {{ tag }}
                  </span>
                  <span v-if="document.tags.length > 3" class="tag-more">
                    +{{ document.tags.length - 3 }} more
                  </span>
                </td>
                <td>{{ formatBytes(document.content_length) }}</td>
                <td>
                  <span :class="document.synthetic ? 'synthetic-yes' : 'synthetic-no'">
                    {{ document.synthetic ? 'Yes' : 'No' }}
                  </span>
                </td>
                <td>{{ formatDate(document.created_at) }}</td>
                <td class="actions-cell">
                  <router-link 
                    :to="'/documents/' + encodeURIComponent(document.url)" 
                    class="btn btn-secondary btn-sm"
                  >
                    View
                  </router-link>
                  <button 
                    @click="deleteDocument(document.url)" 
                    class="btn btn-danger btn-sm"
                    :disabled="deletingUrls.has(document.url)"
                  >
                    {{ deletingUrls.has(document.url) ? '...' : 'Delete' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="documents.length === 0" class="no-results">
          No documents found matching your criteria.
        </div>
      </div>
    </div>

    <!-- Purge Modal -->
    <div v-if="showPurgeModal" class="modal-overlay" @click="showPurgeModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>🗑️ Purge Documents</h3>
          <button @click="showPurgeModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <p><strong>Warning:</strong> This action cannot be undone!</p>
          <div class="purge-options">
            <button 
              @click="purgeDocuments('synthetic')" 
              class="btn btn-warning"
              :disabled="purgeInProgress"
            >
              {{ purgeInProgress === 'synthetic' ? 'Purging...' : 'Purge Synthetic Documents Only' }}
            </button>
            <button 
              @click="purgeDocuments('all')" 
              class="btn btn-danger"
              :disabled="purgeInProgress"
            >
              {{ purgeInProgress === 'all' ? 'Purging...' : 'Purge ALL Documents' }}
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showPurgeModal = false" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Document, DocumentsResponse } from '../types'

const loading = ref(true)
const documents = ref<Document[]>([])
const pagination = ref<DocumentsResponse['pagination'] | null>(null)
const currentPage = ref(1)
const pageSize = ref(20)

// Filters
const searchQuery = ref('')
const selectedJurisdiction = ref('')
const selectedDocumentType = ref('')
const selectedSynthetic = ref('')
const availableJurisdictions = ref<string[]>([])
const availableDocumentTypes = ref<string[]>([])

// Delete and purge state
const deletingUrls = ref<Set<string>>(new Set())
const showPurgeModal = ref(false)
const purgeInProgress = ref<string | null>(null)

let searchTimeout: ReturnType<typeof setTimeout> | null = null

const loadDocuments = async () => {
  try {
    loading.value = true
    
    const params = new URLSearchParams({
      limit: pageSize.value.toString(),
      offset: ((currentPage.value - 1) * pageSize.value).toString(),
    })
    
    if (selectedJurisdiction.value) params.append('jurisdiction', selectedJurisdiction.value)
    if (selectedDocumentType.value) params.append('document_type', selectedDocumentType.value)
    if (selectedSynthetic.value) params.append('synthetic', selectedSynthetic.value)
    if (searchQuery.value.trim()) params.append('search', searchQuery.value.trim())
    
    const response = await fetch(`/api/admin/documents?${params}`)
    const data: DocumentsResponse = await response.json()
    
    documents.value = data.documents
    pagination.value = data.pagination
    
  } catch (error) {
    console.error('Error loading documents:', error)
  } finally {
    loading.value = false
  }
}

const loadFilterOptions = async () => {
  try {
    const [jurisdictionsRes, documentTypesRes] = await Promise.all([
      fetch('/api/admin/jurisdictions'),
      fetch('/api/admin/document-types')
    ])
    
    const jurisdictionsData = await jurisdictionsRes.json()
    const documentTypesData = await documentTypesRes.json()
    
    availableJurisdictions.value = jurisdictionsData.map((j: any) => j.jurisdiction)
    availableDocumentTypes.value = documentTypesData.map((t: any) => t.document_type)
    
  } catch (error) {
    console.error('Error loading filter options:', error)
  }
}

const onSearchChange = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadDocuments()
  }, 500)
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadDocuments()
  }
}

const nextPage = () => {
  if (currentPage.value < (pagination.value?.pages || 1)) {
    currentPage.value++
    loadDocuments()
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
  return date.toLocaleDateString()
}

const truncateUrl = (url: string): string => {
  const maxLength = 60
  return url.length > maxLength ? url.substring(0, maxLength) + '...' : url
}

const deleteDocument = async (url: string) => {
  if (!confirm(`Are you sure you want to delete this document?\n\n${url}`)) {
    return
  }

  try {
    deletingUrls.value.add(url)
    
    const response = await fetch(`/api/admin/documents/${encodeURIComponent(url)}`, {
      method: 'DELETE'
    })
    
    const result = await response.json()
    
    if (result.success) {
      // Remove document from local list
      documents.value = documents.value.filter(doc => doc.url !== url)
      // Update pagination total
      if (pagination.value) {
        pagination.value.total--
      }
    } else {
      alert(`Failed to delete document: ${result.message}`)
    }
  } catch (error) {
    console.error('Error deleting document:', error)
    alert('Failed to delete document. Please try again.')
  } finally {
    deletingUrls.value.delete(url)
  }
}

const purgeDocuments = async (type: 'synthetic' | 'all') => {
  const confirmMessage = type === 'synthetic' 
    ? 'Are you sure you want to purge ALL synthetic documents? This cannot be undone.'
    : 'Are you sure you want to purge ALL documents (both real and synthetic)? This cannot be undone.'
    
  if (!confirm(confirmMessage)) {
    return
  }

  try {
    purgeInProgress.value = type
    
    const response = await fetch(`/api/admin/documents?type=${type}`, {
      method: 'DELETE'
    })
    
    const result = await response.json()
    
    if (result.success) {
      showPurgeModal.value = false
      alert(`Successfully purged ${result.deleted} documents.`)
      // Reload documents list
      currentPage.value = 1
      await loadDocuments()
    } else {
      alert(`Failed to purge documents: ${result.message}`)
    }
  } catch (error) {
    console.error('Error purging documents:', error)
    alert('Failed to purge documents. Please try again.')
  } finally {
    purgeInProgress.value = null
  }
}

onMounted(() => {
  loadFilterOptions()
  loadDocuments()
})
</script>

<style scoped>
.documents h1 {
  margin-bottom: 2rem;
  color: #2c5aa0;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.header-left h2 {
  margin: 0;
}

.purge-controls {
  display: flex;
  gap: 0.5rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-info {
  color: #666;
  font-size: 0.9rem;
}

.url-cell {
  max-width: 300px;
}

.url-link {
  color: #2c5aa0;
  text-decoration: none;
  word-break: break-all;
}

.url-link:hover {
  text-decoration: underline;
}

.tags-cell {
  max-width: 200px;
}

.tag-more {
  color: #666;
  font-size: 0.8rem;
  font-style: italic;
}

.synthetic-yes {
  color: #e67e22;
  font-weight: bold;
}

.synthetic-no {
  color: #27ae60;
  font-weight: bold;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}

.actions-cell {
  white-space: nowrap;
}

.actions-cell .btn {
  margin-right: 0.5rem;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

.btn-danger {
  background-color: #e74c3c;
  color: white;
  border: none;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c0392b;
}

.btn-warning {
  background-color: #f39c12;
  color: white;
  border: none;
}

.btn-warning:hover:not(:disabled) {
  background-color: #e67e22;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  color: #2c5aa0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  margin-bottom: 1.5rem;
  color: #e74c3c;
  font-weight: bold;
}

.purge-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.purge-options .btn {
  padding: 0.75rem 1rem;
  font-size: 1rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>