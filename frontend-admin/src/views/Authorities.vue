<template>
  <div class="authorities">
    <h1>🏛️ Authorities</h1>
    
    <div v-if="loading" class="loading">
      Loading authorities...
    </div>

    <div v-else>
      <div class="card">
        <h2>Authority Contacts ({{ authorities.length }} total)</h2>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Official Name</th>
                <th>Jurisdiction</th>
                <th>Level</th>
                <th>Contact Info</th>
                <th>Website</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="authority in authorities" :key="authority.id">
                <td class="name-cell">{{ authority.name }}</td>
                <td>{{ authority.official_name || 'N/A' }}</td>
                <td>{{ authority.jurisdiction.toUpperCase() }}</td>
                <td class="level-cell">
                  <span :class="'level-' + authority.jurisdiction_level">
                    {{ authority.jurisdiction_level.toUpperCase() }}
                  </span>
                </td>
                <td class="contact-cell">
                  <div v-if="authority.contact_phone" class="contact-item">
                    📞 {{ authority.contact_phone }}
                  </div>
                  <div v-if="authority.contact_email" class="contact-item">
                    📧 {{ authority.contact_email }}
                  </div>
                  <div v-if="authority.contact_hours" class="contact-item">
                    🕐 {{ authority.contact_hours }}
                  </div>
                </td>
                <td>
                  <a v-if="authority.website" :href="authority.website" target="_blank" class="website-link">
                    Visit
                  </a>
                  <span v-else class="no-website">N/A</span>
                </td>
                <td>{{ formatDate(authority.last_updated) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Authority } from '../types'

const loading = ref(true)
const authorities = ref<Authority[]>([])

const loadAuthorities = async () => {
  try {
    loading.value = true
    const response = await fetch('/api/admin/authorities')
    authorities.value = await response.json()
  } catch (error) {
    console.error('Error loading authorities:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

onMounted(() => {
  loadAuthorities()
})
</script>

<style scoped>
.authorities h1 {
  margin-bottom: 2rem;
  color: #2c5aa0;
}

.name-cell {
  font-weight: bold;
  color: #2c5aa0;
}

.level-cell {
  text-align: center;
}

.level-federal {
  background: #3498db;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
}

.level-state {
  background: #e67e22;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
}

.level-local {
  background: #27ae60;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
}

.contact-cell {
  min-width: 200px;
}

.contact-item {
  font-size: 0.85rem;
  margin: 0.25rem 0;
}

.website-link {
  color: #2c5aa0;
  text-decoration: none;
}

.website-link:hover {
  text-decoration: underline;
}

.no-website {
  color: #666;
  font-style: italic;
}
</style>