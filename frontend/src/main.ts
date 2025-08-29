import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'
import './styles/accessibility.css'
import './styles/rtl.css'
import { setupI18n } from './plugins/i18n'

// Simple routing setup
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('./views/Home.vue')
    },
    {
      path: '/search',
      name: 'Search',
      component: () => import('./views/Search.vue')
    },
    {
      path: '/about',
      name: 'About',
      component: () => import('./views/About.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('./views/NotFound.vue')
    }
  ]
})

const pinia = createPinia()
const app = createApp(App)

// Setup plugins
app.use(router)
app.use(pinia)
setupI18n(app)

app.mount('#app')