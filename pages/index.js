import { useEffect, useState } from "react";

export default function Home() {
  const [screen, setScreen] = useState("menu"); // menu | load | game
  const [campaigns, setCampaigns] = useState([]);
  const [current, setCurrent] = useState(null);
  const [input, setInput] = useState("");

  // Load campaigns
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("campaigns") || "[]");
    setCampaigns(saved);
  }, []);

  // Save campaigns
  useEffect(() => {
    localStorage.setItem("campaigns", JSON.stringify(campaigns));
  }, [campaigns]);

  function startNewAdventure() {
    const campaign = {
      id: `campaign-${Date.now()}`,
      name: "A New, Unwritten Road",
      tone: "Dark",
      ruleset: "5e-strict",
      lastPlayed: new Date().toISOString(),
      log: [
        "Cold rain falls on an unfamiliar road.",
        "You have chosen to walk it alone."
      ]
    };

    setCampaigns([...campaigns, campaign]);
    setCurrent(campaign);
    setScreen("game");
  }

  function loadCampaign(c) {
    setCurrent(c);
    setScreen("game");
  }

  function send() {
    if (!input) return;

    const updated = {
      ...current,
      lastPlayed: new Date().toISOString(),
      log: [...current.log, `> ${input}`, "The world listens..."]
    };

    setCurrent(updated);
    setCampaigns(campaigns.map(c => (c.id === updated.id ? updated : c)));
    setInput("");
  }

  // =================
  // START MENU
  // =================
  if (screen === "menu") {
    return (
      <main style={styles.container}>
        <h1 style={styles.title}>MYTHWEAVER DM</h1>

        {campaigns.length > 0 && (
          <button style={styles.button} onClick={() => loadCampaign(campaigns[0])}>
            Continue Last Adventure
          </button>
        )}

        <button style={styles.button} onClick={() => setScreen("load")}>
          Load Adventure
        </button>

        <button style={styles.button} onClick={startNewAdventure}>
          New Adventure
        </button>

        <p style={styles.footer}>Elarion • The Dying Century</p>
      </main>
    );
  }

  // =================
  // LOAD SCREEN
  // =================
  if (screen === "load") {
    return (
      <main style={styles.container}>
        <h1 style={styles.title}>Load Adventure</h1>

        {campaigns.map(c => (
          <button key={c.id} style={styles.button} onClick={() => loadCampaign(c)}>
            {c.name}
          </button>
        ))}

        <button style={styles.subtle} onClick={() => setScreen("menu")}>
          ← Back
        </button>
      </main>
    );
  }

  // =================
  // GAME SCREEN
  // =================
  return (
    <main style={styles.game}>
      <div style={styles.log}>
        {current.log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

      <input
        style={styles.input}
        placeholder="What do you do?"
        value={input}
        onChange={e => setInput(e.target.value)}
      />

      <button style={styles.button} onClick={send}>
        Act
      </button>

      <button style={styles.subtle} onClick={() => setScreen("menu")}>
        Save & Exit
      </button>
    </main>
  );
}

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
  title: {
    letterSpacing: 2
  },
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
    border: "none",
    marginTop: 12
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
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 8,
    background: "#111",
    color: "#ddd",
    border: "1px solid #222"
  }
};
