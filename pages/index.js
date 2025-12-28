import { useEffect, useState } from "react";

/* =====================
   UTILITIES
   ===================== */
const rollDie = d => Math.floor(Math.random() * d) + 1;

function groupInventory(items) {
  const groups = {};
  items.forEach(item => {
    const type = item.type || "Misc";
    if (!groups[type]) groups[type] = [];
    groups[type].push(item.name);
  });
  return groups;
}

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
  lovecraftian: {
    name: "Lovecraftian Fantasy",
    bg: "linear-gradient(#020204, #0f1a14)",
    font: "monospace"
  }
};

/* =====================
   DM STAGING
   ===================== */
function dmSetTheStage({ theme, lastAction, world, universe }) {
  const combat =
    lastAction && /attack|fight|strike|kill|charge/i.test(lastAction);

  const text = `
${theme === "lovecraftian"
  ? "Reality feels thin, watched by something vast."
  : "The world responds to your decision."}

${universe?.description || ""}

${lastAction
  ? `Because you chose to "${lastAction}", events unfold.`
  : "Your journey begins at the edge of the unknown."}
`.trim();

  return { text, mode: combat ? "combat" : "narrative" };
}

/* =====================
   MAIN APP
   ===================== */
export default function Home() {
  const [view, setView] = useState("home");
  const [adventures, setAdventures] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const [panel, setPanel] = useState("log");
  const [mode, setMode] = useState("narrative");
  const [playerInput, setPlayerInput] = useState("");

  /* MENU + SETTINGS */
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [textSize, setTextSize] = useState("medium");
  const [font, setFont] = useState("serif");

  /* LOAD */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("adventures") || "[]");
      const settings = JSON.parse(localStorage.getItem("settings") || "{}");

      if (Array.isArray(saved)) {
        setAdventures(saved);
        if (saved.length) setActiveId(saved[saved.length - 1].id);
      }

      if (settings.textSize) setTextSize(settings.textSize);
      if (settings.font) setFont(settings.font);
    } catch {}
  }, []);

  /* AUTO-SAVE (EVERY CHANGE) */
  useEffect(() => {
    localStorage.setItem("adventures", JSON.stringify(adventures));
  }, [adventures]);

  useEffect(() => {
    localStorage.setItem("settings", JSON.stringify({ textSize, font }));
  }, [textSize, font]);

  const active = adventures.find(a => a.id === activeId) || null;

  /* =====================
     HOME
     ===================== */
  if (view === "home") {
    return (
      <Screen theme={THEMES.dark} font={font} textSize={textSize}>
        <h1>Mythweaver</h1>

        {active && <Button onClick={() => setView("game")}>Continue</Button>}
        <Button onClick={() => setView("new")}>New Adventure</Button>
        <Button onClick={() => setView("load")}>Load Adventure</Button>
        <Button subtle onClick={() => setShowSettings(true)}>Settings</Button>

        {showSettings && <Settings />}
      </Screen>
    );
  }

  /* =====================
     GAME
     ===================== */
  if (view === "game" && active) {
    const inventoryGroups = groupInventory(active.inventory || []);

    return (
      <Screen theme={THEMES[active.theme]} font={font} textSize={textSize}>
        {/* CORNER MENU */}
        <CornerMenu
          open={menuOpen}
          toggle={() => setMenuOpen(o => !o)}
          onSave={() => {
            localStorage.setItem("adventures", JSON.stringify(adventures));
            setMenuOpen(false);
          }}
          onHome={() => setView("home")}
          onSettings={() => setShowSettings(true)}
          onExit={() => setView("home")}
        />

        <h2>{active.name}</h2>

        {/* PANEL SWITCHER */}
        <div style={{ display: "flex", gap: 6 }}>
          <Button onClick={() => setPanel("log")}>Story</Button>
          <Button onClick={() => setPanel("character")}>Character</Button>
          <Button onClick={() => setPanel("inventory")}>Inventory</Button>
        </div>

        {/* STORY PANEL */}
        {panel === "log" && (
          <>
            {active.log.map((l, i) => <p key={i}>{l}</p>)}

            <textarea
              value={playerInput}
              onChange={e => setPlayerInput(e.target.value)}
              placeholder="What do you do next?"
              style={styles.textarea}
            />

            <Button onClick={handleAction}>Continue</Button>
          </>
        )}

        {/* INVENTORY PANEL (SORTED BY TYPE) */}
        {panel === "inventory" && (
          <>
            {Object.keys(inventoryGroups).length === 0 && <p>Inventory is empty.</p>}
            {Object.entries(inventoryGroups).map(([type, items]) => (
              <div key={type}>
                <h4>{type}</h4>
                <ul>
                  {items.map((name, i) => <li key={i}>{name}</li>)}
                </ul>
              </div>
            ))}
          </>
        )}

        {/* COMBAT */}
        {mode === "combat" && <Button onClick={attack}>Attack</Button>}

        {showSettings && <Settings />}
      </Screen>
    );
  }

  return null;

  /* =====================
     LOGIC
     ===================== */
  function handleAction() {
    if (!playerInput.trim()) return;

    const dm = dmSetTheStage({
      theme: active.theme,
      lastAction: playerInput,
      world: active.world,
      universe: active.universe
    });

    const updated = {
      ...active,
      log: [...active.log, `You: ${playerInput}`, dm.text]
    };

    setMode(dm.mode);
    setPlayerInput("");
    setAdventures(adventures.map(a => a.id === active.id ? updated : a));
  }

  function attack() {
    const roll = rollDie(20);

    const updated = {
      ...active,
      log: [...active.log, `You attack (roll ${roll}).`]
    };

    setMode("narrative");
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

        <Button onClick={() => setShowSettings(false)}>Close</Button>
      </div>
    );
  }
}

/* =====================
   UI COMPONENTS
   ===================== */
function Screen({ children, theme, font, textSize }) {
  const sizes = { small: 14, medium: 16, large: 18 };
  return (
    <div style={{
      minHeight: "100vh",
      padding: 24,
      background: theme.bg,
      color: "#eee",
      fontFamily: font,
      fontSize: sizes[textSize]
    }}>
      {children}
    </div>
  );
}

function CornerMenu({ open, toggle, onSave, onHome, onSettings, onExit }) {
  return (
    <div style={{ position: "absolute", top: 10, right: 10 }}>
      <button onClick={toggle}>☰</button>
      {open && (
        <div style={styles.menu}>
          <Button onClick={onSave}>Manual Save</Button>
          <Button onClick={onHome}>Return Home</Button>
          <Button onClick={onSettings}>Settings</Button>
          <Button onClick={onExit}>Exit Game</Button>
        </div>
      )}
    </div>
  );
}

function Button({ children, onClick, subtle }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: 10,
        marginTop: 6,
        background: subtle ? "transparent" : "#222",
        color: "#fff",
        border: subtle ? "1px solid #333" : "none",
        borderRadius: 6
      }}
    >
      {children}
    </button>
  );
}

/* =====================
   STYLES
   ===================== */
const styles = {
  textarea: {
    width: "100%",
    minHeight: 80,
    padding: 10,
    marginTop: 8,
    background: "#111",
    color: "#eee",
    border: "1px solid #333",
    borderRadius: 6
  },
  settings: {
    background: "#111",
    padding: 16,
    marginTop: 16,
    border: "1px solid #333"
  },
  menu: {
    background: "#111",
    padding: 10,
    border: "1px solid #333",
    marginTop: 6
  }
};