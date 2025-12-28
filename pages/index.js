import { useEffect, useState } from "react";

/* =========================================================
   ENGINE MODULES (LOGIC-ONLY, CLEANLY SEPARATED)
   ========================================================= */

/* ---------- Dice & Math ---------- */
const mod = s => Math.floor((s - 10) / 2);
const roll = d => Math.floor(Math.random() * d) + 1;
const d20 = m => {
  const r = roll(20);
  return { roll: r, total: r + m };
};

/* ---------- Encumbrance ---------- */
function encumbrance(player, inventory) {
  const capacity = player.str * 15;
  const load = inventory.reduce((s, i) => s + i.weight, 0);
  return { load, capacity, encumbered: load > capacity };
}

/* ---------- Exhaustion ---------- */
function exhaustionPenalty(level) {
  return level > 0 ? -2 * level : 0;
}

/* ---------- AI DM (LLM-READY STUB) ---------- */
async function aiNarrate(context) {
  // Replace this body with a real LLM call later
  if (context.enemyDown) return "The last breath leaves the body. Silence spreads.";
  if (context.lowHp) return "Pain narrows your vision. Survival feels uncertain.";
  if (context.exhausted) return "Each movement feels heavier than the last.";
  if (context.success) return "For now, fortune favors you.";
  return "The world resists your will.";
}

/* ---------- World Timeline ---------- */
function advanceWorld(campaign) {
  const time = campaign.timeline.turn + 1;
  const events = [];

  if (time % 3 === 0) {
    events.push("A distant settlement falls silent.");
  }
  if (campaign.player.exhaustion >= 2) {
    events.push("Rumors spread of a weakened traveler.");
  }

  return {
    ...campaign,
    timeline: {
      turn: time,
      events: [...campaign.timeline.events, ...events]
    }
  };
}

/* =========================================================
   APP
   ========================================================= */

