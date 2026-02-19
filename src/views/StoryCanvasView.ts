import { TextFileView, WorkspaceLeaf } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { createElement } from "react";
import { StoryCanvas } from "../components/StoryCanvas";
import { StoryDocument } from "../core/StoryDocument";

export const STORY_VIEW_TYPE = "ink-designer-canvas";

export class StoryCanvasView extends TextFileView {
  private root: Root | null = null;
  private renderKey = 0;

  getViewType() { return STORY_VIEW_TYPE; }
  getDisplayText() { return this.file?.basename || "Ink Story"; }
  getIcon() { return "book-open"; }

  async onOpen() {
    this.contentEl.style.height = "100%";
    this.contentEl.style.padding = "0";
    this.contentEl.style.overflow = "hidden";
    this.root = createRoot(this.contentEl);
    this.renderCanvas();
  }

  async onClose() {
    this.root?.unmount();
    this.root = null;
  }

  getViewData(): string {
    return this.data;
  }

  setViewData(data: string, clear: boolean): void {
    this.data = data;
    this.renderKey++;
    this.renderCanvas();
  }

  clear(): void {
    // Reset handled by re-render in setViewData
  }

  private renderCanvas(): void {
    if (!this.root) return;

    let nodes;
    let edges;
    let meta;

    if (this.data) {
      try {
        const doc = StoryDocument.fromJSON(this.data);
        nodes = doc.toReactFlowNodes();
        edges = doc.toReactFlowEdges();
        meta = { name: doc.name, startNodeId: doc.settings.startNodeId, globals: doc.globals };
      } catch {
        // Invalid JSON — render with empty state
      }
    }

    this.root.render(
      createElement(StoryCanvas, {
        key: this.renderKey,
        initialNodes: nodes,
        initialEdges: edges,
        meta,
        onSave: (json: string) => {
          this.data = json;
          this.requestSave();
        },
      }),
    );
  }
}
