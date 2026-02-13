import {
	App,
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	TFile,
} from "obsidian";
import type InkDesignerPlugin from "../main";
import { t } from "../i18n/index";

interface InkVariable {
	name: string;
	type: string;
	defaultValue: unknown;
	source: string;
}

export class InkVariableSuggest extends EditorSuggest<InkVariable> {
	plugin: InkDesignerPlugin;

	constructor(app: App, plugin: InkDesignerPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onTrigger(
		cursor: EditorPosition,
		editor: Editor,
		_file: TFile | null
	): EditorSuggestTriggerInfo | null {
		const line = editor.getLine(cursor.line);
		const beforeCursor = line.slice(0, cursor.ch);
		const lastBrace = beforeCursor.lastIndexOf("{");

		if (lastBrace === -1) return null;

		// Check no } between { and cursor
		const afterBrace = beforeCursor.slice(lastBrace + 1);
		if (afterBrace.includes("}")) return null;

		return {
			start: { line: cursor.line, ch: lastBrace + 1 },
			end: cursor,
			query: afterBrace,
		};
	}

	getSuggestions(
		context: EditorSuggestContext
	): InkVariable[] {
		const variables = this.collectVariables();
		const query = context.query.toLowerCase();

		return variables.filter((v) =>
			v.name.toLowerCase().includes(query)
		);
	}

	renderSuggestion(variable: InkVariable, el: HTMLElement): void {
		const container = el.createDiv({ cls: "ink-variable-suggestion" });
		container.createEl("strong", { text: variable.name });
		container.createEl("span", {
			text: ` (${variable.type}) = ${String(variable.defaultValue)}`,
			cls: "ink-variable-meta",
		});
		container.createEl("small", {
			text: ` ${t("suggest.fromGlobals")}`,
			cls: "ink-variable-source",
		});
	}

	selectSuggestion(
		variable: InkVariable,
		_evt: MouseEvent | KeyboardEvent
	): void {
		if (!this.context) return;

		const editor = this.context.editor;
		const start = this.context.start;
		const end = this.context.end;

		editor.replaceRange(variable.name + "}", start, end);
	}

	private collectVariables(): InkVariable[] {
		const variables: InkVariable[] = [];
		const files = this.app.vault.getMarkdownFiles();

		for (const file of files) {
			const cache = this.app.metadataCache.getFileCache(file);
			const fm = cache?.frontmatter;
			if (!fm || !fm["ink-type"]) continue;

			// Variables from _globals
			if (fm["ink-type"] === "_globals") {
				const vars = fm["ink-vars"];
				if (vars && typeof vars === "object" && !Array.isArray(vars)) {
					for (const [name, value] of Object.entries(vars as Record<string, unknown>)) {
						variables.push({
							name,
							type: typeof value,
							defaultValue: value,
							source: "_globals",
						});
					}
				}

				const consts = fm["ink-consts"];
				if (consts && typeof consts === "object" && !Array.isArray(consts)) {
					for (const [name, value] of Object.entries(consts as Record<string, unknown>)) {
						variables.push({
							name,
							type: "const",
							defaultValue: value,
							source: "_globals",
						});
					}
				}
			}

			// Variables from object instances
			if (fm["ink-fields"] && fm["ink-id"]) {
				const objectId = fm["ink-id"] as string;
				const fields = fm["ink-fields"];
				if (typeof fields === "object" && fields !== null && !Array.isArray(fields)) {
					for (const [field, value] of Object.entries(fields as Record<string, unknown>)) {
						variables.push({
							name: `${objectId}_${field}`,
							type: typeof value,
							defaultValue: value,
							source: objectId,
						});
					}
				}
			}
		}

		return variables;
	}
}
