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

---

<!-- Add new entries below this line -->