<template>
  <div class="print-view" id="print-content">
    <!-- Print Header -->
    <header class="print-header">
      <h1>⚖️ LegalEase Report</h1>
      <p class="subtitle">AI-Powered Regulatory Requirements Analysis</p>
      <div class="report-meta">
        <p>Generated on: {{ formatDate(new Date()) }}</p>
        <p>Report ID: {{ reportId }}</p>
      </div>
    </header>

    <!-- Search Query Summary -->
    <section class="print-section query-section">
      <div class="query-summary avoid-break">
        <h3>Search Query</h3>
        <div class="query-details">
          <p><strong>Business Type:</strong> {{ searchData.businessType || 'Not specified' }}</p>
          <p><strong>Location:</strong> {{ searchData.address || 'Not specified' }}</p>
          <p><strong>Search Query:</strong> {{ searchData.query || 'General requirements search' }}</p>
          <p><strong>Date Searched:</strong> {{ formatDate(searchData.timestamp || Date.now()) }}</p>
        </div>
      </div>
    </section>

    <!-- Summary Statistics -->
    <section class="print-section stats-section">
      <h2>Summary</h2>
      <div class="stats-grid avoid-break">
        <div class="stat-box">
          <span class="stat-number">{{ results.requirements.length }}</span>
          <span class="stat-label">Requirements</span>
        </div>
        <div class="stat-box">
          <span class="stat-number">{{ results.conflicts.length }}</span>
          <span class="stat-label">Conflicts</span>
        </div>
        <div class="stat-box">
          <span class="stat-number">{{ uniqueJurisdictions.length }}</span>
          <span class="stat-label">Jurisdictions</span>
        </div>
        <div class="stat-box">
          <span class="stat-number">{{ estimatedTimeframe }}</span>
          <span class="stat-label">Est. Timeframe</span>
        </div>
      </div>
    </section>

    <!-- Requirements Checklist -->
    <section class="print-section requirements-section">
      <h2>Requirements Checklist</h2>
      <p>Complete this checklist as you progress through the regulatory requirements for your business.</p>
      
      <div class="checklist">
        <div
          v-for="(requirement, index) in results.requirements"
          :key="requirement.id || index"
          class="checklist-item avoid-break"
        >
          <div class="checklist-checkbox"></div>
          <div class="checklist-content">
            <h4>{{ index + 1 }}. {{ requirement.title }}</h4>
            <div class="requirement-meta">
              <span><strong>Authority:</strong> {{ requirement.authority }}</span> |
              <span><strong>Jurisdiction:</strong> {{ requirement.jurisdiction }}</span> |
              <span><strong>Status:</strong> {{ requirement.status }}</span>
            </div>
            <p class="requirement-description">{{ requirement.description }}</p>
            <div class="requirement-details">
              <p><strong>Estimated Time:</strong> {{ requirement.estimatedTime }}</p>
              <p><strong>Estimated Cost:</strong> {{ requirement.estimatedCost }}</p>
              <p v-if="requirement.website"><strong>More Info:</strong> {{ requirement.website }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Conflicts Section -->
    <section v-if="results.conflicts.length > 0" class="print-section conflicts-section page-break">
      <h2>⚠ Potential Conflicts & Issues</h2>
      <p>The following conflicts or issues have been identified that may require additional attention:</p>
      
      <div class="requirements-checklist">
        <div
          v-for="(conflict, index) in results.conflicts"
          :key="conflict.id || index"
          class="requirement-item avoid-break"
        >
          <h4>
            {{ index + 1 }}. {{ conflict.title }}
            <span :class="`conflict-severity severity-${conflict.severity}`">
              {{ conflict.severity }}
            </span>
          </h4>
          <p class="requirement-description">{{ conflict.description }}</p>
          <div v-if="conflict.resolution" class="resolution-steps">
            <strong>Recommended Resolution:</strong>
            <p>{{ conflict.resolution }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Jurisdiction Breakdown -->
    <section class="print-section jurisdictions-section">
      <h2>Jurisdiction Breakdown</h2>
      <p>Your business will need to comply with requirements from the following jurisdictions:</p>
      
      <table class="jurisdictions-table">
        <thead>
          <tr>
            <th>Jurisdiction</th>
            <th>Level</th>
            <th>Requirements Count</th>
            <th>Primary Contact</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="jurisdiction in jurisdictionBreakdown" :key="jurisdiction.name">
            <td>{{ jurisdiction.name }}</td>
            <td>{{ jurisdiction.level }}</td>
            <td>{{ jurisdiction.requirementCount }}</td>
            <td>{{ jurisdiction.contact }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Next Steps -->
    <section class="print-section next-steps-section">
      <h2>Recommended Next Steps</h2>
      <ol class="next-steps-list">
        <li><strong>Review Requirements:</strong> Carefully review each requirement in the checklist above</li>
        <li><strong>Verify Information:</strong> Contact relevant authorities to confirm current requirements and fees</li>
        <li><strong>Gather Documentation:</strong> Prepare all necessary documents for license and permit applications</li>
        <li><strong>Submit Applications:</strong> Begin the application process, starting with the most critical requirements</li>
        <li><strong>Track Progress:</strong> Monitor the status of your applications and follow up as needed</li>
        <li><strong>Stay Updated:</strong> Regularly check for changes to requirements that may affect your business</li>
      </ol>
    </section>

    <!-- Important Contacts -->
    <section class="print-section contacts-section avoid-break">
      <h2>Important Contacts</h2>
      <div class="contacts-grid">
        <div v-for="contact in importantContacts" :key="contact.name" class="contact-item">
          <h4>{{ contact.name }}</h4>
          <p v-if="contact.phone"><strong>Phone:</strong> {{ contact.phone }}</p>
          <p v-if="contact.website"><strong>Website:</strong> {{ contact.website }}</p>
          <p v-if="contact.email"><strong>Email:</strong> {{ contact.email }}</p>
        </div>
      </div>
    </section>

    <!-- Legal Disclaimer -->
    <section class="print-section disclaimer-section">
      <div class="disclaimer avoid-break">
        <h3>⚠ Important Legal Disclaimer</h3>
        <p>
          <strong>This report is for informational purposes only and does not constitute legal advice.</strong>
          LegalEase is an AI-powered information discovery tool that aggregates publicly available data from 
          government sources. All information should be independently verified with the relevant authorities 
          before making business decisions.
        </p>
        <p>
          Requirements, fees, and processes are subject to change. Users should consult with qualified legal 
          and business professionals for specific advice related to their circumstances.
        </p>
        <p>
          <strong>Data Sources:</strong> This report incorporates data from ABLIS (Australian Business Licence 
          and Information Service), Federal Register of Legislation, and various state and local government databases.
        </p>
      </div>
    </section>

    <!-- Footer with QR Code -->
    <footer class="print-footer">
      <div class="footer-content">
        <div class="footer-text">
          <p>© {{ new Date().getFullYear() }} LegalEase - GovHack 2025 Project by Team Democracy Sausage</p>
          <p>For the latest version of this report, visit: legalease.com.au/report/{{ reportId }}</p>
        </div>
        <div class="qr-code">
          <span>QR Code<br/>Digital Access</span>
        </div>
      </div>
    </footer>

    <!-- Page Numbers (CSS will handle this) -->
    <div class="page-numbers print-only"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  searchData: {
    query?: string
    address?: string
    businessType?: string
    timestamp?: number
  }
  results: {
    requirements: Array<{
      id?: string
      title: string
      authority: string
      jurisdiction: string
      status: string
      description: string
      estimatedTime: string
      estimatedCost: string
      website?: string
    }>
    conflicts: Array<{
      id?: string
      title: string
      description: string
      severity: 'low' | 'medium' | 'high'
      resolution?: string
    }>
  }
  metadata?: {
    reportId?: string
    generatedAt?: number
  }
}

const props = withDefaults(defineProps<Props>(), {
  searchData: () => ({
    query: '',
    address: '',
    businessType: '',
    timestamp: Date.now()
  }),
  results: () => ({
    requirements: [],
    conflicts: []
  }),
  metadata: () => ({
    reportId: generateReportId(),
    generatedAt: Date.now()
  })
})

/**
 * Generate a unique report ID
 */
function generateReportId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 7)
  return `LER-${timestamp}-${random}`.toUpperCase()
}

