import { useState } from "react";

export default function Home() {
  const [log, setLog] = useState([
    "Cold rain falls on the Ashfall Road. Smoke rises ahead."
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input) return;
    setLog([...log, `> ${input}`, "The world responds..."]);
    setInput("");
  };

  return (
    <main style={{ background:"#0b0b0b", color:"#ddd", minHeight:"100vh", padding:20 }}>
      <h1>Mythweaver DM</h1>
      <div style={{ whiteSpace:"pre-wrap", marginBottom:20 }}>
        {log.join("\n")}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="What do you do?"
        style={{ width:"100%", padding:10 }}
      />
      <button onClick={send} style={{ marginTop:10 }}>
        Act
      </button>
    </main>
  );
}
