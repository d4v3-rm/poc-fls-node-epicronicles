import type { ReactNode } from 'react';
import { useState, useRef, useCallback } from 'react';

interface DraggablePanelProps {
  title: string;
  initialX: number;
  initialY: number;
  children: ReactNode;
  onClose?: () => void;
}

export const DraggablePanel = ({
  title,
  initialX,
  initialY,
  children,
  onClose,
}: DraggablePanelProps) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const draggingRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!draggingRef.current) {
      return;
    }
    setPosition({
      x: event.clientX - offsetRef.current.x,
      y: event.clientY - offsetRef.current.y,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      draggingRef.current = true;
      offsetRef.current = {
        x: event.clientX - position.x,
        y: event.clientY - position.y,
      };
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [handleMouseMove, handleMouseUp, position.x, position.y],
  );

  return (
    <div
      className="draggable-panel"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <div className="draggable-panel__header" onMouseDown={handleMouseDown}>
        <span>{title}</span>
        {onClose ? (
          <button
            className="draggable-panel__close"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={onClose}
            aria-label={`Chiudi ${title}`}
          >
            ×
          </button>
        ) : null}
      </div>
      <div className="draggable-panel__content">{children}</div>
    </div>
  );
};
