export interface ParsedNote {
	frontmatter: Record<string, unknown>;
	inkType: string | null;
	inkId: string | null;
	inkProject: string | null;
	bodyLines: string[];
	filename: string;
}

/**
 * Parse a markdown note's content and its cached frontmatter.
 *
 * @param content - Raw file text
 * @param frontmatter - Obsidian's metadataCache-parsed YAML
 * @param filename - Note basename without .md extension
 */
export function parseNote(
	content: string,
	frontmatter: Record<string, unknown> | undefined,
	filename: string
): ParsedNote {
	const fm = frontmatter ?? {};

	return {
		frontmatter: fm,
		inkType: typeof fm["ink-type"] === "string" ? fm["ink-type"] : null,
		inkId: typeof fm["ink-id"] === "string" ? fm["ink-id"] : null,
		inkProject: typeof fm["ink-project"] === "string" ? fm["ink-project"] : null,
		bodyLines: extractBody(content),
		filename,
	};
}

/**
 * Extract body lines from raw markdown content,
 * stripping the YAML frontmatter block.
 */
function extractBody(content: string): string[] {
	const lines = content.split("\n");

	if (lines.length === 0 || lines[0]?.trim() !== "---") {
		return lines;
	}

	for (let i = 1; i < lines.length; i++) {
		if (lines[i]?.trim() === "---") {
			return lines.slice(i + 1);
		}
	}

	return lines;
}
