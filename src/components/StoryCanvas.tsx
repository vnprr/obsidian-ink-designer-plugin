import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  reconnectEdge,
  MarkerType,
  Position,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type ReactFlowInstance,
} from "@xyflow/react";
import type { FinalConnectionState } from "@xyflow/system";

import { StoryDocument, type StoryFile } from "../core/StoryDocument";
import { DialogueNode } from "./nodes/DialogueNode";
import { ChoiceEdge } from "./edges/ChoiceEdge";
import { Toolbar } from "./Toolbar";

const NODE_WIDTH = 200;  // przybliżona szerokość DialogueNode
const NODE_HEIGHT = 60;  // przybliżona wysokość DialogueNode (pusty tekst)

// MUST be defined at module level — recreating per render breaks xyflow memoization
const nodeTypes = { dialogue: DialogueNode };
const edgeTypes = { choice: ChoiceEdge };

const defaultEdgeOptions = {
  type: "choice",
  markerEnd: { type: MarkerType.ArrowClosed },
};

/* Helper to calculate node offset based on handle position, so edges connect to the correct point on the node. */
function getNodeOffset(sourcePosition: Position | null | undefined): { x: number; y: number } {
  switch (sourcePosition) {
    case Position.Bottom: return { x: -NODE_WIDTH / 2, y: 0 };
    case Position.Top:    return { x: -NODE_WIDTH / 2, y: -NODE_HEIGHT };
    case Position.Right:  return { x: 0,               y: -NODE_HEIGHT / 2 };
    case Position.Left:   return { x: -NODE_WIDTH,     y: -NODE_HEIGHT / 2 };
    default:              return { x: -NODE_WIDTH / 2, y: 0 };
  }
}

// Given source handle position, pick a sensible default target handle on the opposite side
function getDefaultTargetHandle(sourcePosition: Position | null | undefined): string {
  switch (sourcePosition) {
    case Position.Bottom: return "top-target";
    case Position.Top: return "bottom-target";
    case Position.Right: return "left-target";
    case Position.Left: return "right-target";
    default: return "top-target";
  }
}

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

  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const isReconnectingRef = useRef(false);

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

  // Node data change callback
  const onTextChange = useCallback((nodeId: string, newText: string) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, text: newText } } : n,
      ),
    );
    triggerSave();
  }, [triggerSave]);

  // Edge data change callback
  const onChoiceTextChange = useCallback((edgeId: string, newText: string) => {
    setEdges((eds) =>
      eds.map((e) =>
        e.id === edgeId
          ? { ...e, data: { ...e.data, choiceText: newText, isNew: false } }
          : e,
      ),
    );
    triggerSave();
  }, [triggerSave]);

  // Inject callbacks into node data so custom nodes can call them
  const nodesWithCallbacks = nodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      onTextChange,
    },
  }));

  // Inject callbacks into edge data so custom edges can call them
  const edgesWithCallbacks = edges.map((e) => ({
    ...e,
    data: {
      ...e.data,
      onChoiceTextChange,
    },
  }));

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
        const newEdge: Edge = {
          ...params,
          id: `edge-${Date.now()}`,
          type: "choice",
          markerEnd: { type: MarkerType.ArrowClosed },
          data: { choiceText: "", isNew: true },
        };
        const updated = addEdge(newEdge, eds);
        triggerSave();
        return updated;
      });
    },
    [triggerSave],
  );

  // Edge reconnection: drag endpoint to a different node
  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: { source: string; target: string; sourceHandle: string | null; targetHandle: string | null }) => {
      setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds));
      triggerSave();
    },
    [triggerSave],
  );

  const onReconnectStart = useCallback(() => {
    isReconnectingRef.current = true;
  }, []);


  // Edge reconnection end: if dropped in empty space, remove the edge
  const onReconnectEnd = useCallback(
    (_event: MouseEvent | TouchEvent, edge: Edge, _handleType: unknown, connectionState: FinalConnectionState) => {
      isReconnectingRef.current = false;
      if (!connectionState.isValid) {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
        triggerSave();
      }
    },
    [triggerSave],
  );

  // Connection end: if dropped in empty space, create a new node + edge
  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState: FinalConnectionState) => {
      if (connectionState.isValid || !connectionState.fromNode || !connectionState.fromHandle) {
        return;
      }

      if (isReconnectingRef.current) return;

      const instance = reactFlowRef.current;
      if (!instance) return;

      const clientX = "changedTouches" in event
        ? event.changedTouches[0].clientX
        : event.clientX;
      const clientY = "changedTouches" in event
        ? event.changedTouches[0].clientY
        : event.clientY;

      // const position = instance.screenToFlowPosition({ x: clientX, y: clientY });

      const rawPosition = instance.screenToFlowPosition({x: clientX, y: clientY});
      const offset = getNodeOffset(connectionState.fromHandle.position);
      const position = {
        x: rawPosition.x + offset.x,
        y: rawPosition.y + offset.y,
      };

      // const newNodeId = `node-${Date.now()}`;
      // const newNode: Node = {
      //   id: newNodeId,
      //   type: "dialogue",
      //   position,
      const newNodeId = `node-${Date.now()}`;
      const newNode: Node = {
        id: newNodeId,
        type: "dialogue",
        position,
        data: { text: "", isStart: false },
      };

      const newEdge: Edge = {
        id: `edge-${Date.now()}`,
        source: connectionState.fromNode.id,
        sourceHandle: connectionState.fromHandle.id,
        target: newNodeId,
        targetHandle: getDefaultTargetHandle(connectionState.fromHandle.position),
        type: "choice",
        markerEnd: { type: MarkerType.ArrowClosed },
        data: { choiceText: "", isNew: true },
      };

      setNodes((nds) => [...nds, newNode]);
      setEdges((eds) => [...eds, newEdge]);
      triggerSave();
    },
    [triggerSave],
  );

  const addNodeAtPosition = useCallback(
    (x: number, y: number) => {
      const newId = `node-${Date.now()}`;
      const newNode: Node = {
        id: newId,
        type: "dialogue",
        position: { x, y },
        data: {
          text: "",
          isStart: false,
        },
      };
      setNodes((nds) => [...nds, newNode]);
      triggerSave();
    },
    [triggerSave],
  );

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowRef.current = instance;
  }, []);

  /* Double-click on empty space to add a new node 
      - only if double-clicked directly on the pane, not on a node or edge
  */
  const onPaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.classList.contains("react-flow__pane")) return;
      const instance = reactFlowRef.current;
      if (!instance) return;
      const position = instance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addNodeAtPosition(position.x - NODE_WIDTH / 2, position.y - NODE_HEIGHT / 2);
      // addNodeAtPosition(position.x, position.y);
    },
    [addNodeAtPosition],
  );

  if (!initialNodes) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>
        <p>Open or create a .story file</p>
      </div>
    );
  }

  return (
    <div
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      onDoubleClick={onPaneDoubleClick}
    >
      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={edgesWithCallbacks}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onReconnect={onReconnect}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEnd}
        onInit={onInit}
        edgesReconnectable
        fitView
        deleteKeyCode="Backspace"
        zoomOnDoubleClick={false}
      >
        <Controls />
        <Background />
        <Toolbar onAddNode={addNodeAtPosition} />
      </ReactFlow>
    </div>
  );
}
