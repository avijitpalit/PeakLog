import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  // Enable CORS if needed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing on Vercel.' });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    const { text } = body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text input is required.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `You are a fitness expert. Convert the following workout plan text into a structured JSON array of exercises. 
Output ONLY a valid JSON array with this exact structure (no markdown fences, no conversational text):
[
  {
    "name": "Exercise Name (e.g. Bench Press)",
    "targetSets": 3, 
    "targetReps": "8-12"
  }
]
If sets/reps are missing, default to 3 sets of "8-12".

Here is the workout plan text:
${text}
`;

    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemma-4-31b-it',
        contents: prompt,
      });
      responseText = response.text || '';
    } catch (gemmaErr) {
      console.warn('Gemma 31B failed on Vercel, falling back to gemini-2.5-flash:', gemmaErr);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
      responseText = fallbackResponse.text || '';
    }

    if (responseText) {
      const cleanJson = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);
      return res.status(200).json(parsed);
    } else {
      return res.status(500).json({ error: 'Empty response from model.' });
    }
  } catch (error) {
    console.error('Error parsing plan on Vercel function:', error);
    return res.status(500).json({ error: 'Failed to parse plan text.' });
  }
}
