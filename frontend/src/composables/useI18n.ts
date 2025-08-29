import { computed } from 'vue'
import { useI18n as useVueI18n } from 'vue-i18n'
import { SUPPORT_LOCALES, RTL_LANGUAGES, setI18nLanguage, type SupportLocale } from '../plugins/i18n'

export function useI18n() {
  const { t, locale, n, d } = useVueI18n()

  // Current locale
  const currentLocale = computed(() => locale.value as SupportLocale)

  // Check if current language is RTL
  const isRTL = computed(() => {
    return RTL_LANGUAGES.includes(currentLocale.value as any)
  })

  // Get language display name
  const getLanguageDisplayName = (localeCode: SupportLocale): string => {
    const names: Record<SupportLocale, string> = {
      en: 'English',
      zh: '中文',
      ar: 'العربية'
    }
    return names[localeCode] || localeCode
  }

  // Available languages for selector
  const availableLanguages = computed(() => {
    return SUPPORT_LOCALES.map(code => ({
      code,
      name: getLanguageDisplayName(code),
      nativeName: getLanguageDisplayName(code)
    }))
  })

  // Change language
  const changeLanguage = async (newLocale: SupportLocale) => {
    if (!SUPPORT_LOCALES.includes(newLocale)) {
      console.warn(`Unsupported locale: ${newLocale}`)
      return false
    }

    try {
      setI18nLanguage(newLocale)
      
      // Announce language change to screen readers
      const message = t('notifications.language_changed')
      setTimeout(() => {
        const announcer = document.getElementById('screen-reader-announcer')
        if (announcer) {
          announcer.textContent = message
        }
      }, 100)
      
      return true
    } catch (error) {
      console.error('Failed to change language:', error)
      return false
    }
  }

  // Format currency with locale
  const formatCurrency = (amount: number): string => {
    return n(amount, 'currency')
  }

  // Format decimal with locale
  const formatDecimal = (value: number): string => {
    return n(value, 'decimal')
  }

  // Format percentage with locale
  const formatPercent = (value: number): string => {
    return n(value, 'percent')
  }

  // Format date with locale
  const formatDate = (date: Date | string, format: 'short' | 'long' = 'short'): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return d(dateObj, format)
  }

  // Get pluralized message
  const pluralize = (key: string, count: number, options?: Record<string, any>): string => {
    return t(key, { count, ...options }, count)
  }

  // Get message with fallback
  const tSafe = (key: string, fallback?: string, options?: Record<string, any>): string => {
    try {
      const message = t(key, options)
      return message === key && fallback ? fallback : message
    } catch (error) {
      return fallback || key
    }
  }

  // Direction-aware positioning
  const getDirectionClass = (): string => {
    return isRTL.value ? 'rtl' : 'ltr'
  }

  // Get opposite direction for elements that need flipping
  const getOppositeDirection = (direction: 'left' | 'right'): 'left' | 'right' => {
    if (!isRTL.value) return direction
    return direction === 'left' ? 'right' : 'left'
  }

  // Get CSS property for direction-aware styles
  const getDirectionalProperty = (property: 'margin' | 'padding', side: 'left' | 'right'): string => {
    const actualSide = getOppositeDirection(side)
    return `${property}-${actualSide}`
  }

  // Get text alignment based on direction
  const getTextAlign = (align: 'left' | 'right' | 'center' = 'left'): string => {
    if (align === 'center') return 'center'
    return isRTL.value ? getOppositeDirection(align) : align
  }

  // Get flex direction for RTL
  const getFlexDirection = (direction: 'row' | 'row-reverse' | 'column' | 'column-reverse' = 'row'): string => {
    if (!isRTL.value || direction.includes('column')) return direction
    return direction === 'row' ? 'row-reverse' : 'row'
  }

  // Validate and sanitize translation keys
  const validateTranslationKey = (key: string): boolean => {
    return typeof key === 'string' && key.length > 0 && /^[a-zA-Z0-9._-]+$/.test(key)
  }

  // Get nested translation object
  const getTranslationGroup = (groupKey: string): Record<string, any> => {
    try {
      const keys = groupKey.split('.')
      let current = (useVueI18n().messages.value as any)[currentLocale.value]
      
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key]
        } else {
          return {}
        }
      }
      
      return typeof current === 'object' ? current : {}
    } catch (error) {
      console.error('Failed to get translation group:', error)
      return {}
    }
  }

  // Get all available translation keys for a group
  const getTranslationKeys = (groupKey?: string): string[] => {
    try {
      const group = groupKey ? getTranslationGroup(groupKey) : (useVueI18n().messages.value as any)[currentLocale.value]
      
      const extractKeys = (obj: any, prefix = ''): string[] => {
        const keys: string[] = []
        
        for (const [key, value] of Object.entries(obj)) {
          const fullKey = prefix ? `${prefix}.${key}` : key
          
          if (typeof value === 'object' && value !== null) {
            keys.push(...extractKeys(value, fullKey))
          } else {
            keys.push(fullKey)
          }
        }
        
        return keys
      }
      
      return extractKeys(group, groupKey)
    } catch (error) {
      console.error('Failed to get translation keys:', error)
      return []
    }
  }

  // Helper for conditional translations based on business logic
  const getConditionalTranslation = (conditions: Array<{
    condition: boolean
    key: string
    fallback?: string
  }>): string => {
    for (const { condition, key, fallback } of conditions) {
      if (condition) {
        return tSafe(key, fallback)
      }
    }
    return ''
  }

  // Format relative time
  const formatRelativeTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffHours < 1) {
      return t('common.just_now', {}, 'Just now')
    } else if (diffHours < 24) {
      return pluralize('common.hours_ago', diffHours, { hours: diffHours })
    } else if (diffDays < 7) {
      return pluralize('common.days_ago', diffDays, { days: diffDays })
    } else {
      return formatDate(dateObj)
    }
  }

  // Get localized error messages
  const getErrorMessage = (errorCode: string, fallback?: string): string => {
    return tSafe(`errors.${errorCode}`, fallback || tSafe('errors.generic', 'An error occurred'))
  }

  // Get localized status messages
  const getStatusMessage = (status: string): string => {
    return tSafe(`status.${status}`, status)
  }

  return {
    // Core i18n functions
    t,
    n,
    d,
    tSafe,
    pluralize,
    
    // Locale management
    currentLocale,
    availableLanguages,
    changeLanguage,
    getLanguageDisplayName,
    
    // RTL support
    isRTL,
    getDirectionClass,
    getOppositeDirection,
    getDirectionalProperty,
    getTextAlign,
    getFlexDirection,
    
    // Formatting helpers
    formatCurrency,
    formatDecimal,
    formatPercent,
    formatDate,
    formatRelativeTime,
    
    // Translation utilities
    validateTranslationKey,
    getTranslationGroup,
    getTranslationKeys,
    getConditionalTranslation,
    
    // Specialized helpers
    getErrorMessage,
    getStatusMessage
  }
}