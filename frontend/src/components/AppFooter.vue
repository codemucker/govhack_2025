<template>
  <footer class="app-footer">
    <div class="footer-container">
      <!-- Main Footer Content -->
      <div class="footer-main">
        <!-- Brand Section -->
        <div class="footer-brand">
          <div class="brand-section">
            <div class="brand-icon">⚖️</div>
            <div class="brand-info">
              <h3 class="brand-name">LegalEase</h3>
              <p class="brand-description">
                AI-powered platform for navigating Australian regulatory requirements
              </p>
            </div>
          </div>
          
          <div class="govhack-badge">
            <span class="badge-icon">🏆</span>
            <div class="badge-info">
              <div class="badge-title">GovHack 2025</div>
              <div class="badge-subtitle">Competition Entry</div>
            </div>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="footer-links">
          <div class="links-column">
            <h4 class="links-title">Navigation</h4>
            <nav class="links-list">
              <router-link to="/" class="footer-link">Home</router-link>
              <router-link to="/search" class="footer-link">Search Requirements</router-link>
              <router-link to="/about" class="footer-link">About LegalEase</router-link>
            </nav>
          </div>

          <div class="links-column">
            <h4 class="links-title">Competition</h4>
            <div class="links-list">
              <a 
                href="https://www.govhack.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                class="footer-link external-link"
              >
                GovHack Official Site
                <span class="external-icon">↗</span>
              </a>
              <a 
                href="https://github.com/codemucker/govhack_2025" 
                target="_blank" 
                rel="noopener noreferrer"
                class="footer-link external-link"
              >
                Source Code
                <span class="external-icon">↗</span>
              </a>
            </div>
          </div>

          <div class="links-column">
            <h4 class="links-title">Data Sources</h4>
            <div class="links-list">
              <a 
                href="https://ablis.business.gov.au/" 
                target="_blank" 
                rel="noopener noreferrer"
                class="footer-link external-link"
              >
                ABLIS
                <span class="external-icon">↗</span>
              </a>
              <a 
                href="https://www.legislation.gov.au/" 
                target="_blank" 
                rel="noopener noreferrer"
                class="footer-link external-link"
              >
                Federal Register
                <span class="external-icon">↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Team Section -->
      <div class="footer-team">
        <div class="team-header">
          <h4 class="team-title">Team Democracy Sausage</h4>
          <span class="team-subtitle">GovHack 2025 Participants</span>
        </div>
        
        <div class="team-members">
          <div class="team-member">
            <div class="member-info">
              <span class="member-name">Daniel Bryar</span>
              <span class="member-role">Project Lead & Software Engineer</span>
            </div>
            <a 
              href="https://github.com/dbryar" 
              target="_blank" 
              rel="noopener noreferrer"
              class="member-link"
              aria-label="Daniel Bryar GitHub Profile"
            >
              <span class="github-icon">🔗</span>
            </a>
          </div>
          
          <div class="team-member">
            <div class="member-info">
              <span class="member-name">Bert Van Brakel</span>
              <span class="member-role">Software Engineer</span>
            </div>
            <a 
              href="https://github.com/codemucker" 
              target="_blank" 
              rel="noopener noreferrer"
              class="member-link"
              aria-label="Bert Van Brakel GitHub Profile"
            >
              <span class="github-icon">🔗</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Legal Disclaimers -->
      <div class="footer-legal">
        <div class="disclaimer-section">
          <h4 class="disclaimer-title">
            <span class="warning-icon">⚠️</span>
            Important Legal Disclaimer
          </h4>
          <p class="disclaimer-text">
            <strong>LegalEase is an information discovery tool and does not provide legal advice.</strong> 
            All information is sourced from publicly available government data and should be verified 
            with the relevant authorities. Users should consult with qualified legal professionals 
            for specific legal advice.
          </p>
          <p class="disclaimer-text">
            This project was developed during GovHack 2025 and serves as a proof-of-concept for 
            improving government service accessibility through AI technology.
          </p>
        </div>

        <div class="data-attribution">
          <h5 class="attribution-title">Data Attribution</h5>
          <p class="attribution-text">
            This application uses data from Australian government sources including ABLIS 
            (Australian Business Licence and Information Service), the Federal Register of 
            Legislation, and various state and local government databases.
          </p>
        </div>
      </div>

      <!-- Footer Bottom -->
      <div class="footer-bottom">
        <div class="copyright">
          <span class="copyright-text">
            © {{ currentYear }} LegalEase - GovHack 2025 Project by Team Democracy Sausage
          </span>
        </div>
        
        <div class="footer-meta">
          <span class="build-info">
            Built with ❤️ for accessible government services
          </span>
          <div class="tech-stack">
            <span class="tech-item">Vue.js</span>
            <span class="tech-divider">•</span>
            <span class="tech-item">TypeScript</span>
            <span class="tech-divider">•</span>
            <span class="tech-item">Encore.dev</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
