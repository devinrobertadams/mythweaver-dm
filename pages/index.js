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

  const universeFlavor = universe?.description
    ? `This world reflects your vision: ${universe.description}`
    : "";

  const tensionText =
    world.tension > 30
      ? "The world strains under accumulated consequences."
      : "The balance of this realm is uncertain.";

  const text = `
${theme === "lovecraftian"
  ? "Reality feels thin, watched by something vast."
  : "The world listens closely."}

${universeFlavor}

${lastAction
  ? `Because you chose to "${lastAction}", events unfold.`
  : "Your journey begins at the edge of the unknown."}

${tensionText}
`.trim();

  return { text, mode: combat ? "combat" : "narrative" };
}

/* =====================
   DECISION IMPACT
   ===================== */
function evaluateDecision(text) {
  const result = {
    alignment: 0,
    influence: 0,
    tension: 0,
    trait: null
  };

  if (/help|save|protect|heal/i.test(text)) {
    result.alignment += 10;
    result.influence += 5;
  }

  if (/kill|steal|burn|threaten/i.test(text)) {
    result.alignment -= 10;
    result.tension += 5;
    result.trait = "Feared";
  }

  if (/negotiate|persuade|convince/i.test(text)) {
    result.influence += 10;
  }

  return result;
}

/* =====================
   MAIN APP
   ===================== */
