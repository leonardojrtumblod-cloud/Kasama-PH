import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs';

async function analyzeImage() {
  const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY! });
  const imageBytes = fs.readFileSync('public/kasama-grandparents-celebration.webp').toString('base64');
  
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: {
      parts: [
        {
          inlineData: {
            data: imageBytes,
            mimeType: "image/webp"
          }
        },
        { text: "Describe this image in detail. What is it showing? Is it a screenshot of a website? What needs to be fixed?" }
      ]
    }
  });
  
  console.log(response.text);
}

analyzeImage().catch(console.error);
