<template>
  <div class="jurisdictions">
    <h1>🏛️ Jurisdictions</h1>
    
    <div v-if="loading" class="loading">
      Loading jurisdictions...
    </div>

    <div v-else>
      <!-- Jurisdictions Overview -->
      <div class="card">
        <h2>Jurisdiction Overview ({{ jurisdictions.length }} total)</h2>
        <div class="jurisdictions-grid">
          <div 
            v-for="jurisdiction in jurisdictions" 
            :key="jurisdiction.jurisdiction"
            class="jurisdiction-card"
            @click="selectJurisdiction(jurisdiction.jurisdiction)"
            :class="{ active: selectedJurisdiction === jurisdiction.jurisdiction }"
          >
            <div class="jurisdiction-header">
              <h3>{{ jurisdiction.jurisdiction.toUpperCase() }}</h3>
              <span class="document-count">{{ jurisdiction.count }} documents</span>
            </div>
            <div class="jurisdiction-info">
              <div class="info-item">
                <strong>Level:</strong> {{ getJurisdictionLevel(jurisdiction.jurisdiction) }}
              </div>
              <div class="info-item">
                <strong>Documents:</strong> {{ jurisdiction.count }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Jurisdiction Documents -->
      <div v-if="selectedJurisdiction" class="card">
        <div class="section-header">
          <h2>📄 {{ selectedJurisdiction.toUpperCase() }} Documents</h2>
          <div class="document-actions">
            <select v-model="documentTypeFilter" @change="loadJurisdictionDocuments" class="filter-select">
              <option value="">All Document Types</option>
              <option v-for="type in availableDocumentTypes" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
            <select v-model="syntheticFilter" @change="loadJurisdictionDocuments" class="filter-select">
              <option value="">All Documents</option>
              <option value="false">Real Documents</option>
              <option value="true">Synthetic Documents</option>
            </select>
          </div>
        </div>

        <div v-if="loadingDocuments" class="loading">
          Loading documents for {{ selectedJurisdiction.toUpperCase() }}...
        </div>

        <div v-else-if="jurisdictionDocuments.length === 0" class="no-results">
          No documents found for {{ selectedJurisdiction.toUpperCase() }} with current filters.
        </div>

        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>URL</th>
                <th>Type</th>
                <th>Tags</th>
                <th>Size</th>
                <th>Synthetic</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="document in jurisdictionDocuments" :key="document.url">
                <td class="url-cell">
                  <a :href="document.url" target="_blank" class="url-link">
                    {{ truncateUrl(document.url) }}
                  </a>
                </td>
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

        <!-- Document Pagination -->
        <div v-if="documentPagination && documentPagination.pages > 1" class="pagination-controls">
          <button 
            @click="prevDocumentPage" 
            :disabled="currentDocumentPage <= 1"
            class="btn btn-secondary"
          >
            Previous
          </button>
          <span class="page-info">
            Page {{ currentDocumentPage }} of {{ documentPagination.pages }} 
            ({{ documentPagination.total }} total documents)
          </span>
          <button 
            @click="nextDocumentPage" 
            :disabled="currentDocumentPage >= documentPagination.pages"
            class="btn btn-secondary"
          >
            Next
          </button>
        </div>
      </div>

      <!-- Jurisdiction Statistics -->
      <div v-if="selectedJurisdiction" class="card">
        <h2>📊 {{ selectedJurisdiction.toUpperCase() }} Statistics</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ jurisdictionStats?.total_documents || 0 }}</div>
            <div class="stat-label">Total Documents</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ jurisdictionStats?.real_documents || 0 }}</div>
            <div class="stat-label">Real Documents</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ jurisdictionStats?.synthetic_documents || 0 }}</div>
            <div class="stat-label">Synthetic Documents</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ jurisdictionStats?.document_types || 0 }}</div>
            <div class="stat-label">Document Types</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface Jurisdiction {
  jurisdiction: string
  count: number
}

interface Document {
  url: string
  tags: string[]
  jurisdiction: string
  document_type: string
  synthetic: boolean
  content_length: number
  created_at: string
}

interface DocumentsResponse {
  documents: Document[]
  pagination: {
    total: number
    limit: number
    offset: number
    pages: number
  }
}

interface JurisdictionStats {
  total_documents: number
  real_documents: number
  synthetic_documents: number
  document_types: number
}

const loading = ref(true)
const loadingDocuments = ref(false)
const jurisdictions = ref<Jurisdiction[]>([])
const selectedJurisdiction = ref<string>('')
const jurisdictionDocuments = ref<Document[]>([])
const documentPagination = ref<DocumentsResponse['pagination'] | null>(null)
const currentDocumentPage = ref(1)
const pageSize = ref(20)

// Filters
const documentTypeFilter = ref('')
const syntheticFilter = ref('')
const availableDocumentTypes = ref<string[]>([])

// Delete state
const deletingUrls = ref<Set<string>>(new Set())

// Stats
const jurisdictionStats = ref<JurisdictionStats | null>(null)

const loadJurisdictions = async () => {
  try {
    loading.value = true
    const response = await fetch('/api/admin/jurisdictions')
    jurisdictions.value = await response.json()
  } catch (error) {
    console.error('Error loading jurisdictions:', error)
  } finally {
    loading.value = false
  }
}

