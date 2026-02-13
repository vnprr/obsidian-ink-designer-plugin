import type { MarkdownPostProcessorContext } from "obsidian";
import type InkDesignerPlugin from "../main";
import { t } from "../i18n/index";

/**
 * Register the MarkdownPostProcessor for Ink-specific decorations.
 */
export function registerMarkdownDecorator(plugin: InkDesignerPlugin): void {
	plugin.registerMarkdownPostProcessor(
		(element: HTMLElement, context: MarkdownPostProcessorContext) => {
			if (!plugin.settings.showInkDecorations) return;

			// Only decorate notes with ink-type frontmatter
			const frontmatter = context.frontmatter;
			if (!frontmatter || !frontmatter["ink-type"]) return;

			decorateChoices(element);
			decorateDiverts(element);
			decorateInkExpressions(element);
			decorateCallouts(element);
		}
	);
}

/**
 * Decorate choice lines in blockquotes.
 */
function decorateChoices(element: HTMLElement): void {
	const blockquotes = element.querySelectorAll("blockquote");

	for (const bq of Array.from(blockquotes)) {
		const listItems = bq.querySelectorAll("li");
		for (const li of Array.from(listItems)) {
			li.addClass("ink-choice-item");

			const badge = createSpan({
				cls: "ink-choice-badge",
				text: t("decoration.choice").toLowerCase(),
			});
			badge.setAttribute("aria-label", t("decoration.choice"));
			li.prepend(badge);
		}
	}
}

/**
 * Decorate divert lines (-> [[Target]]) in paragraphs.
 */
function decorateDiverts(element: HTMLElement): void {
	const paragraphs = element.querySelectorAll("p");

	for (const p of Array.from(paragraphs)) {
		const text = p.textContent ?? "";
		const trimmed = text.trim();

		if (/^->\s*\[\[.*\]\]/.test(trimmed) ||
			trimmed === "-> END" ||
			trimmed === "-> DONE") {
			p.addClass("ink-divert-line");

			const badge = createSpan({
				cls: "ink-divert-badge",
				text: t("decoration.divert").toLowerCase(),
			});
			badge.setAttribute("aria-label", t("decoration.divert"));
			p.prepend(badge);
		}
	}
}

/**
 * Decorate inline `ink: ...` code spans.
 */
function decorateInkExpressions(element: HTMLElement): void {
	const codeSpans = element.querySelectorAll("code");

	for (const code of Array.from(codeSpans)) {
		const text = code.textContent ?? "";
		if (text.startsWith("ink:") || text.startsWith("ink: ")) {
			code.addClass("ink-expression-badge");
			code.setAttribute("aria-label", t("decoration.inkExpr"));
		}
	}
}

/**
 * Decorate Ink-specific callouts.
 */
function decorateCallouts(element: HTMLElement): void {
	const callouts = element.querySelectorAll(
		'.callout[data-callout^="ink-"]'
	);

	for (const callout of Array.from(callouts)) {
		const calloutType = callout.getAttribute("data-callout") ?? "";
		callout.addClass("ink-callout");

		if (calloutType === "ink-if" || calloutType === "ink-elif" || calloutType === "ink-else") {
			callout.addClass("ink-callout-condition");
		} else if (
			calloutType === "ink-seq" ||
			calloutType === "ink-cycle" ||
			calloutType === "ink-shuffle" ||
			calloutType === "ink-once"
		) {
			callout.addClass("ink-callout-sequence");
		}
	}
}
