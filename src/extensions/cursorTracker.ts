import { ViewPlugin, ViewUpdate, EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";

/**
 * Creates a CodeMirror 6 extension that tracks cursor/selection changes.
 * Calls the provided callback when cursor moves WITHOUT content changing.
 * (Content changes are already handled by Obsidian's editor-change event)
 */
export function createCursorTracker(
	onCursorMove: (view: EditorView) => void,
): Extension {
	return ViewPlugin.fromClass(
		class {
			update(update: ViewUpdate) {
				// Only fire if selection changed but content didn't
				// (content changes trigger editor-change event separately)
				if (update.selectionSet && !update.docChanged) {
					onCursorMove(update.view);
				}
			}
		},
	);
}
