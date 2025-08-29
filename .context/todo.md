# GovHack 2025: LegalEase - Competition Runsheet

## Competition Timeline

- **Start**: Friday 30/08/2025 @ 7:00pm
- **Development**: Saturday 31/08/2025 (full day)
- **Submission Deadline**: Sunday 01/09/2025 @ 5:00pm

## Required Deliverables

1. ✅ Team registration in Hackerspace
2. ✅ Project page with description
3. ✅ Challenge category selection (Primary: The Red Tape Navigator)
4. ✅ Open data source URLs (ABLIS, Legislation registers, Council data)
5. 🚧 Working prototype/demo (Vue.js + Encore.dev) - **IN PROGRESS**
6. ⏳ 3-minute video pitch
7. ✅ Evidence repository URL (GitHub) - Repository configured

---

## AGENT WORK ALLOCATION

### Agent 1: Backend Services (TypeScript/Encore.dev)
**Focus**: API services, data integration, business logic
**Directory**: `/api/*`
**Commit Branch**: `feature/backend-services`
**Status**: ✅ Foundation complete, 🚧 Core features in progress

### Agent 2: Frontend Application (Vue.js/TypeScript)
**Focus**: UI components, user experience, visualizations
**Directory**: `/frontend/*`
**Commit Branch**: `feature/frontend-app`
**Status**: ✅ Foundation complete, 🚧 Core features in progress

### Shared Resources (Coordinate via main branch)
- `/docs/*` - Documentation (read-only for both)
- `/.context/*` - Project context (read-only for both)
- `/shared/types/*` - TypeScript interfaces (Agent 1 creates, Agent 2 consumes)

---

## Day 1: Friday 30/08/2025 (Evening 7pm-11pm)

### Setup & Planning (7:00pm - 8:30pm) [BOTH AGENTS]

- [ ] **Team Registration**
  - [ ] Complete Hackerspace team setup
  - [ ] Select "The Red Tape Navigator" as primary challenge
  - [ ] Add secondary challenges (AI transparency, Community agents, etc.)

- [x] **Repository Setup** [Agent 1]
  - [x] Initialize Git repository with develop branch
  - [x] Create feature branches for each agent
  - [x] Set up .gitignore for TypeScript/Node projects
  - [x] Create directory structure per architecture

- [ ] **Data Source Research** [Agent 2]
  - [ ] Document ABLIS API endpoints
  - [ ] Map Federal Register of Legislation structure
  - [ ] Identify NSW, VIC, QLD planning portal APIs
  - [ ] List council data sources (at least 5 major councils)

### Initial Development (8:30pm - 11:00pm)

#### Agent 1: Backend Foundation
- [x] **Encore.dev Setup**
  - [x] Initialize Encore.dev TypeScript project
  - [x] Create service structure:
    - [x] `/api/hello.ts` - Health check endpoints
    - [x] `/api/triage.ts` - Query processing
    - [x] `/api/site.ts` - Homepage endpoint
  - [x] Define TypeScript interfaces for API contracts
  - [x] Implement health check endpoint
  - [x] **COMMIT**: "feat: Initialize Encore.dev backend structure"

#### Agent 2: Frontend Foundation
- [x] **Vue.js Setup**
  - [x] Initialize Vue 3 project with Vite and TypeScript
  - [x] Install core dependencies (Vue Router, Pinia)
  - [x] Create component structure:
    - [x] `/frontend/src/views` - Page components (Home, Search, About)
    - [x] `/frontend/src/components` - Reusable components
    - [x] Vue Router configuration
  - [x] Basic styling setup
  - [x] **COMMIT**: "feat: Initialize Vue.js frontend structure"

---

---

## CURRENT DEVELOPMENT PHASE: Core Implementation

**Status**: Git Flow setup complete, foundation in place, ready for core feature development
**Next**: Implement AI triage service and search interface

---

## Day 2: Saturday 31/08/2025 (Full Development Day)

### Morning Session (8:00am - 12:00pm) - **CURRENT FOCUS**

#### Agent 1: Core Services Implementation
- [ ] **Triage Service** (8:00am - 9:30am)
  - [ ] Implement natural language parser
  - [ ] Create entity extraction (location, activity, industry)
  - [ ] Build intent classifier
  - [ ] Add confidence scoring
  - [ ] **COMMIT**: "feat: Implement triage service with NLP"

- [ ] **Jurisdiction Service** (9:30am - 11:00am)
  - [ ] Build address to council mapper
  - [ ] Implement state/territory resolver
  - [ ] Add overlay detection (heritage, flood zones)
  - [ ] Create conflict detection logic
  - [ ] **COMMIT**: "feat: Add jurisdiction resolution service"

- [ ] **Router Service** (11:00am - 12:00pm)
  - [ ] Implement domain classification
  - [ ] Create specialist profile routing
  - [ ] Add multi-domain handling
  - [ ] **COMMIT**: "feat: Add domain routing service"

