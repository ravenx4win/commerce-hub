# Antigravity Skills Directory

This directory contains custom skills for this project.

## Structure

Each skill should have its own subdirectory with a `SKILL.md` file:

```text
skills/
└── <skill-name>/
    ├── SKILL.md          # Required: Instructions with YAML frontmatter
    ├── scripts/          # Optional: Helper scripts
    ├── examples/         # Optional: Example implementations
    ├── resources/        # Optional: Additional resources
    └── references/       # Optional: Detailed documentation
```

### Example `SKILL.md`

```markdown
---
name: sample-skill
description: Describe when the agent should use this skill.
---

# Sample Skill

Instructions and steps for the agent...
```
