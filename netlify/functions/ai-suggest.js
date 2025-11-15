import fetch from 'node-fetch';  // or use global fetch if available

export async function handler(event, context) {
  const OPENAI_KEY = process.env.OPENAI_KEY;

  if (!OPENAI_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing API key" })
    };
  }

  const requestBody = JSON.parse(event.body || "{}");

  const result = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: requestBody.prompt }]
    })
  });

  const data = await result.json();
  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
}