#### Agent 2: User Interface Development
- [ ] **Search Interface** (8:00am - 9:30am)
  - [ ] Create main search component with autocomplete
  - [ ] Add address input with validation
  - [ ] Implement query history/suggestions
  - [ ] Add loading states and animations
  - [ ] **COMMIT**: "feat: Implement search interface"

- [ ] **Results Display** (9:30am - 11:00am)
  - [ ] Build requirements checklist component
  - [ ] Create timeline visualization
  - [ ] Add conflict warning displays
  - [ ] Implement expandable details
  - [ ] **COMMIT**: "feat: Add results display components"

- [ ] **Navigation & Layout** (11:00am - 12:00pm)
  - [ ] Create app header with branding
  - [ ] Add responsive navigation
  - [ ] Build footer with disclaimers
  - [ ] Implement dark mode toggle
  - [ ] **COMMIT**: "feat: Add navigation and layout"

### Afternoon Session (1:00pm - 6:00pm)

#### Agent 1: Data Integration & Processing
- [ ] **Source Adapters** (1:00pm - 3:00pm)
  - [ ] ABLIS integration adapter
  - [ ] Legislation register connector
  - [ ] Council API adapters (Brisbane, Sydney, Melbourne)
  - [ ] Caching layer with Redis
  - [ ] **COMMIT**: "feat: Add government data source adapters"

- [ ] **Compose Service** (3:00pm - 4:30pm)
  - [ ] Build response formatter
  - [ ] Create JSON contract implementation
  - [ ] Add citation management
  - [ ] Implement confidence aggregation
  - [ ] **COMMIT**: "feat: Add response composition service"

- [ ] **API Gateway** (4:30pm - 6:00pm)
  - [ ] Implement main API endpoints
  - [ ] Add rate limiting
  - [ ] Configure CORS policies
  - [ ] Add request validation
  - [ ] **COMMIT**: "feat: Complete API gateway"

#### Agent 2: Advanced UI Features
- [ ] **Interactive Features** (1:00pm - 3:00pm)
  - [ ] Add step-by-step wizard mode
  - [ ] Implement progress tracking
  - [ ] Create save/export functionality
  - [ ] Add print-friendly view
  - [ ] **COMMIT**: "feat: Add interactive features"

- [ ] **Data Visualizations** (3:00pm - 4:30pm)
  - [ ] Create jurisdiction map component
  - [ ] Add requirements timeline chart
  - [ ] Build confidence meter displays
  - [ ] Implement cost calculator
  - [ ] **COMMIT**: "feat: Add data visualizations"

- [ ] **Accessibility & i18n** (4:30pm - 6:00pm)
  - [ ] Implement WCAG 2.1 AA compliance
  - [ ] Add keyboard navigation
  - [ ] Create screen reader support
  - [ ] Add basic multi-language support (EN, ZH, AR)
  - [ ] **COMMIT**: "feat: Add accessibility and i18n"

### Evening Session (7:00pm - 10:00pm)

#### Agent 1: Testing & Optimization
- [ ] **API Testing** (7:00pm - 8:30pm)
  - [ ] Unit tests for core services
  - [ ] Integration tests for data adapters
  - [ ] Load testing with sample queries
  - [ ] **COMMIT**: "test: Add backend test coverage"

- [ ] **Performance Optimization** (8:30pm - 10:00pm)
  - [ ] Implement response caching
  - [ ] Add database indexing
  - [ ] Optimize query processing
  - [ ] **COMMIT**: "perf: Optimize backend performance"

#### Agent 2: Polish & Responsiveness
- [ ] **Mobile Optimization** (7:00pm - 8:30pm)
  - [ ] Responsive design for all screen sizes
  - [ ] Touch-friendly interactions
  - [ ] Mobile-specific navigation
  - [ ] **COMMIT**: "feat: Add mobile responsiveness"

- [ ] **Error Handling & Feedback** (8:30pm - 10:00pm)
  - [ ] User-friendly error messages
  - [ ] Offline mode detection
  - [ ] Feedback collection form
  - [ ] Help tooltips and onboarding
  - [ ] **COMMIT**: "feat: Add error handling and user feedback"

---

## Day 3: Sunday 01/09/2025 (Submission Day)

### Morning Session (8:00am - 12:00pm)

#### Agent 1: Deployment & Documentation
- [ ] **Deployment** (8:00am - 9:30am)
  - [ ] Deploy to Encore.dev cloud
  - [ ] Configure production environment
  - [ ] Set up monitoring and logging
  - [ ] Verify all endpoints working
  - [ ] **COMMIT**: "deploy: Production deployment"

- [ ] **API Documentation** (9:30am - 11:00am)
  - [ ] Generate OpenAPI specification
  - [ ] Create API usage examples
  - [ ] Document authentication flow
  - [ ] **COMMIT**: "docs: Add API documentation"

- [ ] **Demo Data Setup** (11:00am - 12:00pm)
  - [ ] Load sample queries and responses
  - [ ] Create showcase scenarios
  - [ ] Prepare performance metrics
  - [ ] **COMMIT**: "feat: Add demo data"

