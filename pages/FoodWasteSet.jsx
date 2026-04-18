import { useState, useEffect } from "react";

const PIECES = [
  {
    id: 1,
    icon: "🛒",
    title: "Smart Shopping",
    subtitle: "Plan before you buy",
    color: "#2E7D32",
    light: "#E8F5E9",
    actions: [
      "Plan 3 meals before shopping",
      "Check fridge before buying",
      "Stick to a grocery list",
      "Buy only what you need this week",
    ],
    star: "Avoid buying duplicates → save $10–20/week",
    heart: "Reduces overproduction and food waste",
  },
  {
    id: 2,
    icon: "🧺",
    title: "Proper Storage",
    subtitle: "Keep food fresh longer",
    color: "#1565C0",
    light: "#E3F2FD",
    actions: [
      "Store greens in airtight containers",
      "Keep herbs in water jars",
      "Separate ethylene-producing fruits",
      "Label containers with dates",
    ],
    star: "Food lasts longer → fewer replacements",
    heart: "Less food sent to landfill",
  },
  {
    id: 3,
    icon: "🥕",
    title: "Eat Me First Zone",
    subtitle: "Use what's already there",
    color: "#E65100",
    light: "#FFF3E0",
    actions: [
      "Create a visible 'eat first' section in fridge",
      "Move older items to the front",
      "Check it daily before cooking",
    ],
    star: "Use what you already bought",
    heart: "Prevents forgotten food from going to waste",
  },
  {
    id: 4,
    icon: "🍲",
    title: "Leftover Magic",
    subtitle: "Transform, don't toss",
    color: "#6A1B9A",
    light: "#F3E5F5",
    actions: [
      "Turn leftovers into new meals",
      "Freeze extras for later",
      "Label leftovers with date",
      "Try one leftover recipe this week",
    ],
    star: "Replace takeout with leftovers → save $15–30/week",
    heart: "Reduces unnecessary food production",
  },
  {
    id: 5,
    icon: "🪱",
    title: "Compost Scraps",
    subtitle: "Feed the soil, not the landfill",
    color: "#558B2F",
    light: "#F1F8E9",
    actions: [
      "Collect food scraps daily",
      "Start a compost bin or Wormspire",
      "Avoid composting meat/dairy (basic)",
      "Use finished compost in your garden",
    ],
    star: "Reduce trash + create free fertilizer",
    heart: "Cuts methane emissions from landfills",
  },
  {
    id: 6,
    icon: "📊",
    title: "Waste Awareness",
    subtitle: "Track it to change it",
    color: "#00838F",
    light: "#E0F7FA",
    actions: [
      "Track what you throw away for 3 days",
      "Identify top 3 wasted items",
      "Adjust buying habits accordingly",
      "Set a weekly waste reduction goal",
    ],
    star: "Identify money leaks → save $5–15/week",
    heart: "Builds conscious consumption habits",
  },
  {
    id: 7,
    icon: "🤝",
    title: "Share & Donate",
    subtitle: "Give food a second life",
    color: "#C62828",
    light: "#FFEBEE",
    actions: [
      "Share extra food with neighbors",
      "Donate unopened items to food banks",
      "Use local food-sharing apps",
      "Offer surplus produce from your garden",
    ],
    star: "Community value + reduce waste guilt",
    heart: "Supports people + reduces food waste",
  },
];

const STAR_PIECE = {
  id: "star",
  icon: "⭐",
  title: "Weekly Win",
  subtitle: "You saved money this week",
  color: "#F9A825",
  light: "#FFFDE7",
};

const HEART_PIECE = {
  id: "heart",
  icon: "❤️",
  title: "Planet Love",
  subtitle: "Your impact matters",
  color: "#E91E63",
  light: "#FCE4EC",
};

// Honeycomb hex positions (col, row) for 7 pieces + star + heart
// Layout: row0: 3 pieces, row1: 2 pieces, row2: 2 pieces + star+heart flanking
const HEX_LAYOUT = [
  { id: 1, x: 0, y: 0 },
  { id: 2, x: 1, y: 0 },
  { id: 3, x: 2, y: 0 },
  { id: 4, x: 0.5, y: 1 },
  { id: 5, x: 1.5, y: 1 },
  { id: 6, x: 0, y: 2 },
  { id: 7, x: 1, y: 2 },
  { id: "star", x: 2, y: 2 },
  { id: "heart", x: 0.5, y: 3 },
];

