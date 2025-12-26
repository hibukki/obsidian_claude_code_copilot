import React, { useState, useEffect } from "react";
import { App, PluginSettingTab } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import type ClaudeCopilotPlugin from "../../main";
import { CLAUDE_COPILOT_PROMPT_FILE } from "../consts";
import {
	openPromptFile,
	restoreDefaultPrompt,
} from "../services/promptTemplate";

interface SettingsProps {
	plugin: ClaudeCopilotPlugin;
}

const SettingsComponent: React.FC<SettingsProps> = ({ plugin }) => {
	const [debounceDelay, setDebounceDelay] = useState(
		plugin.settings.debounceDelay.toString(),
	);
	const [statusMessage, setStatusMessage] = useState<{
		text: string;
		type: "success" | "error";
	} | null>(null);

	// Auto-clear status messages after 3 seconds
	useEffect(() => {
		if (statusMessage) {
			const timer = setTimeout(() => {
				setStatusMessage(null);
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [statusMessage]);

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
					<div className="setting-item-name">Claude CLI Required</div>
					<div className="setting-item-description">
						This plugin uses the Claude Code CLI. Make sure 'claude'
						is installed and available in your PATH. Get it from
						claude.ai/code
					</div>
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

	constructor(app: App, plugin: ClaudeCopilotPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		this.root = createRoot(containerEl);
		this.root.render(
			React.createElement(SettingsComponent, {
				plugin: this.plugin,
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
