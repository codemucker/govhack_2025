import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AppHeader from '../AppHeader.vue'

// Mock the useDarkMode composable
const mockToggleDarkMode = vi.fn()

vi.mock('../../composables/useDarkMode', () => ({
  useDarkMode: vi.fn(() => ({
    isDarkMode: { value: false },
    toggleDarkMode: mockToggleDarkMode
  }))
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/search', component: { template: '<div>Search</div>' } },
    { path: '/about', component: { template: '<div>About</div>' } }
  ]
})

describe('AppHeader', () => {
  beforeEach(() => {
    // Reset body styles
    document.body.style.overflow = ''
    // Reset mocks
    mockToggleDarkMode.mockClear()
  })

  it('renders header with brand and navigation links', async () => {
    const wrapper = mount(AppHeader, {
      global: {
        plugins: [router]
      }
    })

    // Check brand elements
    expect(wrapper.find('.brand-text').text()).toBe('LegalEase')
    expect(wrapper.find('.brand-tagline').text()).toBe('AU')
    expect(wrapper.find('.brand-icon').text()).toBe('⚖️')

    // Check navigation links
    const navLinks = wrapper.findAll('.nav-link')
    expect(navLinks).toHaveLength(3)
    expect(navLinks[0].text()).toContain('Home')
    expect(navLinks[1].text()).toContain('Search')
    expect(navLinks[2].text()).toContain('About')
  })

  it('displays theme toggle button', () => {
    const wrapper = mount(AppHeader, {
      global: {
        plugins: [router]
      }
    })

    const themeToggle = wrapper.find('.theme-toggle')
    expect(themeToggle.exists()).toBe(true)
    expect(themeToggle.attributes('aria-label')).toBe('Toggle dark mode')
  })

  it('displays mobile menu toggle on mobile', () => {
    const wrapper = mount(AppHeader, {
      global: {
        plugins: [router]
      }
    })

    const mobileToggle = wrapper.find('.mobile-menu-toggle')
    expect(mobileToggle.exists()).toBe(true)
    expect(mobileToggle.attributes('aria-label')).toBe('Toggle navigation menu')
    
    const hamburgerLines = wrapper.findAll('.hamburger-line')
    expect(hamburgerLines).toHaveLength(3)
  })

  it('toggles mobile menu when hamburger is clicked', async () => {
    const wrapper = mount(AppHeader, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('.mobile-nav-overlay').exists()).toBe(false)

    // Click mobile menu toggle
    await wrapper.find('.mobile-menu-toggle').trigger('click')

    expect(wrapper.find('.mobile-nav-overlay').exists()).toBe(true)
    expect(wrapper.find('.mobile-menu-toggle').classes()).toContain('active')
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('closes mobile menu when close button is clicked', async () => {
    const wrapper = mount(AppHeader, {
      global: {
        plugins: [router]
      }
    })

    // Open mobile menu first
    await wrapper.find('.mobile-menu-toggle').trigger('click')
    expect(wrapper.find('.mobile-nav-overlay').exists()).toBe(true)

    // Close mobile menu
    await wrapper.find('.close-mobile-menu').trigger('click')
    expect(wrapper.find('.mobile-nav-overlay').exists()).toBe(false)
    expect(document.body.style.overflow).toBe('')
  })

  it('closes mobile menu when overlay is clicked', async () => {
    const wrapper = mount(AppHeader, {
      global: {
        plugins: [router]
      }
    })

    // Open mobile menu first
    await wrapper.find('.mobile-menu-toggle').trigger('click')
    expect(wrapper.find('.mobile-nav-overlay').exists()).toBe(true)

    // Click overlay
    await wrapper.find('.mobile-nav-overlay').trigger('click')
    expect(wrapper.find('.mobile-nav-overlay').exists()).toBe(false)
  })

  it('closes mobile menu when navigation link is clicked', async () => {
    const wrapper = mount(AppHeader, {
      global: {
        plugins: [router]
      }
    })

    // Open mobile menu first
    await wrapper.find('.mobile-menu-toggle').trigger('click')
    expect(wrapper.find('.mobile-nav-overlay').exists()).toBe(true)

    // Click mobile navigation link
    await wrapper.find('.mobile-nav-link').trigger('click')
    expect(wrapper.find('.mobile-nav-overlay').exists()).toBe(false)
  })

  it('calls toggleDarkMode when theme toggle is clicked', async () => {
    const wrapper = mount(AppHeader, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.find('.theme-toggle').trigger('click')
    expect(mockToggleDarkMode).toHaveBeenCalledOnce()
  })

  it('displays correct theme icon based on dark mode state', async () => {
    // Mock the composable to return dark mode
    const mockUseDarkMode = await import('../../composables/useDarkMode')
    vi.mocked(mockUseDarkMode.useDarkMode).mockReturnValue({
      isDarkMode: { value: true },
      toggleDarkMode: mockToggleDarkMode
    })

    const wrapper = mount(AppHeader, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('.theme-icon').text()).toBe('☀️')
    expect(wrapper.find('.theme-toggle').attributes('title')).toBe('Switch to light mode')
  })

  it('handles keyboard events to close mobile menu', async () => {
    const wrapper = mount(AppHeader, {
      global: {
        plugins: [router]
      }
    })

    // Open mobile menu
    await wrapper.find('.mobile-menu-toggle').trigger('click')
    expect(wrapper.find('.mobile-nav-overlay').exists()).toBe(true)

    // Simulate Escape key
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
    document.dispatchEvent(escapeEvent)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.mobile-nav-overlay').exists()).toBe(false)
  })

  it('mobile theme toggle shows correct active state', async () => {
    // Mock the composable to return dark mode
    const mockUseDarkMode = await import('../../composables/useDarkMode')
    vi.mocked(mockUseDarkMode.useDarkMode).mockReturnValue({
      isDarkMode: { value: true },
      toggleDarkMode: mockToggleDarkMode
    })

    const wrapper = mount(AppHeader, {
      global: {
        plugins: [router]
      }
    })

    const mobileThemeToggle = wrapper.find('.mobile-theme-toggle')
    expect(mobileThemeToggle.classes()).toContain('active')
    
    const themeOptions = wrapper.findAll('.theme-option')
    expect(themeOptions[0].classes()).not.toContain('active') // Light mode
    expect(themeOptions[1].classes()).toContain('active') // Dark mode
  })

  it('prevents click propagation on mobile nav to prevent closing', async () => {
    const wrapper = mount(AppHeader, {
      global: {
        plugins: [router]
      }
    })

    // Open mobile menu
    await wrapper.find('.mobile-menu-toggle').trigger('click')
    expect(wrapper.find('.mobile-nav-overlay').exists()).toBe(true)

    // Click inside mobile nav (should not close)
    await wrapper.find('.mobile-nav').trigger('click')
    expect(wrapper.find('.mobile-nav-overlay').exists()).toBe(true)
  })
})