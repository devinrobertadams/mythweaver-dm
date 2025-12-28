import { useEffect, useState } from "react";

/* =====================
   UTILITIES
   ===================== */
const rollDie = d => Math.floor(Math.random() * d) + 1;

const skillCheck = (mod = 0, dc = 12) => {
  const roll = rollDie(20);
  return { roll, success: roll + mod >= dc };
};

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
   DM NARRATION (STATEFUL, NON-REPEATING)
   ===================== */
function dmNarrate({ theme, universe, dmState }) {
  let text = "";
  let nextBeat = dmState.lastBeat;
  let mode = "narrative";

  if (!dmState.described) {
    text =
      theme === "lovecraftian"
        ? "The world reveals itself slowly, warped and watchful."
        : theme === "high"
        ? "The land opens before you, bright with promise and hidden peril."
        : "You sense a place shaped by hardship and old scars.";

    if (universe?.description) text += "\n\n" + universe.description;
    nextBeat = "explore";
  } else if (dmState.lastBeat === "explore") {
    text = "The moment lingers, inviting action.";
    nextBeat = "consequence";
  } else if (dmState.lastBeat === "consequence") {
    text = "Subtle consequences begin to surface.";
    nextBeat = "escalation";
  } else {
    text = "Events accelerate, forcing a decisive moment.";
    nextBeat = "explore";
    if (Math.random() < 0.3) mode = "combat";
  }

  return {
    text,
    mode,
    nextState: {
      described: true,
      tension: dmState.tension + 5,
      lastBeat: nextBeat
    }
  };
}

/* =====================
   NPC INTERACTION (D&D RULES)
   ===================== */
function classifyIntent(text) {
  if (/lie|bluff|deceive/i.test(text)) return "deception";
  if (/convince|persuade|ask/i.test(text)) return "persuasion";
  if (/threaten|intimidate/i.test(text)) return "intimidation";
  if (/observe|watch|sense|read/i.test(text)) return "insight";
  return null;
}

function dmHandleNPC({ intent, character }) {
  const npc = {
    disposition: 0,
    knows: {
      public: "People here seem wary, unwilling to speak freely.",
      secret: "A hidden group meets beneath the old chapel."
    }
  };

  const mod = character.skills[intent] || 0;
  const dc = 12 - npc.disposition;
  const check = skillCheck(mod, dc);

  return {
    text: check.success
      ? intent === "insight"
        ? "You sense deliberate concealment — something important is being hidden."
        : npc.knows.secret
      : npc.knows.public,
    roll: check.roll,
    success: check.success
  };
}

/* =====================
   MAIN APP
   ===================== */
