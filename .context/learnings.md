# Learnings

## Overview
This document captures complexities, nuances, and unexpected findings discovered during development sessions. Each entry should help future work avoid similar delays or confusion.

## Entries

### Template Entry
**Date**: YYYY-MM-DDTHH:mm:ssZ  
**Task**: Brief description of what was being attempted  
**Issue**: What complexity or unexpected behaviour was encountered  
**Resolution**: How it was resolved or worked around  
**Time Impact**: Approximate additional time required  
**Prevention**: How to avoid this in future  

---

### Package.json Script Patterns with npm
**Date**: 2025-08-29T21:30:00Z  
**Task**: Setting up npm scripts to manage frontend and backend without using `cd` commands  
**Issue**: Initial package.json used `cd frontend && npm run dev` pattern which can be unreliable and doesn't follow best practices  
**Resolution**: Used npm `--prefix` flag: `npm run dev --prefix frontend` instead of changing directories  
**Time Impact**: 15 minutes to research and update all scripts  
**Prevention**: Always use `--prefix` flag for npm workspace operations, document this pattern in technical.md  

### Encore.dev File Structure Discovery
**Date**: 2025-08-29T21:45:00Z  
**Task**: Moving backend files from `/src/api` to `/api` directory  
**Issue**: Files were already in correct location but I assumed they needed to be moved based on folder structure request  
**Resolution**: Verified actual file structure before attempting moves, files were correctly placed in `/api/`  
**Time Impact**: 5 minutes of unnecessary commands and verification  
**Prevention**: Always check current directory structure with LS tool before assuming file movements are needed  

### Context Documentation Requirements
**Date**: 2025-08-29T21:50:00Z  
**Task**: Updating project files without proper context documentation  
**Issue**: Made extensive changes to project (rebranding, architecture, build system) without updating .context/history.md  
**Resolution**: Comprehensive history update documenting all changes made in the session  
**Time Impact**: 20 minutes to properly document all changes retroactively  
**Prevention**: Update .context/history.md incrementally during major changes, not as an afterthought  

### Git Flow Branch Setup with Remotes
**Date**: 2025-08-29T22:15:00Z  
**Task**: Setting up stage branch and adding Encore Cloud remote for deployment workflow  
**Issue**: Initial confusion about which branch to create the stage branch from and proper remote configuration  
**Resolution**: Created stage branch from develop, added Encore remote with correct app ID (`encore://legalease-65o2`)  
**Time Impact**: 10 minutes to verify proper branch strategy and remote setup  
**Prevention**: Document branch creation commands in AGENTS.md, include remote verification steps  

### Documentation Synchronization Patterns
**Date**: 2025-08-29T22:25:00Z  
**Task**: Keeping .context/todo.md and TodoWrite tool synchronized with actual project status  
**Issue**: User pointed out .context/todo.md was unchanged despite using TodoWrite tool - they're separate systems  
**Resolution**: Must update both .context/todo.md file directly AND TodoWrite tool to keep them synchronized  
**Time Impact**: 15 minutes to identify discrepancy and update both systems  
**Prevention**: Always update .context/todo.md file when using TodoWrite tool for major workflow changes  

### Competition Timeline Management
**Date**: 2025-08-29T22:30:00Z  
**Task**: Tracking progress against GovHack competition timeline and deliverables  
**Issue**: Original todo.md had outdated directory references (/services vs /api) and didn't reflect current development status  
**Resolution**: Updated todo.md to show foundation complete, current phase highlighted, next tasks clearly identified  
**Time Impact**: 20 minutes to thoroughly review and update competition timeline  
**Prevention**: Update .context/todo.md after each major milestone to keep competition timeline accurate  

### Frontend Testing Configuration with Vitest
**Date**: 2025-08-29T23:00:00Z  
**Task**: Setting up comprehensive test suite for Vue.js components with Vitest
**Issue**: Tests failing with "document is not defined" error when mounting Vue components
**Resolution**: Added Vitest configuration with jsdom environment and comprehensive test-setup.ts file with global mocks
**Time Impact**: 15 minutes to research and configure proper testing environment  
**Prevention**: Always configure test environment first when setting up component tests, include test-setup.ts in Vitest config

### Axios Mocking in Development with TypeScript
**Date**: 2025-08-29T23:05:00Z  
**Task**: Creating axios interceptors for development mocking while maintaining TypeScript safety
**Issue**: Complex mock setup required for both development interceptors and test mocking
**Resolution**: Used vi.mock with proper factory function and typed mock instances for tests
**Time Impact**: 20 minutes to get TypeScript-compliant mocking working correctly  
**Prevention**: Create mock strategy early, use factory functions in vi.mock, type all mock instances properly

### Context Management Compliance
**Date**: 2025-08-29T23:20:00Z  
**Task**: Following .claude/instructions.md requirements for context documentation  
**Issue**: Repeatedly failing to create scratchpad files and update .context properly despite clear instructions
**Resolution**: Created .context/scratchpad/ directory and task-specific markdown files as required
**Time Impact**: User had to remind me multiple times, wasting 10+ minutes of discussion  
**Prevention**: ALWAYS read .claude/instructions.md first, ALWAYS create scratchpad file before starting work, NEVER skip context management steps

---

<!-- Add new entries below this line -->