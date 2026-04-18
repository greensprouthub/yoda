import { useState, useEffect } from "react";
import { Puzzle4LifePiece } from "@/api/entities";

const CATEGORY_COLORS = {
  Mindset:        { bg: "#7B2D8B", light: "#F3E5F5", text: "#7B2D8B" },
  Habit:          { bg: "#2E7D32", light: "#E8F5E9", text: "#2E7D32" },
  Business:       { bg: "#1565C0", light: "#E3F2FD", text: "#1565C0" },
  Sustainability: { bg: "#388E3C", light: "#E8F5E9", text: "#388E3C" },
  "AI/Tech":      { bg: "#0277BD", light: "#E1F5FE", text: "#0277BD" },
  Relationships:  { bg: "#C62828", light: "#FFEBEE", text: "#C62828" },
  Creativity:     { bg: "#F57C00", light: "#FFF3E0", text: "#F57C00" },
  Focus:          { bg: "#4527A0", light: "#EDE7F6", text: "#4527A0" },
  Health:         { bg: "#00838F", light: "#E0F7FA", text: "#00838F" },
  Finance:        { bg: "#558B2F", light: "#F1F8E9", text: "#558B2F" },
};

const TEMPLATE_URL = "https://base44.app/api/apps/69d577e334f46ea2be6055ca/files/mp/public/69d577e334f46ea2be6055ca/d57651b35_growth_set_blank_template.jpg";

const CATEGORIES = ["All","Mindset","Habit","Business","Focus","AI/Tech","Creativity","Sustainability","Health","Finance","Relationships"];

function wrapText(text = "", maxChars = 20) {
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) {
      if (cur) lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur.trim());
  return lines;
}

function getActivities(piece) {
  // Entity stores as array in 'activities' field
  if (Array.isArray(piece.activities) && piece.activities.length > 0) return piece.activities;
  // Fallback: activity_1..7 keys
  const acts = [];
  for (let i = 1; i <= 7; i++) {
    if (piece[`activity_${i}`]) acts.push(piece[`activity_${i}`]);
  }
  return acts;
}

