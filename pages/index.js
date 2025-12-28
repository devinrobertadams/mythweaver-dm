import { useEffect, useMemo, useState } from "react";

/* =======================
   ENGINE (PURE FUNCTIONS)
   ======================= */

const mod = s => Math.floor((s - 10) / 2);
const roll = d => Math.floor(Math.random() * d) + 1;
const d20 = m => ({ roll: roll(20), total: roll(20) + m });

function narrate(ctx) {
  if (ctx.enemyDown) return "The body falls. Silence follows.";
  if (ctx.lowHp) return "Pain sharpens every breath.";
  if (ctx.exhausted) return "Your limbs feel leaden.";
  if (ctx.success) return "You gain ground, briefly.";
  return "The world resists you.";
}

/* =======================
   APP
   ======================= */

export default function Home() {
  const [screen, setScreen] = useState("menu");
  const [campaigns, setCampaigns] = useState([]);
  const [current, setCurrent] = useState(null);
  const [input, setInput] = useState("");
  const [rulesLog, setRulesLog] = useState([]);

  /* ---------- SAFE LOAD ---------- */
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = JSON.parse(
        window.localStorage.getItem("campaigns") || "[]"
      );
      setCampaigns(saved);
    }
  }, []);

  /* ---------- SAFE SAVE ---------- */
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("campaigns", JSON.stringify(campaigns));
    }
  }, [campaigns]);

  /* =======================
     MENU
     ======================= */

  if (screen === "menu") {
    return (
      <main style={styles.container}>
        <h1>MYTHWEAVER DM</h1>

        {campaigns.map(c => (
          <div key={c.id} style={styles.row}>
            <button
              style={styles.button}
              onClick={() => {
                setCurrent(c);
                setScreen("game");
              }}
            >
              {c.name}
            </button>
            <button
              style={styles.danger}
              onClick={() =>
                setCampaigns(cs => cs.filter(x => x.id !== c.id))
              }
            >
              ✕
            </button>
          </div>
        ))}

        <button style={styles.button} onClick={newGame}>
          New Adventure
        </button>
      </main>
    );
  }

  /* =======================
     GUARD AGAINST NULL
     ======================= */

  if (!current) {
    return <main style={styles.container}>Loading...</main>;
  }

  /* =======================
     DERIVED STATE
     ======================= */

  const p = current.player;

  const encumbrance = useMemo(() => {
    const load = current.inventory.reduce((s, i) => s + i.weight, 0);
    const cap = p.str * 15;
    return { load, cap, enc: load > cap };
  }, [current, p.str]);

  /* =======================
     GAME
     ======================= */

  return (
    <main style={styles.game}>
      <div style={styles.status}>
        HP {p.hp}/{p.maxHp} • Gold {current.gold} •
        Load {encumbrance.load}/{encumbrance.cap}
      </div>

      {rulesLog.length > 0 && (
        <div style={styles.rules}>
          {rulesLog.map((r, i) => (
            <div key={i}>{r}</div>
          ))}
        </div>
      )}

      <div style={styles.log}>
        {current.log.slice(-50).map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

      <input
        style={styles.input}
        value={input}
        placeholder="attack | rest | loot"
        onChange={e => setInput(e.target.value)}
      />

      <button style={styles.button} onClick={act}>
        Act
      </button>

      <button style={styles.subtle} onClick={() => setScreen("menu")}>
        Save & Exit
      </button>
    </main>
  );

  /* =======================
     ACTION HANDLER
     ======================= */

  function act() {
    if (!input) return;

    setCurrent(prev => {
      const log = [...prev.log, `> ${input}`];
      const rules = [];
      const updated = {
        ...prev,
        enemies: prev.enemies.map(e => ({ ...e }))
      };

      if (input === "attack") {
        for (const e of updated.enemies) {
          if (!e.alive) continue;

          const atk = d20(mod(p.str));
          rules.push(`[ATTACK ${e.name}] ${atk.total}`);

          if (atk.total >= 12) {
            const dmg = roll(8) + mod(p.str);
            e.hp -= dmg;
            log.push(`You hit ${e.name} for ${dmg}.`);

            if (e.hp <= 0) {
              e.alive = false;
              log.push(narrate({ enemyDown: true }));
            }
          } else {
            log.push(`You miss ${e.name}.`);
          }
          break;
        }
      }

      if (input === "loot") {
        updated.gold += roll(20);
        updated.inventory.push({ name: "Salvage", weight: 2 });
        log.push("You scavenge what remains.");
      }

      if (input === "rest") {
        updated.player.hp = Math.min(
          p.maxHp,
          p.hp + roll(8)
        );
        log.push("You rest uneasily.");
      }

      updated.log = log;
      setRulesLog(rules);
      setInput("");
      return updated;
    });
  }

  /* =======================
     NEW GAME
     ======================= */

  function newGame() {
    const c = {
      id: `c-${Date.now()}`,
      name: "A Bleak Road",
      log: ["Cold rain falls. The world does not wait."],
      gold: 0,
      inventory: [],
      player: {
        str: 14,
        dex: 14,
        con: 12,
        hp: 12,
        maxHp: 12
      },
      enemies: [
        { name: "Bandit", hp: 8, alive: true },
        { name: "Scout", hp: 6, alive: true }
      ]
    };

    setCampaigns(cs => [...cs, c]);
    setCurrent(c);
    setScreen("game");
  }
}

/* =======================
   STYLES
   ======================= */

const styles = {
  container: { background:"#000", color:"#ddd", minHeight:"100vh", padding:24 },
  game:{ background:"#000", color:"#ddd", minHeight:"100vh", padding:16 },
  button:{ width:"100%", padding:12, background:"#111", color:"#ddd", border:"1px solid #222" },
  danger:{ background:"#400", color:"#fff", border:"none", padding:12 },
  subtle:{ background:"none", color:"#666", border:"none", marginTop:8 },
  input:{ width:"100%", padding:12, background:"#111", color:"#ddd" },
  rules:{ fontFamily:"monospace", background:"#111", padding:8, marginBottom:8 },
  log:{ whiteSpace:"pre-wrap", marginBottom:16 },
  status:{ fontSize:12, color:"#aaa" },
  row:{ display:"flex", gap:8 }
};
