import { useState } from "react";
import { X } from "lucide-react";

// ===== Data: one source of truth for every box on the diagram =====
// Add real content per-node here later (description, links, metrics, etc).
const NODES = {
  trustProxies: {
    label: "Trust\nProxies",
    color: "#D3CCEE",
    textColor: "#1a1a1a",
    style: { left: 920, top: 65, width: 200, height: 95 },
    description: "Placeholder description for Trust Proxies. Add real framework content here.",
  },
  aiSystem: {
    label: "AI system",
    color: "#A9C2E8",
    textColor: "#1a1a1a",
    style: { left: 460, top: 220, width: 210, height: 95 },
    description: "Placeholder description for the AI system node.",
  },
  taiResearchTeam: {
    label: "TAI Research Team",
    color: "#C8E5EC",
    textColor: "#1a1a1a",
    style: { left: 855, top: 320, width: 255, height: 95 },
    description: "Placeholder description for the TAI Research Team.",
  },
  trustInstitution: {
    label: "Trust\nInstitution",
    color: "#B0B0B0",
    textColor: "#6a6a6a",
    style: { left: 20, top: 395, width: 185, height: 80 },
    zIndex: 1,
    description: "Placeholder description for Trusted Institution.",
  },
  trustIntermediaries: {
    label: "Trust\nIntermediaries",
    color: "#C9E6B8",
    textColor: "#1a1a1a",
    style: { left: 205, top: 395, width: 210, height: 80 },
    zIndex: 2,
    description: "Placeholder description for Trust Intermediaries.",
  },
  trustRepresentatives: {
    label: "Trust\nRepresentatives",
    color: "#E9C5E3",
    textColor: "#1a1a1a",
    style: { left: 90, top: 475, width: 210, height: 80 },
    zIndex: 2,
    description: "Placeholder description for Trust Representatives.",
  },
  trustPublic: {
    label: "Trust\nPublic",
    color: "#EDE6B6",
    textColor: "#1a1a1a",
    style: { left: 415, top: 540, width: 245, height: 95 },
    description: "Placeholder description for Trust Public.",
  },
  trustedInfrastructure: {
    label: "Trusted\nInfrastructure",
    color: "#E7C6CA",
    textColor: "#1a1a1a",
    style: { left: 725, top: 540, width: 240, height: 95 },
    description: "Placeholder description for Trusted Infrastructure.",
  },
};

const EDGE_LABELS = [
  { text: "Approximate trustworthiness for OR\napproximate trust in", style: { left: 655, top: 130, width: 280 }, blue: true },
  { text: "Inform assessment of trustworthiness for\nOR represent trust decisions about", style: { left: 115, top: 225, width: 300 }, blue: true },
  { text: "Access and/or\nbuild", style: { left: 725, top: 325, width: 90 } },
  { text: "Support", style: { left: 740, top: 460, width: 90 } },
  { text: "Rely on/use", style: { left: 990, top: 460, width: 90 } },
  { text: "Interact\nwith", style: { left: 480, top: 445, width: 90 } },
  { text: "Stand in for", style: { left: 235, top: 600, width: 90 } },
  { text: "Participatory methods elicit input and\nfeedback in trust and trustworthiness", style: { left: 790, top: 700, width: 280 }, blue: true },
];

function Node({ id, node, isActive, onSelect }) {
  return (
    <button
      onClick={() => onSelect(id)}
      style={{
        position: "absolute",
        left: node.style.left,
        top: node.style.top,
        width: node.style.width,
        height: node.style.height,
        zIndex: node.zIndex ?? 2,
        background: node.color,
        color: node.textColor,
        border: isActive ? "3px solid #1a1a1a" : "3px solid transparent",
        borderRadius: 4,
        boxShadow: isActive
          ? "0 6px 16px rgba(0,0,0,0.25)"
          : "0 1px 2px rgba(0,0,0,0.06)",
        cursor: "pointer",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: 17,
        lineHeight: 1.4,
        whiteSpace: "pre-line",
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 8,
        transition: "transform 120ms ease, box-shadow 120ms ease",
        transform: isActive ? "translateY(-2px)" : "translateY(0)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.transform = "translateY(0)";
      }}
      aria-pressed={isActive}
    >
      {node.label}
    </button>
  );
}