// ── Front card rendered as inline SVG with template image layered under color gradient ──
function CardFront({ piece }) {
  const color = piece.theme_color || CATEGORY_COLORS[piece.category]?.bg || "#4527A0";
  const num   = String(Math.round(piece.piece_number || 0)).padStart(3, "0");
  const uid   = `p${piece.id || piece.piece_number}`;
  const titleLines = wrapText(piece.title || "", 19).slice(0, 2);
  const subLines   = wrapText(piece.subtitle || "", 40).slice(0, 2);
  const activities = getActivities(piece);

  // Title y-start shifts based on number of title lines
  const titleY = titleLines.length === 1 ? 188 : 175;
  const subY   = titleY + titleLines.length * 30 + 10;

  return (
    <svg viewBox="0 0 420 580" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id={`grad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.82"/>
        </linearGradient>
        <clipPath id={`card-${uid}`}>
          <rect x="4" y="4" width="412" height="572" rx="22"/>
        </clipPath>
        <clipPath id={`top-${uid}`}>
          <rect x="4" y="4" width="412" height="300" rx="22"/>
        </clipPath>
      </defs>

      {/* Drop shadow */}
      <rect x="9" y="9" width="411" height="571" rx="22" fill="rgba(0,0,0,0.09)"/>

      {/* Card base */}
      <rect x="4" y="4" width="412" height="572" rx="22" fill="#FAFAFA"/>

      {/* Template texture — subtle, behind gradient */}
      <image href={TEMPLATE_URL} x="4" y="4" width="412" height="300"
        clipPath={`url(#top-${uid})`} preserveAspectRatio="xMidYMid slice" opacity="0.12"/>

      {/* Color gradient overlay */}
      <rect x="4" y="4" width="412" height="300" rx="22"
        fill={`url(#grad-${uid})`} clipPath={`url(#top-${uid})`}/>
      {/* Cover the bottom-corner rounding of the gradient band */}
      <rect x="4" y="276" width="412" height="30" fill={color}/>

      {/* ── Badge: piece number ── */}
      <circle cx="38" cy="38" r="22" fill="rgba(255,255,255,0.20)"/>
      <text x="38" y="44" fontFamily="system-ui,sans-serif" fontSize="12"
        fontWeight="800" fill="white" textAnchor="middle">#{num}</text>

      {/* ── Badge: category ── */}
      <rect x="293" y="17" width="124" height="22" rx="11" fill="rgba(255,255,255,0.18)"/>
      <text x="355" y="31" fontFamily="system-ui,sans-serif" fontSize="9"
        fill="white" textAnchor="middle" fontWeight="700" letterSpacing="0.8">
        {(piece.category || "").toUpperCase()}
      </text>

      {/* ── Hex icon frame ── */}
      <polygon points="210,60 246,80 246,122 210,142 174,122 174,80"
        fill="rgba(255,255,255,0.20)" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5"/>
      {/* Icon emoji */}
      <text x="210" y="114" fontFamily="system-ui,sans-serif" fontSize="36"
        textAnchor="middle">{piece.icon || "🧩"}</text>

      {/* ── Title lines ── */}
      {titleLines.map((line, i) => (
        <text key={i} x="210" y={titleY + i * 30}
          fontFamily="system-ui,sans-serif" fontSize="20" fontWeight="800"
          fill="white" textAnchor="middle" letterSpacing="-0.3">{line}</text>
      ))}

      {/* ── Subtitle lines ── */}
      {subLines.map((line, i) => (
        <text key={i} x="210" y={subY + i * 17}
          fontFamily="system-ui,sans-serif" fontSize="11.5"
          fill="rgba(255,255,255,0.86)" textAnchor="middle" fontStyle="italic">{line}</text>
      ))}

      {/* ── Divider ── */}
      <line x1="30" y1="320" x2="390" y2="320" stroke="#E0E0E0" strokeWidth="1"/>

      {/* ── Activities header ── */}
      <text x="30" y="340" fontFamily="system-ui,sans-serif" fontSize="9"
        fontWeight="700" fill={color} letterSpacing="1.2">PRACTICE ACTIVITIES</text>

      {/* ── Activity rows ── */}
      {activities.slice(0, 6).map((act, i) => {
        const y = 360 + i * 32;
        const label = (act || "").length > 54 ? act.slice(0, 54) + "…" : act;
        return (
          <g key={i}>
            <rect x="30" y={y - 11} width="13" height="13" rx="3"
              fill="none" stroke={color} strokeWidth="1.5"/>
            <text x="50" y={y + 0.5} fontFamily="system-ui,sans-serif"
              fontSize="10.5" fill="#333" dominantBaseline="middle">{label}</text>
          </g>
        );
      })}

      {/* ── Footer ── */}
      <text x="210" y="569" fontFamily="system-ui,sans-serif" fontSize="8"
        fill="#C0C0C0" textAnchor="middle">
        PUZZLE4LIFE™ · {(piece.short_name || "").toUpperCase()}
      </text>

      {/* ── Flip hint ── */}
      <text x="390" y="569" fontFamily="system-ui,sans-serif" fontSize="8"
        fill="#C0C0C0" textAnchor="end">↻ flip</text>
    </svg>
  );
}

// ── Back card — interactive checklist ──
function CardBack({ piece, checkedItems, onToggle }) {
  const color    = piece.theme_color || CATEGORY_COLORS[piece.category]?.bg || "#4527A0";
  const light    = CATEGORY_COLORS[piece.category]?.light || "#EDE7F6";
  const activities = getActivities(piece);
  const done     = Object.values(checkedItems).filter(Boolean).length;
  const pct      = activities.length ? Math.round((done / activities.length) * 100) : 0;

  return (
    <div style={{
      width: "100%", height: "100%", borderRadius: 22,
      background: `linear-gradient(155deg, #FFFFFF 0%, ${light} 100%)`,
      boxShadow: "0 4px 22px rgba(0,0,0,0.11)",
      display: "flex", flexDirection: "column",
      padding: "18px 16px 14px", boxSizing: "border-box",
      fontFamily: "system-ui, sans-serif", overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: "50%", background: color,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 21, flexShrink: 0
        }}>{piece.icon || "🧩"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: color,
            lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {piece.title}
          </div>
          <div style={{ fontSize: 9.5, color: "#888", fontStyle: "italic", marginTop: 2 }}>
            {piece.subtitle}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          fontSize: 9, color: "#999", marginBottom: 4 }}>
          <span style={{ fontWeight: 700, color: color, letterSpacing: 0.8 }}>
            PRACTICE ACTIVITIES
          </span>
          <span>{done}/{activities.length} · {pct}%</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: "#E8E8E8", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 3, background: color,
            width: `${pct}%`, transition: "width 0.4s ease"
          }}/>
        </div>
      </div>

      {/* Checklist */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5 }}>
        {activities.map((act, i) => {
          const checked = !!checkedItems[i];
          return (
            <label key={i} onClick={e => { e.stopPropagation(); onToggle(i); }}
              style={{
                display: "flex", alignItems: "flex-start", gap: 9,
                cursor: "pointer", padding: "5px 7px", borderRadius: 8,
                background: checked ? `${color}12` : "transparent",
                transition: "background 0.18s", userSelect: "none"
              }}>
              {/* Checkbox */}
              <div style={{
                width: 17, height: 17, borderRadius: 4, flexShrink: 0, marginTop: 1,
                border: `2px solid ${color}`,
                background: checked ? color : "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.18s"
              }}>
                {checked && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5L3.2 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <span style={{
                fontSize: 11, lineHeight: 1.4,
                color: checked ? "#AAA" : "#333",
                textDecoration: checked ? "line-through" : "none",
                transition: "all 0.18s"
              }}>{act}</span>
            </label>
          );
        })}
      </div>

      {/* Source footer */}
      <div style={{
        marginTop: 10, paddingTop: 8,
        borderTop: "1px solid #EBEBEB",
        display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap"
      }}>
        <span style={{ fontSize: 9 }}>📎</span>
        <a href={piece.source_link} target="_blank" rel="noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ fontSize: 9, color: "#AAA", textDecoration: "underline" }}>
          {piece.source_name}
        </a>
        <span style={{ fontSize: 9, color: "#CCC" }}>·</span>
        <span style={{ fontSize: 9, color: "#CCC" }}>{piece.source_date}</span>
        <span style={{
          marginLeft: "auto", fontSize: 9, color: "#CCC"
        }}>↻ flip back</span>
      </div>
    </div>
  );
}

