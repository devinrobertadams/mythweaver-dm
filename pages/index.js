import { useEffect, useState } from "react";

/* =========================
   D&D 5e STRICT RULES CORE
   ========================= */

function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function rollD20(mod = 0) {
  const roll = rollDie(20);
  return { roll, mod, total: roll + mod };
}

function resolveCheck({ ability, mod, dc }) {
  const result = rollD20(mod);
  return {
    ...result,
    dc,
    success: result.total >= dc,
    ability
  };
}

/* =========================
   APP
   ========================= */

export default function Home() {
  const [screen, setScreen] = useState("menu");
  const [campaigns, setCampaigns] = useState([]);
  const [current, setCurrent] = useState(null);
  const [input, setInput] = useState("");
  const [rulesLog, setRulesLog] = useState([]);

  const [universe, setUniverse] = useState({
    name: "",
    description: "",
    themes: "",
    tone: "Dark",
    ruleset: "Strict 5e"
  });

  /* -------------------------
     Persistence
     ------------------------- */

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("campaigns") || "[]");
    setCampaigns(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("campaigns", JSON.stringify(campaigns));
  }, [campaigns]);

  /* =========================
     MENU
     ========================= */

  if (screen === "menu") {
    return (
      <main style={styles.container}>
        <h1 style={styles.title}>MYTHWEAVER DM</h1>

        {campaigns.length > 0 && (
          <button
            style={styles.button}
            onClick={() => {
              setCurrent(campaigns[0]);
              setScreen("game");
            }}
          >
            Continue Last Adventure
          </button>
        )}

        <button style={styles.button} onClick={() => setScreen("load")}>
          Load Adventure
        </button>

        <button style={styles.button} onClick={() => setScreen("universeChoice")}>
          New Adventure
        </button>

        <p style={styles.footer}>Solo • Dark • Strict 5e</p>
      </main>
    );
  }

  /* =========================
     LOAD ADVENTURE
     ========================= */

  if (screen === "load") {
    return (
      <main style={styles.container}>
        <h1 style={styles.title}>Load Adventure</h1>

        {campaigns.map(c => (
          <button
            key={c.id}
            style={styles.button}
            onClick={() => {
              setCurrent(c);
              setScreen("game");
            }}
          >
            {c.name}
          </button>
        ))}

        <button style={styles.subtle} onClick={() => setScreen("menu")}>
          ← Back
        </button>
      </main>
    );
  }

  /* =========================
     UNIVERSE CHOICE
     ========================= */

  if (screen === "universeChoice") {
    return (
      <main style={styles.container}>
        <h1 style={styles.title}>Choose a Universe</h1>

        <button
          style={styles.button}
          onClick={() => {
            setUniverse({
              name: "",
              description: "",
              themes: "",
              tone: "Dark",
              ruleset: "Strict 5e"
            });
            setScreen("universe");
          }}
        >
          Create New Universe
        </button>

        {campaigns.length > 0 && (
          <button
            style={styles.button}
            onClick={() => {
              const last = campaigns[campaigns.length - 1];
              const campaign = {
                id: `campaign-${Date.now()}`,
                name: last.universe?.name || "New Adventure",
                universe: last.universe,
                lastPlayed: new Date().toISOString(),
                log: [
                  `Universe: ${last.universe?.name || "Unknown"}`,
                  "A new story begins in a familiar world."
                ]
              };
              setCampaigns([...campaigns, campaign]);
              setCurrent(campaign);
              setScreen("game");
            }}
          >
            Use Existing Universe
          </button>
        )}

        <button style={styles.subtle} onClick={() => setScreen("menu")}>
          ← Back
        </button>
      </main>
    );
  }

  /* =========================
     UNIVERSE CREATION
     ========================= */

  if (screen === "universe") {
    return (
      <main style={styles.container}>
        <h1 style={styles.title}>Create Your Universe</h1>

        <input
          style={styles.input}
          placeholder="Universe Name"
          value={universe.name}
          onChange={e => setUniverse({ ...universe, name: e.target.value })}
        />

        <textarea
          style={styles.textarea}
          placeholder="Describe the world, its rules, dangers, and tone"
          value={universe.description}
          onChange={e => setUniverse({ ...universe, description: e.target.value })}
        />

        <input
          style={styles.input}
          placeholder="Themes (decay, survival, forbidden magic...)"
          value={universe.themes}
          onChange={e => setUniverse({ ...universe, themes: e.target.value })}
        />

        <button
          style={styles.button}
          onClick={async () => {
            const res = await fetch("/api/opening", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ universe })
            });

            const data = await res.json();

            const campaign = {
              id: `campaign-${Date.now()}`,
              name: universe.name || "Untitled Universe",
              universe,
              lastPlayed: new Date().toISOString(),
              log: [
                `Universe: ${universe.name || "Unnamed"}`,
                data.opening || "A dark world stirs."
              ]
            };

            setCampaigns([...campaigns, campaign]);
            setCurrent(campaign);
            setScreen("game");
          }}
        >
          Begin Adventure
        </button>

        <button style={styles.subtle} onClick={() => setScreen("menu")}>
          ← Cancel
        </button>
      </main>
    );
  }

  /* =========================
     GAME SCREEN (STRICT RULES)
     ========================= */

  return (
    <main style={styles.game}>
      {rulesLog.length > 0 && (
        <div style={styles.rules}>
          {rulesLog.map((r, i) => (
            <div key={i}>{r}</div>
          ))}
        </div>
      )}

      <div style={styles.log}>
        {current.log.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>

      <input
        style={styles.input}
        placeholder="What do you do? (e.g. check dex stealth)"
        value={input}
        onChange={e => setInput(e.target.value)}
      />

      <button
        style={styles.button}
        onClick={() => {
          if (!input) return;

          let newLog = [...current.log, `> ${input}`];
          let newRules = [];

          if (input.toLowerCase().startsWith("check")) {
            const parts = input.toLowerCase().split(" ");
            const ability = parts[1];

            const modifiers = {
              str: 3,
              dex: 4,
              con: 2,
              int: 1,
              wis: 2,
              cha: 0
            };

            const dc = 14;

            const result = resolveCheck({
              ability,
              mod: modifiers[ability] || 0,
              dc
            });

            newRules = [
              `[${ability.toUpperCase()} CHECK]`,
              `Roll: ${result.roll} + ${result.mod} = ${result.total} vs DC ${dc}`,
              result.success ? "SUCCESS" : "FAILURE"
            ];

            newLog.push(
              result.success
                ? "You succeed, but consequences linger."
                : "You fail. The world advances regardless."
            );
          } else {
            newLog.push("The Dungeon Master considers your action.");
          }

          const updated = {
            ...current,
            lastPlayed: new Date().toISOString(),
            log: newLog
          };

          setCurrent(updated);
          setRulesLog(newRules);
          setCampaigns(
            campaigns.map(c => (c.id === updated.id ? updated : c))
          );
          setInput("");
        }}
      >
        Act
      </button>

      <button style={styles.subtle} onClick={() => setScreen("menu")}>
        Save & Exit
      </button>
    </main>
  );
}

/* =========================
   STYLES
   ========================= */

const styles = {
  container: {
    background: "#000",
    color: "#ddd",
    minHeight: "100vh",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    justifyContent: "center",
    alignItems: "center"
  },
  title: { letterSpacing: 2 },
  button: {
    width: "100%",
    padding: 14,
    background: "#111",
    color: "#ddd",
    border: "1px solid #222"
  },
  subtle: {
    background: "none",
    color: "#666",
    border: "none"
  },
  footer: {
    marginTop: 40,
    fontSize: 12,
    color: "#444"
  },
  game: {
    background: "#000",
    color: "#ddd",
    minHeight: "100vh",
    padding: 16
  },
  log: {
    whiteSpace: "pre-wrap",
    marginBottom: 16
  },
  rules: {
    background: "#0a0a0a",
    border: "1px solid #222",
    padding: 12,
    marginBottom: 12,
    fontFamily: "monospace",
    fontSize: 13,
    color: "#bbb"
  },
  input: {
    width: "100%",
    padding: 12,
    background: "#111",
    color: "#ddd",
    border: "1px solid #222"
  },
  textarea: {
    width: "100%",
    minHeight: 120,
    padding: 12,
    background: "#111",
    color: "#ddd",
    border: "1px solid #222"
  }
};
