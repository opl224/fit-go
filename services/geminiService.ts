import { GoogleGenAI } from "@google/genai";

/**
 * Fix: Implementation of the Gemini Coach service.
 * This service analyzes a run session and returns a motivational insight using Gemini 2.5 Flash.
 */
export const getCoachInsight = async (session: any, language: string) => {
  // Always use the API key from process.env.API_KEY
  if (!process.env.API_KEY) {
    console.error("API_KEY is not configured.");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a world-class professional running coach for the "Fit GO" app. 
      Analyze the following run session and provide a brief, high-impact, and motivating insight.
      
      Session Stats:
      - Distance: ${session.distance.toFixed(2)} km
      - Duration: ${Math.floor(session.duration / 60)}m ${session.duration % 60}s
      - Average Pace: ${session.avgPace}
      - Type: ${session.type}
      - Calories: ${session.calories}
      
      The response must be in ${language === 'id' ? 'Indonesian' : 'English'}.
      Keep it punchy, professional, and under 250 characters.`,
    });

    // Access .text property directly as per latest SDK guidelines
    return response.text;
  } catch (error) {
    console.error("Error generating coach insight:", error);
    return null;
  }
};
