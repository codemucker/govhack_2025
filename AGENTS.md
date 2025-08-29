# Development Agents Guide

## LegalEase - AI-Powered Regulatory Navigation Platform

> **GovHack 2025 Project** - Team Democracy Sausage  
> Development workflow for parallel backend and frontend development

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: Vue.js 3 + TypeScript + Vite
- **Backend**: TypeScript + Encore.dev microservices  
- **Database**: PostgreSQL (managed by Encore.dev)
- **Cache**: Redis (managed by Encore.dev)
- **Package Manager**: npm with workspaces

### Project Structure
```
/
├── api/                    # Backend services (Agent 1)
│   ├── hello.ts           # Hello world & health endpoints
│   ├── triage.ts          # Main AI triage service
│   └── site.ts            # Development homepage
├── frontend/              # Frontend application (Agent 2)
│   ├── src/
│   │   ├── views/         # Vue.js pages
│   │   ├── components/    # Reusable components
│   │   └── main.ts        # App entry point
│   └── package.json       # Frontend dependencies
├── dist/                  # Built frontend (served by Encore.dev)
└── package.json           # Root workspace
```

## 🔄 Git Flow Development Workflow

### Branch Strategy
```
main           # Production (Terraform deployment)
├── stage      # Staging (Encore Cloud deployment)
├── develop    # Integration branch
└── feature/*  # Feature development branches
```

### Agent Work Allocation

#### Agent 1: Backend Development
- **Directory**: `/api/`
- **Technologies**: TypeScript, Encore.dev
- **Responsibilities**: API endpoints, business logic, data integration
- **Testing**: `npm run test:backend`

#### Agent 2: Frontend Development
- **Directory**: `/frontend/src/`
- **Technologies**: Vue.js 3, TypeScript, Vite
- **Responsibilities**: UI components, user experience, client-side logic
- **Testing**: `npm run test:frontend`

## 🚀 Development Commands

### Initial Setup
```bash
# Clone and install
git clone https://github.com/codemucker/govhack_2025.git
cd govhack_2025
npm run install:all

# Verify Encore.dev CLI is installed
encore version
```

### Daily Development Workflow

#### 1. Start New Feature
```bash
# Always start from develop branch
git checkout develop
git pull origin develop

# Create feature branch (use descriptive names)
git checkout -b feature/ai-triage-integration
# or
git checkout -b feature/search-ui-components
```

#### 2. Development Commands

##### Agent 1 (Backend)
```bash
# Run backend development server
npm run dev:backend
# or directly: encore run

# Backend-only testing
npm run test:backend          # Run tests
npm run lint:backend          # ESLint validation
npm run typecheck:backend     # TypeScript check

# View Encore.dev dashboard
# http://127.0.0.1:9400/legalease-65o2
```

##### Agent 2 (Frontend) 
```bash
# Run frontend development server
npm run dev:frontend
# Frontend available at: http://localhost:3000
# API calls proxied to: http://127.0.0.1:4000

# Frontend-only testing
npm run test:frontend         # Vitest tests
npm run lint:frontend         # ESLint validation
npm run typecheck:frontend    # Vue + TypeScript check
```

##### Both Agents (Full Stack)
```bash
# Run both frontend and backend together
npm run dev

# Full project testing
npm test                      # All tests
npm run lint                  # All linting
npm run typecheck             # All TypeScript checks
```

#### 3. Feature Completion & Integration

##### During Development
```bash
# Regular commits with conventional commit format
git add .
git commit -m "feat: implement triage service integration"
# or
git commit -m "ui: add search results visualization"

# Push feature branch regularly
git push origin feature/your-feature-name
```

##### Feature Integration (Squash Merge)
```bash
# Switch to develop and update
git checkout develop
git pull origin develop

# Merge feature with squash (clean history)
git merge --squash feature/your-feature-name
git commit -m "feat: implement complete AI triage workflow

- Add natural language processing for user queries
- Integrate with Australian government data sources  
- Create responsive search results interface
- Add error handling and loading states"

# Push updated develop branch
git push origin develop

# Clean up feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

## 🧪 Testing & Quality Assurance

### Local Testing
```bash
# Run all tests
npm test

# Individual test suites  
npm run test:backend          # Encore.dev backend tests
npm run test:frontend         # Vitest frontend tests

# Code quality
npm run lint                  # ESLint all code
npm run typecheck             # TypeScript validation
```

### Build Validation
```bash
# Build for production
npm run build

# Validate build artifacts
ls -la dist/                  # Frontend build output
encore check                  # Backend compilation check
```

## 🚢 Deployment Workflow

### 1. Staging Deployment (Encore Cloud)
```bash
# Merge develop to stage for testing
git checkout stage
git merge develop
git commit -m "stage: deploy features for validation"

# Deploy to Encore Cloud
git push encore stage
```

**Staging URL**: Available in [Encore Cloud Dashboard](https://app.encore.dev)

### 2. Production Release
```bash
# After staging validation, merge to main
git checkout main  
git merge stage
git commit -m "release: production deployment v1.x.x"

