import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AppFooter from '../AppFooter.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/search', component: { template: '<div>Search</div>' } },
    { path: '/about', component: { template: '<div>About</div>' } }
  ]
})

describe('AppFooter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 0, 1)) // January 1, 2025
  })

  it('renders footer with brand information', () => {
    const wrapper = mount(AppFooter, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('.brand-name').text()).toBe('LegalEase')
    expect(wrapper.find('.brand-icon').text()).toBe('⚖️')
    expect(wrapper.find('.brand-description').text()).toContain('AI-powered platform for navigating Australian regulatory requirements')
  })

  it('displays GovHack badge', () => {
    const wrapper = mount(AppFooter, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('.govhack-badge').exists()).toBe(true)
    expect(wrapper.find('.badge-title').text()).toBe('GovHack 2025')
    expect(wrapper.find('.badge-subtitle').text()).toBe('Competition Entry')
    expect(wrapper.find('.badge-icon').text()).toBe('🏆')
  })

  it('renders navigation links correctly', () => {
    const wrapper = mount(AppFooter, {
      global: {
        plugins: [router]
      }
    })

    const navLinks = wrapper.findAll('.footer-link')
    const internalLinks = navLinks.filter(link => !link.classes().includes('external-link'))
    
    expect(internalLinks).toHaveLength(3)
    expect(internalLinks[0].text()).toBe('Home')
    expect(internalLinks[1].text()).toBe('Search Requirements')
    expect(internalLinks[2].text()).toBe('About LegalEase')
  })

  it('renders external links with correct attributes', () => {
    const wrapper = mount(AppFooter, {
      global: {
        plugins: [router]
      }
    })

    const externalLinks = wrapper.findAll('.external-link')
    
    externalLinks.forEach(link => {
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')).toBe('noopener noreferrer')
      expect(link.find('.external-icon').text()).toBe('↗')
    })

    // Check specific external links
    const govhackLink = externalLinks.find(link => link.text().includes('GovHack Official Site'))
    expect(govhackLink?.attributes('href')).toBe('https://www.govhack.org/')

    const sourceLink = externalLinks.find(link => link.text().includes('Source Code'))
    expect(sourceLink?.attributes('href')).toBe('https://github.com/codemucker/govhack_2025')

    const ablisLink = externalLinks.find(link => link.text().includes('ABLIS'))
    expect(ablisLink?.attributes('href')).toBe('https://ablis.business.gov.au/')

    const legislationLink = externalLinks.find(link => link.text().includes('Federal Register'))
    expect(legislationLink?.attributes('href')).toBe('https://www.legislation.gov.au/')
  })

  it('displays team information', () => {
    const wrapper = mount(AppFooter, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('.team-title').text()).toBe('Team Democracy Sausage')
    expect(wrapper.find('.team-subtitle').text()).toBe('GovHack 2025 Participants')

    const teamMembers = wrapper.findAll('.team-member')
    expect(teamMembers).toHaveLength(2)

    // Check Daniel Bryar
    const daniel = teamMembers[0]
    expect(daniel.find('.member-name').text()).toBe('Daniel Bryar')
    expect(daniel.find('.member-role').text()).toBe('Project Lead & Software Engineer')
    expect(daniel.find('.member-link').attributes('href')).toBe('https://github.com/dbryar')
    expect(daniel.find('.member-link').attributes('aria-label')).toBe('Daniel Bryar GitHub Profile')

    // Check Bert Van Brakel
    const bert = teamMembers[1]
    expect(bert.find('.member-name').text()).toBe('Bert Van Brakel')
    expect(bert.find('.member-role').text()).toBe('Software Engineer')
    expect(bert.find('.member-link').attributes('href')).toBe('https://github.com/codemucker')
    expect(bert.find('.member-link').attributes('aria-label')).toBe('Bert Van Brakel GitHub Profile')
  })

  it('displays legal disclaimers', () => {
    const wrapper = mount(AppFooter, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('.disclaimer-title').text()).toContain('Important Legal Disclaimer')
    expect(wrapper.find('.warning-icon').text()).toBe('⚠️')
    
    const disclaimerTexts = wrapper.findAll('.disclaimer-text')
    expect(disclaimerTexts[0].text()).toContain('LegalEase is an information discovery tool and does not provide legal advice')
    expect(disclaimerTexts[1].text()).toContain('This project was developed during GovHack 2025')
  })

  it('displays data attribution section', () => {
    const wrapper = mount(AppFooter, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('.attribution-title').text()).toBe('Data Attribution')
    expect(wrapper.find('.attribution-text').text()).toContain('Australian government sources including ABLIS')
  })

  it('displays current year in copyright', () => {
    const wrapper = mount(AppFooter, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('.copyright-text').text()).toContain('© 2025 LegalEase - GovHack 2025 Project by Team Democracy Sausage')
  })

  it('displays tech stack information', () => {
    const wrapper = mount(AppFooter, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('.build-info').text()).toBe('Built with ❤️ for accessible government services')
    
    const techItems = wrapper.findAll('.tech-item')
    expect(techItems[0].text()).toBe('Vue.js')
    expect(techItems[1].text()).toBe('TypeScript')
    expect(techItems[2].text()).toBe('Encore.dev')
    
    const dividers = wrapper.findAll('.tech-divider')
    expect(dividers).toHaveLength(2)
    dividers.forEach(divider => {
      expect(divider.text()).toBe('•')
    })
  })

  it('has proper responsive structure', () => {
    const wrapper = mount(AppFooter, {
      global: {
        plugins: [router]
      }
    })

    // Check main structural elements exist
    expect(wrapper.find('.footer-main').exists()).toBe(true)
    expect(wrapper.find('.footer-team').exists()).toBe(true)
    expect(wrapper.find('.footer-legal').exists()).toBe(true)
    expect(wrapper.find('.footer-bottom').exists()).toBe(true)
    
    // Check grid layouts
    expect(wrapper.find('.footer-links').exists()).toBe(true)
    expect(wrapper.find('.team-members').exists()).toBe(true)
  })

  it('uses CSS custom properties for theming', () => {
    const wrapper = mount(AppFooter, {
      global: {
        plugins: [router]
      }
    })

    // Test that themed elements have the expected CSS classes
    expect(wrapper.find('.app-footer').exists()).toBe(true)
    expect(wrapper.find('.govhack-badge').exists()).toBe(true)
    expect(wrapper.find('.disclaimer-section').exists()).toBe(true)
    expect(wrapper.find('.data-attribution').exists()).toBe(true)
  })

  afterEach(() => {
    vi.useRealTimers()
  })
})