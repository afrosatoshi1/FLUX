import { GoogleGenAI, Type } from "@google/genai";
import { AiMetadata, ChatConfig, Message } from "../types";

// Helper to safely access env vars in Vite
const getApiKey = () => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env.VITE_API_KEY;
  }
  return '';
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

// Helper to resize image for API
const resizeImageForAi = async (base64Str: string, maxWidth = 800): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = maxWidth / img.width;
            const finalScale = scale >= 1 ? 1 : scale;
            
            canvas.width = img.width * finalScale;
            canvas.height = img.height * finalScale;
            
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataUrl.replace(/^data:image\/\w+;base64,/, ""));
        };
        img.onerror = () => resolve(base64Str.replace(/^data:image\/\w+;base64,/, ""));
    });
};

export const analyzePhoto = async (base64Image: string, aiPersonality: boolean = true): Promise<AiMetadata> => {
  if (!apiKey) {
    console.warn("API Key missing. Returning mock data.");
    return {
      caption: "Captured moment",
      tags: ["photo"],
      vibe: "neutral",
      suggestedAlbum: "Recent",
      socialComment: "Nice shot!",
      socialCommentType: "compliment",
      ratings: { authenticity: 8, beauty: 7, virality: 6 }
    };
  }

  try {
    const base64Data = await resizeImageForAi(base64Image);
    const personalityPrompt = aiPersonality 
        ? `6. Generate a 'socialComment' that is either 'rizz' (flirty), 'roast' (savage), or 'compliment'. Choose the ONE style that best fits based on the image content.`
        : `6. Generate a polite 'socialComment'.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Data } },
          { text: `Analyze this image for a Gen-Z social app. 1. Catchy caption. 2. Hashtags. 3. Vibe. 4. Location guess. 5. Album name. ${personalityPrompt} 7. Rate 1-10 on Authenticity, Beauty, Virality.` },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            vibe: { type: Type.STRING },
            locationGuess: { type: Type.STRING },
            suggestedAlbum: { type: Type.STRING },
            socialComment: { type: Type.STRING },
            socialCommentType: { type: Type.STRING, enum: ["rizz", "roast", "compliment"] },
            ratings: {
                type: Type.OBJECT,
                properties: { authenticity: { type: Type.NUMBER }, beauty: { type: Type.NUMBER }, virality: { type: Type.NUMBER } },
            }
          },
        },
      },
    });

    if (response.text) return JSON.parse(response.text) as AiMetadata;
    throw new Error("No response");
  } catch (error) {
    console.error("AI Analysis Error", error);
    return {
      caption: "A cool moment",
      tags: ["snapshot"],
      vibe: "chill",
      suggestedAlbum: "Memories",
      socialComment: "Looking good!",
      socialCommentType: "compliment",
      ratings: { authenticity: 5, beauty: 5, virality: 5 }
    };
  }
};

export const generateAlbumInfo = async (photosMetadata: AiMetadata[]): Promise<{ title: string; description: string }> => {
  if (!apiKey || photosMetadata.length === 0) return { title: "New Memory", description: "A collection of moments." };
  const context = photosMetadata.slice(0, 5).map(m => `${m.caption} (${m.vibe})`).join('; ');
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a creative title (max 5 words) and description (max 15 words) for album with these moments: ${context}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: { title: { type: Type.STRING }, description: { type: Type.STRING } },
        }
      }
    });
    if (response.text) return JSON.parse(response.text);
    return { title: "Memories", description: "Beautiful times." };
  } catch (e) {
    return { title: "Memories", description: "Beautiful times." };
  }
};

export const generateChatReply = async (
    lastMessages: Message[], 
    config: ChatConfig,
    senderName: string
): Promise<string[]> => {
    if (!apiKey) return ["Yeah", "Totally", "For sure"];

    const historyText = lastMessages.slice(-5).map(m => `${m.senderId === 'me' ? 'Me' : senderName}: ${m.text}`).join('\n');
    const prompt = `
    Context: You are helping the user reply to ${senderName}.
    User's Goal: ${config.motive}.
    Desired Tone: ${config.tone}.
    Relationship: ${config.relationship}.
    
    Conversation History:
    ${historyText}
    
    Generate 3 distinct, short, casual replies (max 15 words) that the user could send next.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        
        if (response.text) return JSON.parse(response.text);
        return ["Sounds good", "K", "Cool"];
    } catch (e) {
        console.error("Chat Gen Error", e);
        return ["Sounds good", "K", "Cool"];
    }
};

export const chatWithAi = async (history: Message[]): Promise<string> => {
    if (!apiKey) return "I'm offline right now (or missing API Key), but I'm listening!";
    
    const lastMsg = history[history.length - 1];
    
    // Construct a persona-rich system instruction inside the prompt since generateContent is stateless
    const contextPrompt = `
    SYSTEM: You are "Flux", an advanced, witty, and slightly sassy AI social companion living inside this camera app.
    Your goal is to help the user look cool, feel confident, and navigate social situations.
    Keep your responses short (under 2 sentences), punchy, and conversational. Use emojis sparingly but effectively.
    Never sound like a robot. Be a bestie.

    CHAT HISTORY:
    ${history.slice(-6).map(m => `${m.senderId === 'me' ? 'User' : 'Flux'}: ${m.text}`).join('\n')}
    
    User: ${lastMsg.text}
    Flux:
    `;

    try {
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contextPrompt
        });

        return result.text || "I didn't catch that.";
    } catch (e) {
        console.error("AI Chat Error", e);
        return "My brain is buffering... try again?";
    }
};

// --- NEW: Generate Dynamic Filters ---
export const generateFilterConfig = async (): Promise<{ name: string; css: string; overlayText?: string }> => {
    if (!apiKey) return { name: 'Offline', css: 'grayscale(1)' };

    const prompt = `
    Generate a creative, trendy CSS filter string for a camera app (like Snapchat or Instagram).
    Use a combination of: contrast, brightness, saturate, sepia, hue-rotate, invert, blur, grayscale.
    
    Also provide a cool, short name (max 2 words) and a short 'overlayText' (max 3 words) that describes the vibe (e.g. "RETRO VIBES", "CYBERPUNK", "SUMMER GLOW").
    
    Make it visually distinct.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        css: { type: Type.STRING },
                        overlayText: { type: Type.STRING }
                    }
                }
            }
        });

        if (response.text) return JSON.parse(response.text);
        return { name: 'Glitch', css: 'contrast(1.5) hue-rotate(90deg)' };
    } catch (e) {
        console.error("Filter Gen Error", e);
        return { name: 'Error', css: 'none' };
    }
};