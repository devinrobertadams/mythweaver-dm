import { useEffect, useState } from "react";

/* =========================
   D&D 5e UTILITIES
   ========================= */

function mod(score) {
  return Math.floor((score - 10) / 2);
}

function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function rollD20(modifier = 0) {
  const roll = rollDie(20);
  return { roll, modifier, total: roll + modifier };
}

function rollDamage(dice, modifier = 0) {
  return rollDie(dice) + modifier;
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
          <button style={styles.button} onClick={() => {
            setCurrent(campaigns[0]);
            setScreen("game");
          }}>
            Continue
          </button>
        )}

        <button style={styles.button} onClick={() => setScreen("load")}>
          Load Adventure
        </button>

        <button style={styles.button} onClick={() => setScreen("new")}>
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
          <button key={c.id} style={styles.button} onClick={() => {
            setCurrent(c);
            setScreen("game");
          }}>
            {c.name}
          </button>
        ))}
        <button style={styles.subtle} onClick={() => setScreen("menu")}>← Back</button>
      </main>
    );
  }

  /* =========================
     NEW ADVENTURE + CHARACTER
     ========================= */

  if (screen === "new") {
    return (
      <main style={styles.container}>
        <h1 style={styles.title}>Create Character</h1>

        <button
          style={styles.button}
          onClick={() => {
            const character = {
              name: "Wanderer",
              str: 14,
              dex: 14,
              con: 12,
              int: 10,
              wis: 10,
              cha: 8,
              hp: 10 + mod(12),
              maxHp: 10 + mod(12),
              deathFails: 0,
              alive: true
            };

            const campaign = {
              id: `campaign-${Date.now()}`,
              name: "Ashfall Road",
              log: ["Cold rain falls. Something watches from the dark."],
              player: character,
              enemy: {
                name: "Roadside Bandit",
                hp: 8,
                alive: true
              },
              combat: null
            };

            setCampaigns([...campaigns, campaign]);
            setCurrent(campaign);
            setScreen("sheet");
          }}
        >
          Create Character
        </button>
      </main>
    );
  }

  /* =========================
     CHARACTER SHEET
     ========================= */

  if (screen === "sheet") {
    const p = current.player;
    return (
      <main style={styles.game}>
        <h2>{p.name}</h2>

        {["str","dex","con","int","wis","cha"].map(stat => (
          <div key={stat} style={styles.statRow}>
            <span>{stat.toUpperCase()}</span>
            <input
              type="number"
              value={p[stat]}
              onChange={e => {
                const updated = {
                  ...current,
                  player: { ...p, [stat]: Number(e.target.value) }
                };
                setCurrent(updated);
              }}
            />
            <span>mod {mod(p[stat])}</span>
          </div>
        ))}

        <div>HP: {p.hp} / {p.maxHp}</div>

        <button style={styles.button} onClick={() => setScreen("game")}>
          Begin Adventure
        </button>
      </main>
    );
  }

  /* =========================
     GAME + COMBAT
     ========================= */

  const p = current.player;
  const e = current.enemy;
  const inCombat = current.combat !== null;

  return (
    <main style={styles.game}>
      {rulesLog.length > 0 && (
        <div style={styles.rules}>
          {rulesLog.map((r,i) => <div key={i}>{r}</div>)}
        </div>
      )}

      <div style={styles.log}>
        {current.log.map((l,i) => <div key={i}>{l}</div>)}
      </div>

      {p.alive ? (
        <>
          <input
            style={styles.input}
            placeholder={inCombat ? "attack" : "What do you do?"}
            value={input}
            onChange={e => setInput(e.target.value)}
          />

          <button style={styles.button} onClick={act}>Act</button>
        </>
      ) : (
        <div style={styles.dead}>You are dead.</div>
      )}

      <button style={styles.subtle} onClick={() => setScreen("menu")}>
        Save & Exit
      </button>
    </main>
  );

  /* =========================
     ACTION HANDLER
     ========================= */

  function act() {
    if (!input) return;

    let log = [...current.log, `> ${input}`];
    let rules = [];
    let updated = { ...current };

    if (input === "attack") {
      if (!updated.combat) {
        const initP = rollD20(mod(p.dex));
        const initE = rollD20(1);
        updated.combat = { turn: initP.total >= initE.total ? "player" : "enemy" };
        rules.push(`[INIT] You ${initP.total} | Enemy ${initE.total}`);
        log.push("Combat begins.");
      } else if (updated.combat.turn === "player") {
        const atk = rollD20(mod(p.str));
        rules.push(`[ATTACK] ${atk.total}`);
        if (atk.total >= 12) {
          const dmg = rollDamage(8, mod(p.str));
          updated.enemy.hp -= dmg;
          log.push(`You hit for ${dmg}.`);
          if (updated.enemy.hp <= 0) {
            log.push("Enemy dies.");
            updated.combat = null;
          }
        } else {
          log.push("You miss.");
        }
        updated.combat && (updated.combat.turn = "enemy");
      } else {
        const atk = rollD20(2);
        rules.push(`[ENEMY] ${atk.total}`);
        if (atk.total >= 12) {
          const dmg = rollDamage(6, 1);
          updated.player.hp -= dmg;
          log.push(`You take ${dmg}.`);
          if (updated.player.hp <= 0) {
            updated.player.deathFails += 1;
            log.push("You are dying.");
            if (updated.player.deathFails >= 3) {
              updated.player.alive = false;
              log.push("You bleed out.");
              updated.combat = null;
            }
          }
        } else {
          log.push("Enemy misses.");
        }
        updated.combat && (updated.combat.turn = "player");
      }
    }

    updated.log = log;
    setCurrent(updated);
    setRulesLog(rules);
    setCampaigns(campaigns.map(c => c.id === updated.id ? updated : c));
    setInput("");
  }
}

/* =========================
   STYLES
   ========================= */

const styles = {
  container: {
    background:"#000",
    color:"#ddd",
    minHeight:"100vh",
    padding:24,
    display:"flex",
    flexDirection:"column",
    gap:16,
    justifyContent:"center",
    alignItems:"center"
  },
  title:{letterSpacing:2},
  button:{
    width:"100%",
    padding:14,
    background:"#111",
    color:"#ddd",
    border:"1px solid #222"
  },
  subtle:{
    background:"none",
    color:"#666",
    border:"none"
  },
  footer:{fontSize:12,color:"#444"},
  game:{
    background:"#000",
    color:"#ddd",
    minHeight:"100vh",
    padding:16
  },
  log:{whiteSpace:"pre-wrap",marginBottom:16},
  rules:{
    background:"#0a0a0a",
    border:"1px solid #222",
    padding:12,
    marginBottom:12,
    fontFamily:"monospace"
  },
  input:{
    width:"100%",
    padding:12,
    background:"#111",
    color:"#ddd",
    border:"1px solid #222"
  },
  statRow:{
    display:"flex",
    gap:8,
    alignItems:"center"
  },
  dead:{color:"#900",fontWeight:"bold"}
};
