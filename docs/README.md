# Disco Survivors - Documentation

This folder contains all documentation for the Disco Survivors game project.

## Core Documentation

### [CHARACTER_SYSTEM.md](CHARACTER_SYSTEM.md)
**Technical reference for the JSON-based character definition system**

- Character JSON schema and properties
- How the system works internally
- Step-by-step guide to adding new enemies
- Example enemy configurations
- Spawn system overview
- Performance considerations

**Use this when**: You want to understand how the character system works or need to manually edit `characters.json`

---

### [CHARACTER_EDITOR_README.md](CHARACTER_EDITOR_README.md)
**User guide for the character editor tools**

- Comparison of two editor versions (file-based vs API-based)
- Getting started with each editor
- File-based editor: Simple JSON download/upload workflow
- API-based editor: Real-time saves with automatic backups
- Editing character properties
- Tips for creating balanced enemies
- Comprehensive troubleshooting guide

**Use this when**: You want to create or edit enemies using either:
- File-based editor: `tools/character-editor.html` (offline, simple)
- API-based editor: `tools/character-editor2.html` (Docker, production)

---

### [API_REFERENCE.md](API_REFERENCE.md)
**Complete REST API documentation**

- API endpoints (GET, POST, PUT, DELETE)
- Validation rules and field constraints
- Error codes and handling
- Backup system documentation
- Integration examples (JavaScript, Python, cURL)
- Troubleshooting guide
- Production considerations

**Use this when**: You want to integrate with the REST API or understand how the API works

---

### [ENHANCEMENTS.md](ENHANCEMENTS.md)
**Future improvement ideas and feature suggestions**

- Code quality improvements
- Gameplay feature ideas
- Developer tools
- Performance optimizations
- Documentation needs

**Use this when**: You're looking for ideas on what to work on next or want to contribute to the project

---

## Archived Documentation

### [archive/ProjectPlan/](archive/ProjectPlan/)
**Generic project plan templates (not customized for this project)**

Contains template files for project planning. These are kept as reference material but are not actively used.

---

## Quick Links

### For Players
- **How to play**: See main [README.md](../README.md)
- **Game controls**: Arrow keys to move, 0 to debug

### For Developers
- **Add new enemy**: [CHARACTER_SYSTEM.md](CHARACTER_SYSTEM.md) or [CHARACTER_EDITOR_README.md](CHARACTER_EDITOR_README.md)
- **Modify enemy stats**: Use the [character editor](../tools/character-editor.html)
- **Understand the codebase**: Start with [../game.js](../game.js) and [characters.json](../characters.json)
- **Contribute features**: Check [ENHANCEMENTS.md](ENHANCEMENTS.md) for ideas

### For API Users
- **REST API reference**: [API_REFERENCE.md](API_REFERENCE.md) - Complete API documentation
- **Quick API overview**: [README.md](../README.md#api-service) - Getting started
- **Character editor API integration**: [CHARACTER_EDITOR_README.md](CHARACTER_EDITOR_README.md) - API-based editor

---

## Documentation Guidelines

### When to Update These Docs

- **CHARACTER_SYSTEM.md**: When you add new character properties or change the JSON schema
- **CHARACTER_EDITOR_README.md**: When you add features to either editor or change workflows
- **API_REFERENCE.md**: When you add/modify API endpoints, change validation rules, or update error codes
- **ENHANCEMENTS.md**: When you have new ideas or complete items from the list

### Writing Style

- Use clear, concise language
- Include code examples where helpful
- Provide step-by-step instructions
- Add troubleshooting tips for common issues
- Keep content up-to-date with the actual code

### Documentation Structure

Each doc should have:
1. Clear title and purpose statement
2. Table of contents for longer docs
3. Step-by-step instructions where applicable
4. Code examples with proper syntax highlighting
5. Troubleshooting section if relevant

---

## Contributing to Documentation

Found an error or want to improve the docs?

1. Edit the relevant markdown file
2. Test any code examples you change
3. Keep the same formatting style
4. Submit a pull request

Good documentation helps everyone! 📚✨

---

**Last Updated**: 2026-01-10