function Arrows() {
  return (
    <svg
      style={{ position: "absolute", top: 0, left: 0, width: 1180, height: 860, pointerEvents: "none" }}
    >
      <defs>
        <marker id="arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L8,3 z" fill="#1a1a1a" />
        </marker>
      </defs>

      <path d="M 1020 95 L 565 95 L 565 220" stroke="#1a1a1a" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
      <path d="M 855 390 L 680 390 L 680 285" stroke="#1a1a1a" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
      <path d="M 790 540 L 790 390" stroke="#1a1a1a" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
      <path d="M 1000 540 L 1000 162" stroke="#1a1a1a" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
      <path d="M 570 540 L 570 285" stroke="#1a1a1a" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
      <path d="M 210 395 L 210 280 L 460 280" stroke="#1a1a1a" strokeWidth="2" strokeDasharray="7,6" fill="none" markerEnd="url(#arrow)" />
      <path d="M 210 555 L 210 635 L 415 635" stroke="#1a1a1a" strokeWidth="2" strokeDasharray="7,6" fill="none" markerEnd="url(#arrow)" />
      <path d="M 1150 410 L 1150 790 L 165 790 L 165 525" stroke="#1a1a1a" strokeWidth="2" strokeDasharray="7,6" fill="none" markerEnd="url(#arrow)" />
    </svg>
  );
}

export default function TrustNetworkDiagram() {
  const [selectedId, setSelectedId] = useState(null);
  const selected = selectedId ? NODES[selectedId] : null;

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center", padding: 24, background: "#fafafa" }}>
      <div style={{ width: 1180, fontFamily: "'Courier New', Courier, monospace" }}>
        <div
          style={{
            position: "relative",
            width: 1180,
            height: 860,
            background: "#F2F2F0",
            borderTop: "4px solid #aaa",
            borderBottom: "4px solid #aaa",
          }}
        >
          <Arrows />

          {Object.entries(NODES).map(([id, node]) => (
            <Node key={id} id={id} node={node} isActive={selectedId === id} onSelect={setSelectedId} />
          ))}

          {EDGE_LABELS.map((label, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: label.style.left,
                top: label.style.top,
                width: label.style.width,
                fontSize: 13,
                fontWeight: "bold",
                color: label.blue ? "#134e7a" : "#1a1a1a",
                textAlign: "center",
                whiteSpace: "pre-line",
                pointerEvents: "none",
              }}
            >
              {label.text}
            </div>
          ))}
        </div>

        {/* Detail panel — placeholder content, wire up real data/functionality later */}
        {selected && (
          <div
            style={{
              marginTop: 16,
              background: "white",
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 20,
              position: "relative",
            }}
          >
            <button
              onClick={() => setSelectedId(null)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#666",
              }}
              aria-label="Close details"
            >
              <X size={18} />
            </button>
            <div
              style={{
                display: "inline-block",
                background: selected.color,
                color: selected.textColor,
                padding: "4px 12px",
                borderRadius: 4,
                fontSize: 13,
                fontWeight: "bold",
                marginBottom: 10,
                whiteSpace: "pre-line",
              }}
            >
              {selected.label.replace("\n", " ")}
            </div>
            <p style={{ margin: 0, color: "#333", fontSize: 14, lineHeight: 1.6 }}>
              {selected.description}
            </p>
          </div>
        )}

        {!selected && (
          <p style={{ marginTop: 16, color: "#888", fontSize: 13, textAlign: "center" }}>
            Click any box to see its details here.
          </p>
        )}
      </div>
    </div>
  );
}