#### Agent 2: Frontend Deployment & Demo
- [ ] **Frontend Deployment** (8:00am - 9:30am)
  - [ ] Build production bundle
  - [ ] Deploy to Vercel/Netlify
  - [ ] Configure custom domain
  - [ ] Verify all features working
  - [ ] **COMMIT**: "deploy: Frontend production deployment"

- [ ] **Demo Scenarios** (9:30am - 11:00am)
  - [ ] Create guided tour feature
  - [ ] Add example queries showcase
  - [ ] Implement success story displays
  - [ ] **COMMIT**: "feat: Add demo scenarios"

- [ ] **Visual Polish** (11:00am - 12:00pm)
  - [ ] Final UI/UX improvements
  - [ ] Loading animations
  - [ ] Micro-interactions
  - [ ] **COMMIT**: "style: Final visual polish"

### Video Production (12:00pm - 4:00pm) [BOTH AGENTS COLLABORATE]

- [ ] **Script Writing** (12:00pm - 12:30pm)
  - [ ] Problem statement (30 seconds)
  - [ ] Solution demonstration (90 seconds)
  - [ ] Impact and benefits (45 seconds)
  - [ ] Technical innovation (30 seconds)
  - [ ] Call to action (15 seconds)

- [ ] **Screen Recording** (12:30pm - 2:00pm)
  - [ ] Record user journey: "Opening a café in Surry Hills"
  - [ ] Capture conflict resolution example
  - [ ] Show multi-language support
  - [ ] Demonstrate mobile responsiveness

- [ ] **Video Editing** (2:00pm - 3:30pm)
  - [ ] Edit to exactly 3 minutes
  - [ ] Add captions and annotations
  - [ ] Include team credits
  - [ ] Export in MP4 format

- [ ] **Upload & Backup** (3:30pm - 4:00pm)
  - [ ] Upload to YouTube (unlisted)
  - [ ] Upload to Vimeo as backup
  - [ ] Save local copy

### Final Submission (4:00pm - 5:00pm) [BOTH AGENTS]

- [ ] **Hackerspace Submission**
  - [ ] Update project page with final description
  - [ ] Add all data source URLs
  - [ ] Include demo link
  - [ ] Add video link
  - [ ] Link GitHub repository

- [ ] **Final Checks**
  - [ ] Demo site accessible
  - [ ] API endpoints responding
  - [ ] Video playing correctly
  - [ ] GitHub repo public
  - [ ] All links working

- [ ] **Submit by 4:45pm** (15-minute buffer)

---

## Key Data Sources

### Priority 1 (Must Have)
- [ ] ABLIS Business Licence API
- [ ] Federal Register of Legislation
- [ ] At least 3 state planning portals
- [ ] At least 5 council websites

### Priority 2 (Should Have)
- [ ] ABS demographic data
- [ ] Spatial planning overlays
- [ ] Industry classification codes
- [ ] Government service directories

### Priority 3 (Nice to Have)
- [ ] Historical regulation changes
- [ ] Case law databases
- [ ] International comparison data

---

## Git Workflow

### Branch Strategy
```
main
├── develop
    ├── feature/backend-services (Agent 1)
    └── feature/frontend-app (Agent 2)
```

### Commit Convention
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Adding tests
- `perf:` Performance improvement
- `deploy:` Deployment changes

### Merge Points
1. Friday 11pm: Initial structures merged to develop
2. Saturday 12pm: Core features merged to develop
3. Saturday 6pm: Main features merged to develop
4. Saturday 10pm: All features merged to develop
5. Sunday 12pm: Final code merged to main
6. Sunday 4pm: Competition submission from main

---

## Risk Mitigation

### Technical Risks
- **API Rate Limits**: Implement caching, use mock data fallback
- **Deployment Issues**: Test early, maintain local demo
- **Integration Conflicts**: Regular commits, clear boundaries
- **Performance Problems**: Profile early, optimize critical paths

### Process Risks
- **Merge Conflicts**: Small, frequent commits
- **Communication Gaps**: Use Git commits as communication
- **Scope Creep**: Focus on MVP features first
- **Time Management**: Hard stops at milestone times

---

## Success Metrics

### Must Achieve (MVP)
- ✅ Query processing for 3+ use cases
- ✅ Multi-jurisdiction detection working
- ✅ Conflict identification implemented
- ✅ Live demo accessible
- ✅ Video submitted on time

### Should Achieve (Good)
- ✅ 10+ council integrations
- ✅ Real-time data from 3+ sources
- ✅ Mobile responsive design
- ✅ Multi-language support (3+ languages)

### Nice to Have (Excellent)
- ✅ AI confidence scoring
- ✅ Predictive recommendations
- ✅ Export functionality
- ✅ API documentation site

---

_Remember: Working MVP > Perfect subset. Focus on end-to-end functionality first, polish second._