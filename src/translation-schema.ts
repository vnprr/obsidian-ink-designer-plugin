import { slugify } from "./core/slug";

export type ChoiceMode = "blockquote" | "asterisk";

/** Matches both ASCII arrow `->` and Unicode arrow `→` */
export const ARROW_PATTERN = "(?:->|\u2192)";

export const TRANSLATION_SCHEMA = {

	slugify,

	// === STRUCTURE ===
	structure: {
		knot: {
			toInk: (id: string) => `=== ${id}`,
		},
		stitch: {
			mdPrefix: "## ",
			toInk: (id: string) => `= ${id}`,
		},
		text: {
			rule: "passthrough" as const,
		},
		comment: {
			mdOpen: "%%",
			mdClose: "%%",
			inkPrefix: "//",
		},
	},

	// === CHOICES ===
	choices: {
		basic: {
			mdBlockquote: "> - ",
			mdAsterisk: "* ",
			ink: "* ",
		},
		sticky: {
			mdBlockquote: "> + ",
			mdAsterisk: "+ ",
			ink: "+ ",
		},
		withDivert: {
			toInk: (text: string, target: string, sticky: boolean) => {
				const prefix = sticky ? "+" : "*";
				return `${prefix} [${text}] -> ${slugify(target)}`;
			},
		},
		nested: {
			mdIndent: "  ",
			toInkPrefix: (level: number, sticky: boolean) => {
				const ch = sticky ? "+" : "*";
				return ch.repeat(level + 1) + " ";
			},
		},
		conditional: {
			toInk: (text: string, condition: string) =>
				`* (${condition}) [${text}]`,
		},
		fallback: {
			toInk: (text: string) => `* [${text}] ->`,
		},
	},

	// === NAVIGATION ===
	navigation: {
		divert: {
			mdPattern: new RegExp(`^${ARROW_PATTERN}\\s*\\[\\[([^\\]#]+)\\]\\]\\s*$`),
			toInk: (target: string) => `-> ${slugify(target)}`,
		},
		divertToSection: {
			mdPattern: new RegExp(`^${ARROW_PATTERN}\\s*\\[\\[([^\\]#]+)#([^\\]]+)\\]\\]\\s*$`),
			toInk: (target: string, section: string) =>
				`-> ${slugify(target)}.${slugify(section)}`,
		},
		divertToLocalSection: {
			mdPattern: new RegExp(`^${ARROW_PATTERN}\\s*\\[\\[#([^\\]]+)\\]\\]\\s*$`),
			toInk: (section: string) => `-> ${slugify(section)}`,
		},
		end: {
			mdPattern: new RegExp(`^${ARROW_PATTERN}\\s*END$`),
			ink: "-> END",
		},
		done: {
			mdPattern: new RegExp(`^${ARROW_PATTERN}\\s*DONE$`),
			ink: "-> DONE",
		},
	},

	// === GATHERS ===
	gathers: {
		basic: {
			md: "---",
			ink: "-",
		},
		named: {
			mdPattern: /^---\s*`ink:\s*\(([^)]+)\)`\s*$/,
			toInk: (label: string) => `- (${label})`,
		},
	},

	// === VARIABLES & LOGIC ===
	variables: {
		global: {
			mdKey: "ink-vars",
			toInk: (name: string, value: unknown) => {
				if (typeof value === "string") return `VAR ${name} = "${value}"`;
				return `VAR ${name} = ${value}`;
			},
		},
		constant: {
			mdKey: "ink-consts",
			toInk: (name: string, value: unknown) => `CONST ${name} = ${value}`,
		},
		objectField: {
			mdKey: "ink-fields",
			toInk: (objectId: string, field: string, value: unknown) => {
				const varName = `${objectId}_${field}`;
				if (typeof value === "string")
					return `VAR ${varName} = "${value}"`;
				return `VAR ${varName} = ${varName}`;
			},
		},
		tempVar: {
			mdPattern: /^`ink:\s*~\s*temp\s+(\w+)\s*=\s*(.+)`$/,
			toInk: (name: string, value: string) => `~ temp ${name} = ${value}`,
		},
		modify: {
			mdPattern: /^`ink:\s*~\s*(.+)`$/,
			toInk: (expr: string) => `~ ${expr}`,
		},
		print: {
			rule: "passthrough" as const,
		},
	},

	// === CONDITIONALS ===
	conditionals: {
		block: {
			mdIf: "> [!ink-if]",
			mdElif: "> [!ink-elif]",
			mdElse: "> [!ink-else]",
			toInkIf: (cond: string) => `{${cond}:`,
			toInkElif: (cond: string) => `- ${cond}:`,
			inkElse: "- else:",
			inkClose: "}",
		},
		inline: {
			mdPattern: /`ink:\s*\{([^:]+):\s*([^|]+)\|\s*([^}]+)\}`/,
			toInk: (cond: string, t: string, f: string) =>
				`{${cond}: ${t} | ${f}}`,
		},
	},

	// === SEQUENCES ===
	sequences: {
		sequence: { calloutType: "ink-seq", inkPrefix: "" },
		cycle: { calloutType: "ink-cycle", inkPrefix: "&" },
		shuffle: { calloutType: "ink-shuffle", inkPrefix: "~" },
		once: { calloutType: "ink-once", inkPrefix: "!" },
		toInk: (prefix: string, items: string[]) =>
			`{${prefix}${items.join(" | ")}}`,
	},

	// === TAGS ===
	tags: {
		inline: {
			mdPrefix: "#ink/",
			toInk: (tag: string) => `# ${tag}`,
		},
		knot: {
			mdKey: "ink-tags",
			toInk: (tags: string[]) => tags.map((t) => `# ${t}`).join("\n"),
		},
	},

	// === LISTS ===
	lists: {
		definition: {
			mdKey: "ink-lists",
			toInk: (name: string, values: string[]) =>
				`LIST ${name} = ${values.join(", ")}`,
		},
	},
};

export type TranslationSchemaType = typeof TRANSLATION_SCHEMA;
