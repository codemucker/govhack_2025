<template>
  <div class="legal-taxonomy">
    <h1>⚖️ Legal Taxonomy</h1>
    
    <div v-if="loading" class="loading">
      Loading legal taxonomy...
    </div>

    <div v-else-if="taxonomy">
      <!-- Legal Areas -->
      <div class="card">
        <h2>Legal Areas</h2>
        <div class="areas-grid">
          <div v-for="(area, areaId) in legalAreasWithCounts" :key="areaId" class="area-card">
            <h3>{{ formatAreaName(String(areaId)) }}</h3>
            <p class="area-description">{{ area.description }}</p>
            
            <div class="area-stats">
              <div class="stat-item">
                <span class="stat-label">Keywords:</span>
                <span class="stat-value">{{ area.keywords?.length || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Patterns:</span>
                <span class="stat-value">{{ area.patterns?.length || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Authorities:</span>
                <span class="stat-value">{{ area.authorities?.length || 0 }}</span>
              </div>
              <div class="stat-item clickable" @click="toggleDocuments(String(areaId))">
                <span class="stat-label">Related Docs:</span>
                <span class="stat-value">{{ area.related_document_count || 0 }} {{ expandedAreas.has(String(areaId)) ? '▼' : '▶' }}</span>
              </div>
            </div>

            <!-- Expandable Documents Section -->
            <div v-if="expandedAreas.has(String(areaId))" class="documents-section">
              <div v-if="loadingDocuments.has(String(areaId))" class="loading-small">
                Loading documents...
              </div>
              <div v-else-if="areaDocuments.get(String(areaId))?.length">
                <h4>📄 Related Documents ({{ areaDocuments.get(String(areaId))?.length || 0 }})</h4>
                <div class="documents-list">
                  <div v-for="doc in areaDocuments.get(String(areaId))" :key="doc.url" class="document-item">
                    <div class="document-header">
                      <router-link :to="`/documents/${encodeURIComponent(doc.url)}`" class="document-title">
                        🔗 {{ doc.document_type }}
                      </router-link>
                      <span class="document-jurisdiction">{{ doc.jurisdiction.toUpperCase() }}</span>
                    </div>
                    <div class="document-url">{{ doc.url }}</div>
                    <div class="document-tags">
                      <span v-for="tag in doc.tags.slice(0, 5)" :key="tag" class="document-tag">
                        {{ tag }}
                      </span>
                      <span v-if="doc.tags.length > 5" class="more-tags">+{{ doc.tags.length - 5 }} more</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="no-documents">
                No documents found for this legal area
              </div>
            </div>

            <div v-if="area.keywords && area.keywords.length > 0" class="keywords-section">
              <strong>Keywords:</strong>
              <div class="keywords-container">
                <span v-for="keyword in area.keywords.slice(0, 8)" :key="keyword" class="keyword-tag">
                  {{ keyword }}
                </span>
                <span v-if="area.keywords.length > 8" class="more-keywords">
                  +{{ area.keywords.length - 8 }} more
                </span>
              </div>
            </div>

            <div v-if="area.authorities && area.authorities.length > 0" class="authorities-section">
              <strong>Authority Types:</strong>
              <div class="authorities-container">
                <span v-for="auth in area.authorities" :key="auth" class="authority-tag">
                  {{ formatAuthorityName(auth) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Authority Types -->
      <div class="card">
        <h2>Authority Types</h2>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Contact Type</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(type, typeId) in taxonomy.authority_types" :key="typeId">
                <td><code>{{ typeId }}</code></td>
                <td class="name-cell">{{ type.name }}</td>
                <td>{{ type.description }}</td>
                <td><span class="contact-type">{{ type.contact_type }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Jurisdiction Legislation -->
      <div class="card">
        <h2>Jurisdiction Legislation</h2>
        <div class="jurisdiction-grid">
          <div v-for="(legislation, jurisdiction) in taxonomy.jurisdiction_legislation" :key="jurisdiction" class="jurisdiction-card">
            <h3>{{ String(jurisdiction).toUpperCase() }}</h3>
            <div class="legislation-list">
              <div v-for="(law, areaId) in legislation" :key="areaId" class="legislation-item">
                <h4>{{ formatAreaName(String(areaId)) }}</h4>
                <a :href="law.url" target="_blank" class="legislation-link">
                  {{ law.title }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Jurisdiction Authorities -->
      <div class="card">
        <h2>Jurisdiction Authority Contacts</h2>
        <div class="jurisdiction-grid">
          <div v-for="(authData, jurisdiction) in taxonomy.jurisdiction_authorities" :key="jurisdiction" class="jurisdiction-card">
            <h3>{{ String(jurisdiction).toUpperCase() }}</h3>
            <div class="authority-contacts">
              <div v-for="(contact, authType) in authData" :key="authType" class="contact-item">
                <h4>{{ formatAuthorityName(String(authType)) }}</h4>
                <div class="contact-details">
                  <div><strong>{{ contact.title }}</strong></div>
                  <div v-if="contact.phone">📞 {{ contact.phone }}</div>
                  <div v-if="contact.email">📧 {{ contact.email }}</div>
                  <div v-if="contact.url">
                    <a :href="contact.url" target="_blank">🔗 Website</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Document } from '../types'

const loading = ref(true)
const taxonomy = ref<any>(null)
const expandedAreas = ref(new Set<string>())
const loadingDocuments = ref(new Set<string>())
const areaDocuments = ref(new Map<string, Document[]>())

const legalAreasWithCounts = computed(() => {
  return taxonomy.value?.legal_areas_with_counts || taxonomy.value?.legal_areas || {}
})

const loadTaxonomy = async () => {
  try {
    loading.value = true
    const response = await fetch('/api/admin/legal-taxonomy')
    taxonomy.value = await response.json()
  } catch (error) {
    console.error('Error loading legal taxonomy:', error)
  } finally {
    loading.value = false
  }
}

const formatAreaName = (areaId: string): string => {
  return areaId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatAuthorityName = (authId: string): string => {
  return authId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const toggleDocuments = async (areaId: string) => {
  if (expandedAreas.value.has(areaId)) {
    expandedAreas.value.delete(areaId)
  } else {
    expandedAreas.value.add(areaId)
    await loadDocumentsForArea(areaId)
  }
}

const loadDocumentsForArea = async (areaId: string) => {
  if (areaDocuments.value.has(areaId) && areaDocuments.value.get(areaId)!.length > 0) {
    return // Already loaded
  }

  loadingDocuments.value.add(areaId)
  
  try {
    // Get keywords for the area to search documents
    const area = legalAreasWithCounts.value[areaId]
    if (!area?.keywords) {
      areaDocuments.value.set(areaId, [])
      return
    }

    // Create search terms from area keywords
    const searchTerms = area.keywords.slice(0, 5).join(' ') // Use first 5 keywords
    
    const response = await fetch(`/api/admin/documents?search=${encodeURIComponent(searchTerms)}&limit=10`)
    const result = await response.json()
    
    // Filter documents that actually contain area keywords in tags
    const relevantDocs = result.documents.filter((doc: Document) => 
      area.keywords.some((keyword: string) => 
        doc.tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))
      )
    )
    
    areaDocuments.value.set(areaId, relevantDocs)
  } catch (error) {
    console.error('Error loading documents for area:', error)
    areaDocuments.value.set(areaId, [])
  } finally {
    loadingDocuments.value.delete(areaId)
  }
}

onMounted(() => {
  loadTaxonomy()
})
</script>

<style scoped>
.legal-taxonomy h1 {
  margin-bottom: 2rem;
  color: #2c5aa0;
}

.areas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.area-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
}

.area-card h3 {
  color: #2c5aa0;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.area-description {
  color: #666;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  line-height: 1.4;
}

.area-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 0.8rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-weight: bold;
  color: #2c5aa0;
}

.clickable {
  cursor: pointer;
  transition: background-color 0.2s;
}

.clickable:hover {
  background: #f0f4f8;
  border-radius: 4px;
}

.documents-section {
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.documents-section h4 {
  color: #2c5aa0;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.documents-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.document-item {
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.document-title {
  color: #2c5aa0;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
}

.document-title:hover {
  text-decoration: underline;
}

.document-jurisdiction {
  background: #2c5aa0;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: bold;
}

.document-url {
  font-size: 0.8rem;
  color: #666;
  word-break: break-all;
  margin-bottom: 0.5rem;
}

.document-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.document-tag {
  background: #e2e8f0;
  color: #2c5aa0;
  padding: 0.1rem 0.3rem;
  border-radius: 8px;
  font-size: 0.7rem;
}

.more-tags {
  color: #666;
  font-size: 0.7rem;
  font-style: italic;
}

.loading-small {
  text-align: center;
  padding: 1rem;
  color: #666;
  font-size: 0.9rem;
}

.no-documents {
  text-align: center;
  padding: 1rem;
  color: #999;
  font-size: 0.9rem;
  font-style: italic;
}

.keywords-section,
.authorities-section {
  margin-bottom: 1rem;
}

.keywords-section strong,
.authorities-section strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c5aa0;
  font-size: 0.9rem;
}

.keywords-container,
.authorities-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.keyword-tag {
  background: #e2e8f0;
  color: #2c5aa0;
  padding: 0.2rem 0.4rem;
  border-radius: 8px;
  font-size: 0.75rem;
}

.authority-tag {
  background: #2c5aa0;
  color: white;
  padding: 0.2rem 0.4rem;
  border-radius: 8px;
  font-size: 0.75rem;
}

.more-keywords {
  color: #666;
  font-size: 0.75rem;
  font-style: italic;
}

.name-cell {
  font-weight: bold;
  color: #2c5aa0;
}

.contact-type {
  background: #f1c40f;
  color: #8b6914;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
}

.jurisdiction-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.jurisdiction-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
}

.jurisdiction-card h3 {
  color: #2c5aa0;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 1.2rem;
}

.legislation-item {
  margin-bottom: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.legislation-item h4 {
  color: #2c5aa0;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.legislation-link {
  color: #2c5aa0;
  text-decoration: none;
  font-size: 0.9rem;
}

.legislation-link:hover {
  text-decoration: underline;
}

.contact-item {
  margin-bottom: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.contact-item h4 {
  color: #2c5aa0;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.contact-details {
  font-size: 0.85rem;
  line-height: 1.4;
}

.contact-details div {
  margin-bottom: 0.25rem;
}

.contact-details a {
  color: #2c5aa0;
  text-decoration: none;
}

.contact-details a:hover {
  text-decoration: underline;
}
</style>