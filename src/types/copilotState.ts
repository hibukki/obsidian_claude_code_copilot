// Core types for the refactored React state management

export interface Settings {
	debounceDelayMs: number;
}

// Discriminated union for query state - prevents invalid state combinations
export type QueryState =
	| { status: "idle" }
	| { status: "querying" }
	| { status: "success"; feedback: string }
	| { status: "error"; error: string; occurredAt: Date };

export interface CopilotAppState {
	settings: Settings;
	queryState: QueryState;
	lastSuccessfulFeedback: string | null;
}

// API contract between Obsidian and React
export interface CopilotReactAPI {
	updateSettings: (settings: Partial<Settings>) => void;
	onEditorContentChanged: (
		content: string,
		cursorPosition: number,
		filePath: string,
	) => void;
	cancelPendingQueries: () => void;
}

// CLI-specific error handling
export const canRetryError = (error: string): boolean =>
	!error.toLowerCase().includes("enoent") &&
	!error.toLowerCase().includes("command not found");
