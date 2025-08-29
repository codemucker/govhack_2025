<template>
  <div class="app">
    <header class="app-header">
      <nav class="nav">
        <div class="nav-brand">
          <router-link to="/" class="brand-link">
            <span class="brand-text">LegalEase</span>
          </router-link>
        </div>
        <div class="nav-links">
          <router-link to="/" class="nav-link">Home</router-link>
          <router-link to="/search" class="nav-link">Search</router-link>
          <router-link to="/about" class="nav-link">About</router-link>
        </div>
      </nav>
    </header>

    <main class="app-main">
      <router-view />
    </main>

    <footer class="app-footer">
      <p>&copy; 2025 LegalEase - GovHack 2025 Project by Team Democracy Sausage</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
// App component logic
</script>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 1rem;
}

.nav {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 4rem;
}

.brand-link {
  text-decoration: none;
  color: #1f2937;
}

.brand-text {
  font-size: 1.5rem;
  font-weight: bold;
  color: #059669;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-link {
  text-decoration: none;
  color: #6b7280;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #059669;
}

.app-main {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 2rem 1rem;
}

.app-footer {
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  padding: 1rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .nav {
    flex-direction: column;
    height: auto;
    padding: 1rem 0;
  }
  
  .nav-links {
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .app-main {
    padding: 1rem;
  }
}
</style>