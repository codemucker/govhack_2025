<template>
  <header class="app-header">
    <nav class="nav-container">
      <!-- Brand/Logo Section -->
      <div class="nav-brand">
        <router-link to="/" class="brand-link" @click="closeMobileMenu">
          <div class="brand-icon">⚖️</div>
          <span class="brand-text">LegalEase</span>
          <span class="brand-tagline">AU</span>
        </router-link>
      </div>

      <!-- Desktop Navigation -->
      <div class="nav-links desktop-nav">
        <router-link 
          to="/" 
          class="nav-link"
          active-class="nav-link-active"
          exact-active-class="nav-link-active"
        >
          <span class="nav-icon">🏠</span>
          Home
        </router-link>
        <router-link 
          to="/search" 
          class="nav-link"
          active-class="nav-link-active"
        >
          <span class="nav-icon">🔍</span>
          Search
        </router-link>
        <router-link 
          to="/about" 
          class="nav-link"
          active-class="nav-link-active"
        >
          <span class="nav-icon">ℹ️</span>
          About
        </router-link>
      </div>

      <!-- Theme Toggle & Mobile Menu Button -->
      <div class="nav-actions">
        <!-- Dark Mode Toggle -->
        <button
          @click="toggleTheme"
          class="theme-toggle"
          :title="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
          aria-label="Toggle dark mode"
        >
          <span class="theme-icon">{{ isDarkMode ? '☀️' : '🌙' }}</span>
        </button>

        <!-- Mobile Menu Toggle -->
        <button
          @click="toggleMobileMenu"
          class="mobile-menu-toggle"
          :class="{ active: isMobileMenuOpen }"
          aria-label="Toggle navigation menu"
          aria-expanded="isMobileMenuOpen"
        >
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>
      </div>
    </nav>

    <!-- Mobile Navigation Overlay -->
    <transition name="mobile-menu">
      <div 
        v-if="isMobileMenuOpen" 
        class="mobile-nav-overlay"
        @click="closeMobileMenu"
      >
        <nav class="mobile-nav" @click.stop>
          <div class="mobile-nav-header">
            <div class="mobile-brand">
              <div class="brand-icon">⚖️</div>
              <span class="brand-text">LegalEase</span>
            </div>
            <button
              @click="closeMobileMenu"
              class="close-mobile-menu"
              aria-label="Close navigation menu"
            >
              ✕
            </button>
          </div>

          <div class="mobile-nav-links">
            <router-link 
              to="/" 
              class="mobile-nav-link"
              active-class="mobile-nav-link-active"
              exact-active-class="mobile-nav-link-active"
              @click="closeMobileMenu"
            >
              <span class="nav-icon">🏠</span>
              <span class="nav-text">Home</span>
            </router-link>
            <router-link 
              to="/search" 
              class="mobile-nav-link"
              active-class="mobile-nav-link-active"
              @click="closeMobileMenu"
            >
              <span class="nav-icon">🔍</span>
              <span class="nav-text">Search</span>
            </router-link>
            <router-link 
              to="/about" 
              class="mobile-nav-link"
              active-class="mobile-nav-link-active"
              @click="closeMobileMenu"
            >
              <span class="nav-icon">ℹ️</span>
              <span class="nav-text">About</span>
            </router-link>
          </div>

          <div class="mobile-nav-footer">
            <div class="theme-section">
              <span class="theme-label">Theme</span>
              <button
                @click="toggleTheme"
                class="mobile-theme-toggle"
                :class="{ active: isDarkMode }"
              >
                <span class="theme-option" :class="{ active: !isDarkMode }">
                  ☀️ Light
                </span>
                <span class="theme-option" :class="{ active: isDarkMode }">
                  🌙 Dark
                </span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    </transition>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useDarkMode } from '../composables/useDarkMode'

// Mobile menu state
const isMobileMenuOpen = ref(false)

// Dark mode composable
const { isDarkMode, toggleDarkMode } = useDarkMode()

/**
 * Toggle mobile menu visibility
 */
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  
  // Prevent body scroll when menu is open
  if (isMobileMenuOpen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

/**
 * Close mobile menu
 */
const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
  document.body.style.overflow = ''
}

/**
 * Toggle theme and close mobile menu if open
 */
const toggleTheme = () => {
  toggleDarkMode()
}

/**
 * Handle escape key to close mobile menu
 */
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isMobileMenuOpen.value) {
    closeMobileMenu()
  }
}

/**
 * Handle window resize to close mobile menu on desktop
 */
