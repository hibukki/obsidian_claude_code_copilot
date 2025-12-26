/**
 * Inserts a cursor marker into text content at the specified position
 * @param content The original text content
 * @param position The position where to insert the cursor marker (0-based index)
 * @returns Content with <|cursor|> marker inserted at the specified position
 */
export function insertCursorMarker(content: string, position: number): string {
	// Validate position bounds
	if (position < 0 || position > content.length) {
		return content;
	}

	const beforeCursor = content.substring(0, position);
	const afterCursor = content.substring(position);
	return beforeCursor + "<|cursor|>" + afterCursor;
}

/**
 * Get the line number (0-based) for a character position in content
 */
export function getCursorLineNumber(content: string, position: number): number {
	return content.substring(0, position).split("\n").length - 1;
}

/**
 * Get context lines around the cursor (linesBefore lines before + cursor line)
 * Returns lines with 1-based line numbers prefixed
 */
export function getContextLines(
	lines: string[],
	cursorLine: number,
	linesBefore: number,
): string {
	const startLine = Math.max(0, cursorLine - linesBefore);
	const endLine = cursorLine;
	return lines
		.slice(startLine, endLine + 1)
		.map((line, i) => `${startLine + i + 1}: ${line}`)
		.join("\n");
}
