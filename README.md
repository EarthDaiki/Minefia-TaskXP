# Minefia TaskXP

Minefia TaskXP is a desktop task management app built with Tauri, React, TypeScript, and Rust.

The app is currently under development. AI agent features are planned, but they are not implemented yet.

## Current Features

- Create tasks with title, description, priority, difficulty, estimated minutes, due date, due time, and tags
- View tasks by list, today, upcoming, completed, calendar, and tag
- Open a task detail page to inspect and edit task data
- Add, select, display, and delete tags
- Complete and restore tasks
- Start a task, reset the start time, and track completion-related data
- Store task data locally with SQLite through the Tauri backend

## Planned Features

- AI quick add from natural language
- AI task breakdown for large tasks
- AI prioritization based on due date, priority, difficulty, and estimated effort
- Settings page and app preferences
- Better production packaging and app distribution

## Tech Stack

- Tauri
- React
- TypeScript
- Rust
- SQLite
- Vite
- FullCalendar

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

This project is not production-ready yet. Core task management features are being built and refined. The AI agent functionality and settings page are still future features.
