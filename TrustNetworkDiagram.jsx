import { useState, useMemo, useRef, useEffect } from "react";
import { X, ArrowRight, ArrowLeft } from "lucide-react";

/* ============================================================
   TRUST NETWORK DIAGRAM
   A systems map of the TRAILS trust framework.
   - Hover or click a node to isolate its subgraph.
   - Solid edges = direct relationships; dashed = representational.
   ============================================================ */

const FONT = "'JetBrains Mono', ui-monospace, 'Courier New', monospace";
const INK = "#2c3240";        // charcoal for strokes/text
const INK_SOFT = "#5b6270";   // muted labels
const ACCENT = "#1d3a5f";     // deep ink-blue for chrome accents
const PAPER = "#f4f2ec";      // warm drafting paper

// ---- Nodes: the single source of truth ----
const NODES = {
  trustProxies: {
    label: "Trust Proxies", color: "#D3CCEE",
    x: 920, y: 65, w: 200, h: 95,
    description: "Placeholder description for Trust Proxies. Add real framework content here.",
  },
  aiSystem: {
    label: "AI system", color: "#A9C2E8",
    x: 460, y: 220, w: 210, h: 95,
    description: "Placeholder description for the AI system node.",
  },
  taiResearchTeam: {
    label: "TAI Research Team", color: "#C8E5EC",
    x: 855, y: 320, w: 255, h: 95,
    description: "Placeholder description for the TAI Research Team.",
  },
  trustInstitution: {
    label: "Trust Institution", color: "#B0B0B0", textColor: "#5a5a5a",
    x: 20, y: 395, w: 185, h: 80, zIndex: 1,
    description: "Placeholder description for Trusted Institution.",
  },
  trustIntermediaries: {
    label: "Trust Intermediaries", color: "#C9E6B8",
    x: 205, y: 395, w: 210, h: 80, zIndex: 2,
    description: "Placeholder description for Trust Intermediaries.",
  },
  trustRepresentatives: {
    label: "Trust Representatives", color: "#E9C5E3",
    x: 90, y: 475, w: 210, h: 80, zIndex: 2,
    description: "Placeholder description for Trust Representatives.",
  },
  trustPublic: {
    label: "Trust Public", color: "#EDE6B6",
    x: 415, y: 540, w: 245, h: 95,
    description: "Placeholder description for Trust Public.",
  },
  trustedInfrastructure: {
    label: "Trusted Infrastructure", color: "#E7C6CA",
    x: 725, y: 540, w: 240, h: 95,
    description: "Placeholder description for Trusted Infrastructure.",
  },
};

// ---- Edges: from -> to, with routing points and a relationship label ----
const EDGES = [
  { id: "e1", from: "trustProxies", to: "aiSystem", dashed: false,
    label: "Approximate trustworthiness for\nOR approximate trust in",
    points: [[1020, 95], [565, 95], [565, 220]], labelAt: [795, 122] },
  { id: "e2", from: "taiResearchTeam", to: "aiSystem", dashed: false,
    label: "Access and/or build",
    points: [[855, 390], [680, 390], [680, 285]], labelAt: [770, 350] },
  { id: "e3", from: "trustedInfrastructure", to: "aiSystem", dashed: false,
    label: "Support",
    points: [[790, 540], [790, 390]], labelAt: [785, 470] },
  { id: "e4", from: "trustedInfrastructure", to: "trustProxies", dashed: false,
    label: "Rely on/use",
    points: [[965, 580], [1115, 580], [1115, 162]], labelAt: [1050, 430] },
  { id: "e5", from: "trustPublic", to: "aiSystem", dashed: false,
    label: "Interact with",
    points: [[570, 540], [570, 285]], labelAt: [525, 450] },
  { id: "e6", from: "trustIntermediaries", to: "aiSystem", dashed: true,
    label: "Inform assessment of trustworthiness for\nOR represent trust decisions about",
    points: [[210, 395], [210, 280], [460, 280]], labelAt: [265, 233] },
  { id: "e7", from: "trustRepresentatives", to: "trustPublic", dashed: true,
    label: "Stand in for",
    points: [[210, 555], [210, 635], [415, 635]], labelAt: [280, 608] },
  { id: "participatory", from: "taiResearchTeam", to: "trustRepresentatives", dashed: true,
    label: "Participatory methods elicit input and\nfeedback in trust and trustworthiness",
    points: [[1110, 410], [1160, 410], [1160, 790], [165, 790], [165, 525]], labelAt: [930, 712] },
];

