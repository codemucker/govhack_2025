/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Global test setup
    setupFiles: ['./src/test-setup.ts'],
    
    // Include patterns
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      'public',
      '.nuxt',
      '.output',
      '.vercel',
      '.netlify'
    ],
    
    // Test globals
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'public/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/test-setup.ts',
        'src/utils/testHelpers.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // Component-specific thresholds
        'src/components/': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        },
        'src/composables/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    },
    
    // Watch options
    watch: {
      exclude: [
        'node_modules/**',
        'dist/**',
        'public/**',
        'coverage/**'
      ]
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Concurrent tests
    maxConcurrency: 5,
    
    // Reporter configuration
    reporter: process.env.CI ? ['junit', 'github-actions'] : ['verbose'],
    outputFile: {
      junit: './test-results/junit.xml'
    },
    
    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    
    // Server configuration for testing
    server: {
      deps: {
        inline: [
          '@vue/test-utils'
        ]
      }
    }
  },
  
  // Resolve configuration for tests
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '~': resolve(__dirname, './src'),
      'vue': 'vue/dist/vue.esm-bundler.js'
    }
  },
  
  // Define configuration for tests
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
  },
  
  // Esbuild configuration
  esbuild: {
    target: 'node14'
  }
})