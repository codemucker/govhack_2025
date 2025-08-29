# Technical Specifications

## Project Overview

This document defines the technical standards, language preferences, and coding conventions for the Transliterate project. These specifications should be referenced when implementing new features or modifying existing code.

> **Note**: For infrastructure, deployment, and Encore.dev framework details, see [architecture.md](./architecture.md) > **Locale**: For regional standards and language conventions, see [locale.md](./locale.md)

## Language & Framework Preferences

### Primary Languages

1. **TypeScript** - For frontend development and optional backend with Encore

   - Strict mode enabled
   - Explicit type annotations preferred
   - Avoid `any` type unless absolutely necessary

2. **Go (Golang)** - For high-performance backend services with Encore

   - Go 1.21+ preferred
   - Follow effective Go guidelines
   - Use Go modules for dependency management
   - Prefer standard library over external dependencies

3. **Shell/Bash** - For automation and system scripts
   - POSIX-compliant when possible
   - Use shellcheck for validation

> **Backend Language Choice**: Projects must use either Go OR TypeScript with Encore.dev, not both. Choose based on project requirements.

### Framework Stack

#### Frontend

##### Single Page Applications (SPA)

- **Vue 3** with TypeScript and Composition API
- **Vite** for build tooling and dev server
- **Pinia** for state management
- **Vue Router** for routing
- **Tailwind CSS** for styling
- **Headless UI** or **PrimeVue** for component library
- **Bun** for package management

##### Static Sites

- **Hugo** for static site generation
- **TypeScript/JavaScript** for interactive elements
- **esbuild** for bundling TS/JS assets
- **Tailwind CSS** for styling
- **AlpineJS** for lightweight reactivity (optional)

#### Backend

- **Encore.dev** framework (choose one):
  - **Go** for high-performance services
  - **TypeScript** for rapid development
- **PostgreSQL** via Encore's database support
- **Redis** for caching (via Encore infrastructure)
- **Built-in pub/sub** for event-driven architecture
- **Automatic API client generation** for frontend

#### Testing

- **Vitest** for TypeScript/Vue unit tests (fileName.spec.ts)
- **API validation tests** (testName.test.ts) for endpoint testing
- **Playwright** or **Cypress** for E2E testing
- **Go testing package** for Go unit tests (\*\_test.go)
- **Testify** for Go test assertions
- **Coverage** targets: 80% minimum

## Coding Conventions

### General Principles

1. **Readability over cleverness**
2. **Explicit over implicit**
3. **Composition over inheritance**
4. **Pure functions where possible**

### Testing Conventions

#### Test File Naming

- **Unit Tests**: `fileName.spec.ts` - Test individual functions/components in isolation
- **Validation Tests**: `apiName.test.ts` - Test API endpoints with expected responses

#### Frontend Testing (Vue/TypeScript)

```typescript
// userService.spec.ts - Unit test
import { describe, it, expect, vi } from "vitest"
import { getUserById } from "./userService"

describe("getUserById", () => {
  it("should return user data for valid ID", () => {
    const result = getUserById("123")
    expect(result).toHaveProperty("id", "123")
  })
})

// userApi.test.ts - Validation test
import { describe, it, expect } from "vitest"
import { fetchUser } from "@/services/api"

describe("User API Validation", () => {
  it("should return 200 with valid user data", async () => {
    const response = await fetchUser("123")
    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty("id")
  })

  it("should return 404 for non-existent user", async () => {
    const response = await fetchUser("invalid")
    expect(response.status).toBe(404)
  })
})
```

#### Backend Testing (Go)

```go
// userService_test.go - Unit test
func TestGetUserByID(t *testing.T) {
    user := GetUserByID("123")
    assert.NotNil(t, user)
    assert.Equal(t, "123", user.ID)
}

// userApi_test.go - Validation/Integration test
func TestUserAPIEndpoint(t *testing.T) {
    // Setup test server
    router := setupRouter()
    w := httptest.NewRecorder()

    // Test successful response
    req, _ := http.NewRequest("GET", "/api/users/123", nil)
    router.ServeHTTP(w, req)
    assert.Equal(t, 200, w.Code)

    // Test error response
    req, _ = http.NewRequest("GET", "/api/users/invalid", nil)
    router.ServeHTTP(w, req)
    assert.Equal(t, 404, w.Code)
}
```

### Naming Conventions

#### TypeScript/JavaScript

```typescript
// Files: camelCase
userService.ts
apiClient.ts

// Classes: PascalCase
class UserService {}

// Interfaces: PascalCase with 'I' prefix
interface IUserData {}

// Functions/Methods: camelCase
function getUserData() {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3

// Variables: camelCase
let userName = "John"
```

#### Go

```go
// Files: camelCase
userService.go
apiClient.go

// Packages: lowercase single word
package user

// Exported types/functions: PascalCase
type UserService struct {}
func GetUserData() {}

// Unexported types/functions: camelCase
type userConfig struct {}
func getUserData() {}

// Constants: PascalCase or UPPER_SNAKE_CASE for groups
const MaxRetryCount = 3
const (
    STATUS_OK = 200
    STATUS_NOT_FOUND = 404
)

// Variables: camelCase
var userName = "John"
```

