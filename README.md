# Minefia TaskXP

Minefia TaskXP is a desktop task management app built with Tauri, React, TypeScript, Rust, and SQLite.

This version is complete as a prototype. It includes local task management, tag management, calendar views, settings for API key management, and an AI-assisted quick add flow using the OpenAI API.

## Current Features

- Create tasks with title, description, priority, difficulty, estimated minutes, due date, due time, and tags
- View tasks by list, today, upcoming, completed, calendar, and tag
- Open a task detail page to inspect and edit task data
- Complete, restore, start, and reset task progress
- Track started time, completed time, estimated minutes, and actual minutes
- Add, select, display, and delete tags
- Manage OpenAI API keys from the Settings page
- Store API keys in the OS keychain through the Tauri backend
- Use AI Quick Add to convert natural language into an editable task draft
- Review and edit AI-generated task drafts before saving
- Store task data locally with SQLite

## AI Quick Add

AI Quick Add lets the user write a natural language prompt such as:

```text
Cook dinner today at 7pm
```

The app sends the prompt to the OpenAI Responses API and returns a structured task draft with fields such as title, description, due date, due time, priority, difficulty, estimated minutes, existing tags, and suggested tags.

The AI result is not saved automatically. It is opened in the task dialog so the user can review, edit, and save it manually.

## Settings

The Settings page currently includes:

- API key management
- Main API key selection
- API key deletion
- Tag management

OpenAI API keys are stored in the OS keychain. SQLite stores only key metadata such as the display name and which key is selected as the main key.

## Tech Stack

- Tauri
- React
- TypeScript
- Rust
- SQLite
- Vite
- FullCalendar
- OpenAI Responses API
- OS keychain integration

## Development

Install dependencies:

```bash
npm install
```

Run the Tauri development app:

```bash
npm run tauri dev
```

Build the frontend:

```bash
npm run build
```

Build the desktop app:

```bash
npm run tauri build
```

## Status

This project is complete as a prototype and is not production-ready yet. The main task management flow is implemented, and AI Quick Add is available as an assisted workflow.

## Planned Improvements

- AI task breakdown for large tasks
- AI prioritization based on due date, priority, difficulty, and estimated effort
- Dashboard for task analytics and productivity insights
- Advanced AI agent workflows for planning, analysis, and task management support
- More complete Settings pages
- Better production packaging and app distribution
- More polished error handling and empty states
- README screenshots or demo GIF
