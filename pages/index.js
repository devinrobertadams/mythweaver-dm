import { useEffect, useState } from "react";

/* =========================
   D&D 5e CORE UTILITIES
   ========================= */

function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function rollD20(mod = 0) {
  const roll = rollDie(20);
  return { roll, mod, total: roll + mod };
}

function rollDamage(dice, mod = 0) {
  return rollDie(dice) + mod;
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
     NEW ADVENTURE
     ========================= */

  if (screen === "new") {
    return (
      <main style={styles.container}>
        <h1 style={styles.title}>A Hostile Road Awaits</h1>

        <button
          style={styles.button}
          onClick={() => {
            const campaign = {
              id: `campaign-${Date.now()}`,
              name: "Ashfall Road",
              log: ["Cold rain falls. Something moves in the dark."],

              // PLAYER
              player: {
                hp: 12,
                maxHp: 12,
                deathFails: 0,
                alive: true
              },

              // ENEMY
              enemy: {
                name: "Roadside Bandit",
                hp: 8,
                maxHp: 8,
                alive: true
              },

              combat: null
            };

            setCampaigns([...campaigns, campaign]);
            setCurrent(campaign);
            setScreen("game");
          }}
        >
          Begin
        </button>
      </main>
    );
  }

  /* =========================
     GAME
     ========================= */

  const inCombat = current.combat !== null;

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

      {current.player.alive ? (
        <>
          <input
            style={styles.input}
            placeholder={inCombat ? "attack" : "What do you do?"}
            value={input}
            onChange={e => setInput(e.target.value)}
          />

          <button
            style={styles.button}
            onClick={() => handleAction()}
          >
            Act
          </button>
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

  function handleAction() {
    if (!input) return;

    let newLog = [...current.log, `> ${input}`];
    let newRules = [];
    let updated = { ...current };

    // START COMBAT
    if (input === "attack" && !current.combat) {
      const playerInit = rollD20(2);
      const enemyInit = rollD20(1);

      updated.combat = {
        turn: playerInit.total >= enemyInit.total ? "player" : "enemy"
      };

      newRules.push(
        `[INITIATIVE]`,
        `You: ${playerInit.total} | Enemy: ${enemyInit.total}`
      );

      newLog.push("Steel is drawn.");
    }

    // PLAYER TURN
    else if (input === "attack" && current.combat?.turn === "player") {
      const attack = rollD20(4);
      newRules.push(
        `[ATTACK] Roll: ${attack.roll} + 4 = ${attack.total}`
      );

      if (attack.total >= 12) {
        const dmg = rollDamage(8, 2);
        updated.enemy.hp -= dmg;
        newRules.push(`Hit! Damage: ${dmg}`);
        newLog.push(`You wound the ${updated.enemy.name}.`);

        if (updated.enemy.hp <= 0) {
          updated.enemy.alive = false;
          updated.combat = null;
          newLog.push("Your enemy collapses. Combat ends.");
        }
      } else {
        newLog.push("Your attack misses.");
      }

      updated.combat && (updated.combat.turn = "enemy");
    }

    // ENEMY TURN
    else if (current.combat?.turn === "enemy") {
      const attack = rollD20(3);
      newRules.push(
        `[ENEMY ATTACK] Roll: ${attack.roll} + 3 = ${attack.total}`
      );

      if (attack.total >= 12) {
        const dmg = rollDamage(6, 1);
        updated.player.hp -= dmg;
        newLog.push(`You are hit for ${dmg} damage.`);

        if (updated.player.hp <= 0) {
          updated.player.deathFails += 1;
          newLog.push("You fall, bleeding.");

          if (updated.player.deathFails >= 3) {
            updated.player.alive = false;
            newLog.push("You bleed out. The world moves on.");
            updated.combat = null;
          }
        }
      } else {
        newLog.push("The enemy misses.");
      }

      updated.combat && (updated.combat.turn = "player");
    }

    updated.log = newLog;
    setCurrent(updated);
    setRulesLog(newRules);
    setCampaigns(campaigns.map(c => (c.id === updated.id ? updated : c)));
    setInput("");
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
    fontSize: 13
  },
  input: {
    width: "100%",
    padding: 12,
    background: "#111",
    color: "#ddd",
    border: "1px solid #222"
  },
  dead: {
    color: "#900",
    fontWeight: "bold",
    marginTop: 20
  }
};
