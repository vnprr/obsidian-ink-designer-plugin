import { useCallback, useEffect, useRef, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface DialogueNodeData {
  text: string;
  isStart: boolean;
  onTextChange?: (id: string, text: string) => void;
}

export function DialogueNode({ id, data }: NodeProps & { data: DialogueNodeData }) {
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      const ta = textareaRef.current;
      ta.focus();
      ta.selectionStart = ta.selectionEnd = ta.value.length;
      // JS fallback for auto-resize
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    }
  }, [editing]);

  const handleDoubleClick = useCallback(() => {
    setEditing(true);
  }, []);

  const commitText = useCallback(() => {
    setEditing(false);
    const newText = textareaRef.current?.value ?? "";
    data.onTextChange?.(id, newText);
  }, [id, data]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      commitText();
    }
    // Stop propagation so xyflow doesn't intercept Backspace/Delete/etc
    e.stopPropagation();
  }, [commitText]);

  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    // JS fallback for auto-resize
    const ta = e.currentTarget;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  }, []);

  const hasText = (data.text ?? "").length > 0;

  return (
    <div className={`dialogue-node${data.isStart ? " is-start" : ""}`}>
      {/* Top handles */}
      <Handle type="target" position={Position.Top} id="top-target" />
      <Handle type="source" position={Position.Top} id="top-source" />

      {/* Left handles */}
      <Handle type="target" position={Position.Left} id="left-target" />
      <Handle type="source" position={Position.Left} id="left-source" />

      {/* Text content */}
      {editing ? (
        <textarea
          ref={textareaRef}
          className="node-text-edit"
          defaultValue={data.text}
          placeholder="Enter text..."
          onBlur={commitText}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
        />
      ) : (
        <div
          className={`node-text${!hasText ? " is-empty" : ""}`}
          onDoubleClick={handleDoubleClick}
        >
          {hasText ? data.text : null}
        </div>
      )}

      {/* Right handles */}
      <Handle type="target" position={Position.Right} id="right-target" />
      <Handle type="source" position={Position.Right} id="right-source" />

      {/* Bottom handles */}
      <Handle type="target" position={Position.Bottom} id="bottom-target" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" />
    </div>
  );
}