### File Structure

```
/
├── .claude/           # Claude Code rules and context
├── docs/              # Project documentation
│   ├── technical.md   # This file (coding standards)
│   └── architecture.md # Infrastructure and framework
├── src/               # Source code root
│   ├── api/           # Encore backend application
│   │   ├── services/  # Encore services
│   │   ├── modules/   # Shared business logic
│   │   └── lib/       # Utilities
│   └── frontend/      # Vue/Hugo frontend
│       └── src/       # Frontend source code
├── scripts/           # Build and automation
├── node_modules/      # Hoisted to root (gitignored)
├── package.json       # Root package.json
└── bun.lockb         # Bun lock file
```

### Directory Naming

- **Single words preferred**: `api`, `frontend`, `utils`, `types`
- **Kebab-case for multi-word**: `user-management`, `auth-service`
- **Avoid**: camelCase or snake_case for directories

> **See [architecture.md](./architecture.md)** for complete repository structure

### Code Organization

#### Module Structure

- One export per file for major components/services
- Group related utilities in single files
- Separate types/interfaces into dedicated files
- Include README.md in aggregate folders (where index.ts would be)
- Update README.md when adding new modules

#### Import Order

1. External libraries
2. Internal absolute imports
3. Internal relative imports
4. Type imports (TypeScript)

```typescript
// External
import { defineComponent, ref } from "vue"
import { useRoute } from "vue-router"

// Internal absolute
import { UserService } from "@/services/userService"

// Internal relative
import { formatDate } from "./utils"

// Types
import type { User } from "@/types/user"
```

```go
// Go imports grouped and sorted
import (
    // Standard library
    "context"
    "fmt"
    "net/http"

    // External packages
    "github.com/gin-gonic/gin"
    "github.com/redis/go-redis/v9"

    // Internal packages
    "github.com/yourorg/project/internal/user"
    "github.com/yourorg/project/pkg/utils"
)
```

### Error Handling

#### TypeScript

```typescript
// Use Result pattern for expected errors
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E }

// Throw for unexpected errors
if (!config) {
  throw new Error("Configuration not found")
}
```

#### Go

```go
// Always return errors explicitly
func GetUser(id string) (*User, error) {
    user, err := db.FindUser(id)
    if err != nil {
        return nil, fmt.Errorf("failed to get user %s: %w", id, err)
    }
    return user, nil
}

// Custom error types for domain errors
type NotFoundError struct {
    Resource string
    ID       string
}

func (e NotFoundError) Error() string {
    return fmt.Sprintf("%s not found: %s", e.Resource, e.ID)
}

// Error wrapping for context
if err != nil {
    return fmt.Errorf("service.GetUser: %w", err)
}
```

### Async Patterns

#### TypeScript

- Prefer async/await over promises
- Use Promise.all for parallel operations
- Handle errors at appropriate boundaries

#### Go

- Use goroutines for concurrency
- Channel communication over shared memory
- Context for cancellation and timeouts
- sync.WaitGroup for synchronization
- errgroup for concurrent error handling

### Documentation

#### README.md Requirements

##### Placement Rules

- **Required**: Place a `README.md` in any folder where an `index.ts` file would typically exist
- **Examples**: `./services/README.md`, `./components/README.md`, `./stores/README.md`
- **Purpose**: Document the folder's purpose and contents without needing to open individual files

##### README.md Structure

```markdown
# Services

Central location for all API service modules.

## Modules

### userService

**Purpose**: Handles all user-related API operations
**Exports**: `getUserById`, `createUser`, `updateUser`
**Dependencies**: Encore API client, auth store

### authService

**Purpose**: Manages authentication and session state
**Exports**: `login`, `logout`, `refreshToken`
**Dependencies**: JWT utilities, user store

### paymentService

**Purpose**: Processes payments and billing operations
**Added**: 2024-01-15
**Exports**: `processPayment`, `getInvoices`
**Dependencies**: Stripe SDK, user service
```

##### Update Requirements

- Update README.md immediately when adding new subfolders
- Include: purpose, main exports, dependencies, date added
- Keep descriptions concise but complete

#### Code Comments

- Explain "why" not "what"
- Document complex algorithms
- Add TODO with issue numbers
- Use inline comments sparingly
- Follow Australian English spelling (see [locale.md](./locale.md))
- Always use punctuation at the end of sentences

#### TypeScript Documentation (JSDoc)

##### Required JSDoc Elements

- All exported functions must have JSDoc
- Include all `@param` tags with types and descriptions
- Include `@returns` tag with type and description
- At least one `@example` showing typical usage
- Use `@throws` for functions that can throw errors
- Use `@deprecated` with migration path when applicable

##### TypeScript JSDoc Template