/**
 * Format date for display
 */
const formatDate = (timestamp: number | Date): string => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Get unique jurisdictions from requirements
 */
const uniqueJurisdictions = computed(() => {
  const jurisdictions = new Set<string>()
  props.results.requirements.forEach(req => {
    if (req.jurisdiction) {
      jurisdictions.add(req.jurisdiction)
    }
  })
  return Array.from(jurisdictions)
})

/**
 * Calculate estimated total timeframe
 */
const estimatedTimeframe = computed(() => {
  // This would normally be calculated from requirement data
  // For now, return a placeholder based on number of requirements
  const count = props.results.requirements.length
  if (count === 0) return 'N/A'
  if (count <= 3) return '2-4 weeks'
  if (count <= 6) return '1-2 months'
  if (count <= 10) return '2-3 months'
  return '3-6 months'
})

/**
 * Get report ID
 */
const reportId = computed(() => {
  return props.metadata?.reportId || generateReportId()
})

/**
 * Jurisdiction breakdown for table
 */
const jurisdictionBreakdown = computed(() => {
  const breakdown: Record<string, any> = {}
  
  props.results.requirements.forEach(req => {
    const jurisdiction = req.jurisdiction
    if (!breakdown[jurisdiction]) {
      breakdown[jurisdiction] = {
        name: jurisdiction,
        level: getJurisdictionLevel(jurisdiction),
        requirementCount: 0,
        contact: getJurisdictionContact(jurisdiction)
      }
    }
    breakdown[jurisdiction].requirementCount++
  })
  
  return Object.values(breakdown)
})