export default function Home() {
  const [view, setView] = useState("home");
  const [adventures, setAdventures] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const [campaignName, setCampaignName] = useState("");
  const [customWorld, setCustomWorld] = useState("");

  const [playerInput, setPlayerInput] = useState("");
  const [mode, setMode] = useState("narrative");
  const [panel, setPanel] = useState("story");

  /* SETTINGS */
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState("16px");
  const [fontFamily, setFontFamily] = useState("serif");

  /* LOAD / SAVE */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("adventures") || "[]");
    const savedSettings = JSON.parse(localStorage.getItem("settings") || "{}");

    if (Array.isArray(saved)) {
      setAdventures(saved);
      if (saved.length) setActiveId(saved[saved.length - 1].id);
    }

    if (savedSettings.fontSize) setFontSize(savedSettings.fontSize);
    if (savedSettings.fontFamily) setFontFamily(savedSettings.fontFamily);
  }, []);

  useEffect(() => {
    localStorage.setItem("adventures", JSON.stringify(adventures));
  }, [adventures]);

  useEffect(() => {
    localStorage.setItem(
      "settings",
      JSON.stringify({ fontSize, fontFamily })
    );
  }, [fontSize, fontFamily]);

  const active = adventures.find(a => a.id === activeId);

  /* =====================
     HOME (SETTINGS RESTORED)
     ===================== */
  if (view === "home") {
    return (
      <Screen theme={THEMES.dark} fontFamily={fontFamily} fontSize={fontSize}>
        <h1>Mythweaver</h1>

        {active && <Button onClick={() => setView("game")}>Continue</Button>}
        <Button onClick={() => setView("new")}>New Campaign</Button>
        <Button onClick={() => setView("load")}>Load Campaign</Button>

        <Button subtle onClick={() => setSettingsOpen(true)}>
          Settings
        </Button>

        {settingsOpen && (
          <Settings
            fontSize={fontSize}
            setFontSize={setFontSize}
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
            close={() => setSettingsOpen(false)}
          />
        )}
      </Screen>
    );
  }

  /* =====================
     NEW CAMPAIGN
     ===================== */
  if (view === "new") {
    return (
      <Screen theme={THEMES.dark} fontFamily={fontFamily} fontSize={fontSize}>
        <CornerMenu
          onHome={() => setView("home")}
          onSettings={() => setSettingsOpen(true)}
        />

        <input
          value={campaignName}
          onChange={e => setCampaignName(e.target.value)}
          placeholder="Campaign name"
          style={styles.input}
        />

        <Button onClick={() => createAdventure("dark")}>Dark Fantasy</Button>
        <Button onClick={() => createAdventure("high")}>High Fantasy</Button>
        <Button onClick={() => createAdventure("lovecraftian")}>
          Lovecraftian Fantasy
        </Button>

        <Button onClick={() => setView("custom")}>Build Custom World</Button>
      </Screen>
    );
  }

  /* =====================
     CUSTOM WORLD
     ===================== */
  if (view === "custom") {
    return (
      <Screen theme={THEMES.dark} fontFamily={fontFamily} fontSize={fontSize}>
        <CornerMenu
          onHome={() => setView("home")}
          onSettings={() => setSettingsOpen(true)}
        />

        <textarea
          value={customWorld}
          onChange={e => setCustomWorld(e.target.value)}
          placeholder="Describe your world…"
          style={styles.textarea}
        />

        <Button onClick={createCustomAdventure}>Begin Campaign</Button>
      </Screen>
    );
  }

  /* =====================
     LOAD
     ===================== */
  if (view === "load") {
    return (
      <Screen theme={THEMES.dark} fontFamily={fontFamily} fontSize={fontSize}>
        <CornerMenu
          onHome={() => setView("home")}
          onSettings={() => setSettingsOpen(true)}
        />

        {adventures.map(a => (
          <Button key={a.id} onClick={() => {
            setActiveId(a.id);
            setView("game");
          }}>
            {a.name}
          </Button>
        ))}
      </Screen>
    );
  }

  /* =====================
     GAME
     ===================== */
  if (view === "game" && active) {
    return (
      <Screen
        theme={THEMES[active.theme]}
        fontFamily={fontFamily}
        fontSize={fontSize}
      >
        <CornerMenu
          onHome={() => setView("home")}
          onSettings={() => setSettingsOpen(true)}
        />

        <h2>{active.name}</h2>

        <div style={{ display: "flex", gap: 6 }}>
          <Button onClick={() => setPanel("story")}>Story</Button>
          <Button onClick={() => setPanel("character")}>Character</Button>
        </div>

        {panel === "story" && (
          <>
            {active.log.map((l, i) => <p key={i}>{l}</p>)}
            <textarea
              value={playerInput}
              onChange={e => setPlayerInput(e.target.value)}
              placeholder="What do you do?"
              style={styles.textarea}
            />
            <Button onClick={handleAction}>Continue</Button>
          </>
        )}

        {panel === "character" && (
          <>
            <p>Level: {active.character.level}</p>
            <p>HP: {active.character.hp}/{active.character.maxHp}</p>
            <p>CHA: {active.character.stats.cha}</p>
            <p>Persuasion: {active.character.skills.persuasion}</p>
            <p>Deception: {active.character.skills.deception}</p>
            <p>Insight: {active.character.skills.insight}</p>
            <p>Intimidation: {active.character.skills.intimidation}</p>
          </>
        )}

        {mode === "combat" && <Button>Attack</Button>}

        {settingsOpen && (
          <Settings
            fontSize={fontSize}
            setFontSize={setFontSize}
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
            close={() => setSettingsOpen(false)}
          />
        )}
      </Screen>
    );
  }

  return null;

  /* =====================
     LOGIC
     ===================== */
  function createAdventure(theme) {
    const opening = dmNarrate({
      theme,
      dmState: { described: false, tension: 0, lastBeat: "start" }
    });

    const adv = {
      id: Date.now().toString(),
      name: campaignName || "Unnamed Campaign",
      theme,
      universe: null,
      log: [opening.text],
      dmState: opening.nextState,
      character: {
        level: 1,
        hp: 10,
        maxHp: 10,
        stats: { cha: 10 },
        skills: {
          persuasion: 2,
          deception: 1,
          insight: 1,
          intimidation: 0
        }
      }
    };

    setAdventures([...adventures, adv]);
    setActiveId(adv.id);
    setMode(opening.mode);
    setView("game");
  }

  function createCustomAdventure() {
    const opening = dmNarrate({
      theme: "dark",
      universe: { description: customWorld },
      dmState: { described: false, tension: 0, lastBeat: "start" }
    });

    const adv = {
      id: Date.now().toString(),
      name: campaignName || "Custom Campaign",
      theme: "dark",
      universe: { description: customWorld },
      log: [opening.text],
      dmState: opening.nextState,
      character: {
        level: 1,
        hp: 10,
        maxHp: 10,
        stats: { cha: 10 },
        skills: {
          persuasion: 2,
          deception: 1,
          insight: 1,
          intimidation: 0
        }
      }
    };

    setAdventures([...adventures, adv]);
    setActiveId(adv.id);
    setMode(opening.mode);
    setView("game");
  }

  function handleAction() {
    if (!playerInput.trim()) return;

    const intent = classifyIntent(playerInput);
    let dmText, nextMode = "narrative", nextState = active.dmState;

    if (intent) {
      const result = dmHandleNPC({ intent, character: active.character });
      dmText = `${result.text} (Roll: ${result.roll} — ${result.success ? "Success" : "Failure"})`;
    } else {
      const dm = dmNarrate({
        theme: active.theme,
        universe: active.universe,
        dmState: active.dmState
      });
      dmText = dm.text;
      nextMode = dm.mode;
      nextState = dm.nextState;
    }

    const updated = {
      ...active,
      log: [...active.log, dmText],
      dmState: nextState
    };

    setPlayerInput("");
    setMode(nextMode);
    setAdventures(adventures.map(a => a.id === active.id ? updated : a));
  }
}

