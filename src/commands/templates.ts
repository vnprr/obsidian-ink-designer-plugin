import { Notice } from "obsidian";
import type InkDesignerPlugin from "../main";
import { t } from "../i18n/index";

/**
 * Register template commands for creating new Ink notes.
 */
export function registerTemplateCommands(plugin: InkDesignerPlugin): void {

	plugin.addCommand({
		id: "new-knot",
		name: t("cmd.newKnot"),
		callback: async () => {
			const folder = plugin.settings.storyFolder;
			const project = plugin.settings.defaultProject;
			const filename = `${folder}/New Node.md`;
			const content = buildKnotTemplate(project);

			try {
				await ensureFolderExists(plugin, folder);
				const file = await plugin.app.vault.create(filename, content);
				const leaf = plugin.app.workspace.getLeaf();
				await leaf.openFile(file);
			} catch (e) {
				new Notice(`Failed to create note: ${e}`);
			}
		},
	});

	plugin.addCommand({
		id: "new-character",
		name: t("cmd.newCharacter"),
		callback: async () => {
			const folder = plugin.settings.storyFolder;
			const project = plugin.settings.defaultProject;
			const filename = `${folder}/New Character.md`;
			const content = buildCharacterTemplate(project);

			try {
				await ensureFolderExists(plugin, folder);
				const file = await plugin.app.vault.create(filename, content);
				const leaf = plugin.app.workspace.getLeaf();
				await leaf.openFile(file);
			} catch (e) {
				new Notice(`Failed to create note: ${e}`);
			}
		},
	});

	plugin.addCommand({
		id: "new-globals",
		name: t("cmd.newGlobals"),
		callback: async () => {
			const folder = plugin.settings.storyFolder;
			const project = plugin.settings.defaultProject;
			const filename = `${folder}/_globals.md`;
			const content = buildGlobalsTemplate(project);

			try {
				await ensureFolderExists(plugin, folder);
				const file = await plugin.app.vault.create(filename, content);
				const leaf = plugin.app.workspace.getLeaf();
				await leaf.openFile(file);
			} catch (e) {
				new Notice(`Failed to create note: ${e}`);
			}
		},
	});
}

async function ensureFolderExists(plugin: InkDesignerPlugin, path: string): Promise<void> {
	if (!path) return;
	const existing = plugin.app.vault.getAbstractFileByPath(path);
	if (!existing) {
		await plugin.app.vault.createFolder(path);
	}
}

function buildKnotTemplate(project: string): string {
	const projectLine = project ? `ink-project: ${project}\n` : "";
	return `---
ink-type: knot
${projectLine}---

# New Node

## Scene

Your narrative text here.

> - First choice -> [[Target]]
> - Second choice -> [[Other]]
`;
}

function buildCharacterTemplate(project: string): string {
	const projectLine = project ? `ink-project: ${project}\n` : "";
	return `---
ink-type: character
ink-id: new_character
${projectLine}ink-fields:
  name: "Name"
  alive: true
---

# Character Name

Description of the character.
`;
}

function buildGlobalsTemplate(project: string): string {
	const projectLine = project ? `ink-project: ${project}\n` : "";
	return `---
ink-type: _globals
${projectLine}ink-start: "[[Start]]"
ink-vars:
  gold: 0
  torch: false
ink-consts:
  MAX_HEALTH: 100
---

# Global Variables

Document your game variables here.
`;
}
