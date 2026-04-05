import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

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

    // Check auth if token provided
    const authorization = request.headers.get("authorization");
    const token = authorization?.replace("Bearer ", "").trim();
    let userId = "anonymous";
    let isPro = false;

    if (token) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        isPro = user.user_metadata?.is_pro === true || user.app_metadata?.is_pro === true;

        if (!isPro) {
          const now = new Date();
          const startOfDay = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}T00:00:00+00:00`;
          const { count } = await supabase
            .from("generations")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gte("created_at", startOfDay);

          if ((count ?? 0) >= 5) {
            return NextResponse.json({ error: "Daily limit reached. Upgrade to Pro for unlimited generations." }, { status: 403 });
          }
        }
      }
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