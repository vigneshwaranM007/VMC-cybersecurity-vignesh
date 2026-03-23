import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const generateBackgroundPrompt = async (theme: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a highly detailed, cinematic, and atmospheric background image prompt for a cybersecurity application. The theme is "${theme}". The prompt should be suitable for an AI image generator like Midjourney or DALL-E. Focus on abstract data, digital locks, glowing circuits, and a dark, professional aesthetic. Return ONLY the prompt text.`,
    });
    return response.text || "A dark, cinematic cybersecurity background with glowing digital locks and abstract data streams.";
  } catch (error) {
    console.error("Gemini error:", error);
    return "A dark, cinematic cybersecurity background with glowing digital locks and abstract data streams.";
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return "https://picsum.photos/seed/cybersecurity/1920/1080";
  } catch (error) {
    console.error("Image generation error:", error);
    return "https://picsum.photos/seed/cybersecurity/1920/1080";
  }
};