const W = 1180, H = 860;

// ---- helpers ----
function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(hex, target, t) {
  const a = hexToRgb(hex), b = hexToRgb(target);
  const r = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${r[0]}, ${r[1]}, ${r[2]})`;
}
const darken = (hex) => mix(hex, "#1c2230", 0.5);

// Build an orthogonal path with softly rounded corners from a list of points.
function roundedPath(points, r = 16) {
  if (points.length < 2) return "";
  const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const out = [`M ${points[0][0]} ${points[0][1]}`];
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i - 1], c = points[i], n = points[i + 1];
    const r1 = Math.min(r, dist(p, c) / 2), r2 = Math.min(r, dist(c, n) / 2);
    const v1 = [(p[0] - c[0]) / dist(p, c), (p[1] - c[1]) / dist(p, c)];
    const v2 = [(n[0] - c[0]) / dist(c, n), (n[1] - c[1]) / dist(c, n)];
    const a = [c[0] + v1[0] * r1, c[1] + v1[1] * r1];
    const b = [c[0] + v2[0] * r2, c[1] + v2[1] * r2];
    out.push(`L ${a[0].toFixed(1)} ${a[1].toFixed(1)}`);
    out.push(`Q ${c[0]} ${c[1]} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`);
  }
  const last = points[points.length - 1];
  out.push(`L ${last[0]} ${last[1]}`);
  return out.join(" ");
}

export default function TrustNetworkDiagram() {
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const active = hoveredId || selectedId;

  // adjacency for subgraph isolation
  const neighbors = useMemo(() => {
    const m = {};
    Object.keys(NODES).forEach((id) => (m[id] = new Set([id])));
    EDGES.forEach((e) => { m[e.from].add(e.to); m[e.to].add(e.from); });
    return m;
  }, []);

  const nodeDim = (id) => (active && !neighbors[active].has(id) ? 0.28 : 1);
  const edgeOn = (e) => !active || e.from === active || e.to === active;

  // Scale the fixed 1180x860 canvas to fill the viewport (fit width AND height).
  const rootRef = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const PAD = 36;
    const measure = () => {
      const w = el.clientWidth - PAD * 2;
      const h = el.clientHeight - PAD * 2;
      setScale(Math.max(0.2, Math.min(w / W, h / H, 1.8)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const selected = selectedId ? NODES[selectedId] : null;
  const connections = useMemo(() => {
    if (!selectedId) return { out: [], inc: [] };
    return {
      out: EDGES.filter((e) => e.from === selectedId),
      inc: EDGES.filter((e) => e.to === selectedId),
    };
  }, [selectedId]);

  return (
    <div ref={rootRef} style={{ position: "relative", width: "100%", height: "100%", minHeight: "100vh", overflow: "hidden", background: PAPER, fontFamily: FONT, color: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes tnd-march { to { stroke-dashoffset: -52; } }
        .tnd-canvas-wrap { overflow-x: auto; padding: 28px; display: flex; justify-content: center; }
        .tnd-node { transition: opacity .25s ease, transform .15s ease, box-shadow .15s ease, filter .15s ease; }
        .tnd-node:focus-visible { outline: 3px solid ${ACCENT}; outline-offset: 3px; }
        @media (prefers-reduced-motion: no-preference) {
          .tnd-march { animation: tnd-march 1.6s linear infinite; }
        }
      `}</style>

      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: W * scale, height: H * scale }}>
        <div
          style={{
            position: "relative", width: W, height: H,
            transform: `scale(${scale})`, transformOrigin: "top left",
            background: PAPER,
            backgroundImage: `radial-gradient(${mix(PAPER, INK, 0.16)} 1.1px, transparent 1.1px)`,
            backgroundSize: "22px 22px",
            backgroundPosition: "11px 11px",
            borderRadius: 14,
            border: `1px solid ${mix(PAPER, INK, 0.14)}`,
            boxShadow: "0 1px 0 rgba(255,255,255,.6) inset, 0 18px 40px -28px rgba(28,34,48,.45)",
          }}
          onClick={() => setSelectedId(null)}
        >
          {/* ---- edges ---- */}
          <svg style={{ position: "absolute", inset: 0, width: W, height: H, pointerEvents: "none" }}>
            <defs>
              <marker id="tnd-arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L8,3 z" fill={INK} />
              </marker>
              {EDGES.map((e) => (
                <marker key={e.id} id={`tnd-arrow-${e.id}`} markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L8,3 z" fill={darken(NODES[e.from].color)} />
                </marker>
              ))}
            </defs>

            {EDGES.map((e) => {
              const on = edgeOn(e);
              const lit = active && (e.from === active || e.to === active);
              const stroke = lit ? darken(NODES[e.from].color) : INK;
              return (
                <path
                  key={e.id}
                  d={roundedPath(e.points)}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={lit ? 2.6 : 1.8}
                  strokeDasharray={e.dashed ? "7,6" : "none"}
                  markerEnd={`url(#tnd-arrow${lit ? "-" + e.id : ""})`}
                  className={e.id === "participatory" && e.dashed ? "tnd-march" : ""}
                  style={{ opacity: on ? 1 : 0.1, transition: "opacity .25s ease, stroke-width .15s ease" }}
                />
              );
            })}
          </svg>

          {/* ---- edge labels ---- */}
          {EDGES.map((e) => {
            const on = edgeOn(e);
            const blue = e.label.length > 22;
            return (
              <div key={e.id} style={{
                position: "absolute", left: e.labelAt[0], top: e.labelAt[1],
                transform: "translateX(-50%)", textAlign: "center",
                fontSize: 11.5, fontWeight: 700, lineHeight: 1.5,
                letterSpacing: ".2px", whiteSpace: "pre-line",
                color: blue ? ACCENT : INK_SOFT, pointerEvents: "none",
                opacity: on ? 1 : 0.18, transition: "opacity .25s ease",
                textShadow: `0 1px 0 ${PAPER}, 0 0 6px ${PAPER}`,
              }}>
                {e.label}
              </div>
            );
          })}

          {/* ---- nodes ---- */}
          {Object.entries(NODES).map(([id, n]) => {
            const isSel = selectedId === id;
            const isHot = active === id;
            return (
              <button
                key={id}
                className="tnd-node"
                onClick={(ev) => { ev.stopPropagation(); setSelectedId(isSel ? null : id); }}
                onMouseEnter={() => setHoveredId(id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(id)}
                onBlur={() => setHoveredId(null)}
                aria-pressed={isSel}
                style={{
                  position: "absolute", left: n.x, top: n.y, width: n.w, height: n.h,
                  zIndex: (n.zIndex ?? 2) + (isHot ? 10 : 0),
                  background: n.color,
                  color: n.textColor ?? INK,
                  fontFamily: FONT, fontSize: 16.5, fontWeight: 500, lineHeight: 1.35,
                  letterSpacing: ".2px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  textAlign: "center", padding: 10, cursor: "pointer",
                  border: `1.5px solid ${isSel ? INK : mix(n.color, INK, 0.22)}`,
                  borderRadius: 10,
                  opacity: nodeDim(id),
                  transform: isHot ? "translateY(-3px)" : "translateY(0)",
                  boxShadow: isHot
                    ? `0 14px 28px -10px ${mix(n.color, INK, 0.5)}`
                    : `0 2px 0 ${mix(n.color, INK, 0.18)}`,
                }}
              >
                {n.label}
              </button>
            );
          })}

          {/* ---- legend ---- */}
          <div style={{
            position: "absolute", left: 24, top: 22, zIndex: 30,
            background: mix(PAPER, "#ffffff", 0.5),
            border: `1px solid ${mix(PAPER, INK, 0.16)}`, borderRadius: 10,
            padding: "12px 14px", fontSize: 11.5, lineHeight: 1.6,
            boxShadow: "0 6px 18px -12px rgba(28,34,48,.4)", pointerEvents: "none",
          }}>
            <div style={{ fontWeight: 700, letterSpacing: ".6px", marginBottom: 7, color: INK }}>
              HOW TO READ
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, color: INK_SOFT }}>
              <svg width="34" height="8"><line x1="0" y1="4" x2="34" y2="4" stroke={INK} strokeWidth="2" markerEnd="url(#tnd-arrow)" /></svg>
              direct relationship
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, color: INK_SOFT, marginTop: 4 }}>
              <svg width="34" height="8"><line x1="0" y1="4" x2="34" y2="4" stroke={INK} strokeWidth="2" strokeDasharray="5,4" /></svg>
              representational / participatory
            </div>
            <div style={{ marginTop: 7, color: mix(INK_SOFT, PAPER, 0.15), fontSize: 10.5 }}>
              hover a node to trace its links
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* hint pinned to bottom when nothing is selected */}
      {!selected && (
        <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center", pointerEvents: "none", color: INK_SOFT, fontSize: 12.5, letterSpacing: ".3px" }}>
          Select a node to read its role and trace its connections.
        </div>
      )}

      {/* ---- detail panel (slide-up overlay) ---- */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "center", padding: 16, pointerEvents: "none" }}>
        <div style={{
          width: "min(1180px, calc(100% - 32px))",
          transform: selected ? "translateY(0)" : "translateY(140%)",
          transition: "transform .32s cubic-bezier(.2,.7,.2,1)",
          pointerEvents: selected ? "auto" : "none",
        }}>
          {selected && (
            <div style={{
              position: "relative", background: "#fff",
              border: `1px solid ${mix(PAPER, INK, 0.16)}`, borderRadius: 14,
              borderLeft: `6px solid ${selected.color}`,
              padding: "20px 22px", boxShadow: "0 24px 50px -28px rgba(28,34,48,.55)",
              maxHeight: "44vh", overflow: "auto",
            }}>
              <button
                onClick={() => setSelectedId(null)}
                aria-label="Close details"
                style={{ position: "absolute", top: 14, right: 14, background: "transparent", border: "none", cursor: "pointer", color: INK_SOFT }}
              >
                <X size={18} />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <span style={{ width: 16, height: 16, borderRadius: 4, background: selected.color, border: `1px solid ${mix(selected.color, INK, 0.3)}` }} />
                <h3 style={{ margin: 0, fontSize: 21, fontWeight: 700, letterSpacing: ".3px", color: INK }}>
                  {selected.label}
                </h3>
              </div>

              <p style={{ margin: "0 0 18px", color: "#444b58", fontSize: 13.5, lineHeight: 1.7, maxWidth: 720 }}>
                {selected.description}
              </p>

              {(connections.out.length > 0 || connections.inc.length > 0) && (
                <div style={{ borderTop: `1px dashed ${mix(PAPER, INK, 0.22)}`, paddingTop: 14 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".8px", color: INK_SOFT, marginBottom: 10 }}>
                    CONNECTIONS
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {connections.out.map((e) => (
                      <ConnChip key={e.id} dir="out" to={NODES[e.to].label} label={e.label} color={NODES[e.to].color} onClick={() => setSelectedId(e.to)} />
                    ))}
                    {connections.inc.map((e) => (
                      <ConnChip key={e.id} dir="in" to={NODES[e.from].label} label={e.label} color={NODES[e.from].color} onClick={() => setSelectedId(e.from)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConnChip({ dir, to, label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: mix(color, "#ffffff", 0.55), color: "#333a47",
        border: `1px solid ${mix(color, INK, 0.28)}`, borderRadius: 999,
        padding: "5px 12px 5px 9px", fontFamily: FONT, fontSize: 12, cursor: "pointer",
        whiteSpace: "nowrap", maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis",
      }}
      title={label.replace(/\n/g, " ")}
    >
      {dir === "out"
        ? <ArrowRight size={13} style={{ color: INK_SOFT, flex: "0 0 auto" }} />
        : <ArrowLeft size={13} style={{ color: INK_SOFT, flex: "0 0 auto" }} />}
      <strong style={{ fontWeight: 700 }}>{to}</strong>
      <span style={{ color: INK_SOFT, overflow: "hidden", textOverflow: "ellipsis" }}>
        · {label.replace(/\n/g, " ")}
      </span>
    </button>
  );
}
