# Architecture Guidelines

## Framework & Infrastructure

### Encore.dev Backend Framework

This project uses **Encore.dev** as the primary backend framework for building type-safe, cloud-native applications with built-in observability and infrastructure management.

#### Key Benefits

- **Type-safe APIs** with automatic client generation
- **Built-in tracing** and observability
- **Infrastructure from code** - no separate IaC needed for development
- **Local development** matches production behavior
- **Automatic API documentation**
- **Terraform export** for production deployments

#### Language Selection

Choose **one** backend language per project:

- **Go**: High-performance services, system-level operations
- **TypeScript**: Rapid development, shared types with frontend

> ⚠️ **Important**: Do not mix Go and TypeScript backends in the same Encore application. Choose one and maintain consistency.

### Environment Strategy

#### Development & Testing

- **Encore Cloud**: Ephemeral preview environments
- **Local Development**: `encore run` for local testing
- **Database**: Encore-managed PostgreSQL instances
- **Secrets**: Encore secrets management

#### Production

- **Infrastructure**: Export to Terraform via `encore terraform`
- **Deployment Target**: AWS, GCP, or Azure
- **CI/CD**: GitHub Actions or GitLab CI
- **Monitoring**: Datadog, New Relic, or cloud-native solutions

## Repository Structure

```
/
├── .claude/                 # Claude Code rules and context
├── docs/                    # Documentation
│   ├── architecture.md     # This file
│   └── technical.md         # Coding standards
├── src/                     # Source code root
│   ├── api/                 # Encore backend application
│   │   ├── encore.app       # Encore app configuration
│   │   ├── services/        # Encore services
│   │   │   ├── users/       # User service
│   │   │   │   ├── users.go/ts
│   │   │   │   └── users_test.go/ts
│   │   │   └── auth/        # Auth service
│   │   ├── modules/         # Shared business logic
│   │   ├── lib/             # Shared utilities
│   │   └── migrations/      # Database migrations
│   └── frontend/            # Frontend application
│       ├── index.html       # Entry point
│       ├── src/             # Frontend source
│       │   ├── main.ts      # Vue app entry
│       │   ├── pages/       # Page components
│       │   ├── components/  # Reusable components
│       │   ├── services/    # API client services
│       │   ├── stores/      # Pinia stores
│       │   └── utils/       # Utilities
│       ├── public/          # Static assets
│       └── vite.config.ts   # Vite configuration
├── scripts/                 # Build and deployment scripts
├── terraform/               # Production Terraform (exported)
├── .gitignore              # Include node_modules
├── bun.lockb               # Bun lock file
└── package.json            # Root package.json (hoisted)
```

### Directory Conventions

#### API Structure (Encore)

- **Services**: One directory per service under `/src/api/services/`
- **Service naming**: Singular nouns (`user`, `auth`, `payment`)
- **File naming**: Use function name (`user/create.go`, `auth/login.ts`)
- **Shared code**: Place in `/src/api/lib/` or `/src/api/modules/`

#### Frontend Structure

- **Pages**: Route-based components in `/src/frontend/src/pages/`
- **Components**: Reusable UI in `/src/frontend/src/components/`
- **Services**: API clients in `/src/frontend/src/services/`
- **Type sharing**: Import from generated Encore client

## Encore Service Design

### Service Boundaries

```go
// src/api/services/user/user.go
package user

import "encore.dev/api"

//encore:api public method=GET path=/users/:id
func Get(ctx context.Context, id string) (*User, error) {
    // Implementation
}

//encore:api auth method=POST path=/users
func Create(ctx context.Context, data *CreateRequest) (*User, error) {
    // Implementation
}
```

```typescript
// src/api/services/user/user.ts
import { api } from "encore.dev/api"

export const get = api<{ id: string }, User>({ method: "GET", path: "/users/:id" }, async ({ id }) => {
  // Implementation
})

export const create = api<CreateRequest, User>({ method: "POST", path: "/users", auth: true }, async (data) => {
  // Implementation
})
```

### Database Access

```go
// Using Encore's database support
//encore:db
var db *sqldb.Database

// Migrations in src/api/services/user/migrations/
```

### Service Communication

- **Internal**: Direct function calls between services
- **External**: REST APIs with Encore-generated clients
- **Events**: Pub/sub with Encore's built-in system

## Frontend Integration

### API Client Generation

```bash
# Generate TypeScript client from Encore API
encore gen client ./src/frontend/src/services/client --lang=typescript
```

