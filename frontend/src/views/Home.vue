<template>
  <div class="home">
    <div class="hero">
      <h1 class="hero-title">Welcome to LegalEase</h1>
      <p class="hero-subtitle">
        Navigate Australian regulatory requirements with AI-powered simplicity
      </p>
      <div class="hero-actions">
        <router-link to="/search" class="btn btn-primary">
          Get Started
        </router-link>
        <router-link to="/about" class="btn btn-secondary">
          Learn More
        </router-link>
      </div>
    </div>

    <div class="features">
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon">🏛️</div>
          <h3>Multi-Jurisdictional</h3>
          <p>Navigate local, state, and federal requirements in one place</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🤖</div>
          <h3>AI-Powered</h3>
          <p>Plain English queries processed by advanced AI</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">⚖️</div>
          <h3>Conflict Resolution</h3>
          <p>Identify and resolve regulatory overlaps and conflicts</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📋</div>
          <h3>Actionable Steps</h3>
          <p>Get step-by-step guidance with forms and contacts</p>
        </div>
      </div>
    </div>

    <div class="api-status">
      <h3>API Status</h3>
      <div v-if="loading" class="status-loading">Checking API...</div>
      <div v-else-if="apiStatus" class="status-success">
        <span class="status-indicator"></span>
        API is online - {{ apiStatus.message }}
      </div>
      <div v-else class="status-error">
        <span class="status-indicator"></span>
        API is not responding
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const loading = ref(true)
const apiStatus = ref<{ message: string; timestamp: string } | null>(null)

const checkApiStatus = async () => {
  try {
    const response = await fetch('/api/hello')
    if (response.ok) {
      const data = await response.json()
      apiStatus.value = data as { message: string; timestamp: string }
    }
  } catch (error) {
    console.error('API check failed:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  checkApiStatus()
})
</script>

<style scoped>
.home {
  max-width: 1000px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  padding: 3rem 0;
}

.hero-title {
  font-size: 3rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 1rem;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: #6b7280;
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary {
  background: #059669;
  color: white;
}

.btn-primary:hover {
  background: #047857;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.features {
  padding: 3rem 0;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.feature-card {
  text-align: center;
  padding: 2rem;
  border-radius: 0.75rem;
  background: #f9fafb;
  transition: transform 0.2s;
}

.feature-card:hover {
  transform: translateY(-2px);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.feature-card p {
  color: #6b7280;
}

.api-status {
  background: #f9fafb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-top: 2rem;
}

.api-status h3 {
  margin-bottom: 1rem;
  color: #1f2937;
}

.status-loading {
  color: #6b7280;
}

.status-success {
  color: #059669;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-error {
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1.125rem;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>