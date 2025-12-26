import React, { useState, useEffect, useMemo, useRef } from "react";
import { debounce, App } from "obsidian";
import { Settings, QueryState, CopilotReactAPI } from "../types/copilotState";
import { SettingsProvider } from "../contexts/SettingsContext";
import { CopilotPanel } from "./CopilotPanel";
import { ClaudeClient } from "../services/claudeClient";
import {
	insertCursorMarker,
	getCursorLineNumber,
	getContextLines,
} from "../utils/cursor";
import { getPromptTemplate } from "../services/promptTemplate";

interface CopilotAppProps {
	initialSettings: Settings;
	vaultPath: string;
	onApiReady: (api: CopilotReactAPI) => void;
	app: App;
}

export const CopilotApp: React.FC<CopilotAppProps> = ({
	initialSettings,
	vaultPath,
	onApiReady,
	app,
}) => {
	const [settings, setSettings] = useState<Settings>(initialSettings);
	const [queryState, setQueryState] = useState<QueryState>({
		status: "idle",
	});
	const [lastSuccessfulFeedback, setLastSuccessfulFeedback] = useState<
		string | null
	>(null);

	const claudeClientRef = useRef<ClaudeClient | null>(null);

	// Initialize ClaudeClient
	useEffect(() => {
		claudeClientRef.current = new ClaudeClient(vaultPath);
	}, [vaultPath]);

	// Debounced query function - recreated when settings change
	const debouncedQuery = useMemo(
		() =>
			debounce(
				async (
					content: string,
					cursorPosition: number,
					filePath: string,
				) => {
					if (!claudeClientRef.current) {
						setQueryState({
							status: "error",
							error: "Claude client not initialized",
							occurredAt: new Date(),
						});
						return;
					}

					setQueryState({ status: "querying" });

					try {
						const isNewSession =
							claudeClientRef.current.isNewSession();
						let prompt: string;

						if (isNewSession) {
							// FIRST PROMPT: Full template + entire document with cursor marker
							const documentWithCursor = insertCursorMarker(
								content,
								cursorPosition,
							);
							const promptTemplate = await getPromptTemplate(app);
							prompt = promptTemplate.replace(
								"{{doc}}",
								documentWithCursor,
							);
						} else {
							// FOLLOW-UP PROMPT: Minimal context
							const lines = content.split("\n");
							const cursorLine = getCursorLineNumber(
								content,
								cursorPosition,
							);
							const contextLines = getContextLines(
								lines,
								cursorLine,
								2,
							);

							prompt = `File: ${filePath}
Cursor at line: ${cursorLine + 1}
Context:
${contextLines}

(Use Read tool if you need more context)`;
						}

						const feedback =
							await claudeClientRef.current.getFeedback(prompt);
						setQueryState({ status: "success", feedback });
						setLastSuccessfulFeedback(feedback);
					} catch (error) {
						const errorMessage =
							error instanceof Error
								? error.message
								: "Unknown error occurred";
						setQueryState({
							status: "error",
							error: errorMessage,
							occurredAt: new Date(),
						});
					}
				},
				settings.debounceDelayMs,
				true, // Only use the last call, keep waiting until the user finishes typing
			),
		[settings.debounceDelayMs, app, vaultPath],
	);

	// Handle retry for failed queries
	const handleRetry = () => {
		if (queryState.status === "error") {
			setQueryState({ status: "idle" });
		}
	};

	// Expose API to Obsidian
	useEffect(() => {
		const api: CopilotReactAPI = {
			updateSettings: (updates) => {
				setSettings((prev) => ({ ...prev, ...updates }));
			},
			onEditorContentChanged: debouncedQuery,
			cancelPendingQueries: () => {
				debouncedQuery.cancel();
				if (queryState.status === "querying") {
					setQueryState({ status: "idle" });
				}
			},
		};

		onApiReady(api);
	}, [debouncedQuery, queryState.status]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			debouncedQuery.cancel();
		};
	}, [debouncedQuery]);

	return (
		<SettingsProvider settings={settings}>
			<CopilotPanel
				queryState={queryState}
				lastSuccessfulFeedback={lastSuccessfulFeedback}
				onRetry={handleRetry}
			/>
		</SettingsProvider>
	);
};
