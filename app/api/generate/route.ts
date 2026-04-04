import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000,
});

export async function POST(request: Request) {
  try {
    const { productName, keyFeatures, targetMarket, lang = "en" } = await request.json();

    if (!productName || !keyFeatures || !targetMarket) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const langMap: Record<string, string> = {
      en: "English", zh: "Chinese (Simplified)", es: "Spanish",
      fr: "French", de: "German", ja: "Japanese", ko: "Korean", ar: "Arabic",
    };
    const language = langMap[lang] || "English";

    const prompt = `Write an optimized ${language} product listing.\nProduct: ${productName}\nFeatures: ${keyFeatures}\nMarket: ${targetMarket}\n\nFormat:\nTitle: [title]\nDescription: [3 short paragraphs]\nBullet Points: [5 bullet points starting with •]\nKeywords: [10 comma-separated keywords]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const listing = response.choices[0]?.message?.content || "";

    return NextResponse.json({ listing });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate listing" }, { status: 500 });
  }
}