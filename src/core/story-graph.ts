import { App, TFile } from "obsidian";
import { parseNote, ParsedNote } from "../transpiler/parser";

export interface StoryProject {
	name: string;
	globalsNote: ParsedNote | null;
	knotNotes: ParsedNote[];
	startKnotId: string | null;
}

/**
 * Build a StoryProject by scanning the vault for notes
 * matching the given project name within the story folder.
 */
export async function buildStoryProject(
	app: App,
	projectName: string,
	storyFolder: string
): Promise<StoryProject> {
	const project: StoryProject = {
		name: projectName,
		globalsNote: null,
		knotNotes: [],
		startKnotId: null,
	};

	const allFiles = app.vault.getMarkdownFiles();

	const relevantFiles = storyFolder
		? allFiles.filter((f) =>
			f.path.startsWith(storyFolder + "/") ||
			f.path === storyFolder
		)
		: allFiles;

	for (const file of relevantFiles) {
		const cache = app.metadataCache.getFileCache(file);
		const fm = cache?.frontmatter;

		if (!fm || !fm["ink-type"]) continue;

		// Filter by project if specified
		const noteProject = fm["ink-project"] as string | undefined;
		if (projectName && noteProject && noteProject !== projectName) continue;

		const content = await app.vault.cachedRead(file);
		const parsed = parseNote(content, fm, file.basename);

		if (parsed.inkType === "_globals") {
			project.globalsNote = parsed;

			const inkStart = fm["ink-start"];
			if (typeof inkStart === "string") {
				// Strip [[ and ]] if present
				project.startKnotId = inkStart.replace(/^\[\[/, "").replace(/\]\]$/, "");
			}
		} else if (parsed.inkType === "knot") {
			project.knotNotes.push(parsed);
		}
	}

	// Sort knots alphabetically for deterministic output
	project.knotNotes.sort((a, b) => a.filename.localeCompare(b.filename));

	return project;
}

/**
 * Determine the project name for a given file.
 */
export function getProjectForFile(
	app: App,
	file: TFile,
	defaultProject: string
): string {
	const cache = app.metadataCache.getFileCache(file);
	const fm = cache?.frontmatter;
	if (fm && typeof fm["ink-project"] === "string") {
		return fm["ink-project"] as string;
	}
	return defaultProject;
}
