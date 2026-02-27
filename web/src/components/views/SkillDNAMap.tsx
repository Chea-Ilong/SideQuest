import { useEffect, useRef, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { api } from '../../lib/api.js';
import type { GraphNode, GraphEdge } from '../../types/index.js';
import { Spinner } from '../common/Spinner.js';
import { Input } from '../common/Input.js';

interface SkillDNAMapProps {
  scanId: string;
  onSkillClick: (escoUri: string) => void;
}

export function SkillDNAMap({ scanId, onSkillClick }: SkillDNAMapProps) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  useEffect(() => {
    api.views.map(scanId)
      .then((r) => {
        setNodes(r.data.nodes);
        setEdges(r.data.edges);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [scanId]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setDimensions({ width: el.offsetWidth, height: el.offsetHeight });
    });
    observer.observe(el);
    setDimensions({ width: el.offsetWidth, height: el.offsetHeight });
    return () => observer.disconnect();
  }, []);

  const filteredNodes = search
    ? nodes.filter((n) => n.label.toLowerCase().includes(search.toLowerCase()))
    : nodes;

  const highlightedUris = new Set(filteredNodes.map((n) => n.id));

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const isHighlighted = !search || highlightedUris.has(node.id);
      const size = Math.max(4, Math.min(16, (node.score ?? 0.5) * 20));
      const color = node.cluster_color ?? '#6366f1';

      ctx.globalAlpha = isHighlighted ? 1 : 0.2;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label (only if zoomed in enough or highlighted)
      if (globalScale > 1.5 || (search && isHighlighted)) {
        const fontSize = Math.max(8, 12 / globalScale);
        ctx.font = `${fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#1e293b';
        ctx.fillText(node.label?.slice(0, 20) ?? '', node.x, node.y + size + fontSize);
      }

      ctx.globalAlpha = 1;
    },
    [search, highlightedUris]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-2">
          <Spinner size="lg" />
          <p className="text-slate-500">Loading skill map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-500">Failed to load map: {error}</p>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-500">No skills found. Run analysis first.</p>
      </div>
    );
  }

  // Cap at 200 nodes for performance
  const displayNodes = filteredNodes.slice(0, 200);
  const displayNodeIds = new Set(displayNodes.map((n) => n.id));
  const displayEdges = edges.filter(
    (e) => displayNodeIds.has(e.source as string) && displayNodeIds.has(e.target as string)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-sm text-slate-500 whitespace-nowrap">
          {displayNodes.length} skills
        </span>
      </div>

      <div ref={containerRef} className="w-full rounded-xl border border-slate-200 overflow-hidden bg-slate-50" style={{ height: 500 }}>
        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={{ nodes: displayNodes as any[], links: displayEdges as any[] }}
          nodeId="id"
          linkSource="source"
          linkTarget="target"
          nodeCanvasObject={nodeCanvasObject}
          nodePointerAreaPaint={(node: any, color, ctx) => {
            const size = Math.max(4, Math.min(16, (node.score ?? 0.5) * 20));
            ctx.beginPath();
            ctx.arc(node.x, node.y, size + 4, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          }}
          onNodeClick={(node: any) => onSkillClick(node.id)}
          linkColor={() => '#e2e8f0'}
          linkWidth={0.5}
          backgroundColor="#f8fafc"
          nodeLabel={(node: any) => `${node.label} (${Math.round((node.score ?? 0) * 100)}%)`}
          cooldownTicks={100}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500">Clusters:</span>
        {[...new Set(nodes.map((n) => ({ label: n.cluster_label, color: n.cluster_color })).filter((c) => c.label))]
          .slice(0, 6)
          .map((c, i) => (
            <span key={i} className="flex items-center gap-1 text-xs">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color ?? '#6366f1' }} />
              {c.label}
            </span>
          ))}
      </div>
    </div>
  );
}
