// garbish.genkit.ts
// Genkit chatbot flow for Garbish, the WAIZ recycling assistant

import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const SYSTEM_PROMPT = `
You are Garbish, the WAIZ recycling assistant. 
You ONLY answer questions about:
- The WAIZ platform (how to use it, upload recyclables, accounts, listings, transactions, etc.)
- Recycling and eco-friendly practices (waste segregation, recyclable materials, how to recycle, sustainability, etc.)
- The recycling marketplace in the Philippines (what junk shops buy, how to sell recyclables, etc.)

If asked about current recycling prices and you have no real-time data, say:
"Recycling prices may vary depending on the junk shop and location. For the most accurate and current rates, please check local junk shops or listings within the WAIZ marketplace."

NEVER answer questions outside recycling or the WAIZ platform. 
If a question is out of scope, respond:
"I'm Garbish, the WAIZ recycling assistant. I can help with questions about recycling, eco-friendly practices, and how to use the WAIZ marketplace. Please ask something related to recycling or the WAIZ platform."
`;

const REFUSAL_RESPONSE = `I'm Garbish, the WAIZ recycling assistant. I can help with questions about recycling, eco-friendly practices, and how to use the WAIZ marketplace. Please ask something related to recycling or the WAIZ platform.`;

const PRICE_RESPONSE = `Recycling prices may vary depending on the junk shop and location. For the most accurate and current rates, please check local junk shops or listings within the WAIZ marketplace.`;

// Classification function for user questions
function classifyQuestion(question: string): GarbishQuestionType {
  const q = question.toLowerCase();

  // Strict price-related: must mention price/rate/cost and a recycling material or junk shop
  if (
    /(price|rate|cost|how much|per kilo|per kilogram|per kg|current price|market price)/.test(q) &&
    /(plastic|metal|paper|glass|bottle|can|carton|junk shop|recyclable)/.test(q)
  ) {
    return 'price_question';
  }

  // Strict platform-related: must mention WAIZ or a clear platform action
  if (
    /(waiz|upload(ing)?|marketplace|sell(ing)?|buy(ing)?|account|listing|transaction|junk shop|profile|dashboard|login|register|signup|sign up|how.*use.*waiz)/.test(q)
  ) {
    return 'platform_question';
  }

  // Strict recycling knowledge: must mention recycling, eco, waste, or specific materials
  if (
    /(recycle|recycling|eco[- ]?friendly|waste segregation|waste|sustainability|environment|how to recycle|segregate|recyclable material|plastic|metal|paper|glass|compost|reduce|reuse|environmental|junk shop)/.test(q)
  ) {
    return 'recycling_question';
  }

  // Everything else is out_of_scope
  return 'out_of_scope';
}

type GarbishQuestionType = 'platform_question' | 'recycling_question' | 'price_question' | 'out_of_scope';


const inputSchema = z.object({
  question: z.string(),
});
const outputSchema = z.object({
  answer: z.string(),
  type: z.enum(['platform_question', 'recycling_question', 'price_question', 'out_of_scope']),
});

async function garbishFlow({ question }: { question: string }) {
  const type = classifyQuestion(question);

  if (type === 'out_of_scope') {
    return { answer: REFUSAL_RESPONSE, type };
  }

  if (type === 'price_question') {
    return { answer: PRICE_RESPONSE, type };
  }

  // Setup AI client (same as in garbishAI.ts)
  const ai = genkit({
    plugins: [
      googleAI({
        apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
      })
    ],
    model: 'googleai/gemini-2.0-flash'
  });

  const response = await ai.generate({
    prompt: `${SYSTEM_PROMPT}\n\nUser Question:\n${question}`,
    config: { temperature: 0.3 }
  });

  const text = response.text?.trim() || "I don't have that information.";

  return {
    answer: text,
    type,
  };
}

garbishFlow.inputSchema = inputSchema;
garbishFlow.outputSchema = outputSchema;
export default garbishFlow;
