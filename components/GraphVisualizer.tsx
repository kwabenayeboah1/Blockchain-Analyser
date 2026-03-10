
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, Maximize, MousePointer2, Box } from 'lucide-react';
import { GraphNode, GraphLink } from '../types';

interface ExtendedNode extends GraphNode {
  category: 'input' | 'output' | 'tx' | 'fee';
  isFee?: boolean;
}

interface Props {
  data: any | null;
  onNodeClick: (id: string, type: 'address' | 'transaction') => void;
  aiAnalysis?: string | null;
  gbpPrice?: number;
}

const GraphVisualizer: React.FC<Props> = ({ data, onNodeClick, aiAnalysis, gbpPrice = 0 }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number, y: number, content: React.ReactNode } | null>(null);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [tipHeight, setTipHeight] = useState<number>(0);

  // Fetch current tip height to calculate confirmations
  useEffect(() => {
    fetch('https://mempool.space/api/blocks/tip/height')
      .then(res => res.json())
      .then(height => setTipHeight(height))
      .catch(err => console.error("Failed to fetch tip height", err));
  }, []);

  const formatGBPValue = (sats: number) => {
    if (!gbpPrice) return '£0.00';
    const btc = sats / 100000000;
    const gbpValue = btc * gbpPrice;
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(gbpValue);
  };

  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.7);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const scale = parseFloat(e.target.value);
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).call(zoomRef.current.scaleTo, scale);
    }
  };

  const truncateAddr = (addr: string) => {
    if (addr.length < 12) return addr;
    return `${addr.substring(0, 5)}...${addr.substring(addr.length - 4)}`;
  };

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const isConfirmed = data.status?.confirmed;
    const blockHeight = data.status?.block_height;
    const confirmations = isConfirmed && tipHeight && blockHeight ? (tipHeight - blockHeight + 1) : 0;
    const txFee = data.fee || 0;

    const nodes: ExtendedNode[] = [];
    const links: (GraphLink & { category: string })[] = [];

    nodes.push({ 
      id: data.hash, 
      label: `TX: ${data.hash.substring(0, 8)}...`, 
      type: 'transaction',
      category: 'tx'
    });

    if (data.vin) {
      data.vin.forEach((vin: any, i: number) => {
        const addr = vin.prev_out?.addr || `Unknown Input ${i}`;
        const nodeId = `in-${addr}-${i}`;
        nodes.push({ 
          id: nodeId, 
          label: truncateAddr(addr), 
          type: 'address', 
          category: 'input',
          value: vin.prev_out?.value 
        });
        links.push({ 
          source: nodeId, 
          target: data.hash, 
          value: vin.prev_out?.value || 0,
          category: 'input'
        });
      });
    }

    if (data.vout) {
      data.vout.forEach((vout: any, i: number) => {
        const addr = vout.addr || `Unknown Output ${i}`;
        const nodeId = `out-${addr}-${i}`;
        nodes.push({ 
          id: nodeId, 
          label: truncateAddr(addr), 
          type: 'address', 
          category: 'output',
          value: vout.value 
        });
        links.push({ 
          source: data.hash, 
          target: nodeId, 
          value: vout.value,
          category: 'output'
        });
      });
    }

    if (txFee > 0) {
      const feeId = `fee-${data.hash}`;
      nodes.push({
        id: feeId,
        label: "NETWORK FEE",
        type: 'address',
        category: 'fee',
        value: txFee,
        isFee: true
      });
      links.push({
        source: data.hash,
        target: feeId,
        value: txFee,
        category: 'fee'
      });
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const defs = svg.append("defs");
    const createGlow = (id: string, color: string) => {
      const f = defs.append("filter").attr("id", id).attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
      f.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "blur");
      f.append("feFlood").attr("flood-color", color).attr("result", "color");
      f.append("feComposite").attr("in", "color").attr("in2", "blur").attr("operator", "in").attr("result", "glow");
      const m = f.append("feMerge");
      m.append("feMergeNode").attr("in", "glow");
      m.append("feMergeNode").attr("in", "SourceGraphic");
    };

    createGlow("input-glow", "#ef4444");
    createGlow("output-glow", "#22c55e");
    createGlow("tx-glow", isConfirmed ? "#f59e0b" : "#3b82f6");

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setCurrentZoom(event.transform.k);
        setTooltip(null);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    const simulation = d3.forceSimulation<any>(nodes)
      .force("link", d3.forceLink<any, any>(links).id(d => d.id).distance(220))
      .force("charge", d3.forceManyBody().strength(-2500))
      .force("collide", d3.forceCollide().radius(40))
      .force("x", d3.forceX().x(d => {
          const node = d as ExtendedNode;
          if (node.category === 'input') return width / 6;
          if (node.category === 'output') return (5 * width) / 6;
          return width / 2;
      }).strength(0.25))
      .force("y", d3.forceY(height / 2).strength(0.1))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const nodeSelection = g.append("g");
    const linkSelection = g.append("g");

    const link = linkSelection
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", d => {
        if (d.category === 'input') return "#ef4444";
        if (d.category === 'output') return "#22c55e";
        return "#64748b";
      })
      .attr("stroke-opacity", 0.3)
      .attr("stroke-width", d => Math.min(Math.max(1, Math.sqrt(d.value / 1000000)), 15))
      .style("cursor", "help")
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).attr("stroke-opacity", 0.9).attr("stroke", "#fff");
        
        // Highlight connected nodes
        nodeGroup.filter(n => (n as ExtendedNode).id === (d.source as any).id || (n as ExtendedNode).id === (d.target as any).id)
          .select("circle")
          .attr("stroke-width", 5)
          .attr("stroke", "#fff");

        setTooltip({
          x: event.pageX,
          y: event.pageY,
          content: (
            <div className="space-y-2">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Value Transfer</p>
                <p className="text-sm font-mono text-amber-400">{(d.value / 100000000).toFixed(8)} BTC</p>
                <p className="text-[10px] text-slate-500 font-medium">{formatGBPValue(d.value)}</p>
              </div>
              <div className="border-t border-slate-700/50 pt-1.5 mt-1.5">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Total TX Fee</p>
                <p className="text-[10px] font-mono text-slate-300">{(txFee / 100000000).toFixed(8)} BTC</p>
                <p className="text-[9px] text-slate-500 font-medium">{formatGBPValue(txFee)}</p>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isConfirmed ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`} />
                <span className="text-[9px] text-slate-300 uppercase">{isConfirmed ? 'Confirmed' : 'Pending'}</span>
              </div>
            </div>
          )
        });
      })
      .on("mouseout", (event, d) => {
        d3.select(event.currentTarget)
          .attr("stroke-opacity", 0.3)
          .attr("stroke", d => {
            if (d.category === 'input') return "#ef4444";
            if (d.category === 'output') return "#22c55e";
            return "#64748b";
          });

        nodeGroup.select("circle")
          .attr("stroke-width", n => {
            const node = n as ExtendedNode;
            return node.category === 'tx' ? 3 : 2;
          })
          .attr("stroke", n => {
            const node = n as ExtendedNode;
            if (node.category === 'tx') return isConfirmed ? "#fbbf24" : "#60a5fa";
            if (node.category === 'input') return "#ef4444";
            if (node.category === 'output') return "#22c55e";
            return "#94a3b8";
          });

        setTooltip(null);
      });

    const nodeGroup = nodeSelection
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        const cleanId = d.id.includes('-') ? d.id.split('-')[1] : d.id;
        onNodeClick(cleanId, d.type);
      })
      .on("mouseover", (event, d) => {
        const cleanId = d.id.includes('-') ? d.id.split('-')[1] : d.id;
        const isTx = d.category === 'tx';
        
        setTooltip({ 
          x: event.pageX, 
          y: event.pageY, 
          content: (
            <div className="space-y-1.5 min-w-[140px]">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  d.category === 'input' ? 'bg-red-500' : d.category === 'output' ? 'bg-green-500' : 'bg-amber-500'
                }`} />
                <span className="text-[10px] font-bold uppercase text-slate-400">{d.category}</span>
              </div>
              <p className="text-[10px] mono break-all text-slate-200">{cleanId}</p>
              
              {isTx && (
                <div className="pt-2 border-t border-slate-700/50 mt-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Status</span>
                    <span className={`text-[10px] font-bold ${isConfirmed ? 'text-green-500' : 'text-blue-400 animate-pulse'}`}>
                      {isConfirmed ? 'CONFIRMED' : 'MEMPOOL'}
                    </span>
                  </div>
                  {isConfirmed && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Confirmations</span>
                        <span className="text-[10px] font-mono text-amber-400">{confirmations >= 6 ? '6+' : confirmations}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Block</span>
                        <span className="text-[10px] font-mono text-slate-300">#{blockHeight}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {d.value !== undefined && (
                <div>
                  <p className="text-xs font-mono text-amber-400">{(d.value / 100000000).toFixed(8)} BTC</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{formatGBPValue(d.value)}</p>
                </div>
              )}
            </div>
          )
        });
      })
      .on("mouseout", () => setTooltip(null))
      .call(d3.drag<SVGGElement, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x; d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        }) as any);

    nodeGroup.append("circle")
      .attr("r", d => {
        if (d.category === 'tx') return 28;
        const valSize = d.value ? Math.sqrt(d.value / 2000000) : 0;
        return Math.min(Math.max(14, valSize), 40);
      })
      .attr("fill", d => {
        if (d.category === 'tx') return isConfirmed ? "#f59e0b" : "#3b82f6";
        if (d.category === 'input') return "#1a0606";
        if (d.category === 'output') return "#061a0c";
        return "#1e293b";
      })
      .attr("stroke", d => {
        if (d.category === 'tx') return isConfirmed ? "#fbbf24" : "#60a5fa";
        if (d.category === 'input') return "#ef4444";
        if (d.category === 'output') return "#22c55e";
        return "#94a3b8";
      })
      .attr("stroke-width", d => d.category === 'tx' ? 3 : 2)
      .style("filter", d => {
        if (d.category === 'input') return "url(#input-glow)";
        if (d.category === 'output') return "url(#output-glow)";
        if (d.category === 'tx') return "url(#tx-glow)";
        return "none";
      });

    const labels = nodeGroup.append("g")
      .attr("class", "node-label")
      .style("pointer-events", "none");

    labels.append("rect")
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("fill", "#0f172a")
      .attr("fill-opacity", 0.7)
      .attr("x", d => {
        const node = d as ExtendedNode;
        if (node.category === 'input') return -85;
        if (node.category === 'output') return 25;
        return -40;
      })
      .attr("y", d => {
        const node = d as ExtendedNode;
        if (node.category === 'tx') return 40;
        return -7;
      })
      .attr("width", 80)
      .attr("height", 14)
      .style("visibility", d => (d as ExtendedNode).category === 'fee' ? 'hidden' : 'visible');

    labels.append("text")
      .text(d => d.label)
      .attr("font-size", "9px")
      .attr("font-family", "JetBrains Mono")
      .attr("font-weight", "500")
      .attr("fill", "#e2e8f0")
      .attr("text-anchor", d => {
        if (d.category === 'input') return "end";
        if (d.category === 'output') return "start";
        return "middle";
      })
      .attr("dx", d => {
        if (d.category === 'input') return -25;
        if (d.category === 'output') return 25;
        return 0;
      })
      .attr("dy", d => {
        if (d.category === 'tx') return 50;
        if (d.category === 'input' || d.category === 'output') return 4;
        return 40;
      });

    simulation.on("tick", () => {
      link.attr("d", d => {
        const source = d.source as any;
        const target = d.target as any;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;
        return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
      });
      nodeGroup.attr("transform", d => `translate(${d.x},${d.y})`);
    });

  }, [data, gbpPrice, tipHeight]);

  return (
    <div className="w-full h-full relative bg-slate-950/20 group">
      <svg ref={svgRef} className="w-full h-full" />
      
      {tooltip && (
        <div 
          className="fixed z-[100] p-3 bg-slate-900/90 border border-slate-700 rounded-lg shadow-2xl backdrop-blur-md pointer-events-none border-l-2 border-l-amber-500"
          style={{ left: tooltip.x + 15, top: tooltip.y - 15 }}
        >
          {tooltip.content}
        </div>
      )}

      <div className="absolute top-6 right-6 flex flex-col gap-2 p-2 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button onClick={handleZoomIn} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-indigo-400" title="Zoom In"><ZoomIn className="w-5 h-5" /></button>
        <button onClick={handleZoomOut} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-indigo-400" title="Zoom Out"><ZoomOut className="w-5 h-5" /></button>
        <button onClick={handleResetZoom} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-indigo-400" title="Reset View"><Maximize className="w-5 h-5" /></button>
        <div className="px-1 py-4 flex flex-col items-center gap-2 border-t border-slate-800 mt-1">
          <input type="range" min="0.1" max="4" step="0.01" value={currentZoom} onChange={handleSliderChange} 
            className="h-24 appearance-none bg-slate-800 rounded-full w-1.5 cursor-pointer accent-indigo-500"
            style={{ writingMode: 'bt-lr' as any, WebkitAppearance: 'slider-vertical' }}
          />
          <span className="text-[9px] font-bold text-slate-600">{Math.round(currentZoom * 100)}%</span>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 flex flex-col gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Architecture</p>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]"></div>
          <span className="text-[10px] font-medium text-slate-300">Inputs (Source UTXOs)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
          <span className="text-[10px] font-medium text-slate-300">Outputs (Destinations)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]"></div>
          <span className="text-[10px] font-medium text-slate-300">Transaction Hub</span>
        </div>
      </div>
      
      <div className="absolute top-6 left-6 flex items-center gap-3 px-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl backdrop-blur-md">
        <Box className="w-4 h-4 text-amber-500" />
        <div className="flex flex-col">
          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter leading-none">Latest Block</span>
          <span className="text-xs font-mono text-slate-200">{tipHeight ? `#${tipHeight.toLocaleString()}` : 'Syncing...'}</span>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 rounded-full border border-slate-800 text-[10px] text-slate-500 opacity-50">
        <MousePointer2 className="w-3 h-3" />
        <span>Drag to pan • Scroll to zoom • Hover links to inspect</span>
      </div>
    </div>
  );
};

export default GraphVisualizer;
