# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Obsidian plugin that provides AI-powered writing assistance using Claude AI. The plugin creates a sidebar panel that provides real-time feedback and suggestions as users write in their Obsidian vault.

## Development Commands

- `npm run dev` - Start development build with watch mode
- `npm run build` - Production build with TypeScript checking and esbuild bundling
- `npm run lint` - Run ESLint on TypeScript files in src/
- `npm run version` - Bump version and update manifest/versions files

## Architecture

### Core Components

- **Main Plugin (`main.ts`)**: The primary plugin class that manages initialization, settings, and the plugin lifecycle
- **ClaudeCopilotView**: Custom Obsidian ItemView that renders the React-based sidebar panel
- **AnthropicClient (`src/services/anthropicClient.ts`)**: Handles API communication with Claude
- **CopilotPanel (`src/components/CopilotPanel.tsx`)**: Main React component for the sidebar UI

### Key Features

- **Real-time Document Analysis**: Uses debounced editor change events to analyze document content
- **Cursor-aware Prompts**: Inserts `<cursor/>` markers to show Claude the user's current position
- **Customizable Prompts**: Users can edit the prompt template in `claude_copilot/prompt.md`
- **React Integration**: Uses React 19 with TypeScript for the UI components

### File Structure

- `src/services/` - API clients and external service integrations
- `src/components/` - React components for the UI
- `src/utils/` - Utility functions (cursor handling, XML parsing)
- `src/types/` - TypeScript type definitions
- `src/styles/` - CSS styling
- `src/templates/` - Default prompt templates

### Build System

Uses esbuild for bundling with:

- TypeScript compilation
- React JSX transformation
- External dependencies (Obsidian API, CodeMirror)
- Development watch mode and production minification

### Settings and Configuration

- API key and model selection managed through Obsidian settings
- Debounce delay configurable (default: 2000ms)
- Prompt template stored in vault at `.claude_copilot/prompt.md`
- Default model: `claude-3-5-haiku-latest`

### Plugin Installation

The plugin creates a symbolic link for development:

```sh
ln -s "/PATH/TO/CURRENT/FOLDER" "/PATH/TO/OBSIDIAN/VAULT/.obsidian/plugins/OBSIDIAN-PLUGIN-NAME"
```

### React Component Pattern

Components use inline styles defined in the main view rather than separate CSS files, following Obsidian's CSS variable system for theming consistency.
