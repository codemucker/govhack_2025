# LegalEase - AI-Powered Regulatory Navigation Platform

> **GovHack 2025 Entry** by Team Democracy Sausage  
> Navigate Australian regulatory requirements with AI-powered simplicity

## 🚀 Quick Start

### Prerequisites
- [Node.js 20.18.2+](https://nodejs.org/)
- [Encore.dev CLI](https://encore.dev/docs/install)
- [Git](https://git-scm.com/)

### Installation
```bash
git clone https://github.com/codemucker/govhack_2025.git
cd govhack_2025
npm run install:all
```

### Local Development
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:backend    # Encore.dev API server (http://127.0.0.1:4000)
npm run dev:frontend   # Vue.js dev server (http://localhost:3000)
```

### CLI Testing Tool
Test the backend AI pipeline directly from the command line:
```bash
# Test business questions
./ask.sh "How do I register a business in Australia?"

# Test planning questions  
./ask.sh "Do I need planning permission for a house extension?"

# Test food safety questions
./ask.sh "What food safety licenses do I need for a restaurant?"

# Test consumer rights
./ask.sh "What are my rights when buying faulty products?"
```
See [CLI_USAGE.md](./CLI_USAGE.md) for detailed documentation.

### Build & Deploy
```bash
npm run build    # Build both frontend and backend
npm run deploy   # Deploy to production (requires proper branch workflow)
```

## 🔄 Development Workflow

This project uses a **Git Flow** approach with feature branches and environment-specific deployment.

### Branch Structure
```
main           # Production-ready code (deployed via Terraform)
├── stage      # Staging environment (deployed to Encore Cloud)
├── develop    # Integration branch (local testing)
└── feature/*  # Feature development branches
```

### Development Process

#### 1. Feature Development
```bash
# Start new feature from develop
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# Develop and commit
git add .
git commit -m "feat: your feature description"

# Push feature branch
git push origin feature/your-feature-name
```

#### 2. Integration to Develop
```bash
# Switch to develop and update
git checkout develop
git pull origin develop

# Merge feature with squash (clean history)
git merge --squash feature/your-feature-name
git commit -m "feat: consolidated feature implementation"

# Push updated develop
git push origin develop

# Clean up feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

#### 3. Staging Deployment (Encore Cloud)
```bash
# Merge develop to stage
git checkout stage
git merge develop
git commit -m "stage: deploy latest features for testing"

# Deploy to Encore Cloud
git push encore stage
```

🌍 **Staging URL**: Available in [Encore Cloud Dashboard](https://app.encore.dev)

#### 4. Production Release
```bash
# After staging validation, merge to main
git checkout main
git merge stage
git commit -m "release: production deployment"

# Push to GitHub (triggers Terraform deployment)
git push origin main
```

## 🧪 Testing

### Local Testing
```bash
npm test                    # Run all tests
npm run test:backend        # Backend tests (Encore.dev)
npm run test:frontend       # Frontend tests (Vitest)
npm run lint                # Code linting
npm run typecheck           # TypeScript validation
```

### Environment Testing
- **Local**: `encore run` + `npm run dev:frontend`
- **Staging**: Encore Cloud deployment via `git push encore stage`
- **Production**: Terraform-managed infrastructure via GitHub main branch

## 🏗️ Architecture

### Frontend (Vue.js 3 + TypeScript)
- **Framework**: Vue.js 3 with Composition API
- **Build Tool**: Vite
- **Routing**: Vue Router
- **State**: Pinia
- **Styling**: Tailwind CSS (planned)
- **Location**: `/frontend/src/`

### Backend (TypeScript + Encore.dev)
- **Framework**: Encore.dev microservices
- **Runtime**: Node.js 20.18.2
- **Database**: PostgreSQL (via Encore.dev)
- **Cache**: Redis (via Encore.dev)
- **Location**: `/api/`

### API Endpoints
- `GET /` - Development homepage
- `GET /api/hello` - Hello world endpoint
- `GET /api/health` - Health check
- `POST /api/v1/triage/:clientId` - Main triage service
- `GET /api/v1/councils/search` - Council search

## 📁 Project Structure
```
/
├── api/                    # Encore.dev backend services
│   ├── hello.ts           # Hello world & health endpoints
│   ├── triage.ts          # Main AI triage service
│   └── site.ts            # Homepage endpoint
├── frontend/              # Vue.js frontend application
│   ├── src/
│   │   ├── views/         # Page components
│   │   ├── components/    # Reusable components
│   │   └── main.ts        # App entry point
│   ├── index.html         # HTML template
│   └── package.json       # Frontend dependencies
├── docs/                  # Project documentation
├── dist/                  # Built frontend (served by Encore.dev)
├── .context/              # Claude Code session context
└── package.json           # Root workspace configuration
```

## 🚢 Deployment Environments

### 1. Local Development
- **Frontend**: http://localhost:3000 (Vite dev server)
- **Backend**: http://127.0.0.1:4000 (Encore.dev)
- **Dashboard**: http://127.0.0.1:9400 (Encore.dev dev dashboard)

### 2. Staging (Encore Cloud)
- **URL**: Provided by Encore Cloud Dashboard
- **Database**: Managed PostgreSQL
- **Deploy**: `git push encore stage`
- **Purpose**: Feature testing and validation

### 3. Production (Terraform + Public Cloud)
- **Infrastructure**: Terraform-managed
- **Cloud Provider**: TBD (AWS/GCP/Azure)
- **Deploy**: GitHub main branch push triggers Terraform
- **Purpose**: Public-facing application

## 🛠️ Development Tools

### Package Management
```bash
npm run install:all         # Install all dependencies
npm run clean               # Clean node_modules
npm run clean:dist          # Clean build artifacts
```

### Code Quality
```bash
npm run lint                # ESLint (frontend + backend)
npm run format              # Prettier formatting
npm run typecheck           # TypeScript compilation check
```

### Git Helpers
```bash
git remote -v               # View configured remotes
# origin: GitHub repository
# encore: Encore.dev deployment
```

## 📊 Monitoring & Observability

- **Local**: Encore.dev dev dashboard (http://127.0.0.1:9400)
- **Staging**: [Encore Cloud Dashboard](https://app.encore.dev)
- **Production**: Infrastructure monitoring (TBD with Terraform)

## 🔐 Environment Variables

Development environment variables are managed by Encore.dev. For production deployment, variables will be managed through Terraform configuration.

## 📚 Additional Documentation

- [Technical Specifications](./docs/technical.md)
- [Project Architecture](./docs/architecture.md)
- [GovHack Competition Details](./docs/project.md)
- [Feature Specifications](./docs/features.md)
- [Development Agents Guide](./AGENTS.md)

## 🤝 Contributing

This project was developed for **GovHack 2025**. For development workflow details, see [AGENTS.md](./AGENTS.md).

### Team Democracy Sausage
- **Daniel Bryar** - Project Lead, Software Engineer
- **Bert Van Brakel** - Software Engineer

---

**Built with ❤️ for GovHack 2025 - Making legal compliance accessible to all Australians**