import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchResults from '../SearchResults.vue'
import type { TriageResponse } from '../../composables/useApi'

const mockTriageResponse: TriageResponse = {
  query: {
    raw: 'open a café in Brisbane',
    location: {
      address: 'Brisbane QLD',
      council: 'Brisbane City Council',
      state: 'Queensland'
    },
    assumptions: [
      'New business (not transferring existing licence)',
      'Food service premises requiring commercial kitchen'
    ]
  },
  jurisdictions: [
    {
      name: 'Brisbane City Council',
      level: 'local',
      confidence: 0.92
    },
    {
      name: 'Queensland Government',
      level: 'state',
      confidence: 0.88
    },
    {
      name: 'Australian Government',
      level: 'federal',
      confidence: 0.76
    }
  ],
  requirements: [
    {
      title: 'Business Registration & ABN',
      authority: 'Australian Business Register',
      actions: [
        {
          step: 1,
          desc: 'Register business name with ASIC',
          link: 'https://asic.gov.au/for-business/registering-a-business-name'
        },
        {
          step: 2,
          desc: 'Apply for Australian Business Number (ABN)',
          link: 'https://abr.business.gov.au'
        }
      ],
      notes: ['Required before applying for local permits']
    },
    {
      title: 'Food Business Licence',
      authority: 'Brisbane City Council',
      actions: [
        {
          step: 1,
          desc: 'Submit food business notification'
        }
      ],
      notes: []
    }
  ],
  contacts: [
    {
      authority: 'Brisbane City Council',
      type: 'Business Support',
      phone: '07 3403 8888',
      url: 'https://www.brisbane.qld.gov.au/business-and-trade'
    },
    {
      authority: 'Business Queensland',
      type: 'State Government Support',
      url: 'https://www.business.qld.gov.au'
    }
  ],
  disclaimer: 'This information is for guidance only and should not be considered legal advice.'
}

// Mock browser APIs
vi.stubGlobal('navigator', {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve())
  },
  share: vi.fn(() => Promise.resolve())
})

// Mock window.alert
vi.stubGlobal('alert', vi.fn())