const handleResize = () => {
  if (window.innerWidth >= 768 && isMobileMenuOpen.value) {
    closeMobileMenu()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', handleResize)
  // Ensure body scroll is restored
  document.body.style.overflow = ''
})
</script>

<style scoped>
.app-header {
  background: var(--header-bg, #ffffff);
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: background-color 0.2s ease;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  height: 64px;
}

/* Brand Section */
.nav-brand {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--text-primary, #1f2937);
  font-weight: 700;
  font-size: 1.25rem;
  transition: color 0.2s ease;
}

.brand-link:hover {
  color: var(--primary-color, #059669);
}

.brand-icon {
  font-size: 1.75rem;
  line-height: 1;
}

.brand-text {
  font-size: 1.5rem;
  letter-spacing: -0.025em;
}

.brand-tagline {
  font-size: 0.75rem;
  color: var(--text-secondary, #6b7280);
  background: var(--primary-color, #059669);
  color: white;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-weight: 600;
  margin-left: 0.25rem;
}

/* Desktop Navigation */
.desktop-nav {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--text-secondary, #6b7280);
  font-weight: 500;
  font-size: 0.9375rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: var(--primary-color, #059669);
  background: var(--hover-bg, #f3f4f6);
}

.nav-link-active {
  color: var(--primary-color, #059669);
  background: var(--active-bg, #f0fdf4);
  font-weight: 600;
}

.nav-icon {
  font-size: 1rem;
}

/* Navigation Actions */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 0.5rem;
  background: var(--button-bg, #f3f4f6);
  color: var(--text-primary, #1f2937);
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-toggle:hover {
  background: var(--button-hover-bg, #e5e7eb);
  transform: scale(1.05);
}

.theme-icon {
  font-size: 1.125rem;
}

/* Mobile Menu Toggle */
.mobile-menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0.5rem;
  gap: 0.25rem;
}

.hamburger-line {
  width: 20px;
  height: 2px;
  background: var(--text-primary, #1f2937);
  transition: all 0.3s ease;
  border-radius: 1px;
}

.mobile-menu-toggle.active .hamburger-line:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}

.mobile-menu-toggle.active .hamburger-line:nth-child(2) {
  opacity: 0;
}

.mobile-menu-toggle.active .hamburger-line:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}

/* Mobile Navigation Overlay */
.mobile-nav-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
  display: flex;
  justify-content: flex-end;
}

.mobile-nav {
  background: var(--header-bg, #ffffff);
  width: 280px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
}

.mobile-nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.mobile-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary, #1f2937);
  font-weight: 700;
}

.close-mobile-menu {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-secondary, #6b7280);
  font-size: 1.25rem;
  cursor: pointer;
  border-radius: 0.25rem;
}

.close-mobile-menu:hover {
  background: var(--hover-bg, #f3f4f6);
  color: var(--text-primary, #1f2937);
}

.mobile-nav-links {
  flex: 1;
  padding: 1rem 0;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: var(--text-secondary, #6b7280);
  padding: 0.75rem 1rem;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.mobile-nav-link:hover {
  background: var(--hover-bg, #f3f4f6);
  color: var(--text-primary, #1f2937);
}

.mobile-nav-link-active {
  color: var(--primary-color, #059669);
  background: var(--active-bg, #f0fdf4);
  border-left-color: var(--primary-color, #059669);
  font-weight: 600;
}

.nav-text {
  font-size: 1rem;
}

.mobile-nav-footer {
  padding: 1rem;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.theme-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.theme-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
}

.mobile-theme-toggle {
  display: flex;
  background: var(--button-bg, #f3f4f6);
  border: none;
  border-radius: 0.5rem;
  overflow: hidden;
}

.theme-option {
  flex: 1;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  color: var(--text-secondary, #6b7280);
}

.theme-option.active {
  background: var(--primary-color, #059669);
  color: white;
  font-weight: 600;
}

/* Mobile Menu Animation */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: opacity 0.3s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
}

.mobile-menu-enter-active .mobile-nav,
.mobile-menu-leave-active .mobile-nav {
  transition: transform 0.3s ease;
}

.mobile-menu-enter-from .mobile-nav,
.mobile-menu-leave-to .mobile-nav {
  transform: translateX(100%);
}

/* Responsive Design */
@media (max-width: 767px) {
  .desktop-nav {
    display: none;
  }

  .mobile-menu-toggle {
    display: flex;
  }

  .nav-container {
    padding: 0.75rem 1rem;
  }

  .brand-text {
    font-size: 1.25rem;
  }
}

@media (min-width: 768px) {
  .mobile-nav-overlay {
    display: none;
  }
}

/* Dark mode variables will be defined in global styles */
</style>