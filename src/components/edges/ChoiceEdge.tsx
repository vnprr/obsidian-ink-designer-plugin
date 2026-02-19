import { useCallback, useEffect, useRef, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";

interface ChoiceEdgeData {
  choiceText?: string;
  isNew?: boolean;
  onChoiceTextChange?: (id: string, text: string) => void;
}

export function ChoiceEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps & { data: ChoiceEdgeData }) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(data?.choiceText || "");

  useEffect(() => {
    if (data?.isNew) {
      setEditing(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [data?.isNew]);

  const commitText = useCallback(() => {
    setEditing(false);
    data?.onChoiceTextChange?.(id, text);
  }, [id, text, data]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") {
        commitText();
      }
    },
    [commitText],
  );

  const handleLabelClick = useCallback(() => {
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const hasText = text.trim().length > 0;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={hasText ? undefined : { strokeDasharray: "5 5" }}
      />
      <EdgeLabelRenderer>
        <div
          className="choice-edge-label"
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
        >
          {editing ? (
            <input
              ref={inputRef}
              className="choice-edge-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={commitText}
              onKeyDown={handleKeyDown}
              placeholder="choice text..."
            />
          ) : (
            <span
              className="choice-edge-text"
              onClick={handleLabelClick}
            >
              {hasText ? text : "..."}
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
