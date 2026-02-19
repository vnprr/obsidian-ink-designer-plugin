import { useCallback } from "react";
import { Panel, useReactFlow } from "@xyflow/react";

interface ToolbarProps {
  onAddNode: (x: number, y: number) => void;
}

export function Toolbar({ onAddNode }: ToolbarProps) {
  const { fitView, screenToFlowPosition } = useReactFlow();

  const handleAddNode = useCallback(() => {
    const center = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    onAddNode(center.x, center.y);
  }, [onAddNode, screenToFlowPosition]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2 });
  }, [fitView]);

  return (
    <Panel position="top-left" className="ink-toolbar">
      <button onClick={handleAddNode} title="Add new node">
        + New Node
      </button>
      <button onClick={handleFitView} title="Fit view to all nodes">
        Fit View
      </button>
      <button disabled title="Coming soon">
        ▶ Play
      </button>
    </Panel>
  );
}
