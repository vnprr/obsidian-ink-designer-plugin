import { Plugin } from "obsidian";
import { StoryCanvasView, STORY_VIEW_TYPE } from "./views/StoryCanvasView";
import { StoryDocument } from "./core/StoryDocument";

export default class InkDesignerPlugin extends Plugin {
  async onload() {
    this.registerView(STORY_VIEW_TYPE, (leaf) => new StoryCanvasView(leaf));
    this.registerExtensions(["story"], STORY_VIEW_TYPE);

    this.addCommand({
      id: "new-story",
      name: "New Ink Story",
      callback: () => this.createNewStory(),
    });

    console.log("Ink Designer loaded");
  }

  onunload() {
    console.log("Ink Designer unloaded");
  }

  async createNewStory() {
    const name = "New Story";
    const doc = StoryDocument.createDefault(name);
    const path = `${name}.story`;

    // Avoid overwriting existing file
    let filePath = path;
    let counter = 1;
    while (this.app.vault.getAbstractFileByPath(filePath)) {
      filePath = `${name} ${counter}.story`;
      counter++;
    }

    const file = await this.app.vault.create(filePath, doc.toJSON());
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.openFile(file);
  }
}
