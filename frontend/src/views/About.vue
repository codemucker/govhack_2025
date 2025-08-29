<template>
  <div class="about">
    <h1>About LegalEase</h1>
    
    <div class="hero-section">
      <p class="hero-text">
        LegalEase is an AI-powered platform designed to simplify navigation of Australia's 
        complex regulatory landscape. Built for GovHack 2025, it helps citizens and businesses 
        understand their legal obligations across local, state, and federal jurisdictions.
      </p>
    </div>

    <div class="section">
      <h2>The Problem We Solve</h2>
      <div class="problem-grid">
        <div class="problem-item">
          <h3>🏛️ Complex Jurisdictions</h3>
          <p>500+ local councils, 8 states/territories, and dozens of federal agencies each with unique requirements</p>
        </div>
        <div class="problem-item">
          <h3>📚 Scattered Information</h3>
          <p>Regulations spread across hundreds of websites with technical legal language</p>
        </div>
        <div class="problem-item">
          <h3>⚖️ Conflicting Rules</h3>
          <p>Overlapping regulations between different levels of government create confusion</p>
        </div>
        <div class="problem-item">
          <h3>💰 High Costs</h3>
          <p>Small businesses spend 35+ hours monthly on compliance research</p>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Our Solution</h2>
      <div class="features-list">
        <div class="feature-item">
          <div class="feature-icon">🤖</div>
          <div class="feature-content">
            <h3>Natural Language Processing</h3>
            <p>Ask questions in plain English and get intelligent, context-aware responses</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🎯</div>
          <div class="feature-content">
            <h3>Smart Jurisdiction Mapping</h3>
            <p>Automatically identify relevant local, state, and federal requirements</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">⚡</div>
          <div class="feature-content">
            <h3>Conflict Resolution</h3>
            <p>Detect and explain regulatory overlaps with clear guidance on precedence</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">📋</div>
          <div class="feature-content">
            <h3>Actionable Guidance</h3>
            <p>Step-by-step checklists with direct links to forms and authority contacts</p>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Technology Stack</h2>
      <div class="tech-grid">
        <div class="tech-category">
          <h3>Frontend</h3>
          <ul>
            <li>Vue.js 3 with TypeScript</li>
            <li>Vite for fast development</li>
            <li>Responsive design</li>
            <li>Accessibility compliant</li>
          </ul>
        </div>
        <div class="tech-category">
          <h3>Backend</h3>
          <ul>
            <li>Encore.dev framework</li>
            <li>TypeScript services</li>
            <li>Serverless architecture</li>
            <li>Auto-scaling infrastructure</li>
          </ul>
        </div>
        <div class="tech-category">
          <h3>Data Sources</h3>
          <ul>
            <li>ABLIS API</li>
            <li>Federal Register of Legislation</li>
            <li>State planning portals</li>
            <li>Council databases</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>GovHack 2025 Challenge</h2>
      <div class="challenge-info">
        <h3>Primary Challenge: The Red Tape Navigator</h3>
        <p>
          "How might we help businesses and individuals identify and navigate overlapping 
          or conflicting regulations within and/or across local, state, and federal levels of government?"
        </p>
        
        <h4>Additional Challenges Addressed:</h4>
        <ul>
          <li>Using AI to Help Australians Navigate Government Services</li>
          <li>Making AI Decisions Understandable and Clear</li>
          <li>Community AI Agents: Bridging Service Access Gaps</li>
          <li>Connecting New Citizens to Australian Democracy</li>
        </ul>
      </div>
    </div>

    <div class="section">
      <h2>Team Democracy Sausage</h2>
      <div class="team-grid">
        <div class="team-member">
          <h3>Daniel Bryar</h3>
          <p class="role">Project Lead & Software Engineer</p>
          <p>Full-stack development, AI/ML, GovTech specialist</p>
          <a href="https://github.com/dbryar" target="_blank">@dbryar</a>
        </div>
        <div class="team-member">
          <h3>Bert Van Brakel</h3>
          <p class="role">Software Engineer</p>
          <p>Backend systems and data integration expert</p>
          <a href="https://github.com/codemucker" target="_blank">@codemucker</a>
        </div>
      </div>
    </div>

    <div class="section disclaimer-section">
      <h2>Important Disclaimer</h2>
      <div class="disclaimer-box">
        <p>
          <strong>LegalEase is an information discovery tool and does not provide legal advice.</strong>
          All information is sourced from publicly available government data and should be verified 
          with the relevant authorities. Users should consult with qualified legal professionals 
          for specific legal advice.
        </p>
        <p>
          This project was developed during GovHack 2025 and serves as a proof-of-concept 
          for improving government service accessibility through AI technology.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// About page component logic