/**
 * Get jurisdiction level (Federal, State, Local)
 */
const getJurisdictionLevel = (jurisdiction: string): string => {
  if (jurisdiction.includes('Australia') || jurisdiction.includes('Federal')) return 'Federal'
  if (jurisdiction.includes('NSW') || jurisdiction.includes('VIC') || jurisdiction.includes('QLD')) return 'State'
  return 'Local'
}

/**
 * Get contact info for jurisdiction
 */
const getJurisdictionContact = (jurisdiction: string): string => {
  // This would normally be looked up from a database
  if (jurisdiction.includes('Sydney')) return 'sydney.nsw.gov.au'
  if (jurisdiction.includes('NSW')) return 'service.nsw.gov.au'
  if (jurisdiction.includes('Australia')) return 'business.gov.au'
  return 'Contact local office'
}

/**
 * Important contacts based on requirements
 */
const importantContacts = computed(() => {
  const contacts = [
    {
      name: 'Australian Business Register',
      phone: '13 28 66',
      website: 'abr.business.gov.au',
      email: null
    },
    {
      name: 'Business.gov.au',
      phone: '13 28 46',
      website: 'business.gov.au',
      email: 'info@business.gov.au'
    }
  ]
  
  // Add jurisdiction-specific contacts based on requirements
  const jurisdictions = uniqueJurisdictions.value
  jurisdictions.forEach(jurisdiction => {
    if (jurisdiction.includes('Sydney') && !contacts.find(c => c.name.includes('Sydney'))) {
      contacts.push({
        name: 'City of Sydney Council',
        phone: '02 9265 9333',
        website: 'sydney.nsw.gov.au',
        email: 'council@cityofsydney.nsw.gov.au'
      })
    }
  })
  
  return contacts
})
</script>

<style scoped>
/* Import print styles */
@import '../styles/print.css';

.print-view {
  background: white;
  color: #000;
  font-family: 'Times New Roman', serif;
  font-size: 12pt;
  line-height: 1.4;
  max-width: none;
  margin: 0;
  padding: 0;
}

/* Screen-specific styles for preview */
@media screen {
  .print-view {
    background: white;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
    margin: 2rem auto;
    max-width: 21cm;
    min-height: 29.7cm;
    padding: 2cm;
  }
}

/* Header Styles */
.print-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2pt solid #059669;
}

.print-header h1 {
  font-size: 24pt;
  font-weight: bold;
  color: #059669;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  font-size: 14pt;
  color: #666;
  margin: 0 0 1rem 0;
}

.report-meta p {
  margin: 0.2rem 0;
  font-size: 10pt;
  color: #666;
}

/* Section Styles */
.print-section {
  margin-bottom: 2rem;
}

