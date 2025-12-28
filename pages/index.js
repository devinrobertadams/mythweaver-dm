import { useEffect, useState } from "react";

/* =====================
   UTILITIES
   ===================== */
const rollDie = d => Math.floor(Math.random() * d) + 1;

/* =====================
   BASE THEMES
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
  lovecraftian: {
    name: "Lovecraftian Fantasy",
    bg: "linear-gradient(#020204, #0f1a14)",
    font: "monospace"
  }
};

export default function Home() {
  const [view, setView] = useState("home"); // home | new | custom | load | manage | game
  const [adventures, setAdventures] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  /* ---------- Custom Universe Builder ---------- */
  const [customStep, setCustomStep] = useState(0);
  const [customUniverse, setCustomUniverse] = useState({
    tone: "",
    magic: "",
    danger: ""
  });

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
          <Button key={key} onClick={() => createAdventure(key, t.name)}>
            {t.name}
          </Button>
        ))}

        <Button
          onClick={() => {
            setCustomUniverse({ tone: "", magic: "", danger: "" });
            setCustomStep(1);
            setView("custom");
          }}
        >
          Build Custom Universe
        </Button>

        <Button subtle onClick={() => setView("home")}>
          Back
        </Button>
      </Screen>
    );
  }

  /* =====================
     CUSTOM UNIVERSE BUILDER
     ===================== */
  if (view === "custom") {
    return (
      <Screen theme={THEMES.dark}>
        <h2>Design Your Universe</h2>

        {customStep === 1 && (
          <>
            <p>What is the tone of your world?</p>
            <Button onClick={() => nextCustom("tone", "Hopeful")}>Hopeful</Button>
            <Button onClick={() => nextCustom("tone", "Grim")}>Grim</Button>
            <Button onClick={() => nextCustom("tone", "Bleak")}>Bleak</Button>
          </>
        )}

        {customStep === 2 && (
          <>
            <p>How does magic exist?</p>
            <Button onClick={() => nextCustom("magic", "Common")}>Common</Button>
            <Button onClick={() => nextCustom("magic", "Rare")}>Rare</Button>
            <Button onClick={() => nextCustom("magic", "Forbidden")}>Forbidden</Button>
          </>
        )}

        {customStep === 3 && (
          <>
            <p>How dangerous is the world?</p>
            <Button onClick={() => nextCustom("danger", "Perilous")}>Perilous</Button>
            <Button onClick={() => nextCustom("danger", "Deadly")}>Deadly</Button>
            <Button onClick={() => nextCustom("danger", "Apocalyptic")}>Apocalyptic</Button>
          </>
        )}

        {customStep === 4 && (
          <>
            <p>Your universe takes shape…</p>
            <Button onClick={createCustomAdventure}>
              Begin Adventure
            </Button>
          </>
        )}

        <Button subtle onClick={() => setView("new")}>
          Back
        </Button>
      </Screen>
    );
  }

  /* =====================
     LOAD
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
          <Button danger key={a.id} onClick={() => setConfirmDelete(a.id)}>
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
    const theme = THEMES[active.theme] || THEMES.dark;

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
  function createAdventure(themeKey, name) {
    const adv = {
      id: `adv-${Date.now()}`,
      name,
      theme: themeKey,
      log: ["The world stirs as your journey begins."]
    };

    setAdventures(prev => [...prev, adv]);
    setActiveId(adv.id);
    setView("game");
  }

  function nextCustom(key, value) {
    setCustomUniverse(prev => ({ ...prev, [key]: value }));
    setCustomStep(s => s + 1);
  }

  function createCustomAdventure() {
    const description = `A ${customUniverse.tone.toLowerCase()} world where magic is ${customUniverse.magic.toLowerCase()} and danger is ${customUniverse.danger.toLowerCase()}.`;

    const adv = {
      id: `adv-${Date.now()}`,
      name: "A Custom Realm",
      theme: "dark",
      log: [
        description,
        "Your journey begins at the edge of the unknown."
      ]
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
      type="button"
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