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
  const [view, setView] = useState("home");
  const [adventures, setAdventures] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  /* ---------- SETTINGS ---------- */
  const [showSettings, setShowSettings] = useState(false);
  const [textSize, setTextSize] = useState("medium");
  const [font, setFont] = useState("serif");
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [voiceGender, setVoiceGender] = useState("female");

  /* ---------- CUSTOM UNIVERSE ---------- */
  const [customStep, setCustomStep] = useState(0);
  const [customUniverse, setCustomUniverse] = useState({
    description: "",
    tone: "",
    magic: "",
    danger: ""
  });
  const [input, setInput] = useState("");

  /* ---------- LOAD ---------- */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("adventures") || "[]");
      if (Array.isArray(saved)) {
        setAdventures(saved);
        if (saved.length > 0) setActiveId(saved[saved.length - 1].id);
      }
    } catch {}
  }, []);

  /* ---------- SAVE ---------- */
  useEffect(() => {
    localStorage.setItem("adventures", JSON.stringify(adventures));
  }, [adventures]);

  const active = adventures.find(a => a.id === activeId) || null;

  /* =====================
     TEXT TO SPEECH
     ===================== */
  function speak(text) {
    if (!ttsEnabled || !window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v =>
      voiceGender === "female"
        ? v.name.toLowerCase().includes("female")
        : v.name.toLowerCase().includes("male")
    );
    if (match) utter.voice = match;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  /* =====================
     CORNER MENU
     ===================== */
  function CornerMenu() {
    return (
      <div style={styles.menu}>
        <button type="button" onClick={() => setView("home")}>Home</button>
        <button type="button" onClick={() => setShowSettings(true)}>Settings</button>
        <button type="button" onClick={() => window.location.href = "about:blank"}>
          Exit
        </button>
      </div>
    );
  }

  /* =====================
     HOME
     ===================== */
  if (view === "home") {
    return (
      <Screen theme={THEMES.dark} textSize={textSize} font={font}>
        <h1>Mythweaver</h1>

        {active && <Button onClick={() => setView("game")}>Continue Last Adventure</Button>}
        <Button onClick={() => setView("new")}>New Adventure</Button>
        <Button onClick={() => setView("load")}>Load Adventure</Button>
        <Button onClick={() => setView("manage")}>Manage Saves</Button>
        <Button subtle onClick={() => setShowSettings(true)}>Settings</Button>

        {showSettings && <Settings />}
      </Screen>
    );
  }

  /* =====================
     NEW ADVENTURE
     ===================== */
  if (view === "new") {
    return (
      <Screen theme={THEMES.dark} textSize={textSize} font={font}>
        <CornerMenu />
        <h2>Create New Adventure</h2>

        {Object.entries(THEMES).map(([key, t]) => (
          <Button key={key} onClick={() => createAdventure(key, t.name)}>
            {t.name}
          </Button>
        ))}

        <Button
          onClick={() => {
            setCustomUniverse({ description: "", tone: "", magic: "", danger: "" });
            setCustomStep(1);
            setInput("");
            setView("custom");
          }}
        >
          Build Custom Universe
        </Button>

        {showSettings && <Settings />}
      </Screen>
    );
  }

  /* =====================
     LOAD
     ===================== */
  if (view === "load") {
    return (
      <Screen theme={THEMES.dark} textSize={textSize} font={font}>
        <CornerMenu />
        <h2>Load Adventure</h2>

        {adventures.length === 0 && <p>No saved adventures.</p>}

        {adventures.map(a => (
          <Button key={a.id} onClick={() => {
            setActiveId(a.id);
            setView("game");
          }}>
            {a.name}
          </Button>
        ))}

        {showSettings && <Settings />}
      </Screen>
    );
  }

  /* =====================
     MANAGE SAVES
     ===================== */
  if (view === "manage") {
    return (
      <Screen theme={THEMES.dark} textSize={textSize} font={font}>
        <CornerMenu />
        <h2>Manage Saves</h2>

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

        {showSettings && <Settings />}
      </Screen>
    );
  }

  /* =====================
     GAME
     ===================== */
  if (view === "game" && active) {
    useEffect(() => {
      speak(active.log[active.log.length - 1]);
    }, [active.log]);

    return (
      <Screen theme={THEMES.dark} textSize={textSize} font={font}>
        <CornerMenu />
        <h2>{active.name}</h2>

        {active.log.map((l, i) => <div key={i}>{l}</div>)}

        <Button onClick={attack}>Attack</Button>

        {showSettings && <Settings />}
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

  function attack() {
    const roll = rollDie(20);
    const dc = 12;
    const success = roll >= dc;
    const updated = {
      ...active,
      log: [...active.log,
        success
          ? `Attack succeeds (${roll} vs DC ${dc}).`
          : `Attack fails (${roll} vs DC ${dc}).`
      ]
    };
    setAdventures(adventures.map(a => a.id === active.id ? updated : a));
  }

  function Settings() {
    return (
      <div style={styles.settings}>
        <h3>Settings</h3>

        <label>Text Size</label>
        <select value={textSize} onChange={e => setTextSize(e.target.value)}>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>

        <label>Font</label>
        <select value={font} onChange={e => setFont(e.target.value)}>
          <option value="serif">Serif</option>
          <option value="sans-serif">Sans</option>
          <option value="monospace">Monospace</option>
        </select>

        <label>
          <input
            type="checkbox"
            checked={ttsEnabled}
            onChange={e => setTtsEnabled(e.target.checked)}
          />
          Enable Text to Audio
        </label>

        {ttsEnabled && (
          <select value={voiceGender} onChange={e => setVoiceGender(e.target.value)}>
            <option value="female">Female Voice</option>
            <option value="male">Male Voice</option>
          </select>
        )}

        <Button onClick={() => setShowSettings(false)}>Close</Button>
      </div>
    );
  }
}

/* =====================
   UI COMPONENTS
   ===================== */

function Screen({ children, theme, textSize, font }) {
  const sizes = { small: 14, medium: 16, large: 18 };
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        background: theme.bg,
        color: "#eee",
        fontFamily: font,
        fontSize: sizes[textSize]
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
        borderRadius: 6
      }}
    >
      {children}
    </button>
  );
}

function ConfirmDelete({ onConfirm, onCancel }) {
  return (
    <div style={styles.confirm}>
      <p>This will permanently delete the save.</p>
      <Button danger onClick={onConfirm}>Confirm Delete</Button>
      <Button subtle onClick={onCancel}>Cancel</Button>
    </div>
  );
}

/* =====================
   STYLES
   ===================== */
const styles = {
  menu: {
    position: "fixed",
    top: 10,
    right: 10,
    display: "flex",
    gap: 6
  },
  settings: {
    background: "#111",
    padding: 16,
    marginTop: 20,
    border: "1px solid #333"
  },
  confirm: {
    background: "#111",
    padding: 16,
    marginTop: 16,
    border: "1px solid #333"
  }
};