import { NextResponse } from "next/server";
import OpenAI from "openai";

/** App Router: max serverless duration (e.g. Vercel) */
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai-proxy.com/v1",
  timeout: 60000,
});

export async function POST(request: Request) {
  try {
    const { productName, keyFeatures, targetMarket, lang = "en" } = await request.json();

    if (!productName || !keyFeatures || !targetMarket) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const langMap: Record<string, string> = {
      en: "English",
      zh: "Chinese (Simplified)",
      es: "Spanish",
    };
    const language = langMap[lang] || "English";

    const prompt = `You are an expert e-commerce copywriter. Write an optimized product listing in ${language} for the following product.

Product Name: ${productName}
Key Features: ${keyFeatures}
Target Market: ${targetMarket}

Return your response in exactly this format:
Title: [optimized product title]
Description: [3 paragraphs of compelling product description]
Bullet Points: [5 key selling points, each on a new line starting with •]
Keywords: [10 SEO keywords, comma separated]`;

    const response = await openai.chat.completions.create(
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
      },
      { timeout: 60000 } // Set API call timeout to 60 seconds
    );

    const listing = response.choices[0]?.message?.content || "";

    return NextResponse.json({ listing });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate listing" }, { status: 500 });
  }
}