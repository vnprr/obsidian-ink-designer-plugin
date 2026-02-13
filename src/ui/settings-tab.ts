import { App, PluginSettingTab, Setting } from "obsidian";
import type InkDesignerPlugin from "../main";
import { t } from "../i18n/index";

export interface InkDesignerSettings {
	choiceMode: "blockquote" | "asterisk";
	storyFolder: string;
	showInkDecorations: boolean;
	defaultProject: string;
}

export const DEFAULT_SETTINGS: InkDesignerSettings = {
	choiceMode: "blockquote",
	storyFolder: "Story",
	showInkDecorations: true,
	defaultProject: "",
};

export class InkDesignerSettingsTab extends PluginSettingTab {
	plugin: InkDesignerPlugin;

	constructor(app: App, plugin: InkDesignerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: t("settings.heading") });

		// Choice mode
		new Setting(containerEl)
			.setName(t("settings.choiceMode.name"))
			.setDesc(t("settings.choiceMode.desc"))
			.addDropdown((dropdown) =>
				dropdown
					.addOption("blockquote", "Blockquote (> - text)")
					.addOption("asterisk", "Asterisk (* text)")
					.setValue(this.plugin.settings.choiceMode)
					.onChange(async (value) => {
						this.plugin.settings.choiceMode = value as "blockquote" | "asterisk";
						await this.plugin.saveSettings();
					})
			);

		// Story folder
		new Setting(containerEl)
			.setName(t("settings.storyFolder.name"))
			.setDesc(t("settings.storyFolder.desc"))
			.addText((text) =>
				text
					.setPlaceholder("Story")
					.setValue(this.plugin.settings.storyFolder)
					.onChange(async (value) => {
						this.plugin.settings.storyFolder = value;
						await this.plugin.saveSettings();
					})
			);

		// Show decorations
		new Setting(containerEl)
			.setName(t("settings.showDecorations.name"))
			.setDesc(t("settings.showDecorations.desc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showInkDecorations)
					.onChange(async (value) => {
						this.plugin.settings.showInkDecorations = value;
						await this.plugin.saveSettings();
					})
			);

		// Default project
		new Setting(containerEl)
			.setName(t("settings.defaultProject.name"))
			.setDesc(t("settings.defaultProject.desc"))
			.addText((text) =>
				text
					.setPlaceholder("")
					.setValue(this.plugin.settings.defaultProject)
					.onChange(async (value) => {
						this.plugin.settings.defaultProject = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
