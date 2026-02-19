import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from "@xyflow/react";

import { StoryDocument, type StoryFile } from "../core/StoryDocument";

interface StoryCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  meta?: { name: string; startNodeId: string; globals?: StoryFile["globals"] };
  onSave?: (json: string) => void;
}

export function StoryCanvas({ initialNodes, initialEdges, meta, onSave }: StoryCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes || []);
  const [edges, setEdges] = useState<Edge[]>(initialEdges || []);

  // Refs to always have latest state for debounced save
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const metaRef = useRef(meta);
  metaRef.current = meta;

  const triggerSave = useCallback(() => {
    if (!onSave) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const doc = StoryDocument.fromReactFlow(nodesRef.current, edgesRef.current, {
        name: metaRef.current?.name || "Untitled",
        startNodeId: metaRef.current?.startNodeId || nodesRef.current[0]?.id || "node-1",
        globals: metaRef.current?.globals,
      });
      onSave(doc.toJSON());
    }, 500);
  }, [onSave]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => {
        const updated = applyNodeChanges(changes, nds);
        triggerSave();
        return updated;
      });
    },
    [triggerSave],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => {
        const updated = applyEdgeChanges(changes, eds);
        triggerSave();
        return updated;
      });
    },
    [triggerSave],
  );

  const onConnect: OnConnect = useCallback(
    (params) => {
      setEdges((eds) => {
        const updated = addEdge(params, eds);
        triggerSave();
        return updated;
      });
    },
    [triggerSave],
  );

  if (!initialNodes) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>
        <p>Open or create a .story file</p>
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