export default function Home() {
  const [view, setView] = useState("home");
  const [adventures, setAdventures] = useState([]);
  const [activeId, setActiveId] = useState(null);

  /* SETTINGS */
  const [showSettings, setShowSettings] = useState(false);
  const [textSize, setTextSize] = useState("medium");
  const [font, setFont] = useState("serif");

  /* CAMPAIGN CREATION */
  const [campaignName, setCampaignName] = useState("");
  const [customStep, setCustomStep] = useState(0);
  const [customUniverse, setCustomUniverse] = useState({
    description: "",
    tone: "",
    magic: "",
    danger: ""
  });
  const [customInput, setCustomInput] = useState("");

  /* GAME STATE */
  const [mode, setMode] = useState("narrative");
  const [panel, setPanel] = useState("log");
  const [playerInput, setPlayerInput] = useState("");

  /* LOAD / SAVE */
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

  useEffect(() => {
    localStorage.setItem("adventures", JSON.stringify(adventures));
  }, [adventures]);

  useEffect(() => {
    localStorage.setItem(
      "settings",
      JSON.stringify({ textSize, font })
    );
  }, [textSize, font]);

  const active = adventures.find(a => a.id === activeId) || null;

  /* =====================
     HOME
     ===================== */
  if (view === "home") {
    return (
      <Screen theme={THEMES.dark} textSize={textSize} font={font}>
        <h1>Mythweaver</h1>

        {active && <Button onClick={() => setView("game")}>Continue</Button>}
        <Button onClick={() => {
          setCampaignName("");
          setView("new");
        }}>
          New Adventure
        </Button>
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
      <Screen theme={THEMES.dark} textSize={textSize} font={font}>
        <h2>Name Your Campaign</h2>

        <input
          value={campaignName}
          onChange={e => setCampaignName(e.target.value)}
          placeholder="The Ashen Crown"
          style={styles.input}
        />

        <h3>Select a Fantasy Theme</h3>

        {Object.entries(THEMES).map(([key, t]) => (
          <Button
            key={key}
            onClick={() => {
              if (!campaignName.trim()) return;
              createAdventure(key);
            }}
          >
            {t.name}
          </Button>
        ))}

        <Button
          onClick={() => {
            if (!campaignName.trim()) return;
            setCustomUniverse({ description: "", tone: "", magic: "", danger: "" });
            setCustomStep(1);
            setCustomInput("");
            setView("custom");
          }}
        >
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
      <Screen theme={THEMES.dark} textSize={textSize} font={font}>
        <h2>Design Your World</h2>

        {customStep === 1 && (
          <>
            <p>Describe the world you want to explore.</p>
            <textarea
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              style={styles.textarea}
            />
            <Button onClick={() => nextCustom("description")}>Continue</Button>
          </>
        )}

        {customStep === 2 && (
          <>
            <p>What is the tone of this world?</p>
            <textarea
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              style={styles.textarea}
            />
            <Button onClick={() => nextCustom("tone")}>Continue</Button>
            <Button subtle onClick={() => skipCustom("tone")}>Not Applicable</Button>
          </>
        )}

        {customStep === 3 && (
          <>
            <p>How does magic exist here?</p>
            <textarea
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              style={styles.textarea}
            />
            <Button onClick={() => nextCustom("magic")}>Continue</Button>
            <Button subtle onClick={() => skipCustom("magic")}>Not Applicable</Button>
          </>
        )}

        {customStep === 4 && (
          <>
            <p>How dangerous is this world?</p>
            <textarea
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              style={styles.textarea}
            />
            <Button onClick={() => nextCustom("danger")}>Continue</Button>
            <Button subtle onClick={() => skipCustom("danger")}>Not Applicable</Button>
          </>
        )}

        {customStep === 5 && (
          <>
            <p>Your world is ready.</p>
            <Button onClick={createCustomAdventure}>Begin Campaign</Button>
          </>
        )}
      </Screen>
    );
  }

  /* =====================
     LOAD
     ===================== */
  if (view === "load") {
    return (
      <Screen theme={THEMES.dark} textSize={textSize} font={font}>
        <h2>Load Adventure</h2>

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
    return (
      <Screen theme={THEMES[active.theme]} textSize={textSize} font={font}>
        <h2>{active.name}</h2>

        <div style={{ display: "flex", gap: 6 }}>
          <Button onClick={() => setPanel("log")}>Story</Button>
          <Button onClick={() => setPanel("character")}>Character</Button>
          <Button onClick={() => setPanel("inventory")}>Inventory</Button>
        </div>

        {panel === "log" && (
          <>
            {active.log.map((l, i) => <p key={i}>{l}</p>)}

            <p><strong>What do you do next?</strong></p>
            <textarea
              value={playerInput}
              onChange={e => setPlayerInput(e.target.value)}
              style={styles.textarea}
            />

            <Button onClick={handleAction}>Continue</Button>
          </>
        )}

        {panel === "character" && (
          <>
            <p>Level: {active.character.level}</p>
            <p>XP: {active.character.xp}</p>
            <p>HP: {active.character.hp}/{active.character.maxHp}</p>
            <p>Alignment: {active.character.alignment}</p>
            <p>Influence: {active.character.influence}</p>
          </>
        )}

        {panel === "inventory" && (
          <ul>
            {active.inventory.length === 0
              ? <li>Empty</li>
              : active.inventory.map((i, idx) => <li key={idx}>{i}</li>)
            }
          </ul>
        )}

        {mode === "combat" && <Button onClick={attack}>Attack</Button>}

        <Button subtle onClick={() => setView("home")}>Save & Exit</Button>
      </Screen>
    );
  }

  return null;

  /* =====================
     LOGIC
     ===================== */
  function nextCustom(key) {
    setCustomUniverse(prev => ({ ...prev, [key]: customInput }));
    setCustomInput("");
    setCustomStep(s => s + 1);
  }

  function skipCustom(key) {
    setCustomUniverse(prev => ({ ...prev, [key]: "Not specified" }));
    setCustomInput("");
    setCustomStep(s => s + 1);
  }

  function createAdventure(themeKey) {
    const world = { tension: 0, rumors: [] };
    const opening = dmSetTheStage({ theme: themeKey, world });

    const adv = {
      id: `adv-${Date.now()}`,
      name: campaignName,
      theme: themeKey,
      universe: null,
      log: [opening.text],
      world,
      character: {
        level: 1,
        xp: 0,
        hp: 10,
        maxHp: 10,
        alignment: 0,
        influence: 0,
        traits: []
      },
      inventory: []
    };

    setAdventures(prev => [...prev, adv]);
    setActiveId(adv.id);
    setMode(opening.mode);
    setView("game");
  }

  function createCustomAdventure() {
    const world = { tension: 0, rumors: [] };
    const opening = dmSetTheStage({
      theme: "dark",
      world,
      universe: customUniverse
    });

    const adv = {
      id: `adv-${Date.now()}`,
      name: campaignName,
      theme: "dark",
      universe: customUniverse,
      log: [opening.text],
      world,
      character: {
        level: 1,
        xp: 0,
        hp: 10,
        maxHp: 10,
        alignment: 0,
        influence: 0,
        traits: []
      },
      inventory: []
    };

    setAdventures(prev => [...prev, adv]);
    setActiveId(adv.id);
    setMode(opening.mode);
    setView("game");
  }

  function handleAction() {
    if (!playerInput.trim()) return;

    const impact = evaluateDecision(playerInput);
    const dm = dmSetTheStage({
      theme: active.theme,
      lastAction: playerInput,
      world: active.world,
      universe: active.universe
    });

    const updated = {
      ...active,
      character: {
        ...active.character,
        alignment: active.character.alignment + impact.alignment,
        influence: active.character.influence + impact.influence,
        traits: impact.trait
          ? [...active.character.traits, impact.trait]
          : active.character.traits
      },
      world: {
        ...active.world,
        tension: active.world.tension + impact.tension,
        rumors: impact.trait
          ? [...active.world.rumors, `You are known as ${impact.trait}`]
          : active.world.rumors
      },
      log: [...active.log, `You: ${playerInput}`, dm.text]
    };

    setMode(dm.mode);
    setPlayerInput("");
    setAdventures(adventures.map(a => a.id === active.id ? updated : a));
  }

  function attack() {
    const roll = rollDie(20);
    const success = roll >= 12;

    const updated = {
      ...active,
      character: {
        ...active.character,
        xp: active.character.xp + (success ? 20 : 5)
      },
      log: [
        ...active.log,
        success ? `You strike true (${roll}).` : `Your blow misses (${roll}).`
      ]
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
function Screen({ children, theme, textSize, font }) {
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

function Button({ children, onClick, subtle }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        padding: 12,
        marginTop: 8,
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
  }
};