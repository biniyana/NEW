'use server';

import { z } from 'zod';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { format } from 'date-fns';

/* ---------------- AI SETUP ---------------- */

const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY
    })
  ],
  model: 'googleai/gemini-2.0-flash'
});

/* ---------------- SCHEMAS ---------------- */

const AskGarbishChatbotInputSchema = z.object({
  question: z.string(),
  context: z.string().optional()
});

export type AskGarbishChatbotInput = z.infer<typeof AskGarbishChatbotInputSchema>;

const AskGarbishChatbotOutputSchema = z.object({
  answer: z.string()
});

export type AskGarbishChatbotOutput = z.infer<typeof AskGarbishChatbotOutputSchema>;

/* ---------------- PLATFORM KNOWLEDGE ---------------- */

const WAIZ_KNOWLEDGE = `
WAIZ is a recycling marketplace platform designed to streamline recycling transactions.

Main purpose:
WAIZ connects households with junkshops to make selling recyclable materials easier and organized.

Key features of WAIZ:

1. Recycling Marketplace
Users can list recyclable materials such as plastic bottles, cans, paper, cardboard, and metals for sale.

2. Household to Junkshop Transactions
Households can create listings and junkshops can buy recyclable materials.

3. Collection Requests
Users can create a collection request so junkshops can pick up recyclable materials from their location.

4. Recycling Rates
The platform displays estimated recycling rates for common recyclable materials such as:
- Plastic bottles
- Aluminum cans
- Scrap metal
- Cardboard
- Paper

5. User Dashboard
Users can manage:
- listings
- requests
- transactions
- profile information

6. Eco-friendly Practices
WAIZ promotes:
- waste segregation
- recycling materials instead of throwing them away
- reducing landfill waste
- encouraging community recycling

Goal:
To make recycling more efficient, accessible, and environmentally friendly.
`;


/* ---------------- MAIN FUNCTION ---------------- */

export const REFUSAL_RESPONSE = "I’m Garbish, your WAIZ recycling assistant. I’m sorry, I can’t answer that question, but I can help with recycling, eco-friendly tips, and anything related to the WAIZ marketplace.";
export const PRICE_RESPONSE = "Recycling prices may vary depending on the junk shop and location. For the most accurate and current rates, please check local junk shops or listings within the WAIZ marketplace.";

export type ChatbotTopic =
  | 'platform_question'
  | 'recycling_question'
  | 'price_question'
  | 'out_of_scope';

function classifyQuestion(question: string): ChatbotTopic {
  const normalized = question.trim().toLowerCase();
  if (!normalized) return 'out_of_scope';

  const contains = (terms: string[]) => terms.some((t) => normalized.includes(t));

  const platformKeywords = [
    'waiz',
    'upload',
    'listing',
    'marketplace',
    'sell',
    'buy',
    'account',
    'login',
    'sign in',
    'sign up',
    'register',
    'transaction',
    'request',
    'collection',
    'junkshop',
    'junk shop',
    'dashboard',
    'profile',
    'message',
    'messages',
    'rate page',
    'rates page',
    'list item',
    'add item',
  ];

  const recyclingKeywords = [
    'recycle',
    'recycling',
    'eco',
    'eco-friendly',
    'sustainable',
    'sustainability',
    'waste',
    'segregation',
    'plastic',
    'glass',
    'paper',
    'metal',
    'cardboard',
    'compost',
    'biodegradable',
    'environment',
    'green',
    'reuse',
    'reduce',
    'upcycle',
    'landfill',
    'zero waste',
  ];

  const priceKeywords = [
    'price',
    'prices',
    'rate',
    'rates',
    'cost',
    'costs',
    'how much',
    'per kilo',
    'per kg',
    'per piece',
  ];

  const locationKeywords = [
    'baguio',
    'manila',
    'cebu',
    'davao',
    'cavite',
    'ph',
    'philippines',
  ];

  const isPlatform = contains(platformKeywords);
  const isRecycling = contains(recyclingKeywords);
  const isPrice = contains(priceKeywords);
  const isLocationBased = contains(locationKeywords);

  // Special case: questions about current/local prices should always be handled safely
  if (isPrice && (normalized.includes('current') || normalized.includes('today') || normalized.includes('now') || isLocationBased)) {
    return 'price_question';
  }

  // If a question is explicitly about prices but also about platform features, treat as platform question
  if (isPrice && isPlatform && normalized.includes('how')) {
    return 'platform_question';
  }

  if (isPlatform) {
    return 'platform_question';
  }

  if (isRecycling) {
    return 'recycling_question';
  }

  if (isPrice) {
    return 'price_question';
  }

  return 'out_of_scope';
}

function buildSystemPrompt(question: string) {
  return `You are **Garbish**, the WAIZ recycling assistant.

You MUST only answer questions about the WAIZ platform, recycling, eco-friendly practices, and recycling marketplace information.

If the user asks something outside these topics (e.g., math, politics, entertainment, programming, medical, legal), respond exactly with:
"${REFUSAL_RESPONSE}"

If the user asks about current recycling prices or rates, respond exactly with:
"${PRICE_RESPONSE}"

Use the WAIZ knowledge below to answer the user's question in a friendly, concise, and helpful way.

WAIZ PLATFORM INFORMATION:
${WAIZ_KNOWLEDGE}

Today's date: ${format(new Date(), 'yyyy-MM-dd')}

User Question:
${question}
`;
}

function isOutOfScopeResponse(text?: string) {
  if (!text) return false;
  const normalized = text.toLowerCase();
  const outOfScopeTerms = [
    'politics',
    'president',
    'tax',
    'lawyer',
    'doctor',
    'health',
    'medicine',
    'math',
    'calculus',
    'programming',
    'javascript',
    'python',
    'movie',
    'music',
    'celebrity',
    'sports',
    'football',
    'nba',
    'weather',
    'horoscope',
  ];
  return outOfScopeTerms.some((t) => normalized.includes(t));
}

export async function askGarbishChatbot(
  input: AskGarbishChatbotInput
): Promise<AskGarbishChatbotOutput> {

  const question = input.question.trim();
  const topic = classifyQuestion(question);

  if (topic === 'out_of_scope') {
    return { answer: REFUSAL_RESPONSE };
  }

  if (topic === 'price_question') {
    return { answer: PRICE_RESPONSE };
  }

  const systemPrompt = buildSystemPrompt(question);

  try {

    const response = await ai.generate({
      prompt: systemPrompt,
      config: {
        temperature: 0.3
      }
    });

    const text = response.text?.trim();

    if (isOutOfScopeResponse(text)) {
      return { answer: REFUSAL_RESPONSE };
    }

    return {
      answer: text || REFUSAL_RESPONSE
    };

  } catch (error) {

    console.error("AI error:", error);

    // propagate to caller so that fallback logic in routes.ts can run
    throw error;
  }
}