import { useEffect, useState } from "react";

// Highlights the drop zone while a file is dragged anywhere over the window.
// dragenter/dragleave fire for every descendant, so count depth rather than
// clearing on the first leave.
export function useDragActive() {
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    let depth = 0;

    const onEnter = () => {
      depth += 1;
      setDragActive(true);
    };

    const onLeave = () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragActive(false);
    };

    const onDrop = () => {
      depth = 0;
      setDragActive(false);
    };

    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);

    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  return dragActive;
}
