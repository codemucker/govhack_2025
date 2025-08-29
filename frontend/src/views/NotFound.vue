<template>
  <div class="not-found">
    <div class="not-found-content">
      <div class="error-icon">🔍</div>
      <h1>404 - Page Not Found</h1>
      <p class="error-message">
        Sorry, the page you're looking for doesn't exist or may have been moved.
      </p>
      <div class="actions">
        <router-link to="/" class="btn btn-primary">
          Go Home
        </router-link>
        <router-link to="/search" class="btn btn-secondary">
          Search Requirements
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 404 page component
</script>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}

.not-found-content {
  max-width: 500px;
  padding: 2rem;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.not-found h1 {
  color: #1f2937;
  margin-bottom: 1rem;
  font-size: 2rem;
}

.error-message {
  color: #6b7280;
  margin-bottom: 2rem;
  font-size: 1.125rem;
}

.actions {
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
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}
</style>