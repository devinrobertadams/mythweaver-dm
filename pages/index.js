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
function dmSetTheStage({ theme, lastAction, world }) {
  const combat =
    lastAction && /attack|fight|strike|kill|charge/i.test(lastAction);

  const tensionText =
    world.tension > 30
      ? "The world groans under the weight of your actions."
      : "The balance of this realm feels unstable.";

  const text = `
${theme === "lovecraftian"
  ? "Reality feels thin, watched by something vast."
  : "The world listens closely."}

${lastAction
  ? `Because you chose to "${lastAction}", events begin to unfold.`
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

  const [mode, setMode] = useState("narrative");
  const [panel, setPanel] = useState("log");
  const [playerInput, setPlayerInput] = useState("");

  /* NEW: CAMPAIGN NAME */
  const [campaignName, setCampaignName] = useState("");

  /* LOAD / SAVE */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("adventures") || "[]");
      if (Array.isArray(saved)) {
        setAdventures(saved);
        if (saved.length) setActiveId(saved[saved.length - 1].id);
      }
    } catch {}
  }, []);

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
            Continue: {active.name}
          </Button>
        )}

        <Button onClick={() => {
          setCampaignName("");
          setView("new");
        }}>
          New Adventure
        </Button>

        <Button onClick={() => setView("load")}>
          Load Adventure
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
        <h2>Name Your Campaign</h2>

        <input
          value={campaignName}
          onChange={e => setCampaignName(e.target.value)}
          placeholder="The Ashen Crown..."
          style={styles.input}
        />

        <h3>Select a Fantasy Theme</h3>

        {Object.entries(THEMES).map(([key, t]) => (
          <Button
            key={key}
            onClick={() => {
              if (!campaignName.trim()) return;
              createAdventure(key, campaignName.trim());
            }}
          >
            {t.name}
          </Button>
        ))}

        <Button subtle onClick={() => setView("home")}>Back</Button>
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
      <Screen theme={THEMES[active.theme]}>
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
  function createAdventure(themeKey, name) {
    const world = { tension: 0, rumors: [] };
    const opening = dmSetTheStage({ theme: themeKey, world });

    const adv = {
      id: `adv-${Date.now()}`,
      name,
      theme: themeKey,
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
      world: active.world
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
}

/* =====================
   UI
   ===================== */
function Screen({ children, theme }) {
  return (
    <div style={{
      minHeight: "100vh",
      padding: 24,
      background: theme.bg,
      color: "#eee",
      fontFamily: theme.font
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
  }
};