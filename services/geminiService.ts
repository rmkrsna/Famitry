
import { GoogleGenAI, Type } from "@google/genai";
import { FamilyMember, PostCategory } from "../types";

const getClient = () => {
  // Check for REACT_APP_API_KEY (Local React) or API_KEY (Cloud/Vercel)
  const apiKey = process.env.REACT_APP_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key is missing. Please add REACT_APP_API_KEY to your .env file.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateBio = async (details: Partial<FamilyMember>) => {
  const client = getClient();
  if (!client) return "A loving family member.";

  const prompt = `Write a short, warm, and professional social media bio (under 50 words) for a family tree app profile. Details: Name: ${details.name}, Profession: ${details.profession}, Interest: Connecting with roots.`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "A valued member of the family tree.";
  }
};

export const getCulturalOptions = async (
  target: 'caste' | 'subcaste' | 'gothra',
  context: { religion?: string; caste?: string; subcaste?: string }
): Promise<string[]> => {
  const client = getClient();
  if (!client) return [];

  let contextStr = "";
  if (context.religion) contextStr += `Religion: ${context.religion}. `;
  if (context.caste) contextStr += `Caste: ${context.caste}. `;
  if (context.subcaste) contextStr += `Subcaste: ${context.subcaste}. `;

  if (!contextStr) return [];

  const prompt = `
    Based on the following context: ${contextStr}
    List 10-15 common and historically accurate ${target}s that are associated with this specific background in India.
    Return strictly a JSON array of strings. Do not include explanations.
  `;

  try {
     const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
    });
    const result = JSON.parse(response.text);
    return Array.isArray(result) ? result : [];
  } catch (e) {
    console.error(`Error fetching ${target} options`, e);
    return [];
  }
};

export const analyzePost = async (content: string): Promise<PostCategory> => {
  const client = getClient();
  // Default to general if API fails or isn't present
  if (!client) return 'general';

  const prompt = `
    Analyze the following social media post text and categorize it into exactly one of these categories:
    - 'birthday' (if it mentions birthday wishes, turning an age, cake, etc)
    - 'milestone' (if it mentions promotion, graduation, award, new job, wedding, achievement)
    - 'invitation' (if it invites people to an event, reunion, wedding, party, mentions RSVP)
    - 'reminder' (if it reminds family about something, dates, tasks)
    - 'general' (updates, random thoughts, photos without specific event context)

    Text: "${content}"

    Return ONLY the category word in lowercase.
  `;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const text = response.text.trim().toLowerCase();
    const validCategories: PostCategory[] = ['birthday', 'milestone', 'invitation', 'reminder', 'general'];
    
    if (validCategories.includes(text as PostCategory)) {
      return text as PostCategory;
    }
    return 'general';
  } catch (error) {
    console.error("Gemini Post Analysis Error:", error);
    return 'general';
  }
};

export const generateMatchAnalysis = async (p1: FamilyMember, p2: FamilyMember) => {
  const client = getClient();
  
  // Mock fallback if client is missing
  if (!client) {
      return {
          score: 85,
          summary: "Based on available family data, these profiles show strong cultural and professional compatibility.",
          strengths: ["Shared Cultural Background", "Compatible Professions", "Family Values"],
          challenges: ["Geographical Distance"],
      };
  }

  const prompt = `
    Act as an Indian Matchmaking expert. Analyze the compatibility between these two individuals:
    
    Profile 1:
    Name: ${p1.name}
    Gender: ${p1.gender}
    Born: ${p1.dob}
    Religion: ${p1.religion}
    Caste: ${p1.caste}
    Subcaste: ${p1.subcaste}
    Gothra: ${p1.gothra}
    Profession: ${p1.profession}
    Location: ${p1.location}
    Bio: ${p1.bio}

    Profile 2:
    Name: ${p2.name}
    Gender: ${p2.gender}
    Born: ${p2.dob}
    Religion: ${p2.religion}
    Caste: ${p2.caste}
    Subcaste: ${p2.subcaste}
    Gothra: ${p2.gothra}
    Profession: ${p2.profession}
    Location: ${p2.location}
    Bio: ${p2.bio}

    Provide a compatibility analysis in JSON format with:
    - score: number (0-100)
    - summary: string (2-3 sentences explaining the match)
    - strengths: array of strings (key positive points)
    - challenges: array of strings (potential friction points, e.g. same gothra is bad in some cultures, distance, etc)
  `;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            challenges: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        }
      },
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Match Analysis Error:", error);
    return {
       score: 0,
       summary: "Could not generate analysis due to technical error.",
       strengths: [],
       challenges: []
    };
  }
};