/* =====================
   UI COMPONENTS
   ===================== */
function Screen({ children, theme, fontFamily, fontSize }) {
  return (
    <div style={{
      minHeight: "100vh",
      padding: 24,
      background: theme.bg,
      color: "#eee",
      fontFamily,
      fontSize
    }}>
      {children}
    </div>
  );
}

function CornerMenu({ onHome, onSettings }) {
  return (
    <div style={{ position: "absolute", top: 12, right: 12 }}>
      <div style={styles.menu}>
        <Button onClick={onHome}>Home</Button>
        <Button onClick={onSettings}>Settings</Button>
      </div>
    </div>
  );
}

function Button({ children, onClick, subtle }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: 12,
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

function Settings({ fontSize, setFontSize, fontFamily, setFontFamily, close }) {
  return (
    <div style={styles.settings}>
      <h3>Settings</h3>

      <label>Font Size</label>
      <select value={fontSize} onChange={e => setFontSize(e.target.value)}>
        <option value="14px">Small</option>
        <option value="16px">Medium</option>
        <option value="18px">Large</option>
      </select>

      <label>Font</label>
      <select value={fontFamily} onChange={e => setFontFamily(e.target.value)}>
        <option value="serif">Serif</option>
        <option value="sans-serif">Sans Serif</option>
        <option value="monospace">Monospace</option>
      </select>

      <Button onClick={close}>Close</Button>
    </div>
  );
}

/* =====================
   STYLES
   ===================== */
const styles = {
  textarea: {
    width: "100%",
    minHeight: 90,
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
  menu: {
    background: "#111",
    padding: 10,
    border: "1px solid #333",
    borderRadius: 6
  },
  settings: {
    background: "#111",
    padding: 16,
    marginTop: 16,
    border: "1px solid #333",
    borderRadius: 6
  }
};