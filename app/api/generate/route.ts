import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

/** App Router: max serverless duration (e.g. Vercel) */
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai-proxy.com/v1",
  timeout: 60000,
});

export async function POST(request: Request) {
  try {
    // Get Authorization header from request
    const authorization = request.headers.get("authorization") || request.headers.get("Authorization");
    const token = authorization?.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use createClient for a fresh Supabase client tied to environment config
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Verify user's JWT token using Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is free or pro
    // Assume app_metadata has 'is_pro', or user_metadata.plan === 'pro', or user_metadata.is_pro === true
    const isPro =
      user.app_metadata?.is_pro ||
      user.user_metadata?.plan === "pro" ||
      user.user_metadata?.is_pro === true; // backward compatibility

    // If not pro, check daily generations
    if (!isPro) {
      // Today's date in UTC, start and end
      const now = new Date();
      const utcYear = now.getUTCFullYear();
      const utcMonth = String(now.getUTCMonth() + 1).padStart(2, "0");
      const utcDay = String(now.getUTCDate()).padStart(2, "0");
      const startOfDay = `${utcYear}-${utcMonth}-${utcDay}T00:00:00+00:00`;
      const endOfDay = `${utcYear}-${utcMonth}-${utcDay}T23:59:59.999+00:00`;

      const { count, error: countError } = await supabase
        .from("generations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfDay)
        .lte("created_at", endOfDay);

      if (countError) {
        return NextResponse.json({ error: "Could not verify quota" }, { status: 500 });
      }

      if ((count ?? 0) >= 5) {
        return NextResponse.json(
          { error: "Daily limit reached. Upgrade to Pro for unlimited generations." },
          { status: 403 }
        );
      }
    }

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
      { timeout: 60000 }
    );

    const listing = response.choices[0]?.message?.content || "";

    // Log the generation (optional but needed if you want to track usage)
    // Only for free users; if you want to log for all remove this check
    if (!isPro) {
      await supabase.from("generations").insert([
        {
          user_id: user.id,
          created_at: new Date().toISOString(),
          product_name: productName,
          lang,
          // Optionally, add more fields
        },
      ]);
    }

    return NextResponse.json({ listing });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate listing" }, { status: 500 });
  }
}