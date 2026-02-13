import { TFile } from "obsidian";
import type InkDesignerPlugin from "../main";
import { t } from "../i18n/index";

/**
 * Register context menu items for Ink Designer.
 */
export function registerContextMenu(plugin: InkDesignerPlugin): void {
	plugin.registerEvent(
		plugin.app.workspace.on("file-menu", (menu, file) => {
			if (!(file instanceof TFile)) return;
			if (file.extension !== "md") return;

			const cache = plugin.app.metadataCache.getFileCache(file);
			const fm = cache?.frontmatter;

			if (!fm || !fm["ink-type"]) return;

			// "Play from here" for knot notes
			if (fm["ink-type"] === "knot") {
				menu.addItem((item) => {
					item.setTitle(t("menu.playFromHere"))
						.setIcon("play")
						.onClick(() => {
							plugin.playFromFile(file);
						});
				});
			}

			// "Play story" for _globals notes
			if (fm["ink-type"] === "_globals") {
				menu.addItem((item) => {
					item.setTitle(t("menu.playFromStart"))
						.setIcon("play-circle")
						.onClick(() => {
							plugin.playFromStart();
						});
				});
			}
		})
	);
}
