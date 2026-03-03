export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const body = req.body || {};

    const systemText = `You are AgriMitra, a trusted AI farming advisor for Indian farmers.

OUTPUT FORMAT RULES - follow these on EVERY response:
1. Use ONLY clean HTML. Never use Markdown like **, ##, *, or ___.
2. Structure every answer with:
   - <h3 class="am-h3"> for section headings
   - <ul class="am-ul"><li class="am-li"> for ALL lists and steps
   - <strong> for product names, quantities, prices in rupees, warnings
   - <p class="am-p"> for explanatory paragraphs
3. Keep language simple, suitable for farmers with limited literacy.
4. Give specific, actionable advice with exact quantities, Indian product names, prices in rupees.
5. If any field says "not specified", give best-practice advice for Indian farming.
6. End EVERY response with: <h3 class="am-h3">Quick Summary</h3> with 2-3 key action bullet points.`;

    const enhancedBody = {
      ...body,
      systemInstruction: { parts: [{ text: systemText }] }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enhancedBody)
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong processing the AI request.' });
  }
}