# Push to GitHub (triggers Terraform deployment)
git push origin main
```

## 📊 Monitoring & Debugging

### Local Development
- **Backend API**: http://127.0.0.1:4000
- **Frontend Dev Server**: http://localhost:3000  
- **Encore Dashboard**: http://127.0.0.1:9400/legalease-65o2

### Staging Environment
- **URL**: Provided by Encore Cloud Dashboard
- **Monitoring**: [Encore Cloud Dashboard](https://app.encore.dev)
- **Logs**: Available in Encore dashboard

### Production Environment
- **Infrastructure**: Terraform-managed (TBD)
- **Monitoring**: To be configured with Terraform

## 🔧 Agent-Specific Development Guide

### Agent 1: Backend Services (TypeScript/Encore.dev)

#### Service Development Pattern
```typescript
// api/example-service.ts
import { api } from "encore.dev/api";

interface ExampleRequest {
  query: string;
  options?: string[];
}

interface ExampleResponse {
  result: string;
  confidence: number;
}

export const exampleEndpoint = api(
  { method: "POST", path: "/api/v1/example" },
  async (req: ExampleRequest): Promise<ExampleResponse> => {
    // Implementation
    return {
      result: "processed",
      confidence: 0.95
    };
  }
);
```

#### Key Responsibilities
1. **API Endpoints**: Implement all `/api/*` routes
2. **Data Integration**: Connect to government APIs (ABLIS, legislation registers)
3. **AI Processing**: Implement natural language understanding
4. **Data Models**: Define TypeScript interfaces for request/response
5. **Business Logic**: Jurisdiction resolution, conflict detection

#### Testing Focus
```bash
# Backend test structure
api/
├── hello.ts
├── hello.test.ts              # API endpoint tests
├── triage.ts  
└── triage.test.ts             # Triage service tests
```

### Agent 2: Frontend Application (Vue.js/TypeScript)

#### Component Development Pattern
```vue
<template>
  <div class="component-name">
    <h2>{{ title }}</h2>
    <button @click="handleAction" :disabled="loading">
      {{ loading ? 'Processing...' : 'Submit' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  title: string;
}

const props = defineProps<Props>();
const loading = ref(false);

const handleAction = async () => {
  loading.value = true;
  try {
    // API call or business logic
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Component-specific styles */
</style>
```

#### Key Responsibilities
1. **UI Components**: Build reusable Vue.js components
2. **Pages/Views**: Implement application pages (Home, Search, About)
3. **API Integration**: Connect to backend services
4. **User Experience**: Responsive design, loading states, error handling
5. **State Management**: Use Pinia for complex state

#### Testing Focus
```bash
# Frontend test structure
frontend/src/
├── components/
│   ├── SearchForm.vue
│   └── SearchForm.spec.ts     # Component tests
├── views/
│   ├── Search.vue
│   └── Search.spec.ts         # Page tests
└── services/
    ├── api.ts
    └── api.test.ts            # API client tests
```

## 🔍 Troubleshooting

### Common Issues

#### Backend (Agent 1)
```bash
# Port conflicts
lsof -ti:4000                  # Check what's using port 4000
kill $(lsof -ti:4000)          # Kill process if needed

# Encore.dev issues
encore version update          # Update to latest version
encore check                   # Validate API definitions

# TypeScript errors
npm run typecheck:backend      # Check types
```

#### Frontend (Agent 2)
```bash
# Vite dev server issues
rm -rf frontend/node_modules   # Clear dependencies
npm install --prefix frontend  # Reinstall

# API connection issues
# Verify backend is running on http://127.0.0.1:4000
curl http://127.0.0.1:4000/api/hello

# TypeScript errors
npm run typecheck:frontend     # Check Vue + TypeScript
```

#### Both Agents
```bash
# Clear all builds and dependencies
npm run clean                  # Clean node_modules and dist
npm run install:all            # Reinstall everything

# Git workflow issues
git status                     # Check current state
git remote -v                  # Verify remotes
# origin: GitHub, encore: Encore.dev deployment
```

## 📚 Code Quality Standards

### TypeScript Configuration
- **Strict mode enabled**: No `any` types unless absolutely necessary
- **Explicit return types**: For all public functions
- **Interface definitions**: For all request/response objects

### Commit Message Convention
```bash
# Format: type(scope): description
feat(api): add triage service endpoint
feat(ui): implement search results page
fix(api): resolve council data parsing issue
docs: update API documentation
test: add unit tests for jurisdiction resolver
```

### Code Review Checklist
- [ ] TypeScript compilation passes (`npm run typecheck`)
- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] No console.log statements in production code
- [ ] API endpoints properly typed
- [ ] UI components responsive on mobile
- [ ] Error handling implemented
- [ ] Loading states added for async operations

## 🎯 Competition Focus (GovHack 2025)

### Priority Features (MVP)
1. **Natural Language Query Processing** (Agent 1)
2. **Multi-Jurisdictional Data Integration** (Agent 1)  
3. **Interactive Search Interface** (Agent 2)
4. **Results Visualization** (Agent 2)
5. **Mobile-Responsive Design** (Agent 2)

### Stretch Goals
1. **AI Confidence Scoring** (Agent 1)
2. **Conflict Detection & Resolution** (Agent 1)
3. **Export Functionality** (Agent 2)
4. **Multi-Language Support** (Agent 2)

Remember: **Working MVP > Perfect subset**. Focus on end-to-end functionality first, polish second.

---

**For additional documentation see**: [README.md](./README.md), [docs/technical.md](./docs/technical.md), [docs/project.md](./docs/project.md)