````typescript
/**
 * Transliterates text from one script to another using the specified ruleset.
 * Handles multi-byte characters and preserves whitespace.
 *
 * @param text - The input text to transliterate
 * @param options - Configuration options for transliteration
 * @param options.from - Source script identifier (e.g., 'cyrillic', 'arabic')
 * @param options.to - Target script identifier (e.g., 'latin', 'ipa')
 * @param options.preserveCase - Whether to maintain original casing
 * @returns The transliterated text string
 *
 * @throws {InvalidScriptError} When source or target script is not supported
 * @throws {TransliterationError} When text cannot be processed
 *
 * @example
 * ```typescript
 * // Basic transliteration
 * const result = transliterate('Привет', {
 *   from: 'cyrillic',
 *   to: 'latin',
 *   preserveCase: true
 * });
 * console.log(result); // "Privet"
 * ```
 *
 * @example
 * ```typescript
 * // With error handling
 * try {
 *   const result = transliterate(arabicText, {
 *     from: 'arabic',
 *     to: 'ipa'
 *   });
 * } catch (error) {
 *   if (error instanceof InvalidScriptError) {
 *     console.error('Script not supported');
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 * @see {@link https://docs.example.com/transliteration}
 */
export function transliterate(text: string, options: TransliterationOptions): string {
  // Implementation
}

/**
 * @deprecated Use `transliterate` instead. Will be removed in v2.0.0
 * @see {@link transliterate}
 */
export function oldTransliterate(text: string): string {
  return transliterate(text, { from: "auto", to: "latin" })
}
````

##### Go Documentation

```go
// Transliterate converts text from source to target script.
// It accepts text input and transliteration options,
// returning the transliterated result or an error.
//
// Example:
//   result, err := Transliterate("Привет", Options{
//     From: "cyrillic",
//     To: "latin",
//   })
func Transliterate(text string, options Options) (string, error) {
    // Implementation
}
```

### Performance Considerations

1. **Lazy Loading** - Load resources only when needed
2. **Memoization** - Cache expensive computations
3. **Debouncing** - Limit function call frequency
4. **Virtual Scrolling** - For large lists
5. **Code Splitting** - Separate bundles by route

### Security Standards

1. **Input Validation** - Validate all user inputs
2. **SQL Injection** - Use parameterized queries
3. **XSS Prevention** - Sanitize HTML content
4. **Authentication** - Use industry standards (OAuth, JWT)
5. **Secrets Management** - Never commit secrets
6. **HTTPS Only** - Enforce SSL/TLS

### Development Workflow

#### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

#### Commit Messages

```
type(scope): subject

body

footer
```

Types: feat, fix, docs, style, refactor, test, chore

#### Date and Time Standards

- **Technical contexts**: Use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
- **User interfaces**: DD/MM/YYYY format (Australian standard)
- **Database storage**: Always use UTC timestamps
- **Time format**: 24-hour format in technical contexts
- **Measurements**: SI (metric) units only
- See [locale.md](./locale.md) for complete regional standards

#### Code Review Checklist

- [ ] Tests pass
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Documentation updated
- [ ] Security considerations addressed
- [ ] Performance impact assessed

## Environment-Specific Settings

### Development

- Hot reloading enabled
- Source maps included
- Verbose logging
- Mock external services

### Staging

- Production build
- Real external services
- Error tracking enabled
- Performance monitoring

### Production

- Optimized builds
- Minimal logging
- Full monitoring
- Auto-scaling enabled

## Dependencies Management

### Package Manager

- **Bun** preferred over npm/yarn/pnpm
- Hoist dependencies to root `package.json`
- Use workspaces for monorepo structure

### Version Pinning

- Pin major versions in production
- Use exact versions for critical dependencies
- Regular dependency audits with `bun audit`

### Bun Scripts

```json
// package.json
{
  "scripts": {
    "dev": "bun run --watch src/frontend/src/main.ts",
    "build": "bun run build:frontend && encore build",
    "build:frontend": "bunx vite build",
    "test": "bun test",
    "test:unit": "bunx vitest run --coverage"
  }
}
```

### Approved Libraries

#### Frontend (Vue/TypeScript)

- **HTTP**: native fetch, ofetch, ky
- **State**: pinia, vueuse
- **Forms**: vee-validate, formkit
- **Validation**: zod, valibot
- **Date**: date-fns, dayjs
- **Testing**: vitest, @vue/test-utils
- **Build**: vite, esbuild, bun

#### Static Sites (Hugo)

- **Build**: hugo, esbuild
- **Interactivity**: alpinejs, petite-vue
- **Styling**: tailwindcss, postcss
- **Icons**: lucide, heroicons

#### Backend (Go)

- **Web Framework**: gin, fiber, echo
- **Database**: sqlx, gorm (use sparingly)
- **Validation**: go-playground/validator
- **Testing**: testify, gomock
- **HTTP Client**: resty, standard net/http
- **Config**: viper, envconfig

## Migration Guidelines

When updating technical choices:

1. Document the reason for change
2. Create migration plan
3. Update this document
4. Communicate to team
5. Gradual rollout when possible

---

_Last Updated: [Auto-update on save]_
_Version: 1.0.0_
