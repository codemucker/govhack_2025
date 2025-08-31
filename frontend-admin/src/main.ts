import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Dashboard from './views/Dashboard.vue'
import Documents from './views/Documents.vue'
import DocumentDetails from './views/DocumentDetails.vue'
import Queries from './views/Queries.vue'
import Authorities from './views/Authorities.vue'
import LegalTaxonomy from './views/LegalTaxonomy.vue'
import Jurisdictions from './views/Jurisdictions.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', component: Dashboard },
    { path: '/documents', component: Documents },
    { path: '/documents/:url', component: DocumentDetails, props: true },
    { path: '/queries', component: Queries },
    { path: '/jurisdictions', component: Jurisdictions },
    { path: '/authorities', component: Authorities },
    { path: '/legal-taxonomy', component: LegalTaxonomy },
  ]
})

const app = createApp(App)
app.use(router)
app.mount('#app')