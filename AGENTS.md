# Agents

## transliterate

ASCII Name Transliteration Service - Converts multicultural names to ASCII-compatible structured JSON for legacy systems.

### Project Setup

```bash
# Install dependencies
bun install

# Install Encore CLI (if not installed)
curl -L https://encore.dev/install.sh | bash

# Initialize Encore app
encore app create --example=hello-world
```

### Development Commands

#### Backend (Go/Encore)

```bash
# Run local development server
encore run

# Run backend tests
go test ./...

# Run specific service tests
go test ./src/api/services/user/...

# Generate TypeScript client from Encore API
encore gen client ./src/frontend/src/services/client --lang=typescript

# Check Encore compilation
encore check

# View Encore dashboard
encore dashboard
```

#### Frontend (Hugo)

```bash
# Start Hugo development server
hugo server -D

# Build Hugo static site
hugo --minify

# Build TypeScript assets for Hugo
bun run build:ts
# or
esbuild hugo/assets/ts/main.ts --bundle --outdir=hugo/static/js
```

### Testing Conventions

#### Backend Testing (Go)

- **Unit tests**: `*_test.go` files alongside source
- **Test command**: `go test -v ./...`
- **Coverage**: `go test -cover ./...`
- **Benchmarks**: `go test -bench=. ./...`

Example:
```go
// userService_test.go
func TestGetUserByID(t *testing.T) {
    // Unit test
}

// userApi_test.go  
func TestUserAPIEndpoint(t *testing.T) {
    // Integration test
}
```

#### Frontend Testing (TypeScript)

- **Unit tests**: `fileName.spec.ts`
- **API validation tests**: `apiName.test.ts`
- **Test command**: `bunx vitest run`
- **Watch mode**: `bunx vitest watch`
- **Coverage**: `bunx vitest run --coverage`

Example:
```typescript
// userService.spec.ts - Unit test
// userApi.test.ts - API validation test
```

### Build & Deployment

#### Development
```bash
# Full build
bun run build

# Backend only
encore build

# Frontend only
bunx vite build
```

#### Production
```bash
# Export Terraform configuration
encore terraform generate --env=production ./terraform

# Deploy to Encore cloud
encore deploy production

# Deploy Hugo to Netlify/Vercel
netlify deploy --prod --dir=hugo/public
```

### Project Structure

```
/src
├── api/                    # Encore backend
│   ├── services/          # Individual services
│   │   └── user/         
│   │       ├── user.go    # Service implementation
│   │       └── user_test.go
│   ├── lib/              # Shared libraries
│   └── modules/          # Business logic modules
└── frontend/             # Hugo static site
    ├── assets/
    │   └── ts/          # TypeScript files
    ├── content/         # Markdown content
    ├── layouts/         # HTML templates
    └── static/          # Static assets
```

### API Development

#### Encore Service Pattern (Go)

```go
//encore:api public method=GET path=/transliterate
func Transliterate(ctx context.Context, input string) (*TransliterateResponse, error) {
    // Implementation
}
```

#### Encore Service Pattern (TypeScript)

```typescript
import { api } from "encore.dev/api";

export const transliterate = api<{input: string}, TransliterateResponse>(
    { method: "GET", path: "/transliterate" },
    async ({ input }) => {
        // Implementation
    }
);
```

### Database Operations

```bash
# Run migrations (Encore handles automatically)
# Place migration files in: src/api/services/[service]/migrations/

# Access database console
encore db shell [service-name]
```

### Environment & Secrets

```bash
# Set secrets for Encore
encore secret set --env=production API_KEY
encore secret set --env=production DB_PASSWORD

# List secrets
encore secret list --env=production
```

### Code Quality

```bash
# Lint Go code
golangci-lint run

# Format Go code
go fmt ./...

# Lint TypeScript
bunx eslint ./src/frontend

# Type check TypeScript
bunx tsc --noEmit
```

### Debugging

```bash
# View Encore logs
encore logs --env=local

# View specific service logs
encore logs --env=local --service=user

# Debug with Encore dashboard
encore dashboard
```

### Common Tasks

#### Add a new service
```bash
# Create service directory
mkdir -p src/api/services/newservice

# Create service file
touch src/api/services/newservice/newservice.go

# Add Encore annotations and implement
```

#### Add a new Hugo page
```bash
# Create content file
hugo new content/page-name.md

# Create corresponding layout if needed
touch layouts/page-name.html
```

#### Generate API documentation
```bash
# Encore automatically generates OpenAPI spec
encore api docs
```

### Troubleshooting

- **Port conflicts**: Encore uses 4000 (API) and 9400 (dashboard)
- **Build failures**: Check `encore check` output
- **Test failures**: Ensure database migrations are current
- **Client generation**: Run after any API changes

### Performance Profiling

```bash
# Go profiling
go test -cpuprofile=cpu.prof ./...
go tool pprof cpu.prof

# Frontend bundle analysis
bunx vite-bundle-visualizer
```