// netlify/functions/ai-suggest.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const symptoms = body.symptoms || [];

    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ message: 'No symptoms provided' }) };
    }

    const OPENAI_KEY = process.env.OPENAI_KEY || process.env.GROQ_API_KEY; // support either name
    if (!OPENAI_KEY) {
      return { statusCode: 500, body: JSON.stringify({ message: 'Server not configured: missing API key' }) };
    }

    const prompt = `Symptoms: ${symptoms.join(', ')}. Give short possible causes and next steps.`;

   const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${OPENAI_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'mixtral-8x7b-32768',   // <-- switch here
    messages: [
      { role: 'system', content: 'You are a clinical assistant.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 700,
    temperature: 0
  })
});


    const text = await resp.text();
    let json;
    try { json = JSON.parse(text); } catch(e) { json = null; }

    if (!resp.ok) {
      // include status and any provider message
      return {
        statusCode: 502,
        body: JSON.stringify({
          message: 'AI provider error',
          status: resp.status,
          details: json || text
        })
      };
    }

    // success: normalize response
    const aiText = json?.choices?.[0]?.message?.content ?? (json?.error ?? text);
    return {
      statusCode: 200,
      body: JSON.stringify({ aiText })
    };

  } catch (err) {
    console.error('Function error', err);
    return { statusCode: 500, body: JSON.stringify({ message: 'Function error', details: err.message || String(err) }) };
  }
};