.app-footer {
  background: var(--footer-bg, #f9fafb);
  border-top: 1px solid var(--border-color, #e5e7eb);
  margin-top: auto;
  color: var(--text-primary, #1f2937);
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1rem 1.5rem;
}

/* Main Footer Content */
.footer-main {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 3rem;
  margin-bottom: 3rem;
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.brand-section {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.brand-icon {
  font-size: 2rem;
  line-height: 1;
}

.brand-info {
  flex: 1;
}

.brand-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary, #1f2937);
}

.brand-description {
  color: var(--text-secondary, #6b7280);
  font-size: 0.9375rem;
  line-height: 1.5;
  margin: 0;
}

.govhack-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--accent-bg, #dbeafe);
  border: 1px solid var(--accent-border, #93c5fd);
  border-radius: 0.75rem;
  max-width: fit-content;
}

.badge-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.badge-title {
  font-weight: 600;
  color: var(--accent-text, #1d4ed8);
  font-size: 0.9375rem;
}

.badge-subtitle {
  font-size: 0.8125rem;
  color: var(--accent-text-muted, #1e40af);
}

/* Footer Links */
.footer-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.links-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.links-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.footer-link {
  color: var(--text-secondary, #6b7280);
  text-decoration: none;
  font-size: 0.9375rem;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.footer-link:hover {
  color: var(--primary-color, #059669);
}

.external-link {
  align-items: center;
}

.external-icon {
  font-size: 0.75rem;
  opacity: 0.7;
}

/* Team Section */
.footer-team {
  margin-bottom: 3rem;
  padding: 2rem;
  background: var(--team-bg, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.75rem;
}

.team-header {
  text-align: center;
  margin-bottom: 2rem;
}

.team-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary, #1f2937);
  margin: 0 0 0.5rem 0;
}

.team-subtitle {
  color: var(--text-secondary, #6b7280);
  font-size: 0.9375rem;
}

.team-members {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.team-member {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  background: var(--member-bg, #f8fafc);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.team-member:hover {
  border-color: var(--primary-color, #059669);
  box-shadow: 0 2px 4px rgba(5, 150, 105, 0.1);
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.member-name {
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  font-size: 1rem;
}

.member-role {
  color: var(--text-secondary, #6b7280);
  font-size: 0.875rem;
}

.member-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.5rem;
  background: var(--button-bg, #ffffff);
  color: var(--text-secondary, #6b7280);
  text-decoration: none;
  transition: all 0.2s ease;
}

.member-link:hover {
  border-color: var(--primary-color, #059669);
  color: var(--primary-color, #059669);
  transform: scale(1.05);
}

.github-icon {
  font-size: 1.125rem;
}

/* Legal Disclaimers */
.footer-legal {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.disclaimer-section {
  padding: 2rem;
  background: var(--warning-bg, #fef3c7);
  border: 1px solid var(--warning-border, #f59e0b);
  border-radius: 0.75rem;
}

.disclaimer-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--warning-text, #92400e);
  margin: 0 0 1rem 0;
}

.warning-icon {
  font-size: 1.125rem;
}

.disclaimer-text {
  color: var(--warning-text, #92400e);
  font-size: 0.9375rem;
  line-height: 1.6;
  margin: 0 0 1rem 0;
}

.disclaimer-text:last-child {
  margin-bottom: 0;
}

.data-attribution {
  padding: 1.5rem;
  background: var(--info-bg, #f0f9ff);
  border: 1px solid var(--info-border, #0ea5e9);
  border-radius: 0.5rem;
}

.attribution-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--info-text, #0c4a6e);
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.attribution-text {
  color: var(--info-text, #0c4a6e);
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
}

/* Footer Bottom */
.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color, #e5e7eb);
  flex-wrap: wrap;
  gap: 1rem;
}

.copyright-text {
  color: var(--text-secondary, #6b7280);
  font-size: 0.875rem;
}

.footer-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.build-info {
  color: var(--text-secondary, #6b7280);
  font-size: 0.875rem;
}

.tech-stack {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--text-tertiary, #9ca3af);
}

.tech-item {
  font-weight: 500;
}

.tech-divider {
  opacity: 0.5;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .footer-main {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .footer-links {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .footer-container {
    padding: 2rem 1rem 1rem;
  }

  .footer-main {
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .footer-links {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .team-members {
    grid-template-columns: 1fr;
  }

  .footer-bottom {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1rem;
  }

  .footer-meta {
    align-items: center;
  }

  .govhack-badge {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .brand-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.75rem;
  }

  .disclaimer-section,
  .footer-team {
    padding: 1.5rem;
  }

  .team-member {
    padding: 1rem;
  }
}
</style>