const selectJurisdiction = async (jurisdiction: string) => {
  selectedJurisdiction.value = jurisdiction
  currentDocumentPage.value = 1
  documentTypeFilter.value = ''
  syntheticFilter.value = ''
  
  await Promise.all([
    loadJurisdictionDocuments(),
    loadJurisdictionStats(),
    loadDocumentTypes()
  ])
}

const loadJurisdictionDocuments = async () => {
  if (!selectedJurisdiction.value) return
  
  try {
    loadingDocuments.value = true
    
    const params = new URLSearchParams({
      jurisdiction: selectedJurisdiction.value,
      limit: pageSize.value.toString(),
      offset: ((currentDocumentPage.value - 1) * pageSize.value).toString(),
    })
    
    if (documentTypeFilter.value) params.append('document_type', documentTypeFilter.value)
    if (syntheticFilter.value) params.append('synthetic', syntheticFilter.value)
    
    const response = await fetch(`/api/admin/documents?${params}`)
    const data: DocumentsResponse = await response.json()
    
    jurisdictionDocuments.value = data.documents
    documentPagination.value = data.pagination
    
  } catch (error) {
    console.error('Error loading jurisdiction documents:', error)
  } finally {
    loadingDocuments.value = false
  }
}

const loadJurisdictionStats = async () => {
  if (!selectedJurisdiction.value) return
  
  try {
    const [totalRes, realRes, syntheticRes, typesRes] = await Promise.all([
      fetch(`/api/admin/documents?jurisdiction=${selectedJurisdiction.value}&limit=1`),
      fetch(`/api/admin/documents?jurisdiction=${selectedJurisdiction.value}&synthetic=false&limit=1`),
      fetch(`/api/admin/documents?jurisdiction=${selectedJurisdiction.value}&synthetic=true&limit=1`),
      fetch('/api/admin/document-types')
    ])
    
    const [totalData, realData, syntheticData, typesData] = await Promise.all([
      totalRes.json(),
      realRes.json(), 
      syntheticRes.json(),
      typesRes.json()
    ])
    
    jurisdictionStats.value = {
      total_documents: totalData.pagination?.total || 0,
      real_documents: realData.pagination?.total || 0,
      synthetic_documents: syntheticData.pagination?.total || 0,
      document_types: typesData.filter((type: any) => 
        jurisdictionDocuments.value.some(doc => doc.document_type === type.document_type)
      ).length
    }
    
  } catch (error) {
    console.error('Error loading jurisdiction stats:', error)
  }
}

const loadDocumentTypes = async () => {
  try {
    const response = await fetch('/api/admin/document-types')
    const types = await response.json()
    availableDocumentTypes.value = types.map((t: any) => t.document_type)
  } catch (error) {
    console.error('Error loading document types:', error)
  }
}

const getJurisdictionLevel = (jurisdiction: string): string => {
  const jur = jurisdiction.toLowerCase()
  
  // Federal/Commonwealth
  if (jur === 'cth' || jur === 'commonwealth' || jur === 'australia') return 'Federal'
  
  // State/Territory
  const stateTerritories = ['nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'act', 'nt']
  if (stateTerritories.includes(jur)) return 'State/Territory'
  
  // Regional/Local Councils (common patterns)
  const councilKeywords = ['council', 'city', 'shire', 'regional', 'district', 'borough', 'municipality']
  const isCouncil = councilKeywords.some(keyword => jur.includes(keyword))
  if (isCouncil) return 'Regional/Council'
  
  // Check for specific regional jurisdictions
  const regionalPatterns = [
    'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'darwin', 'hobart', 'canberra',
    'gold coast', 'sunshine coast', 'newcastle', 'wollongong', 'geelong', 'townsville',
    'cairns', 'toowoomba', 'ballarat', 'bendigo', 'mandurah', 'mackay', 'rockhampton'
  ]
  
  if (regionalPatterns.some(pattern => jur.includes(pattern))) return 'Regional/Council'
  
  // Default to Local/Council for unrecognized jurisdictions
  return 'Local/Council'
}

const prevDocumentPage = () => {
  if (currentDocumentPage.value > 1) {
    currentDocumentPage.value--
    loadJurisdictionDocuments()
  }
}

const nextDocumentPage = () => {
  if (documentPagination.value && currentDocumentPage.value < documentPagination.value.pages) {
    currentDocumentPage.value++
    loadJurisdictionDocuments()
  }
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
      jurisdictionDocuments.value = jurisdictionDocuments.value.filter(doc => doc.url !== url)
      // Update pagination total
      if (documentPagination.value) {
        documentPagination.value.total--
      }
      // Refresh stats
      await loadJurisdictionStats()
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

onMounted(() => {
  loadJurisdictions()
})
</script>

<style scoped>
.jurisdictions h1 {
  margin-bottom: 2rem;
  color: #2c5aa0;
}

.jurisdictions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.jurisdiction-card {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.jurisdiction-card:hover {
  border-color: #2c5aa0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(44, 90, 160, 0.1);
}

.jurisdiction-card.active {
  border-color: #2c5aa0;
  background: #f0f7ff;
  box-shadow: 0 4px 12px rgba(44, 90, 160, 0.15);
}

.jurisdiction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.jurisdiction-header h3 {
  color: #2c5aa0;
  margin: 0;
  font-size: 1.25rem;
}

.document-count {
  background: #2c5aa0;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.jurisdiction-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item {
  font-size: 0.9rem;
  color: #666;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
}

.document-actions {
  display: flex;
  gap: 0.5rem;
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

.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.page-info {
  color: #666;
  font-size: 0.9rem;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}
</style>