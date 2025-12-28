import { useEffect, useState } from "react";

/* =====================
   UTILITIES
   ===================== */
const rollDie = d => Math.floor(Math.random() * d) + 1;

function groupInventory(items = []) {
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
   RICH DM NARRATION ENGINE
   ===================== */
function dmNarrate({ theme, universe, tension = 0 }) {
  const sensory = [
    "The air hangs heavy, thick with unspoken tension.",
    "Shadows shift subtly, refusing to remain still.",
    "The silence here feels deliberate, as though listening.",
    "A faint sound echoes from somewhere unseen.",
    "The ground beneath you bears signs of long-forgotten events."
  ];

  const developments = [
    "You become aware of details previously hidden from view.",
    "Something in this place reacts to your presence.",
    "The situation grows more complicated the longer you linger.",
    "Clues suggest forces at work beyond the obvious.",
    "The environment hints at both danger and opportunity."
  ];

  const hooks = [
    "A choice presents itself, though its consequences are unclear.",
    "Something nearby may reward closer inspection.",
    "You sense that hesitation could be costly.",
    "A path forward opens — or perhaps a trap.",
    "The moment feels poised on the edge of change."
  ];

  const themeFlavor =
    theme === "lovecraftian"
      ? "Reality itself feels fragile, strained by incomprehensible forces."
      : theme === "dark"
      ? "This land bears the scars of cruelty and forgotten violence."
      : "Hope and peril coexist uneasily in this realm.";

  const enterCombat = tension > 30 || Math.random() < 0.25;

  const text = `
${themeFlavor}

${universe?.description ? universe.description + "\n" : ""}

${sensory[Math.floor(Math.random() * sensory.length)]}

${developments[Math.floor(Math.random() * developments.length)]}

${hooks[Math.floor(Math.random() * hooks.length)]}
`.trim();

  return { text, mode: enterCombat ? "combat" : "narrative" };
}

/* =====================
   MAIN APP
   ===================== */
export default function Home() {
  const [view, setView] = useState("home"); // home | new | custom | load | game
  const [adventures, setAdventures] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const [campaignName, setCampaignName] = useState("");
  const [customInput, setCustomInput] = useState("");

  const [panel, setPanel] = useState("log"); // log | character | inventory
  const [mode, setMode] = useState("narrative");
  const [playerInput, setPlayerInput] = useState("");

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

  /* AUTO SAVE */
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
     NEW ADVENTURE
     ===================== */
  if (view === "new") {
    return (
      <Screen theme={THEMES.dark} font={font} textSize={textSize}>
        <h2>Name Your Campaign</h2>
        <input
          value={campaignName}
          onChange={e => setCampaignName(e.target.value)}
          placeholder="Campaign name"
          style={styles.input}
        />
        {Object.entries(THEMES).map(([key, t]) => (
          <Button key={key} onClick={() => campaignName && createAdventure(key)}>
            {t.name}
          </Button>
        ))}
        <Button onClick={() => campaignName && setView("custom")}>
          Build Custom Campaign
        </Button>
        <Button subtle onClick={() => setView("home")}>Back</Button>
      </Screen>
    );
  }

  /* =====================
     CUSTOM CAMPAIGN
     ===================== */
  if (view === "custom") {
    return (
      <Screen theme={THEMES.dark} font={font} textSize={textSize}>
        <h2>Describe Your World</h2>
        <textarea
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          placeholder="Ancient ruins, cruel gods, creeping madness…"
          style={styles.textarea}
        />
        <Button onClick={createCustomAdventure}>Begin Campaign</Button>
        <Button subtle onClick={() => setView("new")}>Back</Button>
      </Screen>
    );
  }

  /* =====================
     LOAD
     ===================== */
  if (view === "load") {
    return (
      <Screen theme={THEMES.dark} font={font} textSize={textSize}>
        <h2>Load Adventure</h2>
        {adventures.length === 0 && <p>No saved campaigns.</p>}
        {adventures.map(a => (
          <Button key={a.id} onClick={() => {
            setActiveId(a.id);
            setView("game");
          }}>
            {a.name}
          </Button>
        ))}
        <Button subtle onClick={() => setView("home")}>Back</Button>
      </Screen>
    );
  }

  /* =====================
     GAME
     ===================== */
  if (view === "game" && active) {
    const inventoryGroups = groupInventory(active.inventory);

    return (
      <Screen theme={THEMES[active.theme]} font={font} textSize={textSize}>
        <CornerMenu
          open={menuOpen}
          toggle={() => setMenuOpen(o => !o)}
          onHome={() => setView("home")}
          onSettings={() => setShowSettings(true)}
          onExit={() => setView("home")}
        />

        <h2>{active.name}</h2>

        <div style={{ display: "flex", gap: 6 }}>
          <Button onClick={() => setPanel("log")}>Story</Button>
          <Button onClick={() => setPanel("character")}>Character</Button>
          <Button onClick={() => setPanel("inventory")}>Inventory</Button>
        </div>

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

        {panel === "character" && (
          <>
            <p>Level: {active.character.level}</p>
            <p>HP: {active.character.hp}/{active.character.maxHp}</p>
            <p>STR: {active.character.str}</p>
            <p>DEX: {active.character.dex}</p>
            <p>INT: {active.character.int}</p>
            <p>Alignment: {active.character.alignment}</p>
          </>
        )}

        {panel === "inventory" && (
          <>
            {Object.keys(inventoryGroups).length === 0 && <p>Inventory empty.</p>}
            {Object.entries(inventoryGroups).map(([type, items]) => (
              <div key={type}>
                <h4>{type}</h4>
                <ul>
                  {items.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </div>
            ))}
          </>
        )}

        {mode === "combat" && <Button onClick={attack}>Attack</Button>}
        {showSettings && <Settings />}
      </Screen>
    );
  }

  return null;

  /* =====================
     LOGIC
     ===================== */
  function createAdventure(themeKey) {
    const opening = dmNarrate({ theme: themeKey });
    const adv = {
      id: `adv-${Date.now()}`,
      name: campaignName,
      theme: themeKey,
      universe: null,
      log: [opening.text],
      inventory: [],
      character: {
        level: 1,
        hp: 10,
        maxHp: 10,
        str: 10,
        dex: 10,
        int: 10,
        alignment: 0
      }
    };
    setAdventures(prev => [...prev, adv]);
    setActiveId(adv.id);
    setMode(opening.mode);
    setView("game");
  }

  function createCustomAdventure() {
    const universe = { description: customInput };
    const opening = dmNarrate({ theme: "dark", universe });
    const adv = {
      id: `adv-${Date.now()}`,
      name: campaignName,
      theme: "dark",
      universe,
      log: [opening.text],
      inventory: [],
      character: {
        level: 1,
        hp: 10,
        maxHp: 10,
        str: 10,
        dex: 10,
        int: 10,
        alignment: 0
      }
    };
    setAdventures(prev => [...prev, adv]);
    setActiveId(adv.id);
    setMode(opening.mode);
    setView("game");
  }

  function handleAction() {
    if (!playerInput.trim()) return;
    const dm = dmNarrate({
      theme: active.theme,
      universe: active.universe,
      tension: active.character.alignment < 0 ? 40 : 0
    });
    const updated = {
      ...active,
      log: [...active.log, dm.text]
    };
    setMode(dm.mode);
    setPlayerInput("");
    setAdventures(adventures.map(a => a.id === active.id ? updated : a));
  }

  function attack() {
    const roll = rollDie(20);
    const hit = roll >= 12;
    const updated = {
      ...active,
      log: [...active.log, hit ? "Your attack strikes true." : "Your blow misses."]
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
   UI
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

function CornerMenu({ open, toggle, onHome, onSettings, onExit }) {
  return (
    <div style={{ position: "absolute", top: 10, right: 10 }}>
      <button onClick={toggle}>☰</button>
      {open && (
        <div style={styles.menu}>
          <Button onClick={onHome}>Home</Button>
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
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 12,
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