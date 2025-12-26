import React from "react";
import { XMLContentRenderer } from "./XMLContentRenderer";
import { usePersistentPanelState } from "../hooks/usePersistentPanelState";
import { QueryState, canRetryError } from "../types/copilotState";

interface CopilotPanelProps {
	queryState: QueryState;
	lastSuccessfulFeedback: string | null;
	onRetry?: () => void;
	onClear?: () => void;
}

export const CopilotPanel: React.FC<CopilotPanelProps> = ({
	queryState,
	lastSuccessfulFeedback,
	onRetry,
	onClear,
}) => {
	const [isDebugOpen, toggleDebugOpen] = usePersistentPanelState(
		"debug-section",
		false,
	);

	return (
		<div className="claude-copilot-container">
			<FeedbackSection
				queryState={queryState}
				lastSuccessfulFeedback={lastSuccessfulFeedback}
				onRetry={onRetry}
			/>

			<div className="copilot-footer">
				<a
					className="copilot-clear-link"
					onClick={onClear}
					title="Clear session and start fresh"
				>
					/clear
				</a>

				<DebugSection
					isOpen={isDebugOpen}
					onToggle={toggleDebugOpen}
					queryState={queryState}
				/>
			</div>
		</div>
	);
};

interface FeedbackSectionProps {
	queryState: QueryState;
	lastSuccessfulFeedback: string | null;
	onRetry?: () => void;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({
	queryState,
	lastSuccessfulFeedback,
	onRetry,
}) => {
	return (
		<div className="claude-feedback">
			{queryState.status === "error" && (
				<ErrorDisplay
					error={queryState.error}
					occurredAt={queryState.occurredAt}
					canRetry={canRetryError(queryState.error)}
					onRetry={onRetry}
				/>
			)}

			{queryState.status === "success" ? (
				queryState.feedback && (
					<XMLContentRenderer content={queryState.feedback} />
				)
			) : lastSuccessfulFeedback ? (
				<XMLContentRenderer content={lastSuccessfulFeedback} />
			) : (
				queryState.status === "idle" && (
					<div className="placeholder-text">
						Waiting for document changes...
					</div>
				)
			)}

			{queryState.status === "cleared" && (
				<div className="placeholder-text">Session cleared</div>
			)}

			{/* Always render thinking indicator to maintain layout */}
			<div
				className="claude-thinking-indicator"
				style={{
					visibility:
						queryState.status === "querying" ? "visible" : "hidden",
				}}
			>
				<div className="placeholder-text">Claude is thinking...</div>
			</div>
		</div>
	);
};

interface DebugSectionProps {
	isOpen: boolean;
	onToggle: () => void;
	queryState: QueryState;
}

const DebugSection: React.FC<DebugSectionProps> = ({
	isOpen,
	onToggle,
	queryState,
}) => {
	return (
		<div className="debug-section">
			<div className="debug-header" onClick={onToggle}>
				<span>Debug</span>
				<button className="debug-toggle">{isOpen ? "▼" : "▶"}</button>
			</div>

			<div
				className="debug-details"
				style={{ display: isOpen ? "block" : "none" }}
			>
				<ErrorLog queryState={queryState} />
			</div>
		</div>
	);
};

interface ErrorLogProps {
	queryState: QueryState;
}

const ErrorLog: React.FC<ErrorLogProps> = ({ queryState }) => {
	return (
		<div className="error-log">
			<h5>Errors:</h5>
			<div className="error-content">
				{queryState.status === "error" &&
					`[${queryState.occurredAt.toLocaleTimeString()}] ${
						queryState.error
					}`}
			</div>
			<h5>Developer tools:</h5>
			<p>View {"-->"} Toggle Developer Tools (⌥+⌘+I)</p>
		</div>
	);
};

interface ErrorDisplayProps {
	error: string;
	occurredAt: Date;
	canRetry: boolean;
	onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
	error,
	occurredAt,
	canRetry,
	onRetry,
}) => {
	return (
		<div className="error-display">
			<div className="error-message">⚠️ Error: {error}</div>
			<div className="error-timestamp">
				Occurred at {occurredAt.toLocaleTimeString()}
			</div>
			{canRetry && onRetry && (
				<button onClick={onRetry} className="retry-button">
					Retry
				</button>
			)}
		</div>
	);
};
