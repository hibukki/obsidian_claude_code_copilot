import React, { useState, useEffect, useCallback } from "react";
import { App, PluginSettingTab } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import type ClaudeCopilotPlugin from "../../main";
import { CLAUDE_COPILOT_PROMPT_FILE } from "../consts";
import {
	openPromptFile,
	restoreDefaultPrompt,
} from "../services/promptTemplate";
import { AnthropicClient, ModelInfo } from "../services/anthropicClient";

const FALLBACK_MODELS = [
	"claude-3-5-haiku-latest",
	"claude-3-7-sonnet-latest",
	"claude-sonnet-4-5-20250929",
	"claude-opus-4-5-20251101",
];

interface SettingsProps {
	plugin: ClaudeCopilotPlugin;
	onModelChanged?: (model: string) => void;
}

const SettingsComponent: React.FC<SettingsProps> = ({
	plugin,
	onModelChanged,
}) => {
	const [apiKey, setApiKey] = useState(plugin.settings.apiKey);
	const [model, setModel] = useState(plugin.settings.model);
	const [debounceDelay, setDebounceDelay] = useState(
		plugin.settings.debounceDelay.toString(),
	);
	const [statusMessage, setStatusMessage] = useState<{
		text: string;
		type: "success" | "error";
	} | null>(null);
	const [models, setModels] = useState<ModelInfo[]>([]);
	const [modelsLoading, setModelsLoading] = useState(false);

	const fetchModels = useCallback(async (key: string) => {
		if (!key) {
			setModels([]);
			return;
		}
		setModelsLoading(true);
		try {
			const fetchedModels = await AnthropicClient.fetchModels(key);
			setModels(fetchedModels);
		} catch (error) {
			console.error("Failed to fetch models:", error);
			setModels([]);
		} finally {
			setModelsLoading(false);
		}
	}, []);

	// Fetch models on mount if API key exists
	useEffect(() => {
		if (apiKey) {
			fetchModels(apiKey);
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// Auto-clear status messages after 3 seconds
	useEffect(() => {
		if (statusMessage) {
			const timer = setTimeout(() => {
				setStatusMessage(null);
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [statusMessage]);

	const handleApiKeyChange = async (value: string) => {
		setApiKey(value);
		plugin.settings.apiKey = value;
		await plugin.saveSettings();
	};

	const handleModelChange = async (value: string) => {
		setModel(value);
		plugin.settings.model = value;
		await plugin.saveSettings();
		onModelChanged?.(value);
	};

	const handleDebounceDelayChange = async (value: string) => {
		setDebounceDelay(value);
		const delay = parseInt(value);
		if (!isNaN(delay) && delay > 0) {
			plugin.settings.debounceDelay = delay;
			await plugin.saveSettings();
		}
	};

	const handleEditPrompt = async () => {
		try {
			await openPromptFile(plugin.app);
			setStatusMessage({
				text: `Opened prompt file: ${CLAUDE_COPILOT_PROMPT_FILE}`,
				type: "success",
			});
		} catch (error) {
			console.error("Error opening prompt file:", error);
			setStatusMessage({
				text: "Failed to open prompt file",
				type: "error",
			});
		}
	};

	const handleRestoreDefault = async () => {
		try {
			await restoreDefaultPrompt(plugin.app);
			setStatusMessage({
				text: "Prompt restored to default",
				type: "success",
			});
		} catch (error) {
			console.error("Error restoring default prompt:", error);
			setStatusMessage({
				text: "Failed to restore default prompt",
				type: "error",
			});
		}
	};

	return (
		<div className="claude-copilot-settings">
			<h2>Claude Copilot Settings</h2>

			<div className="setting-item">
				<div className="setting-item-info">
					<div className="setting-item-name">Claude API Key</div>
					<div className="setting-item-description">
						Enter your Claude API key. Get one from
						console.anthropic.com
					</div>
				</div>
				<div className="setting-item-control">
					<input
						type="password"
						placeholder="sk-ant-..."
						value={apiKey}
						onChange={(e) => handleApiKeyChange(e.target.value)}
						spellCheck={false}
					/>
				</div>
			</div>

			<div className="setting-item">
				<div className="setting-item-info">
					<div className="setting-item-name">Claude Model</div>
					<div className="setting-item-description">
						{models.length > 0
							? `Select which Claude model to use (${models.length} available)`
							: "Select which Claude model to use (using fallback list)"}
					</div>
				</div>
				<div className="setting-item-control">
					<select
						className="dropdown"
						value={model}
						onChange={(e) => handleModelChange(e.target.value)}
						disabled={modelsLoading}
					>
						{(models.length > 0
							? models.map((m) => m.id)
							: FALLBACK_MODELS
						).map((modelOption) => (
							<option key={modelOption} value={modelOption}>
								{modelOption}
							</option>
						))}
					</select>
					<button
						onClick={() => fetchModels(apiKey)}
						disabled={modelsLoading || !apiKey}
						style={{ marginLeft: "8px" }}
						title="Refresh model list from API"
					>
						{modelsLoading ? "..." : "↻"}
					</button>
				</div>
			</div>

			<div className="setting-item">
				<div className="setting-item-info">
					<div className="setting-item-name">Debounce Delay (ms)</div>
					<div className="setting-item-description">
						How long to wait after typing stops before querying
						Claude (in milliseconds)
					</div>
				</div>
				<div className="setting-item-control">
					<input
						type="text"
						placeholder="2000"
						value={debounceDelay}
						onChange={(e) =>
							handleDebounceDelayChange(e.target.value)
						}
					/>
				</div>
			</div>

			<div className="setting-item">
				<div className="setting-item-info">
					<div className="setting-item-name">Prompt Template</div>
					<div className="setting-item-description">
						Customize the prompt template that guides Claude's
						responses. File location: {CLAUDE_COPILOT_PROMPT_FILE}
					</div>
				</div>
				<div className="setting-item-control">
					<button onClick={handleEditPrompt}>Edit Prompt</button>
					<button
						onClick={handleRestoreDefault}
						style={{ marginLeft: "8px" }}
					>
						Restore Default
					</button>
				</div>
				{statusMessage && (
					<div
						style={{
							marginTop: "8px",
							padding: "6px 12px",
							borderRadius: "4px",
							fontSize: "14px",
							backgroundColor:
								statusMessage.type === "success"
									? "#d4edda"
									: "#f8d7da",
							color:
								statusMessage.type === "success"
									? "#155724"
									: "#721c24",
							border: `1px solid ${statusMessage.type === "success" ? "#c3e6cb" : "#f5c6cb"}`,
						}}
					>
						{statusMessage.text}
					</div>
				)}
			</div>
		</div>
	);
};

export class ClaudeCopilotSettingTab extends PluginSettingTab {
	plugin: ClaudeCopilotPlugin;
	root: Root | null = null;
	onModelChanged?: (model: string) => void;

	constructor(
		app: App,
		plugin: ClaudeCopilotPlugin,
		onModelChanged?: (model: string) => void,
	) {
		super(app, plugin);
		this.plugin = plugin;
		this.onModelChanged = onModelChanged;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		this.root = createRoot(containerEl);
		this.root.render(
			React.createElement(SettingsComponent, {
				plugin: this.plugin,
				onModelChanged: this.onModelChanged,
			}),
		);
	}

	hide(): void {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
	}
}
