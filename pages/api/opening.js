export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { universe } = req.body;

  if (!universe || !universe.description) {
    return res.status(400).json({ error: "Universe description required" });
  }

  const prompt = `
You are a Dungeon Master running a dark, solo D&D 5e campaign.

Universe Name: ${universe.name}
Tone: ${universe.tone}
Themes: ${universe.themes}

World Description:
${universe.description}

Task:
Write a dark, atmospheric opening scene.
Do NOT explain rules.
Do NOT address the player directly.
End with a clear moment of tension.
Keep it under 120 words.
`;

  // TEMPORARY PLACEHOLDER RESPONSE (NO API KEY YET)
  // This allows the app to work immediately.
  // We will swap this for real AI next.
  const opening = `
Cold air settles over a nameless road.

The land feels wrong here — too quiet, too patient.
Somewhere nearby, something waits, unseen.

Your journey begins without ceremony.
`;

  res.status(200).json({ opening });
}
