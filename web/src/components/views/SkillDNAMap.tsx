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
      const size = Math.max(3, Math.min(12, (node.score ?? 0.5) * 16));
      const color = node.cluster_color ?? '#4a3f8f';

      ctx.globalAlpha = isHighlighted ? 1 : 0.15;

      // Pixel-style square nodes
      ctx.fillStyle = color;
      ctx.fillRect(node.x - size, node.y - size, size * 2, size * 2);

      // Pixel border
      ctx.strokeStyle = isHighlighted && search ? '#00d4ff' : '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(node.x - size, node.y - size, size * 2, size * 2);

      // Label
      if (globalScale > 1.5 || (search && isHighlighted)) {
        const fontSize = Math.max(7, 10 / globalScale);
        ctx.font = `${fontSize}px Silkscreen, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#c8c8c8';
        ctx.fillText(node.label?.slice(0, 18) ?? '', node.x, node.y + size + fontSize + 1);
      }

      ctx.globalAlpha = 1;
    },
    [search, highlightedUris]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Spinner size="lg" color="#00d4ff" />
        <p className="font-[Silkscreen,monospace] text-xs text-[#555577] uppercase tracking-wider">Loading skill map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="text-3xl">😕</div>
        <p className="font-[Silkscreen,monospace] text-xs text-[#ff2244]">▶ Failed to load map: {error}</p>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="text-4xl">🧬</div>
        <p className="font-[Silkscreen,monospace] text-sm text-[#888888] uppercase tracking-wider">No skills found</p>
        <p className="font-[Silkscreen,monospace] text-xs text-[#555577]">Run analysis first to see your Skill DNA map.</p>
        <p className="font-[Silkscreen,monospace] text-xs text-[#333355]">Make sure ESCO data is imported.</p>
      </div>
    );
  }

  const displayNodes = filteredNodes.slice(0, 200);
  const displayNodeIds = new Set(displayNodes.map((n) => n.id));
  const displayEdges = edges.filter(
    (e) => displayNodeIds.has(e.source as string) && displayNodeIds.has(e.target as string)
  );

  const clusters = [...new Map(
    nodes
      .filter((n) => n.cluster_label && n.cluster_color)
      .map((n) => [n.cluster_label, { label: n.cluster_label, color: n.cluster_color }])
  ).values()].slice(0, 8);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-xs">
          <Input
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 font-[Silkscreen,monospace] text-xs text-[#555577]">
          <span className="text-[#00d4ff]">{displayNodes.length}</span>
          <span>/ {nodes.length}</span>
        </div>
        {search && (
          <button
            onClick={() => setSearch('')}
            className="font-[Silkscreen,monospace] text-xs text-[#ff2244] hover:text-[#ff4466] uppercase tracking-wider transition-colors duration-75"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Graph */}
      <div
        ref={containerRef}
        className="w-full border-2 border-[#333355] shadow-[4px_4px_0_#000000] overflow-hidden"
        style={{ height: 520, backgroundColor: '#050510' }}
      >
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
            const size = Math.max(3, Math.min(12, (node.score ?? 0.5) * 16));
            ctx.fillStyle = color;
            ctx.fillRect(node.x - size - 4, node.y - size - 4, (size + 4) * 2, (size + 4) * 2);
          }}
          onNodeClick={(node: any) => onSkillClick(node.id)}
          linkColor={() => '#1a1a2e'}
          linkWidth={1}
          backgroundColor="#050510"
          nodeLabel={(node: any) => `${node.label} (${Math.round((node.score ?? 0) * 100)}%)`}
          cooldownTicks={100}
        />
      </div>

      {/* Legend */}
      {clusters.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap p-3 bg-[#0a0a1a] border-2 border-[#333355]">
          <span className="font-[Silkscreen,monospace] text-xs uppercase tracking-wider text-[#555577]">Clusters:</span>
          {clusters.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5 font-[Silkscreen,monospace] text-xs text-[#888888]">
              <span className="w-3 h-3 flex-shrink-0 border border-[#000000]" style={{ backgroundColor: c.color ?? '#4a3f8f' }} />
              {c.label}
            </span>
          ))}
        </div>
      )}

      <p className="font-[Silkscreen,monospace] text-xs text-[#333355] text-center uppercase tracking-wider">
        Click node for evidence • Scroll to zoom • Drag to pan
      </p>
    </div>
  );
}
