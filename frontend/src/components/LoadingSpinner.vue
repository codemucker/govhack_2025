<template>
  <div 
    class="loading-spinner"
    :class="[
      `size-${size}`,
      `variant-${variant}`,
      { 'with-text': text }
    ]"
    role="status"
    :aria-label="ariaLabel || $t('common.loading')"
  >
    <!-- Spinner animation -->
    <div class="spinner" :class="spinnerClass">
      <!-- Default spinner (circular) -->
      <svg
        v-if="variant === 'spinner'"
        class="spinner-svg"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          class="spinner-track"
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
        />
        <circle
          class="spinner-fill"
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
          stroke-linecap="round"
          stroke-dasharray="56.5486"
          stroke-dashoffset="56.5486"
        />
      </svg>

      <!-- Dots spinner -->
      <div v-else-if="variant === 'dots'" class="dots-container">
        <div class="dot" v-for="i in 3" :key="i"></div>
      </div>

      <!-- Pulse spinner -->
      <div v-else-if="variant === 'pulse'" class="pulse-container">
        <div class="pulse-dot"></div>
      </div>

      <!-- Bars spinner -->
      <div v-else-if="variant === 'bars'" class="bars-container">
        <div class="bar" v-for="i in 4" :key="i"></div>
      </div>

      <!-- Ring spinner -->
      <div v-else-if="variant === 'ring'" class="ring-container">
        <div class="ring"></div>
      </div>

      <!-- Wave spinner -->
      <div v-else-if="variant === 'wave'" class="wave-container">
        <div class="wave-bar" v-for="i in 5" :key="i"></div>
      </div>
    </div>

    <!-- Loading text -->
    <div v-if="text" class="spinner-text">
      {{ text }}
    </div>

    <!-- Screen reader only text -->
    <span class="sr-only">{{ ariaLabel || $t('common.loading') }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'

interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'ring' | 'wave'
  color?: 'primary' | 'secondary' | 'white' | 'current'
  text?: string
  ariaLabel?: string
  inline?: boolean
  centered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'spinner',
  color: 'primary',
  text: '',
  ariaLabel: '',
  inline: false,
  centered: false
})

const { t } = useI18n()

const spinnerClass = computed(() => [
  `color-${props.color}`,
  { 'inline': props.inline, 'centered': props.centered }
])
</script>

<style scoped>
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--space-2);
}

.loading-spinner.with-text {
  gap: var(--space-3);
}

.spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner.inline {
  display: inline-flex;
}

.spinner.centered {
  width: 100%;
  height: 100%;
}

/* Size variants */
.size-xs .spinner {
  width: 16px;
  height: 16px;
}

.size-sm .spinner {
  width: 20px;
  height: 20px;
}

.size-md .spinner {
  width: 24px;
  height: 24px;
}

.size-lg .spinner {
  width: 32px;
  height: 32px;
}

.size-xl .spinner {
  width: 48px;
  height: 48px;
}

/* Color variants */
.color-primary {
  color: var(--color-primary);
}

.color-secondary {
  color: var(--color-text-secondary);
}

.color-white {
  color: white;
}

.color-current {
  color: currentColor;
}

/* Spinner variant */
.spinner-svg {
  width: 100%;
  height: 100%;
  animation: spin 1s linear infinite;
}

.spinner-track {
  opacity: 0.2;
}

.spinner-fill {
  animation: dash 1.5s ease-in-out infinite;
  stroke-dasharray: 56.5486;
  stroke-dashoffset: 56.5486;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dashoffset: 56.5486;
  }
  50% {
    stroke-dashoffset: 14.1372;
  }
  100% {
    stroke-dashoffset: 56.5486;
  }
}

/* Dots variant */
.dots-container {
  display: flex;
  gap: 4px;
}

.dot {
  width: 20%;
  height: 20%;
  background: currentColor;
  border-radius: 50%;
  animation: dot-bounce 1.4s ease-in-out infinite both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }
.dot:nth-child(3) { animation-delay: 0s; }

@keyframes dot-bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

/* Pulse variant */
.pulse-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-dot {
  width: 100%;
  height: 100%;
  background: currentColor;
  border-radius: 50%;
  animation: pulse-scale 1s ease-in-out infinite;
}

@keyframes pulse-scale {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

/* Bars variant */
.bars-container {
  display: flex;
  gap: 2px;
  align-items: end;
  height: 100%;
}

.bar {
  width: 3px;
  height: 100%;
  background: currentColor;
  border-radius: 1px;
  animation: bar-scale 1.2s ease-in-out infinite;
}

.bar:nth-child(1) { animation-delay: -0.45s; }
.bar:nth-child(2) { animation-delay: -0.3s; }
.bar:nth-child(3) { animation-delay: -0.15s; }
.bar:nth-child(4) { animation-delay: 0s; }

@keyframes bar-scale {
  0%, 40%, 100% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1);
  }
}

/* Ring variant */
.ring-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring {
  width: 100%;
  height: 100%;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: ring-spin 1s linear infinite;
}

@keyframes ring-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Wave variant */
.wave-container {
  display: flex;
  gap: 2px;
  align-items: center;
  height: 100%;
}

.wave-bar {
  width: 2px;
  height: 50%;
  background: currentColor;
  border-radius: 1px;
  animation: wave-scale 1.2s ease-in-out infinite;
}

.wave-bar:nth-child(1) { animation-delay: -0.4s; }
.wave-bar:nth-child(2) { animation-delay: -0.3s; }
.wave-bar:nth-child(3) { animation-delay: -0.2s; }
.wave-bar:nth-child(4) { animation-delay: -0.1s; }
.wave-bar:nth-child(5) { animation-delay: 0s; }

@keyframes wave-scale {
  0%, 40%, 100% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1);
  }
}

/* Text styling */
.spinner-text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-weight: 500;
  text-align: center;
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Size-specific adjustments */
.size-xs .dots-container .dot {
  width: 3px;
  height: 3px;
}

.size-sm .dots-container .dot {
  width: 4px;
  height: 4px;
}

.size-md .dots-container .dot {
  width: 5px;
  height: 5px;
}

.size-lg .dots-container .dot {
  width: 6px;
  height: 6px;
}

.size-xl .dots-container .dot {
  width: 8px;
  height: 8px;
}

.size-xs .bars-container .bar {
  width: 2px;
}

.size-sm .bars-container .bar {
  width: 2px;
}

.size-md .bars-container .bar {
  width: 3px;
}

.size-lg .bars-container .bar {
  width: 4px;
}

.size-xl .bars-container .bar {
  width: 5px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .spinner-svg,
  .dot,
  .pulse-dot,
  .bar,
  .ring,
  .wave-bar {
    animation: none;
  }
  
  /* Show a static indicator instead */
  .spinner-svg .spinner-fill {
    stroke-dasharray: none;
    stroke-dashoffset: 0;
    opacity: 0.8;
  }
  
  .dot {
    opacity: 0.8;
  }
  
  .pulse-dot {
    transform: scale(0.8);
    opacity: 0.8;
  }
  
  .bar {
    transform: scaleY(0.8);
    opacity: 0.8;
  }
  
  .wave-bar {
    transform: scaleY(0.8);
    opacity: 0.8;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .color-primary {
    color: ButtonText;
  }
  
  .color-secondary {
    color: ButtonText;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .spinner-text {
    color: var(--color-text-secondary-dark);
  }
}
</style>