export default function Home() {
  const [screen, setScreen] = useState("menu");
  const [campaigns, setCampaigns] = useState([]);
  const [current, setCurrent] = useState(null);
  const [input, setInput] = useState("");
  const [rulesLog, setRulesLog] = useState([]);

  /* ---------- Persistence ---------- */
  useEffect(() => {
    setCampaigns(JSON.parse(localStorage.getItem("campaigns") || "[]"));
  }, []);

  useEffect(() => {
    localStorage.setItem("campaigns", JSON.stringify(campaigns));
  }, [campaigns]);

  /* =========================================================
     MENU
     ========================================================= */

  if (screen === "menu") {
    return (
      <main style={styles.container}>
        <h1>MYTHWEAVER DM</h1>

        {campaigns.map(c => (
          <div key={c.id} style={styles.row}>
            <button style={styles.button} onClick={() => {
              setCurrent(c);
              setScreen("game");
            }}>
              {c.name}
            </button>
            <button style={styles.danger} onClick={() => {
              setCampaigns(campaigns.filter(x => x.id !== c.id));
            }}>
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

  /* =========================================================
     GAME
     ========================================================= */

  const p = current.player;
  const enc = encumbrance(p, current.inventory);

  return (
    <main style={styles.game}>
      <div style={styles.status}>
        HP {p.hp}/{p.maxHp} • Gold {current.gold} • Load {enc.load}/{enc.capacity}
        • Exhaustion {p.exhaustion}
      </div>

      {rulesLog.length > 0 && (
        <div style={styles.rules}>
          {rulesLog.map((r,i) => <div key={i}>{r}</div>)}
        </div>
      )}

      <div style={styles.log}>
        {current.log.map((l,i) => <div key={i}>{l}</div>)}
      </div>

      <input
        style={styles.input}
        placeholder="attack | cast | rest | loot"
        value={input}
        onChange={e => setInput(e.target.value)}
      />

      <button style={styles.button} onClick={act}>Act</button>

      <button style={styles.subtle} onClick={() => exportLog("narrative")}>
        Download Narrative
      </button>

      <button style={styles.subtle} onClick={() => exportLog("raw")}>
        Download Raw Log
      </button>

      <button style={styles.subtle} onClick={() => setScreen("menu")}>
        Save & Exit
      </button>
    </main>
  );

  /* =========================================================
     ACTION HANDLER
     ========================================================= */

  async function act() {
    if (!input) return;

    let log = [...current.log, `> ${input}`];
    let rules = [];
    let updated = { ...current };

    const penalty = exhaustionPenalty(p.exhaustion) + (enc.encumbered ? -2 : 0);

    /* ---------- ATTACK (MULTI-ENEMY) ---------- */
    if (input === "attack") {
      updated.enemies = updated.enemies.map(e => {
        if (!e.alive) return e;

        const atk = d20(mod(p.str) + penalty);
        rules.push(`[ATTACK vs ${e.name}] ${atk.total}`);

        if (atk.total >= 12) {
          const dmg = roll(8) + mod(p.str);
          e.hp -= dmg;
          log.push(`You strike ${e.name} for ${dmg}.`);

          if (e.hp <= 0) {
            e.alive = false;
            log.push(await aiNarrate({ enemyDown: true }));
          }
        } else {
          log.push(`Your blow misses ${e.name}.`);
        }
        return e;
      });
    }

    /* ---------- CAST ---------- */
    if (input === "cast") {
      if (p.spellSlots <= 0) {
        log.push("No spell slots remain.");
      } else {
        updated.player.spellSlots--;
        const spell = d20(mod(p.int) + penalty);
        rules.push(`[SPELL] ${spell.total}`);

        if (spell.total >= 12) {
          const dmg = roll(10) + mod(p.int);
          updated.enemies[0].hp -= dmg;
          log.push(`Magic scorches flesh for ${dmg}.`);
        } else {
          log.push("The spell fails.");
        }
      }
    }

    /* ---------- REST ---------- */
    if (input === "rest") {
      updated.player.hp = Math.min(p.maxHp, p.hp + roll(8));
      if (enc.encumbered) updated.player.exhaustion++;
      log.push("You rest, uneasily.");
    }

    /* ---------- LOOT ---------- */
    if (input === "loot") {
      updated.gold += roll(20);
      updated.inventory.push({ name: "Salvage", weight: 2 });
      log.push("You scavenge what remains.");
    }

    /* ---------- WORLD ADVANCE ---------- */
    updated = advanceWorld(updated);

    updated.log = log;
    setRulesLog(rules);
    setCurrent(updated);
    setCampaigns(campaigns.map(c => c.id === updated.id ? updated : c));
    setInput("");
  }

  /* =========================================================
     HELPERS
     ========================================================= */

  function newGame() {
    const campaign = {
      id: `c-${Date.now()}`,
      name: "A Bleak Road",
      log: ["Cold rain falls. The world does not wait."],
      gold: 0,
      inventory: [],
      timeline: { turn: 0, events: [] },
      player: {
        str: 14, dex: 14, con: 12, int: 12,
        hp: 12, maxHp: 12,
        spellSlots: 2,
        exhaustion: 0
      },
      enemies: [
        { name: "Bandit", hp: 8, alive: true },
        { name: "Scout", hp: 6, alive: true }
      ]
    };

    setCampaigns([...campaigns, campaign]);
    setCurrent(campaign);
    setScreen("game");
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

/* =========================================================
   STYLES
   ========================================================= */

const styles = {
  container:{background:"#000",color:"#ddd",minHeight:"100vh",padding:24},
  game:{background:"#000",color:"#ddd",minHeight:"100vh",padding:16},
  button:{width:"100%",padding:12,background:"#111",color:"#ddd",border:"1px solid #222"},
  danger:{background:"#400",color:"#fff",border:"none",padding:12},
  subtle:{background:"none",color:"#666",border:"none",marginTop:8},
  input:{width:"100%",padding:12,background:"#111",color:"#ddd"},
  rules:{fontFamily:"monospace",background:"#111",padding:8,marginBottom:8},
  log:{whiteSpace:"pre-wrap",marginBottom:16},
  status:{fontSize:12,color:"#aaa"},
  row:{display:"flex",gap:8}
};
