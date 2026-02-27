export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Vercel will securely inject this environment variable
  const apiKey = process.env.GEMINI_API_KEY; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body) // Pass the exact data sent from your frontend
    });

    const data = await response.json();
    
    // Send Google's response back to your frontend
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong processing the AI request.' });
  }
}