</script>

<style scoped>
.about {
  max-width: 1000px;
  margin: 0 auto;
  line-height: 1.6;
}

.about h1 {
  text-align: center;
  color: #1f2937;
  margin-bottom: 2rem;
  font-size: 2.5rem;
}

.hero-section {
  text-align: center;
  margin-bottom: 3rem;
}

.hero-text {
  font-size: 1.25rem;
  color: #6b7280;
  max-width: 800px;
  margin: 0 auto;
}

.section {
  margin-bottom: 3rem;
}

.section h2 {
  color: #1f2937;
  border-bottom: 2px solid #059669;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
}

.problem-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.problem-item {
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 0.75rem;
  border-left: 4px solid #ef4444;
}

.problem-item h3 {
  color: #1f2937;
  margin-bottom: 0.5rem;
  font-size: 1.125rem;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.feature-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  background: #f0fdf4;
  padding: 1.5rem;
  border-radius: 0.75rem;
  border-left: 4px solid #059669;
}

.feature-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.feature-content h3 {
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.feature-content p {
  color: #6b7280;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.tech-category {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
}

.tech-category h3 {
  color: #1f2937;
  margin-bottom: 1rem;
  font-size: 1.25rem;
}

.tech-category ul {
  list-style: none;
  padding: 0;
}

.tech-category li {
  padding: 0.25rem 0;
  color: #6b7280;
  position: relative;
  padding-left: 1rem;
}

.tech-category li:before {
  content: "▸";
  color: #059669;
  position: absolute;
  left: 0;
}

.challenge-info {
  background: #eff6ff;
  padding: 2rem;
  border-radius: 0.75rem;
  border: 1px solid #3b82f6;
}

.challenge-info h3 {
  color: #1e40af;
  margin-bottom: 1rem;
}

.challenge-info h4 {
  color: #1f2937;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.challenge-info ul {
  margin-top: 0.5rem;
}

.challenge-info li {
  margin-bottom: 0.25rem;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.team-member {
  background: #f9fafb;
  padding: 2rem;
  border-radius: 0.75rem;
  text-align: center;
}

.team-member h3 {
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.role {
  color: #059669;
  font-weight: 600;
  margin-bottom: 1rem;
}

.team-member a {
  color: #3b82f6;
  text-decoration: none;
  font-family: monospace;
}

.team-member a:hover {
  text-decoration: underline;
}

.disclaimer-section {
  margin-top: 4rem;
}

.disclaimer-box {
  background: #fef3c7;
  border: 2px solid #f59e0b;
  border-radius: 0.75rem;
  padding: 2rem;
}

.disclaimer-box p {
  margin-bottom: 1rem;
}

.disclaimer-box p:last-child {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .about h1 {
    font-size: 2rem;
  }
  
  .hero-text {
    font-size: 1.125rem;
  }
  
  .problem-grid,
  .tech-grid,
  .team-grid {
    grid-template-columns: 1fr;
  }
  
  .feature-item {
    flex-direction: column;
    text-align: center;
  }
  
  .feature-icon {
    align-self: center;
  }
}
</style>