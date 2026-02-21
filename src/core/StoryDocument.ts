import type { Node, Edge } from "@xyflow/react";

export interface StoryNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { label?: string; text: string };
}

export interface StoryEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  data: { choiceText?: string };
}

export interface StoryFile {
  version: number;
  name: string;
  settings: { startNodeId: string };
  nodes: StoryNode[];
  edges: StoryEdge[];
  globals: {
    variables: Record<string, number | string | boolean>;
    constants: Record<string, number | string | boolean>;
  };
}

export class StoryDocument {
  private file: StoryFile;

  constructor(file: StoryFile) {
    this.file = file;
  }

  static fromJSON(jsonString: string): StoryDocument {
    const parsed = JSON.parse(jsonString) as StoryFile;
    if (!parsed.version) {
      throw new Error("Invalid .story file: missing version");
    }
    return new StoryDocument(parsed);
  }

  toJSON(): string {
    return JSON.stringify(this.file, null, 2);
  }

  get name(): string { return this.file.name; }
  get settings(): StoryFile["settings"] { return this.file.settings; }
  get globals(): StoryFile["globals"] { return this.file.globals; }

  toReactFlowNodes(): Node[] {
    const startId = this.file.settings.startNodeId;
    return this.file.nodes.map((node) => ({
      id: node.id,
      type: "dialogue",
      position: node.position,
      data: {
        text: node.data.text || "",
        isStart: node.id === startId,
      },
    }));
  }

  toReactFlowEdges(): Edge[] {
    return this.file.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: "choice",
      data: { choiceText: edge.data.choiceText || "" },
    }));
  }

  static fromReactFlow(
    nodes: Node[],
    edges: Edge[],
    meta: { name: string; startNodeId: string; globals?: StoryFile["globals"] },
  ): StoryDocument {
    const storyNodes: StoryNode[] = nodes.map((n) => {
      const text = typeof n.data.text === "string" ? n.data.text : "";
      const autoLabel = text.split(/\s+/).slice(0, 4).join(" ") || n.id;
      return {
        id: n.id,
        type: "dialogue",
        position: n.position,
        data: { label: autoLabel, text },
      };
    });

    const storyEdges: StoryEdge[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? undefined,
      targetHandle: e.targetHandle ?? undefined,
      data: {
        choiceText: typeof e.data?.choiceText === "string" ? e.data.choiceText : "",
      },
    }));

    return new StoryDocument({
      version: 1,
      name: meta.name,
      settings: { startNodeId: meta.startNodeId },
      nodes: storyNodes,
      edges: storyEdges,
      globals: meta.globals || { variables: {}, constants: {} },
    });
  }

  static createDefault(name: string): StoryDocument {
    return new StoryDocument({
      version: 1,
      name,
      settings: { startNodeId: "node-1" },
      nodes: [
        {
          id: "node-1",
          type: "dialogue",
          position: { x: 0, y: 0 },
          data: { label: "Start", text: "" },
        },
      ],
      edges: [],
      globals: { variables: {}, constants: {} },
    });
  }
}