### Type Safety

```typescript
// src/frontend/src/services/api.ts
import Client from "./client"

const client = new Client(import.meta.env.VITE_API_URL)

// Fully typed based on backend definitions
export const userService = {
  get: (id: string) => client.user.Get({ id }),
  create: (data: CreateUserRequest) => client.user.Create(data),
}
```

## Static Sites with Hugo

For documentation, marketing sites, or content-heavy projects that don't require a full SPA:

### Hugo + TypeScript/JavaScript

```
/
├── hugo/                    # Hugo static site
│   ├── config.toml         # Hugo configuration
│   ├── content/            # Markdown content
│   ├── layouts/            # HTML templates
│   ├── static/             # Static files
│   └── assets/             # Processed assets
│       ├── ts/             # TypeScript modules
│       └── css/            # Styles
```

### Build Pipeline

```toml
# hugo/config.toml
[build]
  writeStats = true

[params]
  # Enable TypeScript processing
  useTypeScript = true
```

```json
// package.json scripts
{
  "scripts": {
    "build:hugo": "hugo --minify",
    "build:ts": "esbuild hugo/assets/ts/main.ts --bundle --outdir=hugo/static/js",
    "build:static": "bun run build:ts && bun run build:hugo"
  }
}
```

## Deployment Strategy

### Development Workflow

1. **Local development**: `encore run`
2. **Preview environments**: Automatic on PR
3. **Staging**: Merge to `develop` branch
4. **Production**: Merge to `main` branch

### Production Deployment

```bash
# Export Terraform configuration
encore terraform generate --env=production ./terraform

# Review and apply
cd terraform
terraform init
terraform plan
terraform apply
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1

      # Build frontend
      - run: bun install
      - run: bun run build

      # Deploy Encore backend
      - uses: encoredev/action@v1
        with:
          env: production
```

## Security Considerations

### API Security

- Use Encore's built-in auth middleware
- Implement rate limiting at service level
- Validate all inputs with proper types
- Use parameterized queries (handled by Encore)

### Secret Management

```bash
# Set secrets via Encore CLI
encore secret set --env=production API_KEY
encore secret set --env=production DB_PASSWORD
```

### CORS Configuration

```go
//encore:api public cors=*
func PublicEndpoint() error {
    // Accessible from any origin
}

//encore:api public cors=https://myapp.com
func RestrictedEndpoint() error {
    // Only accessible from myapp.com
}
```

## Monitoring & Observability

### Built-in Tracing

- Automatic distributed tracing
- Request flow visualization
- Performance metrics per endpoint

### Custom Metrics

```go
import "encore.dev/metrics"

var requestCount = metrics.NewCounter[struct{ Service string }]()

func Handler() {
    requestCount.Increment(struct{ Service string }{Service: "user"})
}
```

### Error Tracking

- Structured logging with `encore.dev/rlog`
- Automatic error aggregation in Encore dashboard
- Export to external services (Sentry, Rollbar)

## Performance Guidelines

### Backend Optimization

- Use connection pooling (handled by Encore)
- Implement caching with Redis
- Batch database operations
- Use async processing for heavy tasks

### Frontend Optimization

- Code splitting by route
- Lazy loading for components
- Image optimization with Vite
- Bundle analysis and tree shaking

## Testing Strategy

### Backend Testing

```go
// src/api/services/user/user_test.go
func TestUserService(t *testing.T) {
    // Encore provides test infrastructure
    ts := encoretest.NewServer(t)

    // Test API endpoints
    resp := ts.Get("/users/123")
    assert.Equal(t, 200, resp.StatusCode)
}
```

### Frontend Testing

```typescript
// src/frontend/src/services/api.test.ts
import { describe, it, expect } from "vitest"

describe("API Validation", () => {
  it("should handle user creation", async () => {
    const result = await userService.create(mockData)
    expect(result.id).toBeDefined()
  })
})
```

## Migration Path

### From Existing Codebase

1. Install Encore CLI
2. Initialize Encore app: `encore app create`
3. Move services to `/src/api/services/`
4. Convert endpoints to Encore annotations
5. Generate frontend client
6. Update deployment pipeline

### Breaking Changes

- Document API versioning strategy
- Use Encore's migration system
- Implement backwards compatibility
- Gradual rollout with feature flags

---

_Last Updated: [Auto-update on save]_
_Version: 1.0.0_
