import { Compiler } from "inkjs/full";
import type { Story } from "inkjs/full";

export interface CompileResult {
	story: Story | null;
	inkSource: string;
	errors: string[];
	warnings: string[];
}

/**
 * Compile an Ink source string into a playable Story.
 */
export function compileInk(inkSource: string): CompileResult {
	const result: CompileResult = {
		story: null,
		inkSource,
		errors: [],
		warnings: [],
	};

	try {
		const compiler = new Compiler(inkSource);
		const story = compiler.Compile();

		result.errors = compiler.errors ? [...compiler.errors] : [];
		result.warnings = compiler.warnings ? [...compiler.warnings] : [];

		if (result.errors.length === 0 && story) {
			result.story = story;
		}
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : String(e);
		result.errors.push(`Ink compiler exception: ${message}`);
	}

	return result;
}
