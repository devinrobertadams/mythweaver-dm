import { useEffect, useMemo, useState } from "react";

/* =====================
   UTILITIES
   ===================== */
const roll = d => Math.floor(Math.random() * d) + 1;
const mod = s => Math.floor((s - 10) / 2);

/* =====================
   DEFAULT SHAPE
   ===================== */
const EMPTY = {
  id: "",
  name: "",
  log: [],
  gold: 0,
  inventory: [],
  enemies: [],
  player: { str: 10, hp: 10, maxHp: 10 }
};

export default function Home() {
  const [view, setView] = useState("menu"); // menu | game
  const [campaigns, setCampaigns] = useState([]);
  const [active, setActive] = useState(null);
  const [input, setInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  /* ---------- LOAD ---------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = JSON.parse(localStorage.getItem("campaigns") || "[]");
      if (Array.isArray(saved)) setCampaigns(saved);
    } catch {}
  }, []);

  /* ---------- SAVE ---------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("campaigns", JSON.stringify(campaigns));
  }, [campaigns]);

  /* ---------- AUTO NAV ---------- */
  useEffect(() => {
    if (active) setView("game");
  }, [active]);

  /* =====================
     MENU
     ===================== */
  if (view === "menu") {
    return (
      <main style={ui.shell}>
        <h1 style={ui.title}>Mythweaver</h1>

        {campaigns.length === 0 && (
          <p style={ui.muted}>No adventures yet.</p>
        )}

        {campaigns.map(c => (
          <div key={c.id} style={ui.card}>
            <button style={ui.primary} onClick={() => setActive(c)}>
              {c.name}
            </button>
            <button style={ui.danger} onClick={() => setConfirmDelete(c.id)}>
              Delete
            </button>
          </div>
        ))}

        <button style={ui.primary} onClick={newAdventure}>
          New Adventure
        </button>

        {confirmDelete && (
          <ConfirmDelete
            onConfirm={() => {
              setCampaigns(cs => cs.filter(c => c.id !== confirmDelete));
              setConfirmDelete(null);
            }}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
      </main>
    );
  }

  /* =====================
     GAME
     ===================== */
  const game = {
    ...EMPTY,
    ...active,
    player: { ...EMPTY.player, ...active.player }
  };

  const load = useMemo(
    () => game.inventory.reduce((s, i) => s + (i.weight || 0), 0),
    [game.inventory]
  );

  return (
    <main style={ui.shell}>
      <div style={ui.status}>
        HP {game.player.hp}/{game.player.maxHp} • Gold {game.gold}
      </div>

      <div style={ui.log}>
        {game.log.slice(-30).map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

      <input
        style={ui.input}
        placeholder="attack | loot | rest"
        value={input}
        onChange={e => setInput(e.target.value)}
      />

      <button style={ui.primary} onClick={() => act(game)}>
        Act
      </button>

      <button
        style={ui.secondary}
        onClick={() => {
          setActive(null);
          setView("menu");
        }}
      >
        Save & Exit
      </button>
    </main>
  );

  /* =====================
     GAME LOGIC
     ===================== */
  function act(game) {
    if (!input) return;

    const updated = {
      ...game,
      log: [...game.log, `> ${input}`],
      enemies: game.enemies.map(e => ({ ...e }))
    };

    if (input === "attack") {
      const enemy = updated.enemies.find(e => e.alive);
      if (enemy) {
        const hit = roll(20) + mod(game.player.str);
        if (hit >= 12) {
          const dmg = roll(6) + mod(game.player.str);
          enemy.hp -= dmg;
          updated.log.push(`You strike for ${dmg}.`);
          if (enemy.hp <= 0) {
            enemy.alive = false;
            updated.log.push("The enemy falls.");
          }
        } else {
          updated.log.push("You miss.");
        }
      }
    }

    if (input === "loot") {
      updated.gold += roll(10);
      updated.log.push("You scavenge supplies.");
    }

    if (input === "rest") {
      updated.player.hp = Math.min(
        updated.player.maxHp,
        updated.player.hp + roll(6)
      );
      updated.log.push("You rest briefly.");
    }

    setCampaigns(cs => cs.map(c => (c.id === updated.id ? updated : c)));
    setActive(updated);
    setInput("");
  }

  function newAdventure() {
    const c = {
      id: `adv-${Date.now()}`,
      name: "A Bleak Road",
      log: ["Cold rain falls. You are alone."],
      gold: 0,
      inventory: [],
      player: { str: 14, hp: 12, maxHp: 12 },
      enemies: [{ name: "Bandit", hp: 8, alive: true }]
    };
    setCampaigns(cs => [...cs, c]);
    setActive(c);
  }
}

/* =====================
   CONFIRM DELETE
   ===================== */
function ConfirmDelete({ onConfirm, onCancel }) {
  return (
    <div style={ui.overlay}>
      <div style={ui.modal}>
        <p>Delete this adventure?</p>
        <button style={ui.danger} onClick={onConfirm}>Delete</button>
        <button style={ui.secondary} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

/* =====================
   UI STYLES (CLEAN)
   ===================== */
const ui = {
  shell:{background:"#000",color:"#eee",minHeight:"100vh",padding:20},
  title:{marginBottom:16,fontSize:28},
  muted:{opacity:0.6,marginBottom:12},
  card:{marginBottom:12},
  status:{opacity:0.7,marginBottom:10,fontSize:12},
  log:{marginBottom:16,lineHeight:1.5},
  input:{width:"100%",padding:12,fontSize:16,background:"#111",color:"#eee",border:"1px solid #333",borderRadius:6},
  primary:{width:"100%",padding:12,marginTop:8,background:"#222",color:"#fff",border:"none",borderRadius:6},
  secondary:{width:"100%",padding:12,marginTop:8,background:"transparent",color:"#aaa",border:"1px solid #333",borderRadius:6},
  danger:{width:"100%",padding:10,marginTop:6,background:"#400",color:"#fff",border:"none",borderRadius:6},
  overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center"},
  modal:{background:"#111",padding:20,borderRadius:8,width:"90%",maxWidth:300}
};
