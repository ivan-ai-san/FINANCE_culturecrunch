import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { CULTURE_CRUNCH_SYSTEM_INSTRUCTION } from '../constants';
import { Transaction } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const createCultureCoachChat = (): Chat => {
  const ai = getClient();
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: CULTURE_CRUNCH_SYSTEM_INSTRUCTION,
      temperature: 0.7, // Warm and creative
    },
  });
};

export const sendMessageToCoach = async (chat: Chat, message: string, contextData?: Transaction[]): Promise<string> => {
  let prompt = message;
  
  if (contextData) {
    const summary = contextData.slice(0, 50).map(t => 
      `${t.date}: ${t.description} (${t.category}) - $${t.amount.toFixed(2)} [${t.type}]`
    ).join('\n');
    
    prompt = `
Context - Current Financial Data (Last 50 transactions):
${summary}

User Query:
${message}
`;
  }

  try {
    const response: GenerateContentResponse = await chat.sendMessage({ message: prompt });
    return response.text || "I'm listening, but I couldn't quite catch that reflection. Could you try again?";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble connecting to my deeper reasoning right now. Please check your connection or API key.";
  }
};

export const categorizeTransaction = async (description: string): Promise<string> => {
    const ai = getClient();
    const prompt = `
    Categorize this transaction description for an Australian startup into one of these exact categories:
    ['Wages & Superannuation', 'Software & Subscriptions', 'Rent & Utilities', 'Marketing & Advertising', 'Office Supplies', 'Travel & Meals', 'Legal & Accounting', 'Contractors', 'Equipment', 'Training & Development', 'Team Culture', 'Other']
    
    Description: "${description}"
    
    Return ONLY the category name.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        const text = response.text?.trim();
        return text || 'Other';
    } catch (e) {
        return 'Other';
    }
}
