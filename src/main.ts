import { Notice, Plugin, TFile } from "obsidian";
import type { Story } from "inkjs/full";
import { InkDesignerSettings, DEFAULT_SETTINGS, InkDesignerSettingsTab } from "./ui/settings-tab";
import { InkPlayerView, INK_PLAYER_VIEW_TYPE } from "./ui/ink-player-view";
import { buildStoryProject, getProjectForFile } from "./core/story-graph";
import { transpileStory } from "./transpiler/md-to-ink";
import { compileInk } from "./core/story-compiler";
import { slugify } from "./core/slug";
import { t } from "./i18n/index";
import { registerContextMenu } from "./commands/context-menu";
import { registerTemplateCommands } from "./commands/templates";
import { InkVariableSuggest } from "./ui/variable-suggest";
import { registerMarkdownDecorator } from "./ui/md-decorator";

export default class InkDesignerPlugin extends Plugin {
	settings: InkDesignerSettings;

	async onload() {
		await this.loadSettings();

		// Register the Ink Player view
		this.registerView(
			INK_PLAYER_VIEW_TYPE,
			(leaf) => new InkPlayerView(leaf)
		);

		// Command: Play Ink from start
		this.addCommand({
			id: "play-ink-story",
			name: t("cmd.playStory"),
			callback: () => this.playFromStart(),
		});

		// Register settings tab
		this.addSettingTab(new InkDesignerSettingsTab(this.app, this));

		// Register context menu + template commands
		registerContextMenu(this);
		registerTemplateCommands(this);

		// Register variable autocomplete
		this.registerEditorSuggest(new InkVariableSuggest(this.app, this));

		// Register markdown decorations
		registerMarkdownDecorator(this);

		// Ribbon icon
		this.addRibbonIcon("play-circle", t("menu.playFromStart"), () => {
			this.playFromStart();
		});
	}

	onunload() {}

	async playFromStart(): Promise<void> {
		const project = await buildStoryProject(
			this.app,
			this.settings.defaultProject,
			this.settings.storyFolder
		);

		if (!project.globalsNote) {
			new Notice(t("error.noGlobals"));
			return;
		}

		if (!project.startKnotId) {
			new Notice(t("error.noStart"));
			return;
		}

		const transpiled = transpileStory(project.globalsNote, project.knotNotes, {
			choiceMode: this.settings.choiceMode,
		});

		if (transpiled.warnings.length > 0) {
			console.warn("Ink transpile warnings:", transpiled.warnings);
		}

		const compiled = compileInk(transpiled.inkSource);

		if (compiled.errors.length > 0) {
			new Notice(t("error.compile", { message: compiled.errors[0] ?? "unknown" }));
			console.error("Ink compilation errors:", compiled.errors);
			console.error("Ink source:\n", compiled.inkSource);
			return;
		}

		if (!compiled.story) {
			new Notice(t("error.compileFailed"));
			return;
		}

		const startPath = slugify(project.startKnotId);
		await this.activatePlayerView(compiled.story, startPath);
	}

	async playFromFile(file: TFile): Promise<void> {
		const projectName = getProjectForFile(
			this.app,
			file,
			this.settings.defaultProject
		);

		const project = await buildStoryProject(
			this.app,
			projectName,
			this.settings.storyFolder
		);

		const transpiled = transpileStory(project.globalsNote, project.knotNotes, {
			choiceMode: this.settings.choiceMode,
		});

		const compiled = compileInk(transpiled.inkSource);

		if (compiled.errors.length > 0) {
			new Notice(t("error.compile", { message: compiled.errors[0] ?? "unknown" }));
			console.error("Ink compilation errors:", compiled.errors);
			return;
		}

		if (!compiled.story) {
			new Notice(t("error.compileFailed"));
			return;
		}

		const cache = this.app.metadataCache.getFileCache(file);
		const fm = cache?.frontmatter;
		const knotId = (fm?.["ink-id"] as string) ?? slugify(file.basename);

		await this.activatePlayerView(compiled.story, knotId);
	}

	private async activatePlayerView(
		story: Story,
		startPath: string
	): Promise<void> {
		let leaf = this.app.workspace.getLeavesOfType(INK_PLAYER_VIEW_TYPE)[0];
		if (!leaf) {
			const rightLeaf = this.app.workspace.getRightLeaf(false);
			if (rightLeaf) {
				await rightLeaf.setViewState({
					type: INK_PLAYER_VIEW_TYPE,
					active: true,
				});
				leaf = rightLeaf;
			}
		}

		if (leaf) {
			this.app.workspace.revealLeaf(leaf);
			const view = leaf.view as InkPlayerView;
			view.startStory(story, startPath);
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData() as Partial<InkDesignerSettings>
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
