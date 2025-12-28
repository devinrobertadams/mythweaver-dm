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
            setCustomUniverse({
              description: "",
              tone: "",
              magic: "",
              danger: ""
            });
            setCustomStep(1);
            setInput("");
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
     CUSTOM UNIVERSE (TEXT-DRIVEN)
     ===================== */
  if (view === "custom") {
    return (
      <Screen theme={THEMES.dark}>
        <h2>Design Your Universe</h2>

        {customStep === 1 && (
          <>
            <p>
              Describe the fantasy world you want to explore.
            </p>

            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ancient ruins, fading magic, cruel gods..."
              style={styles.textarea}
            />

            <Button onClick={() => nextCustom("description")}>
              Continue
            </Button>
          </>
        )}

        {customStep === 2 && (
          <>
            <p>
              What is the overall tone of this world?
            </p>

            <InputRow value={input} setValue={setInput} />

            <Button onClick={() => nextCustom("tone")}>
              Continue
            </Button>

            <Button subtle onClick={() => skipCustom("tone")}>
              Not Applicable
            </Button>
          </>
        )}

        {customStep === 3 && (
          <>
            <p>
              How does magic exist in this world?
            </p>

            <InputRow value={input} setValue={setInput} />

            <Button onClick={() => nextCustom("magic")}>
              Continue
            </Button>

            <Button subtle onClick={() => skipCustom("magic")}>
              Not Applicable
            </Button>
          </>
        )}

        {customStep === 4 && (
          <>
            <p>
              How dangerous is this world?
            </p>

            <InputRow value={input} setValue={setInput} />

            <Button onClick={() => nextCustom("danger")}>
              Continue
            </Button>

            <Button subtle onClick={() => skipCustom("danger")}>
              Not Applicable
            </Button>
          </>
        )}

        {customStep === 5 && (
          <>
            <p>Your universe takes shape…</p>
            <Button onClick={createCustomAdventure}>
              Begin Adventure
            </Button>
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
    const theme = THEMES.dark;

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
  function nextCustom(key) {
    setCustomUniverse(prev => ({ ...prev, [key]: input }));
    setInput("");
    setCustomStep(s => s + 1);
  }

  function skipCustom(key) {
    setCustomUniverse(prev => ({ ...prev, [key]: "Not applicable" }));
    setInput("");
    setCustomStep(s => s + 1);
  }

  function createCustomAdventure() {
    const u = customUniverse;

    const description = `
${u.description || ""}
Tone: ${u.tone || "Not specified"}.
Magic: ${u.magic || "Not specified"}.
Danger: ${u.danger || "Not specified"}.
`.trim();

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
    <div style={styles.confirm}>
      <p>This will permanently delete the save.</p>
      <Button danger onClick={onConfirm}>Confirm Delete</Button>
      <Button subtle onClick={onCancel}>Cancel</Button>
    </div>
  );
}

function InputRow({ value, setValue }) {
  return (
    <textarea
      value={value}
      onChange={e => setValue(e.target.value)}
      style={styles.textarea}
      placeholder="Type your answer here..."
    />
  );
}

/* =====================
   STYLES
   ===================== */
const styles = {
  textarea: {
    width: "100%",
    minHeight: 90,
    marginTop: 10,
    padding: 10,
    background: "#111",
    color: "#eee",
    border: "1px solid #333",
    borderRadius: 6,
    fontSize: 14
  },
  confirm: {
    background: "#111",
    padding: 16,
    marginTop: 16,
    border: "1px solid #333"
  }
};