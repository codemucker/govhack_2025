# Context Folder

This folder maintains the working context for Claude Code sessions.

## Structure

### scratchpad/
Directory containing task-specific scratchpad files. Each task/feature gets its own file to avoid merge conflicts.

**Naming convention**: `task-name.md` or `feature-name.md`  
**Example**: `scratchpad/user-auth.md`, `scratchpad/api-refactor.md`

### learnings.md
Documents complexities, nuances, and unexpected findings that caused delays or required workarounds. Reference this to avoid repeated issues.

### history.md
Chronological record of all development sessions including:
- Date and time (ISO 8601 format)
- User request interpretation
- Tasks completed
- Outcome reports with major/minor changes
- Reference to specific scratchpad file used

## Usage

- **Starting work**: Create new scratchpad file matching your feature branch
- **During work**: Use task-specific scratchpad for active notes
- **When stuck**: Document issues in learnings.md
- **After sessions**: Update history.md with summary and scratchpad reference

## Maintenance

- Keep scratchpad files for historical reference
- Archive old scratchpad files if folder gets too large
- Keep learnings.md entries concise but complete
- Ensure history.md entries reference specific scratchpad files