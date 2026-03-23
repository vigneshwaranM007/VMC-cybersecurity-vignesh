import { GoogleGenAI } from "@google/genai";

const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateBackgroundPrompt = async (theme: string): Promise<string> => {
  const ai = getAi();
  if (!ai) return "A dark, cinematic cybersecurity background with glowing digital locks and abstract data streams.";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a highly detailed, cinematic, and atmospheric background image prompt for a cybersecurity application. The theme is "${theme}". The prompt should be suitable for an AI image generator like Midjourney or DALL-E. Focus on abstract data, digital locks, glowing circuits, and a dark, professional aesthetic. Return ONLY the prompt text.`,
    });
    return response.text || "A dark, cinematic cybersecurity background with glowing digital locks and abstract data streams.";
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes("quota") || error?.message?.includes("429")) {
      console.warn("Gemini quota exceeded for background prompt. Using default.");
    } else {
      console.error("Gemini error:", error);
    }
    return "A dark, cinematic cybersecurity background with glowing digital locks and abstract data streams.";
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  const ai = getAi();
  if (!ai) return "https://picsum.photos/seed/cybersecurity/1920/1080";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
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
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes("quota") || error?.message?.includes("429")) {
      console.warn("Gemini quota exceeded for image generation. Using fallback.");
    } else {
      console.error("Image generation error:", error);
    }
    return "https://picsum.photos/seed/cybersecurity/1920/1080";
  }
};

export const generateSecurityInsight = async (password: string): Promise<string> => {
  const ai = getAi();
  if (!ai) return "AI security insights are currently unavailable. Please check your configuration.";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following password and provide a brief, professional security insight or tip: "${password}". Focus on its strengths or weaknesses without revealing the password itself. Keep it under 50 words.`,
    });
    return response.text || "No insight available.";
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes("quota") || error?.message?.includes("429")) {
      console.warn("Gemini quota exceeded for security insight.");
      return "AI security insights are temporarily unavailable due to high demand. Please try again later.";
    } else {
      console.error("Gemini error:", error);
      return "An error occurred while generating security insights.";
    }
  }
};