.print-section h2 {
  font-size: 16pt;
  font-weight: bold;
  color: #333;
  border-left: 4pt solid #059669;
  padding-left: 0.5rem;
  margin: 0 0 1rem 0;
}

.print-section h3 {
  font-size: 14pt;
  font-weight: bold;
  color: #333;
  margin: 1rem 0 0.5rem 0;
}

/* Query Summary */
.query-summary {
  background: #f5f5f5;
  border: 1pt solid #ccc;
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 4px;
}

.query-details p {
  margin: 0.3rem 0;
}

/* Stats Grid */
.stats-grid {
  display: flex;
  justify-content: space-around;
  margin: 1rem 0;
  gap: 1rem;
}

.stat-box {
  text-align: center;
  border: 1pt solid #ccc;
  padding: 1rem;
  flex: 1;
  background: #f9f9f9;
}

.stat-number {
  font-size: 18pt;
  font-weight: bold;
  color: #059669;
  display: block;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 10pt;
  color: #666;
}

/* Checklist */
.checklist {
  margin: 1rem 0;
}

.checklist-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  page-break-inside: avoid;
}

.checklist-checkbox {
  width: 1rem;
  height: 1rem;
  border: 1pt solid #333;
  margin-right: 1rem;
  margin-top: 0.2rem;
  flex-shrink: 0;
}

.checklist-content {
  flex: 1;
}

.checklist-content h4 {
  font-size: 13pt;
  font-weight: bold;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.requirement-meta {
  font-size: 10pt;
  color: #666;
  margin: 0.3rem 0;
}

.requirement-description {
  font-size: 11pt;
  line-height: 1.3;
  margin: 0.5rem 0;
}

.requirement-details p {
  margin: 0.2rem 0;
  font-size: 10pt;
}

/* Conflicts */
.conflict-severity {
  display: inline-block;
  padding: 0.1rem 0.3rem;
  font-size: 9pt;
  font-weight: bold;
  text-transform: uppercase;
  margin-left: 0.5rem;
  border-radius: 2px;
}

.severity-high {
  background: #fee2e2;
  color: #dc2626;
  border: 1pt solid #dc2626;
}

.severity-medium {
  background: #fef3c7;
  color: #d97706;
  border: 1pt solid #d97706;
}

.severity-low {
  background: #e5e7eb;
  color: #6b7280;
  border: 1pt solid #6b7280;
}

/* Tables */
.jurisdictions-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.jurisdictions-table th,
.jurisdictions-table td {
  border: 1pt solid #ccc;
  padding: 0.5rem;
  text-align: left;
  vertical-align: top;
}

.jurisdictions-table th {
  background: #f5f5f5;
  font-weight: bold;
  font-size: 11pt;
}

.jurisdictions-table td {
  font-size: 10pt;
}

/* Next Steps */
.next-steps-list {
  margin: 1rem 0;
  padding-left: 2rem;
}

.next-steps-list li {
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

/* Contacts */
.contacts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.contact-item {
  border: 1pt solid #ccc;
  padding: 1rem;
  background: #f9f9f9;
}

.contact-item h4 {
  font-size: 12pt;
  margin: 0 0 0.5rem 0;
  color: #333;
}

.contact-item p {
  margin: 0.2rem 0;
  font-size: 10pt;
}

/* Disclaimer */
.disclaimer {
  background: #f0f0f0;
  border: 1pt solid #ccc;
  padding: 1rem;
  margin: 1rem 0;
  font-size: 10pt;
}

.disclaimer h3 {
  color: #dc2626;
  margin: 0 0 0.5rem 0;
  font-size: 12pt;
}

/* Footer */
.print-footer {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1pt solid #ccc;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-text {
  flex: 1;
}

.footer-text p {
  margin: 0.2rem 0;
  font-size: 9pt;
  color: #666;
}

.qr-code {
  width: 3rem;
  height: 3rem;
  border: 1pt solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8pt;
  color: #666;
  background: #f9f9f9;
  text-align: center;
  line-height: 1.2;
}

/* Responsive adjustments */
@media screen and (max-width: 768px) {
  .print-view {
    padding: 1rem;
    margin: 1rem;
  }
  
  .stats-grid {
    flex-direction: column;
  }
  
  .contacts-grid {
    grid-template-columns: 1fr;
  }
  
  .footer-content {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>