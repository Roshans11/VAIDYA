const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    const body = JSON.parse(event.body || '{}');
    const symptoms = body.symptoms || [];

    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No symptoms provided' }) };
    }

    const GROQ_KEY = process.env.OPENAI_KEY; 
    // (Rename later if needed)

    if (!GROQ_KEY) return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured' }) };

    const prompt = `Symptoms: ${symptoms.join(', ')}. Give short possible causes and next steps.`

    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",   // or any Groq model
        messages: [
          { role: "system", content: "You are a clinical assistant." },
          { role: "user", content: prompt }
        ]
      })
    });

    const json = await resp.json();
    const aiText = json.choices?.[0]?.message?.content || "";

    return {
      statusCode: 200,
      body: JSON.stringify({ aiText })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
