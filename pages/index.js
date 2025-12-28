import { useEffect, useMemo, useState } from "react";

/* =========================
   ENGINE (PURE FUNCTIONS)
   ========================= */

const mod = s => Math.floor((s - 10) / 2);
const roll = d => Math.floor(Math.random() * d) + 1;
const d20 = m => {
  const r = roll(20);
  return { roll: r, total: r + m };
};

/* =========================
   APP
   ========================= */

export default function Home() {
  const [screen, setScreen] = useState("menu"); // menu | game
  const [campaigns, setCampaigns] = useState([]);
  const [current, setCurrent] = useState(null);
  const [input, setInput] = useState("");
  const [rules, setRules] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);

  /* =========================
     SAFE LOAD / SAVE (SSR SAFE)
     ========================= */

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = JSON.parse(
      window.localStorage.getItem("campaigns") || "[]"
    );
    setCampaigns(saved);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("campaigns", JSON.stringify(campaigns));
  }, [campaigns]);

  /* =========================
     AUTO NAVIGATION (SAFE)
     ========================= */

  useEffect(() => {
    if (current && screen !== "game") {
      setScreen("game");
    }
  }, [current]);

  /* =========================
     MENU
     ========================= */

  if (screen === "menu") {
    return (
      <main style={styles.container}>
        <h1>MYTHWEAVER DM</h1>

        {campaigns.map(c => (
          <div key={c.id} style={styles.row}>
            <button
              style={styles.button}
              onClick={() => setCurrent(c)}
            >
              {c.name}
            </button>
            <button
              style={styles.danger}
              onClick={() => setConfirmDelete(c.id)}
            >
              ✕
            </button>
          </div>
        ))}

        <button style={styles.button} onClick={newGame}>
          New Adventure
        </button>

        {/* CONFIRM DELETE OVERLAY */}
        {confirmDelete && (
          <div style={styles.confirmOverlay}>
            <div style={styles.confirmBox}>
              <p>Delete this adventure?</p>
              <p style={{ fontSize: 12, color: "#999" }}>
                This action cannot be undone.
              </p>

              <button
                style={styles.danger}
                onClick={() => {
                  setCampaigns(cs =>
                    cs.filter(c => c.id !== confirmDelete)
                  );
                  setConfirmDelete(null);
                }}
              >
                Yes, Delete
              </button>

              <button
                style={styles.subtle}
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>
    );
  }

  /* =========================
     GUARD
     ========================= */

  if (!current) {
    return <main style={styles.container}>Loading…</main>;
  }

  /* =========================
     DERIVED STATE (MEMOIZED)
     ========================= */

  const p = current.player;

  const status = useMemo(() => {
    const load = current.inventory.reduce((s, i) => s + i.weight, 0);
    const cap = p.str * 15;
    return { load, cap };
  }, [current, p.str]);

  /* =========================
     GAME
     ========================= */

  return (
    <main style={styles.game}>
      <div style={styles.status}>
        HP {p.hp}/{p.maxHp} • Gold {current.gold} •
        Load {status.load}/{status.cap}
      </div>

      {rules.length > 0 && (
        <div style={styles.rules}>
          {rules.map((r, i) => <div key={i}>{r}</div>)}
        </div>
      )}

      <div style={styles.log}>
        {current.log.slice(-40).map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

      <input
        style={styles.input}
        placeholder="attack | loot | rest"
        value={input}
        onChange={e => setInput(e.target.value)}
      />

      <button style={styles.button} onClick={act}>
        Act
      </button>

      <button
        style={styles.subtle}
        onClick={() => exportLog("narrative")}
      >
        Download Narrative
      </button>

      <button
        style={styles.subtle}
        onClick={() => exportLog("raw")}
      >
        Download Raw Log
      </button>

      <button
        style={styles.subtle}
        onClick={() => {
          setCurrent(null);
          setScreen("menu");
        }}
      >
        Save & Exit
      </button>
    </main>
  );

  /* =========================
     ACTION HANDLER
     ========================= */

  function act() {
    if (!input) return;

    setCurrent(prev => {
      const log = [...prev.log, `> ${input}`];
      const rulesOut = [];
      const updated = {
        ...prev,
        enemies: prev.enemies.map(e => ({ ...e }))
      };

      if (input === "attack") {
        const enemy = updated.enemies.find(e => e.alive);
        if (enemy) {
          const atk = d20(mod(p.str));
          rulesOut.push(`[ATTACK] ${atk.total}`);
          if (atk.total >= 12) {
            const dmg = roll(8) + mod(p.str);
            enemy.hp -= dmg;
            log.push(`You hit for ${dmg}.`);
            if (enemy.hp <= 0) {
              enemy.alive = false;
              log.push("Your enemy falls.");
            }
          } else {
            log.push("You miss.");
          }
        }
      }

      if (input === "loot") {
        updated.gold += roll(20);
        updated.inventory.push({ name: "Scrap", weight: 2 });
        log.push("You gather what remains.");
      }

      if (input === "rest") {
        updated.player.hp = Math.min(
          p.maxHp,
          p.hp + roll(8)
        );
        log.push("You rest uneasily.");
      }

      updated.log = log;
      setRules(rulesOut);
      setInput("");
      return updated;
    });
  }

  /* =========================
     HELPERS
     ========================= */

  function newGame() {
    const c = {
      id: `c-${Date.now()}`,
      name: "A Bleak Road",
      log: ["Cold rain falls. You are alone."],
      gold: 0,
      inventory: [],
      player: {
        str: 14,
        dex: 14,
        con: 12,
        hp: 12,
        maxHp: 12
      },
      enemies: [{ name: "Bandit", hp: 8, alive: true }]
    };

    setCampaigns(cs => [...cs, c]);
    setCurrent(c);
  }

  function exportLog(type) {
    const text =
      type === "narrative"
        ? current.log.filter(l => !l.startsWith(">")).join("\n\n")
        : current.log.join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${current.name}-${type}.txt`;
    a.click();
  }
}

/* =========================
   STYLES
   ========================= */

const styles = {
  container: {
    background: "#000",
    color: "#ddd",
    minHeight: "100vh",
    padding: 24
  },
  game: {
    background: "#000",
    color: "#ddd",
    minHeight: "100vh",
    padding: 16
  },
  button: {
    width: "100%",
    padding: 12,
    background: "#111",
    color: "#ddd",
    border: "1px solid #222"
  },
  danger: {
    background: "#400",
    color: "#fff",
    border: "none",
    padding: 12
  },
  subtle: {
    background: "none",
    color: "#666",
    border: "none",
    marginTop: 8
  },
  input: {
    width: "100%",
    padding: 12,
    background: "#111",
    color: "#ddd"
  },
  rules: {
    fontFamily: "monospace",
    background: "#111",
    padding: 8,
    marginBottom: 8
  },
  log: {
    whiteSpace: "pre-wrap",
    marginBottom: 16
  },
  status: {
    fontSize: 12,
    color: "#aaa",
    marginBottom: 8
  },
  row: {
    display: "flex",
    gap: 8,
    marginBottom: 8
  },
  confirmOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  },
  confirmBox: {
    background: "#111",
    border: "1px solid #333",
    padding: 20,
    width: "90%",
    maxWidth: 320,
    textAlign: "center"
  }
};