function HexPiece({ piece, completed, partial, onClick, size = 120 }) {
  const [hovered, setHovered] = useState(false);
  const isStar = piece.id === "star";
  const isHeart = piece.id === "heart";
  const isSpecial = isStar || isHeart;

  const hw = size;
  const hh = size * 1.15;
  const cx = hw / 2;
  const cy = hh / 2;
  const r = hw * 0.46;

  // Hex points
  const pts = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(" ");

  const scale = hovered ? 1.07 : 1;
  const glowColor = completed ? piece.color : "transparent";

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: "pointer",
        transform: `scale(${scale})`,
        transition: "transform 0.2s ease, filter 0.2s ease",
        filter: hovered ? `drop-shadow(0 6px 16px ${piece.color}55)` : completed ? `drop-shadow(0 4px 10px ${piece.color}44)` : "drop-shadow(0 2px 6px rgba(0,0,0,0.15))",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <svg width={hw} height={hh} viewBox={`0 0 ${hw} ${hh}`}>
        <defs>
          <linearGradient id={`hg-${piece.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={completed ? piece.color : isSpecial ? piece.color : "#f8f8f8"} />
            <stop offset="100%" stopColor={completed ? piece.color + "cc" : isSpecial ? piece.color + "bb" : "#efefef"} />
          </linearGradient>
          <clipPath id={`hclip-${piece.id}`}>
            <polygon points={pts} />
          </clipPath>
        </defs>

        {/* Hex fill */}
        <polygon
          points={pts}
          fill={`url(#hg-${piece.id})`}
          stroke={completed || isSpecial ? piece.color : "#ddd"}
          strokeWidth={completed ? 2.5 : 1.5}
        />

        {/* Partial progress ring */}
        {partial > 0 && !completed && (
          <polygon
            points={pts}
            fill="none"
            stroke={piece.color}
            strokeWidth="3"
            strokeDasharray={`${partial * 2.5} 999`}
            opacity="0.5"
          />
        )}

        {/* Icon */}
        <text
          x={cx}
          y={cy - (isSpecial ? 2 : 6)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.28}
        >
          {piece.icon}
        </text>

        {/* Title */}
        <text
          x={cx}
          y={cy + size * 0.22}
          textAnchor="middle"
          fontSize={size * 0.095}
          fontWeight="700"
          fill={completed || isSpecial ? "white" : "#333"}
          fontFamily="system-ui, sans-serif"
        >
          {piece.title.split(" ").slice(0, 2).join(" ")}
        </text>
        {piece.title.split(" ").length > 2 && (
          <text
            x={cx}
            y={cy + size * 0.33}
            textAnchor="middle"
            fontSize={size * 0.09}
            fontWeight="700"
            fill={completed || isSpecial ? "white" : "#333"}
            fontFamily="system-ui, sans-serif"
          >
            {piece.title.split(" ").slice(2).join(" ")}
          </text>
        )}

        {/* Completed checkmark */}
        {completed && (
          <text x={cx + r * 0.55} y={cy - r * 0.55} textAnchor="middle" fontSize={size * 0.2}>✅</text>
        )}
      </svg>
    </div>
  );
}

function Modal({ piece, checked, onToggle, onClose, completed }) {
  if (!piece || piece.id === "star" || piece.id === "heart") return null;
  const done = checked.filter(Boolean).length;
  const total = piece.actions.length;
  const pct = Math.round((done / total) * 100);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "16px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "white", borderRadius: "24px", maxWidth: "440px",
          width: "100%", overflow: "hidden",
          boxShadow: `0 20px 60px ${piece.color}44`,
          animation: "popIn 0.25s ease",
        }}
      >
        {/* Header */}
        <div style={{ background: piece.color, padding: "24px", position: "relative" }}>
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 14, right: 14,
              background: "rgba(255,255,255,0.25)", border: "none",
              borderRadius: "50%", width: 30, height: 30, cursor: "pointer",
              color: "white", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >×</button>
          <div style={{ fontSize: 44, marginBottom: 8 }}>{piece.icon}</div>
          <div style={{ color: "white", fontSize: 22, fontWeight: 800, fontFamily: "system-ui" }}>{piece.title}</div>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 }}>{piece.subtitle}</div>

          {/* Progress bar */}
          <div style={{ marginTop: 14, background: "rgba(255,255,255,0.2)", borderRadius: 8, height: 8 }}>
            <div style={{
              background: "white", height: 8, borderRadius: 8,
              width: `${pct}%`, transition: "width 0.4s ease",
            }} />
          </div>
          <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 11, marginTop: 5 }}>
            {done}/{total} actions completed · {pct}%
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#999", letterSpacing: 1, marginBottom: 12 }}>
            MICRO ACTIONS
          </div>
          {piece.actions.map((action, i) => (
            <label key={i} style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              marginBottom: 12, cursor: "pointer",
              padding: "10px 12px", borderRadius: 10,
              background: checked[i] ? piece.light : "#fafafa",
              border: `1px solid ${checked[i] ? piece.color + "44" : "#eee"}`,
              transition: "all 0.2s",
            }}>
              <input
                type="checkbox"
                checked={!!checked[i]}
                onChange={() => onToggle(i)}
                style={{ marginTop: 1, accentColor: piece.color, width: 16, height: 16 }}
              />
              <span style={{
                fontSize: 13.5, color: checked[i] ? "#555" : "#333",
                textDecoration: checked[i] ? "line-through" : "none",
                fontFamily: "system-ui",
              }}>{action}</span>
            </label>
          ))}

          {/* Benefits */}
          <div style={{
            marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10
          }}>
            <div style={{
              background: "#FFFDE7", borderRadius: 12, padding: "12px",
              border: "1px solid #F9A82522"
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>⭐</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#F9A825", letterSpacing: 0.8 }}>SAVE MONEY</div>
              <div style={{ fontSize: 11.5, color: "#555", marginTop: 4, lineHeight: 1.4 }}>{piece.star}</div>
            </div>
            <div style={{
              background: "#FCE4EC", borderRadius: 12, padding: "12px",
              border: "1px solid #E91E6322"
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>❤️</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#E91E63", letterSpacing: 0.8 }}>PLANET IMPACT</div>
              <div style={{ fontSize: 11.5, color: "#555", marginTop: 4, lineHeight: 1.4 }}>{piece.heart}</div>
            </div>
          </div>

          {completed && (
            <div style={{
              marginTop: 16, textAlign: "center", padding: "14px",
              background: piece.light, borderRadius: 14,
              border: `2px solid ${piece.color}44`,
              animation: "popIn 0.3s ease",
            }}>
              <div style={{ fontSize: 28 }}>🏅</div>
              <div style={{ fontWeight: 800, color: piece.color, fontSize: 14 }}>Piece Completed!</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>You're 1% better for the planet 🌍</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FoodWasteSet() {
  const [checks, setChecks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fw_checks") || "{}");
    } catch { return {}; }
  });
  const [active, setActive] = useState(null);
  const [celebrated, setCelebrated] = useState(false);
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    localStorage.setItem("fw_checks", JSON.stringify(checks));
    // Check if all 7 completed
    const allDone = PIECES.every(p => {
      const c = checks[p.id] || [];
      return c.filter(Boolean).length === p.actions.length;
    });
    if (allDone && !celebrated) {
      setCelebrated(true);
      launchConfetti();
    }
  }, [checks]);

  const launchConfetti = () => {
    const pieces = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: ["#2E7D32", "#E65100", "#1565C0", "#6A1B9A", "#558B2F", "#00838F", "#C62828", "#F9A825"][Math.floor(Math.random() * 8)],
      size: Math.random() * 8 + 5,
      delay: Math.random() * 1.5,
    }));
    setConfetti(pieces);
    setTimeout(() => setConfetti([]), 4000);
  };

  const toggleCheck = (pieceId, actionIdx) => {
    setChecks(prev => {
      const curr = [...(prev[pieceId] || [])];
      curr[actionIdx] = !curr[actionIdx];
      return { ...prev, [pieceId]: curr };
    });
  };

  const isPieceCompleted = (piece) => {
    const c = checks[piece.id] || [];
    return c.filter(Boolean).length === piece.actions.length;
  };

  const pieceProgress = (piece) => {
    const c = checks[piece.id] || [];
    return c.filter(Boolean).length;
  };

  const completedCount = PIECES.filter(isPieceCompleted).length;
  const allDone = completedCount === 7;

  const activePiece = active ? PIECES.find(p => p.id === active) : null;
  const activeChecks = activePiece ? (checks[activePiece.id] || []) : [];

  const resetAll = () => {
    setChecks({});
    setCelebrated(false);
    setConfetti([]);
  };

  // Responsive hex size
  const hexSize = typeof window !== "undefined" && window.innerWidth < 480 ? 90 : 120;
  const gap = hexSize * 0.08;
  const colW = hexSize;
  const rowH = hexSize * 0.88;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #E8F5E9 0%, #FFF8E1 50%, #E3F2FD 100%)", fontFamily: "system-ui, sans-serif" }}>
      <style>{`
        @keyframes popIn {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

      {/* Confetti */}
      {confetti.map(c => (
        <div key={c.id} style={{
          position: "fixed", top: 0, left: `${c.x}%`, zIndex: 2000,
          width: c.size, height: c.size, borderRadius: "2px",
          background: c.color, animation: `fall ${2 + c.delay}s ease forwards`,
          animationDelay: `${c.delay * 0.3}s`,
        }} />
      ))}

      {/* Header */}
      <div style={{ textAlign: "center", padding: "32px 20px 16px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#558B2F", letterSpacing: 2, marginBottom: 6 }}>
          PUZZLE4LIFE™ · CLIMATE ACTION SET
        </div>
        <h1 style={{ fontSize: "clamp(22px, 5vw, 36px)", fontWeight: 900, color: "#1B5E20", margin: "0 0 8px" }}>
          🌍 Food Waste – 1% Better Action Set
        </h1>
        <p style={{ fontSize: 14, color: "#555", maxWidth: 480, margin: "0 auto 20px" }}>
          Complete all 7 pieces to reduce waste and make a real impact. One tiny action at a time.
        </p>

        {/* Overall progress */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "white", borderRadius: 50, padding: "10px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>
            {completedCount}/7 pieces completed
          </div>
          <div style={{ width: 120, height: 8, background: "#eee", borderRadius: 8 }}>
            <div style={{
              height: 8, borderRadius: 8, background: "linear-gradient(90deg, #2E7D32, #558B2F)",
              width: `${(completedCount / 7) * 100}%`, transition: "width 0.5s ease",
            }} />
          </div>
          {allDone && <span style={{ fontSize: 18 }}>🏆</span>}
        </div>
      </div>

      {/* All Done Banner */}
      {allDone && (
        <div style={{
          margin: "0 auto 24px", maxWidth: 500, padding: "20px 24px",
          background: "linear-gradient(135deg, #2E7D32, #558B2F)",
          borderRadius: 20, textAlign: "center", color: "white",
          animation: "pulse 2s infinite", boxShadow: "0 8px 30px #2E7D3244",
          marginLeft: 20, marginRight: 20,
        }}>
          <div style={{ fontSize: 36 }}>🌱</div>
          <div style={{ fontSize: 20, fontWeight: 900, marginTop: 6 }}>You are a Food Waste Hero!</div>
          <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>You completed all 7 pieces. The planet thanks you 🌍</div>
          <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: "Food Waste Hero!", text: "I'm 1% better for the planet today 🌍 #OnePercentBetterForThePlanet #Puzzle4Life", url: window.location.href });
                } else {
                  navigator.clipboard?.writeText("I'm 1% better for the planet today 🌍 #OnePercentBetterForThePlanet #Puzzle4Life");
                  alert("Copied to clipboard!");
                }
              }}
              style={{ background: "white", color: "#2E7D32", border: "none", borderRadius: 20, padding: "8px 18px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
            >
              📤 Share My Win
            </button>
            <button
              onClick={resetAll}
              style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 20, padding: "8px 18px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
            >
              🔄 Reset & Replay
            </button>
          </div>
        </div>
      )}

      {/* Honeycomb grid */}
      <div style={{ display: "flex", justifyContent: "center", padding: "0 20px 20px" }}>
        <div style={{ position: "relative", width: 4 * colW + 3 * gap, height: 5 * rowH }}>
          {HEX_LAYOUT.map(({ id, x, y }) => {
            const piece = id === "star" ? STAR_PIECE : id === "heart" ? HEART_PIECE : PIECES.find(p => p.id === id);
            if (!piece) return null;
            const isRegular = typeof id === "number";
            const completed = isRegular ? isPieceCompleted(piece) : false;
            const partial = isRegular ? pieceProgress(piece) : 0;
            const left = x * (colW + gap);
            const top = y * (rowH + gap * 0.5);
            return (
              <div
                key={id}
                style={{ position: "absolute", left, top }}
              >
                <HexPiece
                  piece={piece}
                  completed={completed}
                  partial={partial}
                  onClick={() => isRegular && setActive(id)}
                  size={hexSize}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ textAlign: "center", padding: "0 20px 16px", display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#666" }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: "#ddd", border: "1px solid #ccc" }} />
          Not started
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#666" }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: "#558B2F" }} />
          Completed ✅
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#666" }}>
          <span>⭐</span> Saves money
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#666" }}>
          <span>❤️</span> Planet impact
        </div>
      </div>

      {/* Daily reminder */}
      <div style={{ textAlign: "center", padding: "12px 20px 40px" }}>
        <div style={{
          display: "inline-block", background: "white", borderRadius: 20,
          padding: "10px 20px", fontSize: 13, color: "#555",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          🌍 Do one tiny thing today · <strong>#OnePercentBetterForThePlanet</strong>
        </div>
        {!allDone && (
          <div style={{ marginTop: 12 }}>
            <button
              onClick={resetAll}
              style={{ background: "transparent", border: "1px solid #ccc", borderRadius: 16, padding: "6px 14px", fontSize: 12, color: "#888", cursor: "pointer" }}
            >
              🔄 Reset progress
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {active && (
        <Modal
          piece={activePiece}
          checked={activeChecks}
          onToggle={(i) => toggleCheck(active, i)}
          onClose={() => setActive(null)}
          completed={activePiece && isPieceCompleted(activePiece)}
        />
      )}
    </div>
  );
}