// ── Flip card wrapper ──
function FlipCard({ piece }) {
  const [flipped, setFlipped]     = useState(false);
  const [checked, setChecked]     = useState({});

  return (
    <div style={{ perspective: 1100, width: "100%", aspectRatio: "420/580" }}
      onClick={() => setFlipped(f => !f)}>
      <div style={{
        position: "relative", width: "100%", height: "100%",
        transformStyle: "preserve-3d",
        transition: "transform 0.52s cubic-bezier(0.4,0.2,0.2,1)",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0)"
      }}>
        {/* Front */}
        <div style={{
          position: "absolute", inset: 0,
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden"
        }}>
          <CardFront piece={piece}/>
        </div>
        {/* Back */}
        <div style={{
          position: "absolute", inset: 0,
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          transform: "rotateY(180deg)"
        }}>
          <CardBack piece={piece} checkedItems={checked}
            onToggle={i => setChecked(p => ({ ...p, [i]: !p[i] }))}/>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ──
export default function Puzzle4LifeDashboard() {
  const [pieces, setPieces]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [categoryFilter, setCatFilter] = useState("All");
  const [statusFilter, setStFilter]   = useState("All");
  const [view, setView]               = useState("grid");

  useEffect(() => {
    Puzzle4LifePiece.list().then(data => {
      // sort by piece_number ascending
      setPieces([...data].sort((a, b) => (a.piece_number || 0) - (b.piece_number || 0)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = pieces.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !q || [p.title, p.subtitle, p.category, p.source_name]
      .some(f => (f || "").toLowerCase().includes(q));
    const matchC = categoryFilter === "All" || p.category === categoryFilter;
    const matchS = statusFilter === "All" || p.status === statusFilter;
    return matchQ && matchC && matchS;
  });

  const catCounts = {};
  pieces.forEach(p => { catCounts[p.category] = (catCounts[p.category] || 0) + 1; });

  return (
    <div style={{ minHeight: "100vh", background: "#F0F2F8",
      fontFamily: "system-ui,-apple-system,sans-serif" }}>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #4527A0 0%, #7B2D8B 55%, #1565C0 100%)",
        padding: "28px 32px 22px"
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <img src={TEMPLATE_URL} alt="Puzzle4Life"
              style={{ width: 52, height: 52, borderRadius: 12, objectFit: "cover",
                border: "2px solid rgba(255,255,255,0.3)" }}/>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "white", letterSpacing: -0.5 }}>
                Puzzle4Life™
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
                Personal Growth Card Library · {pieces.length} piece{pieces.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { icon: "🧩", val: pieces.length, label: "Total" },
              { icon: "✅", val: pieces.filter(p => p.status === "Approved").length, label: "Approved" },
              { icon: "📋", val: pieces.filter(p => ["Draft","Generated"].includes(p.status)).length, label: "In Review" },
              { icon: "📌", val: pieces.filter(p => p.in_backlog).length, label: "In Backlog" },
            ].map(s => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,0.14)", borderRadius: 10,
                padding: "8px 16px", backdropFilter: "blur(8px)"
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "white" }}>{s.icon} {s.val}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.72)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 32px 0" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span style={{ position: "absolute", left: 11, top: "50%",
              transform: "translateY(-50%)", fontSize: 15, pointerEvents: "none" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search pieces, categories, sources…"
              style={{
                width: "100%", padding: "9px 12px 9px 36px", borderRadius: 10,
                border: "1.5px solid #E0E0E0", fontSize: 13, outline: "none",
                background: "white", boxSizing: "border-box",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
              }}/>
          </div>

          {/* Status */}
          <select value={statusFilter} onChange={e => setStFilter(e.target.value)}
            style={{ padding: "9px 14px", borderRadius: 10, border: "1.5px solid #E0E0E0",
              fontSize: 13, background: "white", outline: "none", cursor: "pointer" }}>
            {["All","Draft","Generated","Reviewed","Approved","Published"].map(s =>
              <option key={s}>{s}</option>)}
          </select>

          {/* View toggle */}
          <div style={{ display: "flex", gap: 3, background: "white", padding: 3,
            borderRadius: 10, border: "1.5px solid #E0E0E0" }}>
            {[["grid","⊞ Grid"], ["list","☰ List"]].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "6px 12px", borderRadius: 7, border: "none",
                background: view === v ? "#4527A0" : "transparent",
                color: view === v ? "white" : "#666",
                cursor: "pointer", fontSize: 12, fontWeight: 600
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap" }}>
          <button onClick={() => setCatFilter("All")} style={{
            padding: "4px 12px", borderRadius: 20, border: "1.5px solid #CCC",
            background: categoryFilter === "All" ? "#4527A0" : "white",
            color: categoryFilter === "All" ? "white" : "#555",
            fontSize: 11, fontWeight: 600, cursor: "pointer"
          }}>All ({pieces.length})</button>

          {CATEGORIES.slice(1).filter(c => catCounts[c]).map(cat => {
            const col = CATEGORY_COLORS[cat];
            const active = categoryFilter === cat;
            return (
              <button key={cat} onClick={() => setCatFilter(active ? "All" : cat)} style={{
                padding: "4px 12px", borderRadius: 20,
                border: `1.5px solid ${col?.bg || "#ccc"}`,
                background: active ? col?.bg : "white",
                color: active ? "white" : col?.text || "#333",
                fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.18s"
              }}>{cat} ({catCounts[cat]})</button>
            );
          })}
        </div>

        <div style={{ fontSize: 11, color: "#999", margin: "10px 0 4px" }}>
          {filtered.length} piece{filtered.length !== 1 ? "s" : ""} shown
          {view === "grid" && " · Click any card to flip and check off activities"}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 32px 70px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: "#888" }}>
            <div style={{ fontSize: 48 }}>🧩</div>
            <div style={{ marginTop: 12, fontSize: 14 }}>Loading your puzzle library…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80, color: "#888" }}>
            <div style={{ fontSize: 48 }}>🔍</div>
            <div style={{ marginTop: 12, fontSize: 14 }}>No pieces match your search.</div>
            <button onClick={() => { setSearch(""); setCatFilter("All"); setStFilter("All"); }}
              style={{ marginTop: 12, padding: "8px 20px", borderRadius: 8,
                border: "1.5px solid #4527A0", background: "white",
                color: "#4527A0", cursor: "pointer", fontWeight: 600 }}>
              Clear filters
            </button>
          </div>
        ) : view === "grid" ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
            gap: 22
          }}>
            {filtered.map(piece => <FlipCard key={piece.id} piece={piece}/>)}
          </div>
        ) : (
          // List view
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(piece => {
              const color = piece.theme_color || CATEGORY_COLORS[piece.category]?.bg || "#4527A0";
              const acts  = getActivities(piece);
              return (
                <div key={piece.id} style={{
                  background: "white", borderRadius: 13,
                  boxShadow: "0 1px 5px rgba(0,0,0,0.07)",
                  display: "flex", overflow: "hidden"
                }}>
                  <div style={{ width: 5, background: color, flexShrink: 0 }}/>
                  <div style={{ padding: "12px 16px", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 22 }}>{piece.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: 13.5, color: "#1A1A2E" }}>
                          #{String(Math.round(piece.piece_number)).padStart(3,"0")} — {piece.title}
                        </span>
                        <div style={{ fontSize: 11, color: "#888", fontStyle: "italic" }}>{piece.subtitle}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <span style={{
                          padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 600,
                          background: CATEGORY_COLORS[piece.category]?.light || "#F3E5F5",
                          color
                        }}>{piece.category}</span>
                        <span style={{
                          padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 600,
                          background: piece.status === "Approved" ? "#E8F5E9"
                            : piece.status === "Published" ? "#E3F2FD" : "#FFF8E1",
                          color: piece.status === "Approved" ? "#2E7D32"
                            : piece.status === "Published" ? "#1565C0" : "#E65100"
                        }}>{piece.status}</span>
                      </div>
                    </div>
                    {acts.length > 0 && (
                      <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {acts.slice(0, 3).map((a, i) => (
                          <span key={i} style={{
                            fontSize: 10.5, color: "#555", background: "#F5F5F5",
                            padding: "3px 8px", borderRadius: 6
                          }}>✦ {a.length > 55 ? a.slice(0, 55) + "…" : a}</span>
                        ))}
                        {acts.length > 3 && (
                          <span style={{ fontSize: 10.5, color: "#AAA" }}>+{acts.length - 3} more</span>
                        )}
                      </div>
                    )}
                    <div style={{ marginTop: 6, fontSize: 9.5, color: "#CCC" }}>
                      📎 {piece.source_name} · {piece.source_date}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
