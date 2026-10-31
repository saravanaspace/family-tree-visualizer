import { useCallback, useState } from 'react';
import { getNodesBounds, getViewportForBounds, type Node } from '@xyflow/react';
import { toPng, toSvg } from 'html-to-image';

export type ExportFormat = 'png' | 'svg';

const PADDING = 48;
const MAX_SIDE = 8000;

function download(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

/** Exports the whole tree (not just the visible viewport) by rendering the viewport layer at fit size. */
export function useExport(getNodes: () => Node[]) {
  const [exporting, setExporting] = useState(false);

  const exportTree = useCallback(async (format: ExportFormat) => {
    const nodes = getNodes();
    const el = document.querySelector<HTMLElement>('.react-flow__viewport');
    if (!nodes.length || !el) throw new Error('Nothing to export');
    setExporting(true);
    try {
      const bounds = getNodesBounds(nodes);
      const width = Math.min(MAX_SIDE, Math.ceil(bounds.width + PADDING * 2));
      const height = Math.min(MAX_SIDE, Math.ceil(bounds.height + PADDING * 2));
      const viewport = getViewportForBounds(bounds, width, height, 0.1, 4, PADDING / Math.max(width, 1));
      const render = format === 'png' ? toPng : toSvg;
      const url = await render(el, {
        backgroundColor: '#ffffff',
        width,
        height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        },
      });
      download(url, `family-tree.${format}`);
    } finally {
      setExporting(false);
    }
  }, [getNodes]);

  return { exportTree, exporting };
}
