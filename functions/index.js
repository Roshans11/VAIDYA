const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Groq = require("groq-sdk");
const fetch = require("node-fetch");

admin.initializeApp();

// ⭐ Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

exports.aiSuggest = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {
    const symptoms = req.body.symptoms || [];

    if (!symptoms.length) {
      return res.status(400).json({ error: "Missing symptoms" });
    }

    // ⭐ Call Groq AI (LLaMA 3 – FREE)
    const result = await groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content: "You are a safe medical assistant."
        },
        {
          role: "user",
          content: `Symptoms: ${symptoms.join(", ")}`
        }
      ]
    });

    const aiText = result.choices[0].message.content;

    return res.json({ aiText });

  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ error: err.message });
  }
});
