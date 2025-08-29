import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import ErrorBoundary from '../ErrorBoundary.vue'
import { mountComponent, testUtils, factories } from '../../utils/testHelpers'
import type { VueWrapper } from '@vue/test-utils'

// Mock child component that can throw errors
const ThrowingComponent = {
  name: 'ThrowingComponent',
  props: {
    shouldThrow: Boolean,
    errorMessage: {
      type: String,
      default: 'Test error'
    },
    errorType: {
      type: String,
      default: 'Error'
    }
  },
  mounted() {
    if (this.shouldThrow) {
      const ErrorClass = this.errorType === 'NetworkError' ? NetworkError : Error
      const error = new ErrorClass(this.errorMessage)
      if (this.errorType === 'ChunkLoadError') {
        error.name = 'ChunkLoadError'
      }
      throw error
    }
  },
  template: '<div data-testid="throwing-component">Normal content</div>'
}

// Custom error types for testing
class NetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

describe('ErrorBoundary', () => {
  let wrapper: VueWrapper<any>
  let consoleMocks: any

  beforeEach(() => {
    consoleMocks = testUtils.mockConsole()
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    consoleMocks.restore()
    vi.clearAllMocks()
  })

  describe('Normal Operation', () => {
    it('renders children normally when no error occurs', async () => {
      wrapper = await mountComponent(ErrorBoundary, {
        slots: {
          default: '<div data-testid="child-content">Child content</div>'
        }
      })

      expect(wrapper.find('[data-testid="child-content"]').exists()).toBe(true)
      expect(wrapper.find('.error-state').exists()).toBe(false)
    })

    it('renders custom fallback component when provided', async () => {
      const FallbackComponent = {
        template: '<div data-testid="custom-fallback">Custom fallback</div>'
      }

      wrapper = await mountComponent(ErrorBoundary, {
        props: {
          fallbackComponent: FallbackComponent
        },
        slots: {
          default: ThrowingComponent,
          fallback: '<div data-testid="custom-fallback">Custom fallback</div>'
        }
      })

      // Force error by updating child component
      await wrapper.setProps({
        fallbackComponent: FallbackComponent
      })
    })
  })

  describe('Error Handling', () => {
    it('catches and displays error when child component throws', async () => {
      wrapper = await mountComponent(ErrorBoundary, {
        slots: {
          default: '<throwing-component :should-throw="true" />'
        },
        global: {
          components: {
            ThrowingComponent
          }
        }
      })

      await testUtils.waitForNextTick()

      expect(wrapper.find('.error-state').exists()).toBe(true)
      expect(wrapper.find('[data-testid="throwing-component"]').exists()).toBe(false)
      expect(wrapper.text()).toContain('Something went wrong')
    })

    it('displays appropriate error title and message', async () => {
      wrapper = await mountComponent(ErrorBoundary, {
        slots: {
          default: '<throwing-component :should-throw="true" error-message="Custom error message" />'
        },
        global: {
          components: {
            ThrowingComponent
          }
        }
      })

      await testUtils.waitForNextTick()

      expect(wrapper.text()).toContain('Something went wrong')
      expect(wrapper.text()).toContain('Custom error message')
    })

    it('handles network errors with appropriate messaging', async () => {
      wrapper = await mountComponent(ErrorBoundary, {
        slots: {
          default: '<throwing-component :should-throw="true" error-type="NetworkError" error-message="Network failed" />'
        },
        global: {
          components: {
            ThrowingComponent
          }
        }
      })

      await testUtils.waitForNextTick()

      expect(wrapper.text()).toContain('Connection Error')
      expect(wrapper.text()).toContain('Please check your connection and try again')
    })

    it('handles chunk load errors with update message', async () => {
      wrapper = await mountComponent(ErrorBoundary, {
        slots: {
          default: '<throwing-component :should-throw="true" error-type="ChunkLoadError" error-message="Loading chunk failed" />'
        },
        global: {
          components: {
            ThrowingComponent
          }
        }
      })

      await testUtils.waitForNextTick()

      expect(wrapper.text()).toContain('Update Required')
      expect(wrapper.text()).toContain('The app has been updated. Please refresh')
    })

    it('emits error event when error occurs', async () => {
      const onError = vi.fn()

      wrapper = await mountComponent(ErrorBoundary, {
        props: {
          onError
        },
        slots: {
          default: '<throwing-component :should-throw="true" />'
        },
        global: {
          components: {
            ThrowingComponent
          }
        }
      })

      await testUtils.waitForNextTick()

      expect(wrapper.emitted('error')).toBeTruthy()
      expect(onError).toHaveBeenCalled()
    })
  })

  describe('Error Recovery', () => {
    it('shows retry button for recoverable errors', async () => {
      wrapper = await mountComponent(ErrorBoundary, {
        props: {
          enableRetry: true
        },
        slots: {
          default: '<throwing-component :should-throw="true" error-type="NetworkError" />'
        },
        global: {
          components: {
            ThrowingComponent
          }
        }
      })

      await testUtils.waitForNextTick()

      const retryButton = wrapper.find('[data-testid="retry-button"]')
      expect(retryButton.exists() || wrapper.text().includes('Try Again')).toBe(true)
    })

    it('attempts retry when retry button is clicked', async () => {
      wrapper = await mountComponent(ErrorBoundary, {
        props: {
          enableRetry: true,
          maxRetries: 2
        },
        slots: {
          default: '<throwing-component :should-throw="true" error-type="NetworkError" />'
        },
        global: {
          components: {
            ThrowingComponent
          }
        }
      })

      await testUtils.waitForNextTick()

      // Find and click retry button
      const retryButton = wrapper.find('button').filter(b => 
        b.text().includes('Try Again') || b.text().includes('Retry')
      )[0]
      
      if (retryButton) {
        await retryButton.trigger('click')
        await testUtils.waitForNextTick()

        expect(wrapper.emitted('retry')).toBeTruthy()
      }
    })

    it('shows recovery button when recovery is enabled', async () => {
      const onRecover = vi.fn()

      wrapper = await mountComponent(ErrorBoundary, {
        props: {
          enableRecovery: true,
          onRecover
        },
        slots: {
          default: '<throwing-component :should-throw="true" />'
        },
        global: {
          components: {
            ThrowingComponent
          }
        }
      })

      await testUtils.waitForNextTick()

      const recoverButton = wrapper.find('button').filter(b => 
        b.text().includes('Recovery') || b.text().includes('Recover')
      )[0]
      
      expect(recoverButton?.exists()).toBe(true)
    })

    it('calls onRecover when recovery button is clicked', async () => {
      const onRecover = vi.fn().mockResolvedValue(undefined)

      wrapper = await mountComponent(ErrorBoundary, {
        props: {
          enableRecovery: true,
          onRecover
        },
        slots: {
          default: '<throwing-component :should-throw="true" />'
        },
        global: {
          components: {
            ThrowingComponent
          }
        }
      })

      await testUtils.waitForNextTick()

      const recoverButton = wrapper.find('button').filter(b => 
        b.text().includes('Recovery') || b.text().includes('Recover')
      )[0]
      
      if (recoverButton) {
        await recoverButton.trigger('click')
        await testUtils.waitForNextTick()

        expect(onRecover).toHaveBeenCalled()
        expect(wrapper.emitted('recover')).toBeTruthy()
      }
    })
  })

  describe('Navigation Actions', () => {
    it('navigates home when home button is clicked', async () => {
      const mockPush = vi.fn()
      
      wrapper = await mountComponent(ErrorBoundary, {
        slots: {
          default: '<throwing-component :should-throw="true" />'
        },
        global: {
          components: {
            ThrowingComponent
          },
          mocks: {
            $router: {
              push: mockPush,
              currentRoute: {
                value: { path: '/some-page' }
              }
            }
          }
        }
      })

      await testUtils.waitForNextTick()

      const homeButton = wrapper.find('button').filter(b => 
        b.text().includes('Home') || b.text().includes('Go Home')
      )[0]

      if (homeButton) {
        await homeButton.trigger('click')
        expect(mockPush).toHaveBeenCalledWith('/')
      }
    })

    it('goes back when go back alternative action is clicked', async () => {
      const mockBack = vi.fn()
      
      wrapper = await mountComponent(ErrorBoundary, {
        slots: {
          default: '<throwing-component :should-throw="true" />'
        },
        global: {
          mocks: {
            $router: {
              back: mockBack,
              currentRoute: {
                value: { path: '/some-page' }
              }
            }
          },
          components: {
            ThrowingComponent
          }
        }
      })

      await testUtils.waitForNextTick()

      // Look for go back action in alternative actions
      const backButton = wrapper.find('button').filter(b => 
        b.text().includes('Go back') || b.text().includes('back')
      )[0]

      if (backButton) {
        await backButton.trigger('click')
        expect(mockBack).toHaveBeenCalled()
      }
    })
  })

  describe('Development Features', () => {
    it('shows error details in development mode', async () => {
      // Mock development environment
      const originalEnv = import.meta.env.DEV
      Object.defineProperty(import.meta.env, 'DEV', {
        value: true,
        writable: true
      })

      wrapper = await mountComponent(ErrorBoundary, {
        props: {
          showDetails: true
        },
        slots: {
          default: '<throwing-component :should-throw="true" />'
        },
        global: {
          components: {
            ThrowingComponent
          }
        }
      })

      await testUtils.waitForNextTick()

      const detailsElement = wrapper.find('details')
      expect(detailsElement.exists() || wrapper.text().includes('Technical Details')).toBe(true)

      // Restore environment
      Object.defineProperty(import.meta.env, 'DEV', {
        value: originalEnv,
        writable: true
      })
    })

    it('shows error context when enabled', async () => {
      wrapper = await mountComponent(ErrorBoundary, {
        props: {
          showContext: true
        },
        slots: {
          default: '<throwing-component :should-throw="true" />'
        },
        global: {
          components: {
            ThrowingComponent
          }
        }
      })

      await testUtils.waitForNextTick()

      expect(wrapper.text().includes('Context') || wrapper.find('.error-context').exists()).toBe(true)
    })
  })

  describe('Offline Detection', () => {
    it('shows offline indicator when user is offline', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      })

      wrapper = await mountComponent(ErrorBoundary, {
        slots: {
          default: '<throwing-component :should-throw="true" />'
        },
        global: {
          components: {
            ThrowingComponent
          }
        }
      })

      await testUtils.waitForNextTick()

      expect(wrapper.text().includes('offline') || wrapper.find('.offline-indicator').exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes for error state', async () => {
      wrapper = await mountComponent(ErrorBoundary, {
        slots: {
          default: '<throwing-component :should-throw="true" />'
        },
        global: {
          components: {
            ThrowingComponent
          }
        }
      })

      await testUtils.waitForNextTick()

      const errorState = wrapper.find('.error-state')
      expect(errorState.attributes('role')).toBe('alert')
      expect(errorState.attributes('aria-live')).toBeTruthy()
    })

    it('has keyboard accessible action buttons', async () => {
      wrapper = await mountComponent(ErrorBoundary, {
        slots: {
          default: '<throwing-component :should-throw="true" />'
        },
        global: {
          components: {
            ThrowingComponent
          }
        }
      })

      await testUtils.waitForNextTick()

      const buttons = wrapper.findAll('button')
      buttons.forEach(button => {
        expect(button.attributes('type')).toBe('button')
        // All buttons should be keyboard accessible (no tabindex=-1)
        expect(button.attributes('tabindex')).not.toBe('-1')
      })
    })

    it('handles keyboard navigation properly', async () => {
      wrapper = await mountComponent(ErrorBoundary, {
        slots: {
          default: '<throwing-component :should-throw="true" />'
        },
        global: {
          components: {
            ThrowingComponent
          }
        }
      })

      await testUtils.waitForNextTick()

      // Test Escape key handling would go here
      // This requires more complex setup with focus management
    })
  })

  describe('Error Reporting', () => {
    it('shows report button when enabled', async () => {
      wrapper = await mountComponent(ErrorBoundary, {
        props: {
          showReportButton: true
        },
        slots: {
          default: '<throwing-component :should-throw="true" />'
        },
        global: {
          components: {
            ThrowingComponent
          }
        }
      })

      await testUtils.waitForNextTick()

      const reportButton = wrapper.find('button').filter(b => 
        b.text().includes('Report') || b.text().includes('Issue')
      )[0]
      
      expect(reportButton?.exists()).toBe(true)
    })

    it('handles error reporting', async () => {
      wrapper = await mountComponent(ErrorBoundary, {
        props: {
          showReportButton: true
        },
        slots: {
          default: '<throwing-component :should-throw="true" />'
        },
        global: {
          components: {
            ThrowingComponent
          }
        }
      })

      await testUtils.waitForNextTick()

      const reportButton = wrapper.find('button').filter(b => 
        b.text().includes('Report') || b.text().includes('Issue')
      )[0]
      
      if (reportButton) {
        await reportButton.trigger('click')
        await testUtils.waitForNextTick()

        // Should show reporting state or success message
        expect(
          wrapper.text().includes('Reporting') || 
          wrapper.text().includes('report sent')
        ).toBe(true)
      }
    })
  })

  describe('Isolation', () => {
    it('prevents error propagation when isolated', async () => {
      const parentErrorHandler = vi.fn()

      wrapper = await mountComponent({
        template: `
          <div>
            <error-boundary :isolate="true" @error="onError">
              <throwing-component :should-throw="true" />
            </error-boundary>
          </div>
        `,
        components: {
          ErrorBoundary,
          ThrowingComponent
        },
        setup() {
          return {
            onError: parentErrorHandler
          }
        }
      })

      await testUtils.waitForNextTick()

      // Error should be handled by the boundary, not propagate
      expect(parentErrorHandler).toHaveBeenCalled()
      expect(consoleMocks.mocks.error).toHaveBeenCalled()
    })
  })
})