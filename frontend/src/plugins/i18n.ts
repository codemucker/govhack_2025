import { createI18n } from 'vue-i18n'
import type { App } from 'vue'

// Import translation files
import en from '../locales/en.json'
import zh from '../locales/zh.json'
import ar from '../locales/ar.json'

export type MessageLanguages = keyof typeof en
export type MessageSchema = typeof en

// Supported locales
export const SUPPORT_LOCALES = ['en', 'zh', 'ar'] as const
export type SupportLocale = typeof SUPPORT_LOCALES[number]

// Default locale
export const DEFAULT_LOCALE: SupportLocale = 'en'

// RTL languages
export const RTL_LANGUAGES = ['ar'] as const

// Get saved locale or browser preference
function getStartLocale(): SupportLocale {
  // Check localStorage first
  const saved = localStorage.getItem('user-locale')
  if (saved && SUPPORT_LOCALES.includes(saved as SupportLocale)) {
    return saved as SupportLocale
  }

  // Check browser language
  const browserLang = navigator.language.split('-')[0]
  if (SUPPORT_LOCALES.includes(browserLang as SupportLocale)) {
    return browserLang as SupportLocale
  }

  return DEFAULT_LOCALE
}

// Configure number formats for each locale
const numberFormats = {
  en: {
    currency: {
      style: 'currency',
      currency: 'AUD',
      notation: 'standard'
    },
    decimal: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    },
    percent: {
      style: 'percent',
      useGrouping: false
    }
  },
  zh: {
    currency: {
      style: 'currency',
      currency: 'AUD',
      notation: 'standard'
    },
    decimal: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    },
    percent: {
      style: 'percent',
      useGrouping: false
    }
  },
  ar: {
    currency: {
      style: 'currency',
      currency: 'AUD',
      notation: 'standard'
    },
    decimal: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    },
    percent: {
      style: 'percent',
      useGrouping: false
    }
  }
}

// Configure date-time formats for each locale
const datetimeFormats = {
  en: {
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    },
    long: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric'
    }
  },
  zh: {
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    },
    long: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric'
    }
  },
  ar: {
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    },
    long: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric'
    }
  }
}

// Create i18n instance
export const i18n = createI18n<[MessageSchema], SupportLocale>({
  locale: getStartLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  legacy: false,
  globalInjection: true,
  messages: {
    en,
    zh,
    ar
  },
  numberFormats,
  datetimeFormats
})

// Set document language and direction
export function setI18nLanguage(locale: SupportLocale) {
  if (i18n.mode === 'legacy') {
    i18n.global.locale = locale
  } else {
    ;(i18n.global.locale as any).value = locale
  }
  
  // Set document attributes
  document.querySelector('html')?.setAttribute('lang', locale)
  
  // Set text direction for RTL languages
  const isRTL = RTL_LANGUAGES.includes(locale as any)
  document.querySelector('html')?.setAttribute('dir', isRTL ? 'rtl' : 'ltr')
  document.documentElement.classList.toggle('rtl', isRTL)
  
  // Save preference
  localStorage.setItem('user-locale', locale)
}

// Initialize language settings
export function initializeI18n() {
  setI18nLanguage(i18n.global.locale.value as SupportLocale)
}

// Plugin installation function
export function setupI18n(app: App) {
  app.use(i18n)
  initializeI18n()
}

export default i18n