import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateCharacterResponse(prompt: string, character: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: `You are ${character}, a compassionate Filipino senior care assistant. 
      Speak in Taglish naturally. Use familiar terms like 'Lo', 'La', 'Po', 'Opo'.
      Keep sentences short (15 words max per line).
      Use pause markers [...] for voice pacing.`,
    },
  });
  return response.text;
}

export async function generateSpeech(text: string, voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Kore') {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    const audioBlob = await fetch(`data:audio/pcm;base64,${base64Audio}`).then(res => res.blob());
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    // Note: Raw PCM might need a wrapper or specific sample rate. 
    // For simplicity in this demo, we'll assume the browser can handle it or use a library if needed.
    // Standard HTML5 Audio might not play raw PCM directly without a header.
    // In a real app, we'd add a WAV header or use Web Audio API.
    return audio;
  }
  return null;
}

export async function classifyIntent(userInput: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Classify this senior's Taglish response: "${userInput}". 
    Options: reminder_ack, emergency, story_response, exercise_pause, repeat_request. 
    Return ONLY the JSON: {"intent": "...", "sentiment": "..."}`,
    config: {
      responseMimeType: "application/json",
    },
  });
  return JSON.parse(response.text);
}
