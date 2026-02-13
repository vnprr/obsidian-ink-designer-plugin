import { ItemView, WorkspaceLeaf } from "obsidian";
import type { Story } from "inkjs/full";
import { t } from "../i18n/index";

export const INK_PLAYER_VIEW_TYPE = "ink-player-view";

export class InkPlayerView extends ItemView {
	private story: Story | null = null;
	private storyContainerEl!: HTMLElement;
	private choicesContainerEl!: HTMLElement;
	private controlsEl!: HTMLElement;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return INK_PLAYER_VIEW_TYPE;
	}

	getDisplayText(): string {
		return t("player.title");
	}

	getIcon(): string {
		return "play-circle";
	}

	async onOpen(): Promise<void> {
		const container = this.contentEl;
		container.empty();
		container.addClass("ink-player-container");

		// Controls bar
		this.controlsEl = container.createDiv({ cls: "ink-player-controls" });
		const restartBtn = this.controlsEl.createEl("button", {
			text: t("player.restart"),
			cls: "ink-player-restart-btn",
		});
		restartBtn.addEventListener("click", () => this.restart());

		// Story text container
		this.storyContainerEl = container.createDiv({
			cls: "ink-player-story",
		});

		// Choices container
		this.choicesContainerEl = container.createDiv({
			cls: "ink-player-choices",
		});
	}

	async onClose(): Promise<void> {
		this.story = null;
		this.contentEl.empty();
	}

	/**
	 * Load a compiled Story and start playing.
	 * Optionally jump to a specific knot path.
	 */
	public startStory(story: Story, startPath?: string): void {
		this.story = story;
		this.storyContainerEl.empty();
		this.choicesContainerEl.empty();

		if (startPath) {
			try {
				this.story.ChoosePathString(startPath);
			} catch {
				// If path doesn't exist, start from beginning
			}
		}

		this.continueStory();
	}

	private restart(): void {
		if (this.story) {
			this.story.ResetState();
			this.storyContainerEl.empty();
			this.choicesContainerEl.empty();
			this.continueStory();
		}
	}

	/**
	 * Core game loop: Continue the story until choices or end.
	 */
	private continueStory(): void {
		if (!this.story) return;

		while (this.story.canContinue) {
			const text = this.story.Continue();
			const tags = this.story.currentTags;

			if (text) {
				this.renderParagraph(text.trim(), tags ?? []);
			}
		}

		// Display choices
		this.choicesContainerEl.empty();
		const choices = this.story.currentChoices;

		if (choices.length > 0) {
			for (const choice of choices) {
				const choiceBtn = this.choicesContainerEl.createEl("button", {
					text: choice.text,
					cls: "ink-player-choice-btn",
				});
				const idx = choice.index;
				choiceBtn.addEventListener("click", () => {
					this.selectChoice(idx);
				});
			}
		} else {
			// Story ended
			const endEl = this.storyContainerEl.createDiv({
				cls: "ink-player-end",
			});
			endEl.createEl("em", { text: t("player.end") });
		}

		// Scroll to bottom
		this.storyContainerEl.scrollTop = this.storyContainerEl.scrollHeight;
	}

	private selectChoice(index: number): void {
		if (!this.story) return;

		const choice = this.story.currentChoices[index];
		if (choice) {
			const choiceEl = this.storyContainerEl.createDiv({
				cls: "ink-player-chosen",
			});
			choiceEl.createEl("strong", { text: "> " + choice.text });
		}

		this.story.ChooseChoiceIndex(index);
		this.continueStory();
	}

	private renderParagraph(text: string, tags: string[]): void {
		const paraEl = this.storyContainerEl.createDiv({
			cls: "ink-player-paragraph",
		});

		// Handle IMAGE tags
		for (const tag of tags) {
			const imgMatch = tag.match(/^IMAGE:\s*(.+)$/);
			if (imgMatch?.[1]) {
				const imgPath = imgMatch[1].trim();
				const imgFile = this.app.vault.getAbstractFileByPath(imgPath);
				if (imgFile) {
					const imgEl = paraEl.createEl("img", {
						cls: "ink-player-image",
					});
					imgEl.setAttribute(
						"src",
						this.app.vault.getResourcePath(imgFile as any)
					);
				}
			}
		}

		paraEl.createEl("p", { text });
	}
}
