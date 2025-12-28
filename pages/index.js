import { useEffect, useState } from "react";

/* =====================
   UTILITIES
   ===================== */
const rollDie = d => Math.floor(Math.random() * d) + 1;

/* =====================
   THEMES
   ===================== */
const THEMES = {
  dark: {
    name: "Dark Fantasy",
    bg: "linear-gradient(#050505, #120a0a)",
    font: "serif"
  },
  high: {
    name: "High Fantasy",
    bg: "linear-gradient(#0b132b, #1c2541)",
    font: "serif"
  },
  eldritch: {
    name: "Eldritch Horror",
    bg: "linear-gradient(#020204, #0f1a14)",
    font: "monospace"
  }
};

export default function Home() {
  const [view, setView] = useState("home"); // home | new | load | manage | game
  const [adventures, setAdventures] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  /* ---------- LOAD ---------- */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("adventures") || "[]");
      if (Array.isArray(saved)) {
        setAdventures(saved);
        if (saved.length > 0) {
          setActiveId(saved[saved.length - 1].id);
        }
      }
    } catch {}
  }, []);

  /* ---------- SAVE ---------- */
  useEffect(() => {
    localStorage.setItem("adventures", JSON.stringify(adventures));
  }, [adventures]);

  const active = adventures.find(a => a.id === activeId) || null;

  /* =====================
     HOME
     ===================== */
  if (view === "home") {
    return (
      <Screen theme={THEMES.dark}>
        <h1>Mythweaver</h1>

        {active && (
          <Button onClick={() => setView("game")}>
            Continue Last Adventure
          </Button>
        )}

        <Button onClick={() => setView("new")}>
          New Adventure
        </Button>

        <Button onClick={() => setView("load")}>
          Load Adventure
        </Button>

        <Button subtle onClick={() => setView("manage")}>
          Manage Saves
        </Button>
      </Screen>
    );
  }

  /* =====================
     NEW ADVENTURE
     ===================== */
  if (view === "new") {
    return (
      <Screen theme={THEMES.dark}>
        <h2>Create New Adventure</h2>

        {Object.entries(THEMES).map(([key, t]) => (
          <Button
            key={key}
            onClick={() => createAdventure(key)}
          >
            New {t.name} Universe
          </Button>
        ))}

        <Button subtle onClick={() => setView("home")}>
          Back
        </Button>
      </Screen>
    );
  }

  /* =====================
     LOAD ADVENTURE
     ===================== */
  if (view === "load") {
    return (
      <Screen theme={THEMES.dark}>
        <h2>Load Adventure</h2>

        {adventures.length === 0 && <p>No saved adventures.</p>}

        {adventures.map(a => (
          <Button
            key={a.id}
            onClick={() => {
              setActiveId(a.id);
              setView("game");
            }}
          >
            {a.name}
          </Button>
        ))}

        <Button subtle onClick={() => setView("home")}>
          Back
        </Button>
      </Screen>
    );
  }

  /* =====================
     MANAGE SAVES
     ===================== */
  if (view === "manage") {
    return (
      <Screen theme={THEMES.dark}>
        <h2>Manage Saves</h2>

        {adventures.length === 0 && <p>No saved adventures.</p>}

        {adventures.map(a => (
          <Button
            danger
            key={a.id}
            onClick={() => setConfirmDelete(a.id)}
          >
            Delete {a.name}
          </Button>
        ))}

        {confirmDelete && (
          <ConfirmDelete
            onConfirm={() => {
              setAdventures(adventures.filter(a => a.id !== confirmDelete));
              if (confirmDelete === activeId) setActiveId(null);
              setConfirmDelete(null);
            }}
            onCancel={() => setConfirmDelete(null)}
          />
        )}

        <Button subtle onClick={() => setView("home")}>
          Back
        </Button>
      </Screen>
    );
  }

  /* =====================
     GAME
     ===================== */
  if (view === "game" && active) {
    const theme = THEMES[active.theme];

    return (
      <Screen theme={theme}>
        <h2>{active.name}</h2>

        <div style={{ marginBottom: 16 }}>
          {active.log.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>

        <Button onClick={() => attack()}>
          Attack
        </Button>

        <Button subtle onClick={() => setView("home")}>
          Save & Exit
        </Button>
      </Screen>
    );
  }

  return null;

  /* =====================
     LOGIC
     ===================== */
  function createAdventure(theme) {
    const adv = {
      id: `adv-${Date.now()}`,
      name: "A New Beginning",
      theme,
      log: ["The world stirs as your journey begins."]
    };

    setAdventures(prev => [...prev, adv]);
    setActiveId(adv.id);
    setView("game");
  }

  function attack() {
    const roll = rollDie(20);
    const dc = 12;
    const success = roll >= dc;

    const updated = {
      ...active,
      log: [
        ...active.log,
        success
          ? `Attack succeeds (${roll} vs DC ${dc}).`
          : `Attack fails (${roll} vs DC ${dc}).`
      ]
    };

    setAdventures(adventures.map(a => (a.id === active.id ? updated : a)));
  }
}

/* =====================
   UI COMPONENTS
   ===================== */

function Screen({ children, theme }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        background: theme.bg,
        color: "#eee",
        fontFamily: theme.font
      }}
    >
      {children}
    </div>
  );
}

function Button({ children, onClick, subtle, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: 14,
        marginTop: 10,
        background: danger ? "#400" : subtle ? "transparent" : "#222",
        color: "#fff",
        border: subtle ? "1px solid #333" : "none",
        borderRadius: 6,
        fontSize: 16
      }}
    >
      {children}
    </button>
  );
}

function ConfirmDelete({ onConfirm, onCancel }) {
  return (
    <div
      style={{
        background: "#111",
        padding: 16,
        marginTop: 16,
        border: "1px solid #333"
      }}
    >
      <p>This will permanently delete the save.</p>
      <Button danger onClick={onConfirm}>Confirm Delete</Button>
      <Button subtle onClick={onCancel}>Cancel</Button>
    </div>
  );
}