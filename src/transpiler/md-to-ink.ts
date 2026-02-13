import { TRANSLATION_SCHEMA, ChoiceMode } from "../translation-schema";
import { ParsedNote } from "./parser";

const S = TRANSLATION_SCHEMA;

export interface TranspileOptions {
	choiceMode: ChoiceMode;
}

export interface TranspileResult {
	inkSource: string;
	warnings: string[];
}

/**
 * Transpile a complete story (multiple parsed notes) into a single Ink source string.
 */
export function transpileStory(
	globalsNote: ParsedNote | null,
	knotNotes: ParsedNote[],
	options: TranspileOptions
): TranspileResult {
	const output: string[] = [];
	const warnings: string[] = [];

	// 1. Emit variable declarations from _globals
	if (globalsNote) {
		emitVariables(globalsNote, output);
		if (output.length > 0) {
			output.push("");
		}
	}

	// 2. Emit each knot
	for (const note of knotNotes) {
		const knotId = note.inkId ?? S.slugify(note.filename);
		output.push(S.structure.knot.toInk(knotId));

		// Emit knot-level tags from frontmatter
		const inkTags = note.frontmatter["ink-tags"];
		if (Array.isArray(inkTags) && inkTags.length > 0) {
			output.push(S.tags.knot.toInk(inkTags as string[]));
		}

		const bodyResult = transpileBody(note.bodyLines, options);
		output.push(...bodyResult.lines);
		warnings.push(...bodyResult.warnings);

		output.push("");
	}

	return {
		inkSource: output.join("\n"),
		warnings,
	};
}

// ---- Variable emission ----

function emitVariables(globals: ParsedNote, output: string[]): void {
	const fm = globals.frontmatter;

	// LIST declarations
	const lists = fm["ink-lists"];
	if (lists && typeof lists === "object" && !Array.isArray(lists)) {
		for (const [name, values] of Object.entries(lists as Record<string, unknown>)) {
			if (Array.isArray(values)) {
				output.push(S.lists.definition.toInk(name, values as string[]));
			}
		}
	}

	// CONST declarations
	const consts = fm["ink-consts"];
	if (consts && typeof consts === "object" && !Array.isArray(consts)) {
		for (const [name, value] of Object.entries(consts as Record<string, unknown>)) {
			output.push(S.variables.constant.toInk(name, value));
		}
	}

	// VAR declarations
	const vars = fm["ink-vars"];
	if (vars && typeof vars === "object" && !Array.isArray(vars)) {
		for (const [name, value] of Object.entries(vars as Record<string, unknown>)) {
			output.push(S.variables.global.toInk(name, value));
		}
	}
}

// ---- Body transpilation ----

interface BodyResult {
	lines: string[];
	warnings: string[];
}

