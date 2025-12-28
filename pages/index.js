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
   MAIN APP
   ===================== */
export default function Home() {
  const [view, setView] = useState("home"); 
  const [adventures, setAdventures] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  /* ---------- SETTINGS ---------- */
  const [settingsOpen, setSettingsOpen] = useState(false);
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
     HOME
     ===================== */
  if (view === "home") {
    return (
      <Screen settings={{ textSize, font }} theme={THEMES.dark}>
        <h1>Mythweaver</h1>

        {active && (
          <Button onClick={() => setView("game")}>
            Continue Last Adventure
          </Button>
        )}

        <Button onClick={() => setView("new")}>New Adventure</Button>
        <Button onClick={() => setView("load")}>Load Adventure</Button>
        <Button onClick={() => setView("manage")}>Manage Saves</Button>
        <Button subtle onClick={() => setSettingsOpen(true)}>Settings</Button>

        {settingsOpen && (
          <Settings
            close={() => setSettingsOpen(false)}
            textSize={textSize}
            setTextSize={setTextSize}
            font={font}
            setFont={setFont}
            ttsEnabled={ttsEnabled}
            setTtsEnabled={setTtsEnabled}
            voiceGender={voiceGender}
            setVoiceGender={setVoiceGender}
          />
        )}
      </Screen>
    );
  }

  /* =====================
     GLOBAL MENU (NON-HOME)
     ===================== */
  const Menu = (
    <TopMenu
      onHome={() => {
        setView("home");
      }}
      onSettings={() => setSettingsOpen(true)}
      onExit={() => {
        window.location.href = "about:blank";
      }}
    />
  );

  /* =====================
     GAME
     ===================== */
  if (view === "game" && active) {
    const theme = THEMES[active.theme] || THEMES.dark;
    const lastLine = active.log[active.log.length - 1] || "";

    useEffect(() => {
      speak(lastLine);
    }, [lastLine]);

    return (
      <Screen settings={{ textSize, font }} theme={theme}>
        {Menu}
        <h2>{active.name}</h2>

        <div>
          {active.log.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>

        <Button onClick={attack}>Attack</Button>
      </Screen>
    );
  }

  /* =====================
     OTHER VIEWS (LOAD / MANAGE / CUSTOM)
     ===================== */
  return (
    <Screen settings={{ textSize, font }} theme={THEMES.dark}>
      {Menu}
      <p>Feature screen in progress.</p>
    </Screen>
  );

  /* =====================
     LOGIC
     ===================== */
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

function Screen({ children, theme, settings }) {
  const sizeMap = { small: 14, medium: 16, large: 18 };
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        background: theme.bg,
        color: "#eee",
        fontFamily: settings?.font || theme.font,
        fontSize: sizeMap[settings?.textSize || "medium"]
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

function TopMenu({ onHome, onSettings, onExit }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <Button onClick={onHome}>Save & Return Home</Button>
      <Button onClick={onSettings}>Settings</Button>
      <Button danger onClick={onExit}>Exit Application</Button>
    </div>
  );
}

function Settings({
  close,
  textSize,
  setTextSize,
  font,
  setFont,
  ttsEnabled,
  setTtsEnabled,
  voiceGender,
  setVoiceGender
}) {
  return (
    <div style={{ background: "#111", padding: 16, marginTop: 16 }}>
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
        <>
          <label>Voice</label>
          <select value={voiceGender} onChange={e => setVoiceGender(e.target.value)}>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </>
      )}

      <Button onClick={close}>Close</Button>
    </div>
  );
}