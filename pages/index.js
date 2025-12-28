import { useEffect, useState } from "react";

export default function Home() {
  const [view, setView] = useState("menu"); // menu | game
  const [campaigns, setCampaigns] = useState([]);
  const [activeId, setActiveId] = useState(null);

  /* ---------- LOAD ---------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = JSON.parse(localStorage.getItem("campaigns") || "[]");
      if (Array.isArray(saved)) setCampaigns(saved);
    } catch {}
  }, []);

  /* ---------- SAVE ---------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("campaigns", JSON.stringify(campaigns));
  }, [campaigns]);

  /* ---------- SAFE DERIVATION ---------- */
  const active = campaigns.find(c => c.id === activeId) || null;

  /* =====================
     MENU
     ===================== */
  if (view === "menu") {
    return (
      <div style={ui.shell}>
        <h1 style={ui.title}>Mythweaver</h1>

        {campaigns.map(c => (
          <button
            key={c.id}
            style={ui.primary}
            onClick={() => {
              setActiveId(c.id);
              setView("game");
            }}
          >
            {c.name}
          </button>
        ))}

        <button style={ui.primary} onClick={createNewAdventure}>
          New Adventure
        </button>
      </div>
    );
  }

  /* =====================
     GAME
     ===================== */
  if (!active) {
    return (
      <div style={ui.shell}>
        <p>Loading adventure…</p>
      </div>
    );
  }

  return (
    <div style={ui.shell}>
      <div style={ui.status}>
        HP {active.player.hp}/{active.player.maxHp}
      </div>

      <div style={ui.log}>
        {active.log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

      <button
        style={ui.secondary}
        onClick={() => {
          setView("menu");
          setActiveId(null);
        }}
      >
        Save & Exit
      </button>
    </div>
  );

  /* =====================
     NEW ADVENTURE (SAFE)
     ===================== */
  function createNewAdventure() {
    const adventure = {
      id: `adv-${Date.now()}`,
      name: "A Bleak Road",
      log: ["Cold rain falls. You are alone."],
      player: { hp: 12, maxHp: 12 }
    };

    setCampaigns(prev => {
      const next = [...prev, adventure];

      // IMPORTANT: set active AFTER campaigns update
      setTimeout(() => {
        setActiveId(adventure.id);
        setView("game");
      }, 0);

      return next;
    });
  }
}

/* =====================
   UI (MINIMAL & SAFE)
   ===================== */
const ui = {
  shell: {
    background: "#000",
    color: "#eee",
    minHeight: "100vh",
    padding: 20
  },
  title: {
    fontSize: 28,
    marginBottom: 16
  },
  primary: {
    width: "100%",
    padding: 14,
    marginBottom: 10,
    background: "#222",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 16
  },
  secondary: {
    width: "100%",
    padding: 12,
    background: "transparent",
    color: "#aaa",
    border: "1px solid #333",
    borderRadius: 6,
    marginTop: 20
  },
  status: {
    opacity: 0.7,
    marginBottom: 12
  },
  log: {
    lineHeight: 1.5
  }
};