function transpileBody(bodyLines: string[], options: TranspileOptions): BodyResult {
	const output: string[] = [];
	const warnings: string[] = [];
	let i = 0;

	while (i < bodyLines.length) {
		const line = bodyLines[i] ?? "";
		const trimmed = line.trim();

		// Empty lines pass through
		if (trimmed === "") {
			output.push("");
			i++;
			continue;
		}

		// Comments: %%text%% → // text
		if (trimmed.startsWith(S.structure.comment.mdOpen) && trimmed.endsWith(S.structure.comment.mdClose)) {
			const commentText = trimmed.slice(2, -2).trim();
			output.push(`${S.structure.comment.inkPrefix} ${commentText}`);
			i++;
			continue;
		}

		// H1 heading → stitch
		if (trimmed.startsWith(S.structure.stitch.mdPrefix) && !trimmed.startsWith("## ")) {
			const headingText = trimmed.slice(S.structure.stitch.mdPrefix.length).trim();
			output.push(S.structure.stitch.toInk(S.slugify(headingText)));
			i++;
			continue;
		}

		// H2+ headings — pass as Ink comments
		if (/^#{2,}\s/.test(trimmed)) {
			const headingText = trimmed.replace(/^#+\s*/, "");
			output.push(`// ${headingText}`);
			i++;
			continue;
		}

		// -> END
		if (trimmed === S.navigation.end.md) {
			output.push(S.navigation.end.ink);
			i++;
			continue;
		}

		// -> DONE
		if (trimmed === S.navigation.done.md) {
			output.push(S.navigation.done.ink);
			i++;
			continue;
		}

		// -> [[Target#Section]]
		const sectionMatch = trimmed.match(S.navigation.divertToSection.mdPattern);
		if (sectionMatch) {
			output.push(S.navigation.divertToSection.toInk(
				sectionMatch[1] ?? "", sectionMatch[2] ?? ""
			));
			i++;
			continue;
		}

		// -> [[Target]]
		const divertMatch = trimmed.match(S.navigation.divert.mdPattern);
		if (divertMatch) {
			output.push(S.navigation.divert.toInk(divertMatch[1] ?? ""));
			i++;
			continue;
		}

		// Named gather: --- `ink: (label)`
		const namedGatherMatch = trimmed.match(S.gathers.named.mdPattern);
		if (namedGatherMatch) {
			output.push(S.gathers.named.toInk(namedGatherMatch[1] ?? ""));
			i++;
			continue;
		}

		// Basic gather: --- (horizontal rule)
		if (trimmed === S.gathers.basic.md || trimmed === "----" || trimmed === "-----") {
			output.push(S.gathers.basic.ink);
			i++;
			continue;
		}

		// Full-line inline ink: temp var `ink: ~ temp x = 3`
		const tempMatch = trimmed.match(S.variables.tempVar.mdPattern);
		if (tempMatch) {
			output.push(S.variables.tempVar.toInk(
				tempMatch[1] ?? "", tempMatch[2] ?? ""
			));
			i++;
			continue;
		}

		// Full-line inline ink: modify `ink: ~ expression`
		const modifyMatch = trimmed.match(S.variables.modify.mdPattern);
		if (modifyMatch) {
			output.push(S.variables.modify.toInk(modifyMatch[1] ?? ""));
			i++;
			continue;
		}

		// Conditional callout blocks: > [!ink-if]
		if (trimmed.startsWith(S.conditionals.block.mdIf)) {
			const result = transpileConditionalBlock(bodyLines, i);
			output.push(...result.lines);
			i = result.nextIndex;
			continue;
		}

		// Sequence callouts: > [!ink-seq], [!ink-cycle], etc.
		const seqResult = tryTranspileSequence(bodyLines, i);
		if (seqResult) {
			output.push(seqResult.ink);
			i = seqResult.nextIndex;
			continue;
		}

		// Choice blocks (blockquote or asterisk mode)
		if (isChoiceLine(trimmed, options.choiceMode)) {
			const result = transpileChoiceBlock(bodyLines, i, options);
			output.push(...result.lines);
			i = result.nextIndex;
			continue;
		}

		// Default: plain text (passthrough with inline processing)
		output.push(processInlineElements(trimmed));
		i++;
	}

	return { lines: output, warnings };
}

// ---- Choice detection & transpilation ----

function isChoiceLine(trimmed: string, mode: ChoiceMode): boolean {
	if (mode === "blockquote") {
		return trimmed.startsWith("> - ") || trimmed.startsWith("> + ");
	}
	return trimmed.startsWith("* ") || trimmed.startsWith("+ ");
}

function isChoiceContinuation(trimmed: string, mode: ChoiceMode): boolean {
	if (mode === "blockquote") {
		return trimmed.startsWith(">") &&
			!trimmed.startsWith("> - ") &&
			!trimmed.startsWith("> + ") &&
			!trimmed.startsWith("> [!");
	}
	return /^\s{2,}\S/.test(trimmed);
}

function transpileChoiceBlock(
	bodyLines: string[],
	startIdx: number,
	options: TranspileOptions
): { lines: string[]; nextIndex: number } {
	const output: string[] = [];
	let i = startIdx;

	while (i < bodyLines.length) {
		const line = bodyLines[i] ?? "";
		const trimmed = line.trim();

		if (trimmed === "") {
			i++;
			break;
		}

		if (isChoiceLine(trimmed, options.choiceMode)) {
			output.push(transpileSingleChoice(trimmed, options, 0));
			i++;
			continue;
		}

		if (isChoiceContinuation(trimmed, options.choiceMode)) {
			const content = trimmed.startsWith("> ")
				? trimmed.slice(2).trim()
				: trimmed.startsWith(">")
					? trimmed.slice(1).trim()
					: trimmed.trim();

			// Check if continuation is a nested choice
			if (options.choiceMode === "blockquote" && (content.startsWith("- ") || content.startsWith("+ "))) {
				const isSticky = content.startsWith("+ ");
				const nestedText = content.slice(2).trim();
				output.push(transpileSingleChoice(
					(isSticky ? "> + " : "> - ") + nestedText,
					options,
					1
				));
				i++;
				continue;
			}

			// Check if continuation is a divert
			const divertMatch = content.match(/^->\s*\[\[([^\]#]+)\]\]\s*$/);
			if (divertMatch) {
				output.push("  " + S.navigation.divert.toInk(divertMatch[1] ?? ""));
				i++;
				continue;
			}

			const sectionDivertMatch = content.match(/^->\s*\[\[([^\]#]+)#([^\]]+)\]\]\s*$/);
			if (sectionDivertMatch) {
				output.push("  " + S.navigation.divertToSection.toInk(
					sectionDivertMatch[1] ?? "", sectionDivertMatch[2] ?? ""
				));
				i++;
				continue;
			}

			if (content === "-> END") {
				output.push("  -> END");
				i++;
				continue;
			}

			if (content === "-> DONE") {
				output.push("  -> DONE");
				i++;
				continue;
			}

			// Regular continuation text
			output.push("  " + processInlineElements(content));
			i++;
			continue;
		}

		// Not a choice or continuation — end the block
		break;
	}

	return { lines: output, nextIndex: i };
}

function transpileSingleChoice(
	trimmed: string,
	options: TranspileOptions,
	nestLevel: number
): string {
	let text: string;
	let sticky = false;
	let condition: string | null = null;
	let divertTarget: string | null = null;

	if (options.choiceMode === "blockquote") {
		sticky = trimmed.startsWith("> + ");
		text = trimmed.slice(4).trim();
	} else {
		sticky = trimmed.startsWith("+ ");
		text = trimmed.slice(2).trim();
	}

	// Check for fallback: `ink: fallback`
	const fallbackMatch = text.match(/^`ink:\s*fallback`\s*/);
	if (fallbackMatch) {
		text = text.slice(fallbackMatch[0].length).trim();
		return S.choices.fallback.toInk(text);
	}

	// Check for inline condition: `ink: (condition)`
	const condMatch = text.match(/`ink:\s*\(([^)]+)\)`/);
	if (condMatch) {
		condition = condMatch[1] ?? "";
		text = text.replace(condMatch[0], "").trim();
	}

	// Check for divert target: [[Target]] or [[Target|Text]]
	const wikilinkMatch = text.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]\s*$/);
	if (wikilinkMatch) {
		const linkTarget = wikilinkMatch[1] ?? "";
		const linkAlias = wikilinkMatch[2];
		divertTarget = linkTarget;
		text = text.replace(wikilinkMatch[0], "").trim();
		if (text === "" && linkAlias) {
			text = linkAlias;
		} else if (text === "") {
			text = linkTarget;
		}
	}

	// Build Ink output
	const prefix = S.choices.nested.toInkPrefix(nestLevel, sticky);
	let ink = prefix;

	if (condition) {
		ink += `(${condition}) `;
	}

	ink += `[${text}]`;

	if (divertTarget) {
		ink += ` -> ${S.slugify(divertTarget)}`;
	}

	return ink;
}

// ---- Conditional callouts ----

function transpileConditionalBlock(
	bodyLines: string[],
	startIdx: number
): { lines: string[]; nextIndex: number } {
	const output: string[] = [];
	let i = startIdx;
	let blockOpen = false;

	while (i < bodyLines.length) {
		const line = bodyLines[i] ?? "";
		const trimmed = line.trim();

		if (trimmed.startsWith(S.conditionals.block.mdIf)) {
			const cond = trimmed.slice(S.conditionals.block.mdIf.length).trim();
			output.push(S.conditionals.block.toInkIf(cond));
			blockOpen = true;
			i++;
			continue;
		}

		if (trimmed.startsWith(S.conditionals.block.mdElif)) {
			const cond = trimmed.slice(S.conditionals.block.mdElif.length).trim();
			output.push(S.conditionals.block.toInkElif(cond));
			i++;
			continue;
		}

		if (trimmed.startsWith(S.conditionals.block.mdElse)) {
			output.push(S.conditionals.block.inkElse);
			i++;
			continue;
		}

		if (trimmed.startsWith("> ")) {
			output.push("  " + processInlineElements(trimmed.slice(2)));
			i++;
			continue;
		}

		// End of callout block
		break;
	}

	if (blockOpen) {
		output.push(S.conditionals.block.inkClose);
	}

	return { lines: output, nextIndex: i };
}

// ---- Sequence callouts ----

function tryTranspileSequence(
	bodyLines: string[],
	startIdx: number
): { ink: string; nextIndex: number } | null {
	const line = bodyLines[startIdx] ?? "";
	const trimmed = line.trim();

	const seqTypes = [
		S.sequences.sequence,
		S.sequences.cycle,
		S.sequences.shuffle,
		S.sequences.once,
	];

	let matchedPrefix: string | null = null;
	for (const st of seqTypes) {
		if (trimmed.startsWith(`> [!${st.calloutType}]`)) {
			matchedPrefix = st.inkPrefix;
			break;
		}
	}

	if (matchedPrefix === null) return null;

	const items: string[] = [];
	let i = startIdx + 1;
	while (i < bodyLines.length) {
		const seqLine = bodyLines[i] ?? "";
		const seqTrimmed = seqLine.trim();
		if (seqTrimmed.startsWith("> ") && !seqTrimmed.startsWith("> [!")) {
			items.push(seqTrimmed.slice(2).trim());
		} else {
			break;
		}
		i++;
	}

	return {
		ink: S.sequences.toInk(matchedPrefix, items),
		nextIndex: i,
	};
}

// ---- Inline element processing ----

function processInlineElements(line: string): string {
	let result = line;

	// Full-line inline ink expressions: `ink: ~ expr` → ~ expr
	result = result.replace(/`ink:\s*~\s*([^`]+)`/g, (_match, expr: string) => {
		return `~ ${expr.trim()}`;
	});

	// Inline ink expressions: `ink: expr` → expr as-is
	result = result.replace(/`ink:\s*([^`]+)`/g, (_match, expr: string) => {
		return expr.trim();
	});

	// Inline tags: #ink/tagname → # tagname
	result = result.replace(/#ink\/(\w+)/g, (_match, tag: string) => {
		return `# ${tag}`;
	});

	// Inline comments: %%text%% → // text
	result = result.replace(/%%([^%]+)%%/g, (_match, text: string) => {
		return `// ${text.trim()}`;
	});

	return result;
}
