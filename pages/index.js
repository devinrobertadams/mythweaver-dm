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

  /* -------------------------
     UNIVERSE
     ------------------------- */
  const [universe, setUniverse] = useState({
    name: "",
    description: "",
    themes: "",
    tone: "Dark",
    ruleset: "Strict 5e"
  });

  /* -------------------------
     PERSISTENCE
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
     LOAD
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
     UNIVERSE CREATION
     ========================= */

  if (screen === "universeChoice") {
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
          placeholder="Describe the world, its dangers, rules, and tone"
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
          onClick={() => {
            const campaign = {
              id: `campaign-${Date.now()}`,
              name: universe.name || "Untitled World",
              universe,
              lastPlayed: new Date().toISOString(),
              log: ["You enter a hostile world."],

              // NEW: NPCs & Factions
              npcs: [
                {
                  name: "Watcher in the Rain",
                  faction: "Ashfall Survivors",
                  attitude: 0,
                  memory: [],
                  alive: true
                }
              ],
              factions: [
                {
                  name: "Ashfall Survivors",
                  goal: "Endure at any cost",
                  attitude: 0,
                  influence: 1,
                  memory: []
                }
              ]
            };

            setCampaigns([...campaigns, campaign]);
            setCurrent(campaign);
            setScreen("game");
          }}
        >
          Begin Adventure
        </button>
      </main>
    );
  }

  /* =========================
     GAME
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
        {current.log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

      <input
        style={styles.input}
        placeholder="What do you do? (check dex stealth)"
        value={input}
        onChange={e => setInput(e.target.value)}
      />

      <button
        style={styles.button}
        onClick={() => {
          if (!input) return;

          let newLog = [...current.log, `> ${input}`];
          let newRules = [];
          let updatedNPCs = [...current.npcs];
          let updatedFactions = [...current.factions];

          if (input.startsWith("check")) {
            const ability = input.split(" ")[1];
            const mods = { str: 3, dex: 4, con: 2, int: 1, wis: 2, cha: 0 };
            const dc = 14;

            const result = resolveCheck({
              ability,
              mod: mods[ability] || 0,
              dc
            });

            newRules = [
              `[${ability.toUpperCase()} CHECK]`,
              `Roll: ${result.roll} + ${result.mod} = ${result.total} vs DC ${dc}`,
              result.success ? "SUCCESS" : "FAILURE"
            ];

            // MEMORY EFFECTS
            updatedNPCs = updatedNPCs.map(npc => ({
              ...npc,
              attitude: npc.attitude + (result.success ? 1 : -1),
              memory: [
                ...npc.memory,
                result.success ? "Player proved capable." : "Player failed under pressure."
              ]
            }));

            updatedFactions = updatedFactions.map(f => ({
              ...f,
              attitude: f.attitude + (result.success ? 1 : -1),
              memory: [
                ...f.memory,
                result.success
                  ? "Player action benefited us."
                  : "Player action harmed our position."
              ]
            }));

            newLog.push(
              result.success
                ? "Eyes follow you with new respect."
                : "Whispers spread of your weakness."
            );
          }

          const updated = {
            ...current,
            lastPlayed: new Date().toISOString(),
            log: newLog,
            npcs: updatedNPCs,
            factions: updatedFactions
          };

          setCurrent(updated);
          setRulesLog(newRules);
          setCampaigns(campaigns.map(c => (c.id === updated.id ? updated : c)));
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
