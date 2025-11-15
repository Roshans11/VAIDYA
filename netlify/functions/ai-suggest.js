// netlify/functions/ai-suggest.js
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    // If you protected with Firebase ID token, parse here. For test, skip auth.
    const body = JSON.parse(event.body || '{}');
    const symptoms = body.symptoms || [];

    // Basic validation
    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No symptoms provided' }) };
    }

    // Replace: use your OPENAI_KEY from Netlify env vars
    const OPENAI_KEY = process.env.OPENAI_KEY;
    if (!OPENAI_KEY) return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured' }) };

    const prompt = `Symptoms: ${symptoms.join(', ')}. Give short possible causes and next steps.`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: 'You are a clinical assistant.' }, { role: 'user', content: prompt }],
        max_tokens: 700,
        temperature: 0
      })
    });

    if (!resp.ok) {
      const t = await resp.text();
      return { statusCode: 502, body: JSON.stringify({ error: 'AI provider error', details: t }) };
    }

    const json = await resp.json();
    const aiText = json.choices?.[0].message?.content || '';

    return {
      statusCode: 200,
      body: JSON.stringify({ aiText })
    };
  } catch (err) {
    console.error('Function error', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || err }) };
  }
};
