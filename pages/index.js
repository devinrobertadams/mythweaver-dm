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
    bg: "linear-gradient(#050505, #120a0a)",
    accent: "#8b0000",
    font: "serif"
  },
  high: {
    bg: "linear-gradient(#0b132b, #1c2541)",
    accent: "#cdb4db",
    font: "serif"
  },
  eldritch: {
    bg: "linear-gradient(#020204, #0f1a14)",
    accent: "#3ddc97",
    font: "monospace"
  }
};

export default function Home() {
  const [view, setView] = useState("home"); // home | game
  const [adventures, setAdventures] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const [dice, setDice] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  const [showMath, setShowMath] = useState(true);

  /* ---------- LOAD ---------- */
  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem("adventures") || "[]");
      if (Array.isArray(a)) setAdventures(a);
    } catch {}
  }, []);

  /* ---------- SAVE ---------- */
  useEffect(() => {
    localStorage.setItem("adventures", JSON.stringify(adventures));
  }, [adventures]);

  const active = adventures.find(a => a.id === activeId);
  const theme = THEMES[active?.theme || "dark"];

  /* =====================
     HOME
     ===================== */
  if (view === "home") {
    return (
      <Screen theme={THEMES.dark}>
        <h1>Mythweaver</h1>

        {active && (
          <Button onClick={() => setView("game")}>
            Continue Adventure
          </Button>
        )}

        <Button onClick={() => createAdventure("dark")}>
          New Dark Fantasy
        </Button>
        <Button onClick={() => createAdventure("high")}>
          New High Fantasy
        </Button>
        <Button onClick={() => createAdventure("eldritch")}>
          New Eldritch Horror
        </Button>

        <Button subtle onClick={() => setSoundOn(s => !s)}>
          Dice Sound: {soundOn ? "ON" : "OFF"}
        </Button>

        <Button subtle onClick={() => setShowMath(m => !m)}>
          Show Dice Math: {showMath ? "ON" : "OFF"}
        </Button>
      </Screen>
    );
  }

  /* =====================
     GAME
     ===================== */
  if (!active) return null;

  return (
    <Screen theme={theme}>
      <h2>{active.name}</h2>

      <div style={{ opacity: 0.85, marginBottom: 14 }}>
        {active.log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

      <Button onClick={() => attack({})}>
        Attack
      </Button>

      <Button onClick={() => attack({ advantage: true })}>
        Attack (Advantage)
      </Button>

      <Button onClick={() => attack({ disadvantage: true })}>
        Attack (Disadvantage)
      </Button>

      <Button subtle onClick={() => setView("home")}>
        Save & Exit
      </Button>

      {dice && (
        <DiceRoll
          dice={dice}
          soundOn={soundOn}
          showMath={showMath}
          onDone={() => setDice(null)}
        />
      )}
    </Screen>
  );

  /* =====================
     GAME LOGIC
     ===================== */
  function attack({ advantage, disadvantage }) {
    const dc = 12;
    const mod = 2;

    const rolls =
      advantage || disadvantage
        ? [rollDie(20), rollDie(20)]
        : [rollDie(20)];

    const chosen = advantage
      ? Math.max(...rolls)
      : disadvantage
      ? Math.min(...rolls)
      : rolls[0];

    const total = chosen + mod;
    const success = total >= dc;

    const damageRolls = success ? [rollDie(8)] : [];
    const damage = success ? damageRolls[0] + mod : 0;

    setDice({
      die: 20,
      rolls,
      chosen,
      mod,
      total,
      dc,
      success,
      damageRolls,
      damage
    });

    const updated = {
      ...active,
      log: [
        ...active.log,
        success
          ? `Attack hits (${total} vs DC ${dc}). You deal ${damage} damage.`
          : `Attack misses (${total} vs DC ${dc}).`
      ]
    };

    setAdventures(adventures.map(a => (a.id === active.id ? updated : a)));
  }

  function createAdventure(theme) {
    const adv = {
      id: `a-${Date.now()}`,
      name: "A New Beginning",
      theme,
      log: ["The world stirs as your journey begins."]
    };
    setAdventures([...adventures, adv]);
    setActiveId(adv.id);
    setView("game");
  }
}

/* =====================
   DICE ROLL VISUAL
   ===================== */
function DiceRoll({ dice, onDone, soundOn, showMath }) {
  const [display, setDisplay] = useState(dice.chosen);

  useEffect(() => {
    if (soundOn) {
      const audio = new Audio(
        "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"
      );
      audio.volume = 0.25;
      audio.play().catch(() => {});
    }

    let ticks = 0;
    const interval = setInterval(() => {
      setDisplay(Math.floor(Math.random() * dice.die) + 1);
      ticks++;
      if (ticks > 10) {
        clearInterval(interval);
        setDisplay(dice.chosen);
        setTimeout(onDone, 1600);
      }
    }, 80);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={diceUI.overlay}>
      <div style={diceUI.panel}>
        <div style={diceUI.roll}>{display}</div>

        {showMath && (
          <div style={diceUI.explain}>
            <div><strong>Attack Roll</strong></div>

            {dice.rolls.length > 1 && (
              <div>d20 rolls: {dice.rolls.join(", ")}</div>
            )}
            {dice.rolls.length === 1 && (
              <div>d20 rolled: {dice.rolls[0]}</div>
            )}

            <div>Modifier: +{dice.mod}</div>
            <div>
              Total: {dice.chosen} + {dice.mod} ={" "}
              <strong>{dice.total}</strong>
            </div>
            <div>DC: {dice.dc}</div>
          </div>
        )}

        <div
          style={{
            ...diceUI.result,
            color: dice.success ? "#4caf50" : "#ff5252"
          }}
        >
          {dice.success ? "SUCCESS" : "FAILURE"}
        </div>

        {dice.success && showMath && (
          <div style={diceUI.damage}>
            <div><strong>Damage</strong></div>
            <div>
              {dice.damageRolls.join(", ")} + {dice.mod} ={" "}
              <strong>{dice.damage}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =====================
   UI PRIMITIVES
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

function Button({ children, onClick, subtle }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: 14,
        marginTop: 10,
        background: subtle ? "transparent" : "#222",
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

/* =====================
   DICE STYLES
   ===================== */
const diceUI = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  },
  panel: {
    background: "#111",
    borderRadius: 12,
    padding: 24,
    width: 280,
    textAlign: "center",
    boxShadow: "0 0 40px rgba(0,0,0,0.8)"
  },
  roll: {
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 12
  },
  explain: {
    fontSize: 14,
    opacity: 0.85,
    lineHeight: 1.5,
    marginBottom: 10,
    textAlign: "left"
  },
  result: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "bold"
  },
  damage: {
    marginTop: 10,
    fontSize: 14,
    opacity: 0.9
  }
};