import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

app.post('/api/parse-plan', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing.' });
    }

    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text input is required.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `You are a fitness expert. Convert the following workout plan text into a structured JSON array of exercises. 
Output ONLY a JSON array with this exact structure (no markdown, no extra text):
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      res.json(parsed);
    } else {
      res.status(500).json({ error: 'Empty response from Gemini API.' });
    }
  } catch (error) {
    console.error('Error parsing plan:', error);
    res.status(500).json({ error: 'Failed to parse plan text.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
