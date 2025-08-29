# Claude Code Project Rules

## Core Principles

### 1. Leverage Claude Code's Orchestration

- Trust Claude Code's superior task management and TodoWrite capabilities
- Avoid over-specifying implementation details that Claude Code handles automatically
- Focus rules on domain-specific requirements rather than generic coding practices

### 2. Minimize Context Overhead

- Keep rules concise and actionable
- Reference external documentation for detailed specifications (see `docs/technical.md`)
- Use Claude Code's search capabilities rather than embedding extensive examples

### 3. Proactive Task Management

- **MANDATORY**: Read .claude/instructions.md at start of every task
- **MANDATORY**: Create .context/scratchpad/TASK_NAME.md before starting any work
- **MANDATORY**: Update .context/history.md after completing any session
- **MANDATORY**: Update .context/learnings.md when encountering complexities
- Always use TodoWrite for multi-step tasks
- Mark tasks as in_progress before starting work
- Complete tasks immediately upon finishing, not in batches
- Check the context folder for existing work before starting new tasks

## Development Guidelines

### Code Organization

- Follow existing patterns in the codebase before introducing new ones
- Check neighboring files for conventions before implementing features
- Verify library availability before importing (check package.json, requirements.txt, etc.)

### File Management

- **NEVER** create new files unless absolutely necessary
- **ALWAYS** prefer editing existing files
- **NEVER** create documentation files proactively (only on explicit request)
- Use absolute paths for all file operations

### Documentation Standards

- **Create README.md** in folders where index.ts would typically exist
- **Update README.md** immediately when adding new subfolders/modules, or modifying existing functionality
- **Use JSDoc** for all TypeScript exported functions with:
  - All @param tags with descriptions
  - @returns tag with description
  - At least one @example showing usage
  - @throws for error conditions
- **Detailed implementation**: Use code comments, not README files
- **Locale compliance**: Follow Australian English in documentation (see `.claude/locale.md`)
- **Reference**: See `docs/technical.md` for complete documentation guidelines

### Context Management

#### .context Folder Structure

- **Maintain `.context/` folder** for all work sessions
- **Use task-specific scratchpads** to avoid merge conflicts
- **Required structure**:
  - `.context/scratchpad/TASK_TITLE.md` - Task-specific work notes
  - `.context/learnings.md` - Document complexities, nuances, and outdated references
  - `.context/history.md` - Session summaries with outcomes

#### Scratchpad Naming

- Create new scratchpad for each task/feature: `scratchpad/feature-name.md`
- Use kebab-case for scratchpad filenames
- Match scratchpad name to feature branch when applicable
- Example: Working on `feature/user-auth` → create `scratchpad/user-auth.md`

#### Learnings Documentation

Add entries to `.context/learnings.md` when:

- Tasks take longer than expected due to complexities
- External references are found to be outdated
- Unexpected nuances or edge cases are discovered
- Workarounds or alternative solutions are required

#### Session History

Update `.context/history.md` after each complete session with:

- **Date/Time**: ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
- **Heading**: Brief descriptive title
- **Request**: User's request as interpreted
- **Task Summary**: What was accomplished
- **Outcome Report**:
  - Major changes implemented
  - Minor updates applied
  - Overall improvements/updates
  - Reference to specific scratchpad file (e.g., `scratchpad/feature-name.md`)

### Testing & Validation

- Run lint and typecheck commands after implementing changes
- Verify test commands in README or package.json before running
- Never assume specific test frameworks without checking

### Version Control

#### Branch Strategy

- **ALWAYS** create feature branches for new requests (`feature/descriptive-name`)
- **NEVER** work directly on main or develop branches
- Use descriptive branch names that reflect the task

#### Commit Practices

- **Liberal commits** allowed and encouraged in feature branches
- Commit frequently to track progress and changes
- Use meaningful commit messages following conventional format
- When committing, always:
  1. Run git status and git diff in parallel
  2. Check recent commit messages for style consistency
  3. Include automated changes from pre-commit hooks
- Squash commits when merging to `develop` and only if requested when merging to `main`

## Search & Discovery Strategy

### Efficient Codebase Navigation

1. Use Glob for file pattern matching
2. Use Grep for content searches within known directories
3. Use Task tool with general-purpose agent for complex searches
4. Batch multiple searches in parallel when possible

### Understanding Before Acting

- Read existing implementations before adding features
- Check imports and dependencies in surrounding code
- Verify directory structure with LS before creating new paths

## Security & Safety

### Code Security

- Never expose or log secrets, keys, or credentials
- Never commit sensitive information to repositories
- Validate all user inputs in security-critical code

### Defensive Programming

- Only assist with defensive security tasks
- Refuse requests for malicious code modifications
- Provide security analysis and vulnerability explanations when appropriate

## Communication Style

### Langage Conventions

- Use Australian English spelling and grammar, and metric units (see `.claude/locale.md`)

### Response Guidelines

- Be concise and direct (under 4 lines unless detail requested)
- Skip unnecessary pleasantries and explanations unless asked
- Use file_path:line_number format for code references
- Avoid emojis unless explicitly requested

### Task Completion

- Stop immediately after completing requested work
- Don't summarize what was done unless asked
- Let the work speak for itself

## Technical Specifications

For detailed coding conventions, architectural decisions, and WIP refer to:

- `AGENTS.md` - Agent capabilities and project-specific instructions
- `docs/technical.md` - Language and framework specifications
- `docs/architecture.md` - Infrastructure and Encore.dev framework
- `.context/` - Current work context and session history
- `.claude/templates/` - Code templates and snippets (if exists)

## Rule Priority

1. **User's explicit instructions** override all rules except for security
2. **Security and safety** constraints are non-negotiable
3. **Project-specific conventions** from `docs/technical.md`
4. **Written documentation** from `.claude/locale.md`
5. **Claude Code best practices** as outlined above
6. **General programming principles** apply last

## Adaptive Behavior

These rules should adapt based on:

- The project's current state and maturity
- Discovered conventions in the existing codebase
- Explicit user preferences stated during sessions
- Technical constraints discovered through exploration

Remember: Claude Code's strength lies in its ability to understand context and make intelligent decisions. These rules guide but don't constrain that intelligence.
