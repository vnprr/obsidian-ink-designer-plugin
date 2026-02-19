import { useCallback, useRef, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface DialogueNodeData {
  label: string;
  text: string;
  isStart: boolean;
  onTextChange?: (id: string, text: string) => void;
  onLabelChange?: (id: string, label: string) => void;
}

export function DialogueNode({ id, data }: NodeProps & { data: DialogueNodeData }) {
  const [editingText, setEditingText] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  const handleTextDoubleClick = useCallback(() => {
    setEditingText(true);
    setTimeout(() => textRef.current?.focus(), 0);
  }, []);

  const handleTextBlur = useCallback(() => {
    setEditingText(false);
    const newText = textRef.current?.textContent || "";
    data.onTextChange?.(id, newText);
  }, [id, data]);

  const handleTextKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setEditingText(false);
      const newText = textRef.current?.textContent || "";
      data.onTextChange?.(id, newText);
    }
  }, [id, data]);

  const handleLabelDoubleClick = useCallback(() => {
    setEditingLabel(true);
    setTimeout(() => labelRef.current?.focus(), 0);
  }, []);

  const handleLabelBlur = useCallback(() => {
    setEditingLabel(false);
    const newLabel = labelRef.current?.textContent || "";
    data.onLabelChange?.(id, newLabel);
  }, [id, data]);

  const handleLabelKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setEditingLabel(false);
      const newLabel = labelRef.current?.textContent || "";
      data.onLabelChange?.(id, newLabel);
    }
  }, [id, data]);

  return (
    <div className={`dialogue-node${data.isStart ? " is-start" : ""}`}>
      <Handle type="target" position={Position.Top} />
      <div
        ref={labelRef}
        className="node-label"
        contentEditable={editingLabel}
        suppressContentEditableWarning
        onDoubleClick={handleLabelDoubleClick}
        onBlur={handleLabelBlur}
        onKeyDown={handleLabelKeyDown}
      >
        {data.label}
      </div>
      <div
        ref={textRef}
        className="node-text"
        contentEditable={editingText}
        suppressContentEditableWarning
        onDoubleClick={handleTextDoubleClick}
        onBlur={handleTextBlur}
        onKeyDown={handleTextKeyDown}
      >
        {data.text}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
