import en from "./en";
import pl from "./pl";
import { moment } from "obsidian";

const locales: Record<string, Record<string, string>> = { en, pl };

/**
 * Translate a key to the current locale.
 * Supports {placeholder} interpolation.
 */
export function t(key: string, params?: Record<string, string>): string {
	const lang = moment.locale().slice(0, 2);
	const locale = locales[lang] ?? locales["en"];
	const fallback = locales["en"];

	let text = locale?.[key] ?? fallback?.[key] ?? key;

	if (params) {
		for (const [k, v] of Object.entries(params)) {
			text = text.replace(`{${k}}`, v);
		}
	}

	return text;
}
