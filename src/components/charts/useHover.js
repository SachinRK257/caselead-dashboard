import { useCallback, useState } from "react";

/**
 * Tooltip state for mark-based charts. The hovered mark is tracked by index so
 * keyboard focus and pointer hover show exactly the same readout.
 */
export function useHover() {
  const [hover, setHover] = useState(null);

  const show = useCallback((index, event, extra) => {
    const host = event.currentTarget.closest(
      ".chart-body, .stacked-bar, .bar-chart"
    );
    if (!host) return;

    const hostBox = host.getBoundingClientRect();
    const markBox = event.currentTarget.getBoundingClientRect();

    setHover({
      index,
      // Anchor to the mark, not the pointer, so focus and hover agree.
      x: markBox.left + markBox.width / 2 - hostBox.left,
      y: markBox.top - hostBox.top,
      ...extra,
    });
  }, []);

  const hide = useCallback(() => setHover(null), []);

  return { hover, show, hide };
}