describe('SearchResults', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(SearchResults, {
      props: {
        result: mockTriageResponse
      }
    })
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  describe('rendering', () => {
    it('should render results header correctly', () => {
      const header = wrapper.find('.results-header')
      expect(header.exists()).toBe(true)
      expect(header.find('h2').text()).toBe('Search Results')
    })

    it('should display results summary', () => {
      const summary = wrapper.find('.results-summary')
      expect(summary.text()).toContain('2 requirements') // 2 requirements in mock data
      expect(summary.text()).toContain('3 jurisdictions') // 3 jurisdictions in mock data
    })

    it('should render all main sections', () => {
      expect(wrapper.find('h3').text()).toContain('Query Analysis')
      expect(wrapper.findAll('h3').some((h3: any) => h3.text().includes('Jurisdictions'))).toBe(true)
      expect(wrapper.findAll('h3').some((h3: any) => h3.text().includes('Requirements'))).toBe(true)
      expect(wrapper.findAll('h3').some((h3: any) => h3.text().includes('Contacts'))).toBe(true)
    })

    it('should render disclaimer section', () => {
      const disclaimer = wrapper.find('.disclaimer')
      expect(disclaimer.exists()).toBe(true)
      expect(disclaimer.text()).toContain('Legal Disclaimer')
      expect(disclaimer.text()).toContain(mockTriageResponse.disclaimer)
    })

    it('should render action buttons', () => {
      const actions = wrapper.find('.result-actions')
      expect(actions.exists()).toBe(true)
      
      const buttons = actions.findAll('button')
      expect(buttons.length).toBe(3)
      expect(buttons[0].text()).toContain('Export PDF')
      expect(buttons[1].text()).toContain('Share Results')
      expect(buttons[2].text()).toContain('Save for Later')
    })
  })

  describe('query analysis section', () => {
    it('should display query analysis correctly', () => {
      const analysisCard = wrapper.find('.analysis-card')
      expect(analysisCard.exists()).toBe(true)
      
      expect(analysisCard.text()).toContain(mockTriageResponse.query.raw)
      expect(analysisCard.text()).toContain(mockTriageResponse.query.location?.address)
    })

    it('should display assumptions when present', () => {
      const assumptions = wrapper.find('.assumptions-list')
      expect(assumptions.exists()).toBe(true)
      
      const assumptionItems = assumptions.findAll('li')
      expect(assumptionItems.length).toBe(mockTriageResponse.query.assumptions.length)
      expect(assumptionItems[0].text()).toContain(mockTriageResponse.query.assumptions[0])
    })

    it('should display council badge when available', () => {
      const councilBadge = wrapper.find('.council-badge')
      expect(councilBadge.exists()).toBe(true)
      expect(councilBadge.text()).toBe(mockTriageResponse.query.location?.council)
    })

    it('should handle toggle section functionality', async () => {
      const toggleBtn = wrapper.find('.toggle-btn')
      expect(toggleBtn.exists()).toBe(true)
      
      // Analysis should be expanded by default
      expect(toggleBtn.text()).toBe('Hide Details')
      
      await toggleBtn.trigger('click')
      expect(toggleBtn.text()).toBe('Show Details')
    })
  })

  describe('jurisdictions section', () => {
    it('should display all jurisdictions', () => {
      const jurisdictionCards = wrapper.findAll('.jurisdiction-card')
      expect(jurisdictionCards.length).toBe(mockTriageResponse.jurisdictions.length)
    })

    it('should display jurisdiction details correctly', () => {
      const firstCard = wrapper.find('.jurisdiction-card')
      const firstJurisdiction = mockTriageResponse.jurisdictions[0]
      
      expect(firstCard.find('.jurisdiction-level').text()).toBe(firstJurisdiction.level)
      expect(firstCard.find('.jurisdiction-name').text()).toBe(firstJurisdiction.name)
      expect(firstCard.find('.confidence-score').text()).toContain('92%')
    })

    it('should render confidence bars with correct width', () => {
      const confidenceFills = wrapper.findAll('.confidence-fill')
      const firstFill = confidenceFills[0]
      
      expect(firstFill.attributes('style')).toContain('width: 92%')
    })

    it('should display confidence labels', () => {
      const labels = wrapper.findAll('.confidence-label')
      expect(labels[0].text()).toContain('Very High Confidence') // 92% confidence
      expect(labels[1].text()).toContain('High Confidence') // 88% confidence
      expect(labels[2].text()).toContain('Medium Confidence') // 76% confidence
    })
  })

  describe('requirements section', () => {
    it('should display all requirements', () => {
      const requirementCards = wrapper.findAll('.requirement-card')
      expect(requirementCards.length).toBe(mockTriageResponse.requirements.length)
    })

    it('should display requirement details correctly', () => {
      const firstCard = wrapper.find('.requirement-card')
      const firstRequirement = mockTriageResponse.requirements[0]
      
      expect(firstCard.find('h4').text()).toBe(firstRequirement.title)
      expect(firstCard.find('.requirement-authority').text()).toBe(firstRequirement.authority)
      expect(firstCard.find('.steps-count').text()).toContain('2 steps')
    })

    it('should display action steps with checkboxes', () => {
      const actionItems = wrapper.findAll('.action-item')
      expect(actionItems.length).toBeGreaterThan(0)
      
      const firstAction = actionItems[0]
      expect(firstAction.find('.action-checkbox input').exists()).toBe(true)
      expect(firstAction.find('.step-number').text()).toBe('1')
      expect(firstAction.find('.step-description').exists()).toBe(true)
    })

    it('should display external links for actions', () => {
      const stepLinks = wrapper.findAll('.step-link')
      expect(stepLinks.length).toBeGreaterThan(0)
      
      const firstLink = stepLinks[0]
      expect(firstLink.attributes('href')).toBe(mockTriageResponse.requirements[0].actions[0].link)
      expect(firstLink.attributes('target')).toBe('_blank')
      expect(firstLink.text()).toContain('View Details')
    })

    it('should display requirement notes when present', () => {
      const notes = wrapper.find('.requirement-notes')
      expect(notes.exists()).toBe(true)
      expect(notes.text()).toContain('Important Notes')
    })

    it('should handle authority filtering', async () => {
      const filterBtns = wrapper.findAll('.filter-btn')
      expect(filterBtns.length).toBe(2) // Two unique authorities in mock data
      
      await filterBtns[0].trigger('click')
      expect(filterBtns[0].classes()).toContain('active')
    })
  })

  describe('contacts section', () => {
    it('should display all contacts', () => {
      const contactCards = wrapper.findAll('.contact-card')
      expect(contactCards.length).toBe(mockTriageResponse.contacts.length)
    })

    it('should display contact details correctly', () => {
      const firstCard = wrapper.find('.contact-card')
      const firstContact = mockTriageResponse.contacts[0]
      
      expect(firstCard.find('h4').text()).toBe(firstContact.authority)
      expect(firstCard.find('.contact-type').text()).toBe(firstContact.type)
    })

    it('should display phone numbers when available', () => {
      const phoneLink = wrapper.find('a[href^="tel:"]')
      expect(phoneLink.exists()).toBe(true)
      expect(phoneLink.attributes('href')).toBe('tel:07 3403 8888')
    })

    it('should display website links', () => {
      const websiteLinks = wrapper.findAll('.contact-link')
      expect(websiteLinks.length).toBeGreaterThan(0)
      
      const firstWebsiteLink = websiteLinks.find(link => 
        link.attributes('href') === mockTriageResponse.contacts[0].url
      )
      expect(firstWebsiteLink).toBeTruthy()
    })
  })

  describe('interaction functionality', () => {
    it('should handle action checkbox changes', async () => {
      const checkbox = wrapper.find('.action-check')
      
      // Mock console.log to verify it's called
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      await checkbox.setChecked(true)
      
      expect(consoleSpy).toHaveBeenCalledWith('Action completed:', true)
      consoleSpy.mockRestore()
    })

    it('should handle export results action', async () => {
      const exportBtn = wrapper.find('button').filter((btn: any) => 
        btn.text().includes('Export PDF')
      )[0]
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      await exportBtn.trigger('click')
      
      expect(consoleSpy).toHaveBeenCalledWith('Export results to PDF')
      consoleSpy.mockRestore()
    })

    it('should handle share results with navigator.share', async () => {
      const shareBtn = wrapper.findAll('button').find((btn: any) => 
        btn.text().includes('Share Results')
      )
      
      await shareBtn.trigger('click')
      
      expect(navigator.share).toHaveBeenCalledWith({
        title: 'LegalEase Search Results',
        text: `Requirements for: ${mockTriageResponse.query.raw}`,
        url: window.location.href,
      })
    })

    it('should fallback to clipboard when navigator.share is not available', async () => {
      // Mock navigator.share as undefined
      const originalShare = navigator.share
      ;(navigator as any).share = undefined
      
      const shareBtn = wrapper.findAll('button').find((btn: any) => 
        btn.text().includes('Share Results')
      )
      
      await shareBtn.trigger('click')
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href)
      expect(window.alert).toHaveBeenCalledWith('Link copied to clipboard!')
      
      // Restore original
      navigator.share = originalShare
    })

    it('should handle save results action', async () => {
      const saveBtn = wrapper.findAll('button').find((btn: any) => 
        btn.text().includes('Save for Later')
      )
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      await saveBtn.trigger('click')
      
      expect(consoleSpy).toHaveBeenCalledWith('Save results for later')
      consoleSpy.mockRestore()
    })
  })

  describe('utility functions', () => {
    it('should calculate confidence colors correctly', () => {
      // High confidence (>= 0.8) should be green
      expect(wrapper.vm.getConfidenceColor(0.92)).toBe('#059669')
      
      // Medium confidence (0.6-0.8) should be orange
      expect(wrapper.vm.getConfidenceColor(0.7)).toBe('#d97706')
      
      // Low confidence (< 0.6) should be red
      expect(wrapper.vm.getConfidenceColor(0.4)).toBe('#dc2626')
    })

    it('should generate correct confidence labels', () => {
      expect(wrapper.vm.getConfidenceLabel(0.95)).toBe('Very High Confidence')
      expect(wrapper.vm.getConfidenceLabel(0.85)).toBe('High Confidence')
      expect(wrapper.vm.getConfidenceLabel(0.7)).toBe('Medium Confidence')
      expect(wrapper.vm.getConfidenceLabel(0.5)).toBe('Low Confidence')
      expect(wrapper.vm.getConfidenceLabel(0.3)).toBe('Very Low Confidence')
    })
  })

  describe('responsive design', () => {
    it('should have responsive grid classes', () => {
      expect(wrapper.find('.jurisdiction-grid').exists()).toBe(true)
      expect(wrapper.find('.contacts-grid').exists()).toBe(true)
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels for checkboxes', () => {
      const checkbox = wrapper.find('.action-check')
      const label = wrapper.find('label.sr-only')
      
      expect(checkbox.exists()).toBe(true)
      expect(label.exists()).toBe(true)
      expect(label.text()).toContain('Mark step')
    })

    it('should have proper link attributes for external links', () => {
      const externalLinks = wrapper.findAll('a[target="_blank"]')
      
      externalLinks.forEach((link: any) => {
        expect(link.attributes('rel')).toBe('noopener noreferrer')
      })
    })

    it('should have proper heading hierarchy', () => {
      const h2 = wrapper.find('h2')
      const h3s = wrapper.findAll('h3')
      const h4s = wrapper.findAll('h4')
      
      expect(h2.exists()).toBe(true) // Main heading
      expect(h3s.length).toBeGreaterThan(0) // Section headings
      expect(h4s.length).toBeGreaterThan(0) // Subsection headings
    })
  })

  describe('error handling', () => {
    it('should handle missing optional data gracefully', () => {
      const minimalResponse: TriageResponse = {
        query: {
          raw: 'test query',
          assumptions: []
        },
        jurisdictions: [],
        requirements: [],
        contacts: [],
        disclaimer: 'Test disclaimer'
      }
      
      const minimalWrapper = mount(SearchResults, {
        props: { result: minimalResponse }
      })
      
      expect(minimalWrapper.find('.search-results').exists()).toBe(true)
      expect(minimalWrapper.find('.results-summary').text()).toContain('0 requirements')
      
      minimalWrapper.unmount()
    })
  })
})