"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

// -----------------------------------------
// --------- EXISTING LISTING PARSER --------
function parseListing(aiResult: string, lang: string) {
  let title = "", desc = "", bullets = "", keywords = "";
  const labels: Record<string, { [k: string]: string }> = {
    en: {
      title: "Optimized Title",
      desc: "Product Description",
      bullets: "Bullet Points",
      keywords: "SEO Keywords",
      copy: "Copy",
    },
    zh: {
      title: "优化标题",
      desc: "产品描述",
      bullets: "要点",
      keywords: "SEO关键词",
      copy: "复制",
    },
    es: {
      title: "Título Optimizado",
      desc: "Descripción del Producto",
      bullets: "Puntos Clave",
      keywords: "Palabras clave SEO",
      copy: "Copiar",
    },
  };

  const titleMatch = aiResult.match(/Title:\s*([\s\S]+?)\n(?:Description:|$)/i);
  const descMatch = aiResult.match(/Description:\s*([\s\S]+?)\n(?:Bullet Points:|Keywords:|$)/i);
  const bulletsMatch = aiResult.match(/Bullet Points:\s*([\s\S]+?)\n(?:Keywords:|$)/i);
  const keywordsMatch = aiResult.match(/Keywords:\s*([\s\S]+)$/i);

  title = titleMatch ? titleMatch[1].trim() : "";
  desc = descMatch ? descMatch[1].trim() : "";
  bullets = bulletsMatch ? bulletsMatch[1].trim() : "";
  keywords = keywordsMatch ? keywordsMatch[1].trim() : "";

  let descParagraphs: string[] = [];
  if (desc) {
    descParagraphs = desc.split(/\n{2,}/g).map(s => s.trim()).filter(Boolean);
    if (descParagraphs.length < 3) {
      descParagraphs = desc.split(". ").reduce((acc, curr) => {
        if (acc.length && acc[acc.length - 1].split(' ').length < 20)
          acc[acc.length - 1] += ". " + curr;
        else
          acc.push(curr);
        return acc;
      }, [] as string[]);
      descParagraphs = descParagraphs.slice(0, 3);
    } else {
      descParagraphs = descParagraphs.slice(0, 3);
    }
  }

  let bulletItems: string[] = [];
  if (bullets) {
    bulletItems = bullets.split(/\n|•|- /).map(s => s.trim()).filter(s => s && !/^(Bullet Points:?)/i.test(s));
    bulletItems = bulletItems.slice(0, 5);
  }

  let keywordList: string[] = [];
  if (keywords) {
    keywordList = keywords.split(/,|\n/).map(s => s.trim()).filter(s => s);
    keywordList = keywordList.slice(0, 10);
  }

  return {
    labels: labels[lang],
    title,
    descParagraphs,
    bulletItems,
    keywordList,
  };
}

function useTabs(defaultLang = "en") {
  const [lang, setLang] = useState(defaultLang);
  const tabs = [
    { label: "English", value: "en" },
    { label: "中文", value: "zh" },
    { label: "Español", value: "es" },
  ];
  return { lang, setLang, tabs };
}

function CardSection({ title, children, canCopy, onCopy }: { title: string, children: React.ReactNode, canCopy?: boolean, onCopy?: () => void }) {
  return (
    <div className="bg-white border rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {canCopy && onCopy && (
          <button
            onClick={onCopy}
            className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 active:bg-gray-300 transition"
            type="button"
          >
            Copy
          </button>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

// --------- MARKETING LANDING PAGE (non-auth) ---------
const UPGRADE_URL = "https://www.creem.io/test/payment/prod_4y6VNxRW0tLyqwpYUH5Cip";

function MarketingLanding() {
  const features = [
    {
      icon: (
        <svg className="h-10 w-10 mb-3 text-blue-500" fill="none" viewBox="0 0 24 24">
          <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 11L12 16 17 11M12 4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "AI-Optimized Copy",
      desc: "Writes converting product descriptions"
    },
    {
      icon: (
        <svg className="h-10 w-10 mb-3 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M2 12h20M12 2a10 10 0 010 20" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
      title: "8 Languages",
      desc: "English, Chinese, Spanish, French, German, Japanese, Korean, Arabic"
    },
    {
      icon: (
        <svg className="h-10 w-10 mb-3 text-blue-500" fill="none" viewBox="0 0 24 24">
          <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 8h8M8 12h4" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      title: "Platform-Specific",
      desc: "Optimized for Amazon, Shopify, Etsy, eBay"
    },
    {
      icon: (
        <svg className="h-10 w-10 mb-3 text-blue-500" fill="none" viewBox="0 0 24 24">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      title: "SEO Keywords",
      desc: "Auto-generates high-ranking keywords"
    },
    {
      icon: (
        <svg className="h-10 w-10 mb-3 text-blue-500" fill="none" viewBox="0 0 24 24">
          <path d="M8 17l4 4 4-4M12 13v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="4" y="3" width="16" height="5" rx="2" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      title: "One-Click Copy",
      desc: "Copy any section instantly"
    },
    {
      icon: (
        <svg className="h-10 w-10 mb-3 text-blue-500" fill="none" viewBox="0 0 24 24">
          <rect x="2" y="7" width="20" height="14" rx="4" stroke="currentColor" strokeWidth="2"/>
          <path d="M16 3v4M8 3v4" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      title: "Generation History",
      desc: "Save and access all past listings"
    }
  ];

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-100 text-gray-900">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-blue-600 to-blue-800 text-white pt-24 px-4 pb-16 mb-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1
            className="text-5xl sm:text-6xl md:text-7xl font-black mb-8"
            style={{
              textShadow:
                "0 2px 12px rgba(22,41,120,0.18), 0 4px 44px rgba(19,32,105,0.18), 0 0px 1px #000A, 0 1px 2px #2224"
            }}
          >
            AI-Powered Product Listings in 30 Seconds
          </h1>
          <p className="text-xl sm:text-2xl mb-12 font-medium text-blue-100">
            Generate optimized, multi-language product listings for Amazon, Shopify, Etsy and more.{" "}
            <br className="hidden sm:block"/>
            Save hours of copywriting.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10">
            <a
              href="/login"
              className="bg-white text-blue-700 font-bold rounded-full px-12 py-5 shadow-lg hover:bg-blue-50 transition text-2xl"
            >
              Start Free
            </a>
            <a
              href="/pricing"
              className="border border-white text-white font-bold rounded-full px-12 py-5 hover:bg-blue-700 hover:text-white transition text-2xl"
            >
              View Pricing
            </a>
          </div>
        </div>
      </section>
      {/* Feature Cards */}
      <section className="max-w-5xl mx-auto -mt-16 md:-mt-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-4">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md border border-blue-100 p-6 flex flex-col items-center text-center transition hover:shadow-xl">
              {f.icon}
              <div className="font-bold text-lg mb-1">{f.title}</div>
              <div className="text-gray-600">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
      {/* How It Works (NEW SECTION) */}
      <section className="max-w-4xl mx-auto px-4 py-12 my-16 bg-white rounded-3xl shadow-md flex flex-col">
        <h2 className="font-extrabold text-2xl sm:text-3xl text-center mb-10 text-blue-700">
          How It Works
        </h2>
        <div className="flex flex-col sm:flex-row justify-between items-stretch gap-8">
          {/* Step 1 */}
          <div className="flex-1 flex flex-col items-center bg-white rounded-xl shadow-sm px-6 py-8">
            <div className="bg-blue-100 rounded-full h-16 w-16 flex items-center justify-center mb-4 border-4 border-blue-300 shadow-inner">
              <span className="text-3xl font-black text-blue-800">1</span>
            </div>
            <div className="font-semibold text-lg mb-2">Enter Product Info</div>
            <div className="text-gray-600 text-center text-base">
              Input your product name, features, and target market
            </div>
          </div>
          {/* Step 2 */}
          <div className="flex-1 flex flex-col items-center bg-white rounded-xl shadow-sm px-6 py-8">
            <div className="bg-blue-100 rounded-full h-16 w-16 flex items-center justify-center mb-4 border-4 border-blue-300 shadow-inner">
              <span className="text-3xl font-black text-blue-800">2</span>
            </div>
            <div className="font-semibold text-lg mb-2">AI Generates Listing</div>
            <div className="text-gray-600 text-center text-base">
              Our AI creates optimized titles, descriptions, and keywords
            </div>
          </div>
          {/* Step 3 */}
          <div className="flex-1 flex flex-col items-center bg-white rounded-xl shadow-sm px-6 py-8">
            <div className="bg-blue-100 rounded-full h-16 w-16 flex items-center justify-center mb-4 border-4 border-blue-300 shadow-inner">
              <span className="text-3xl font-black text-blue-800">3</span>
            </div>
            <div className="font-semibold text-lg mb-2">Copy &amp; Publish</div>
            <div className="text-gray-600 text-center text-base">
              Copy your listing and publish to any platform
            </div>
          </div>
        </div>
      </section>
      {/* CTA Banner (NEW SECTION) */}
      <section className="w-full bg-gradient-to-br from-blue-600 to-blue-700 text-white py-12 px-4 my-12">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">
            Ready to optimize your listings?
          </h2>
          <p className="text-lg mb-8 text-blue-100 font-medium">
            Start free today - no credit card required.
          </p>
          <a
            href="/login"
            className="bg-white text-blue-700 font-bold rounded-full px-10 py-4 shadow-lg hover:bg-blue-100 transition text-xl"
          >
            Get Started
          </a>
        </div>
      </section>
      {/* Pricing Section */}
      <section className="max-w-4xl mx-auto px-4 mb-20">
        <h2 className="font-extrabold text-2xl sm:text-3xl text-center mb-10 text-blue-700">
          Pricing
        </h2>
        <div className="flex flex-col md:flex-row justify-center gap-8">
          {/* Free */}
          <div className="flex-1 bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-8 flex flex-col items-center text-center">
            <div className="text-blue-600 font-extrabold text-xl mb-2">Free</div>
            <div className="text-4xl font-extrabold mb-2">
              $0 <span className="text-xl font-medium text-gray-500">/mo</span>
            </div>
            <ul className="mt-4 mb-8 flex-1 text-left text-base text-gray-700 w-full space-y-2">
              <li><span className="text-blue-500 font-bold">5</span> generations per day</li>
              <li><span className="text-blue-500 font-bold">3</span> supported languages</li>
              <li>History of last <span className="text-blue-500 font-bold">3</span> listings</li>
              <li>Basic AI model</li>
            </ul>
            <a href="/login" className="w-full block bg-blue-600 text-white font-bold rounded-full px-6 py-3 mt-auto hover:bg-blue-700 transition">Start Free</a>
          </div>
          {/* Pro */}
          <div className="flex-1 bg-blue-50 rounded-2xl shadow-xl border-2 border-blue-500 p-8 flex flex-col items-center text-center scale-105">
            <div className="text-blue-700 font-extrabold text-xl mb-2">Pro</div>
            <div className="text-4xl font-extrabold mb-2">
              $19 <span className="text-xl font-medium text-gray-600">/mo</span>
            </div>
            <ul className="mt-4 mb-8 flex-1 text-left text-base text-gray-700 w-full space-y-2">
              <li><span className="text-blue-700 font-bold">Unlimited</span> generations</li>
              <li><span className="text-blue-700 font-bold">All 8</span> languages</li>
              <li>Full generation history</li>
              <li>Best AI & copywriting</li>
              <li>Priority support</li>
            </ul>
            <a
              href={UPGRADE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full block bg-blue-700 text-white font-bold rounded-full px-6 py-3 mt-auto hover:bg-blue-800 transition shadow-lg"
            >Upgrade</a>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-blue-600 text-white text-center py-6 px-4 mt-auto">
        <div className="font-medium">
          &copy; {new Date().getFullYear()} Creem AI, Inc. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

// ------------------------------------------------------------
// --------- LOGGED-IN GENERATOR COMPONENT ---------
function ListingGenerator({
  user,
  onLogout,
}: {
  user: { id: string; email?: string | null };
  onLogout: () => void | Promise<void>;
}) {
  const [productName, setProductName] = useState("");
  const [keyFeatures, setKeyFeatures] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [results, setResults] = useState<{ [lang: string]: string | null }>({});
  const [loading, setLoading] = useState(false);
  const [loadingLang, setLoadingLang] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { lang, setLang, tabs } = useTabs();
  const [copyStatus, setCopyStatus] = useState<{ [part: string]: boolean }>({});

  useEffect(() => {
    async function fetchTranslation(nextLang: string) {
      if (nextLang === "en" || results[nextLang] !== undefined || !results["en"]) return;
      setLoadingLang(nextLang);
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            productName,
            keyFeatures,
            targetMarket,
            lang: nextLang,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Unknown error");
        }
        setResults(prev => ({ ...prev, [nextLang]: data.listing }));

        if (user?.id && data.listing) {
          await saveGeneration({
            user_id: user.id,
            product_name: productName,
            input_data: { keyFeatures, targetMarket },
            output_data: data.listing,
            lang: nextLang,
          });
        }
      } catch (err: any) {
        setError(err.message || "Failed to translate product listing.");
      } finally {
        setLoadingLang(null);
      }
    }
    fetchTranslation(lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const saveGeneration = async ({
    user_id,
    product_name,
    input_data,
    output_data,
    lang,
  }: {
    user_id: string,
    product_name: string,
    input_data: any,
    output_data: string,
    lang: string,
  }) => {
    try {
      await supabase.from("generations").insert([
        {
          user_id,
          product_name,
          input_data,
          output_data,
          lang,
        }
      ]);
    } catch (err) {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResults({});
    setError(null);
    setLoading(true);
    setLoadingLang("en");
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ productName, keyFeatures, targetMarket, lang: "en" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unknown error");
      }
      setResults({ en: data.listing });

      if (user?.id && data.listing) {
        await saveGeneration({
          user_id: user.id,
          product_name: productName,
          input_data: { keyFeatures, targetMarket },
          output_data: data.listing,
          lang: "en",
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate product listing.");
    } finally {
      setLoading(false);
      setLoadingLang(null);
    }
  };

  function handleCopy(text: string, part: string) {
    navigator.clipboard.writeText(text);
    setCopyStatus(s => ({ ...s, [part]: true }));
    setTimeout(() => setCopyStatus(s => ({ ...s, [part]: false })), 1500);
  }

  let parsed: ReturnType<typeof parseListing> | null = null;
  if (results[lang]) {
    parsed = parseListing(results[lang] || "", lang);
  }

  const isDailyLimitError =
    typeof error === "string" &&
    (
      error.toLowerCase().includes("daily limit") ||
      error.toLowerCase().includes("quota") ||
      error.toLowerCase().includes("plan limit")
    );

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      {/* Header Bar Showing Email + Logout */}
      <div className="fixed top-0 left-0 w-full z-40 bg-blue-600 text-white px-6 py-3 flex items-center justify-between shadow">
        <span className="font-semibold text-base truncate">Logged in as {user.email || "User"}</span>
        <button
          className="ml-3 px-4 py-1 text-sm font-medium rounded bg-white text-blue-700 hover:bg-blue-100 border transition"
          onClick={() => void onLogout()}
        >
          Log out
        </button>
      </div>
      <div className="bg-white px-10 py-16 rounded-3xl shadow-xl flex flex-col items-center w-full max-w-xl mt-16">

        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 text-center">
          AI Listing Optimizer
        </h1>
        <p className="text-lg text-gray-600 mb-8 text-center">
          Generate optimized product listings in seconds
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 bg-gray-50 px-8 py-8 rounded-2xl shadow border">
          <div>
            <label className="block text-gray-700 font-semibold mb-2" htmlFor="productName">
              Product Name
            </label>
            <input
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none"
              id="productName"
              type="text"
              value={productName}
              onChange={e => setProductName(e.target.value)}
              required
              placeholder="Your product name"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2" htmlFor="keyFeatures">
              Key Features
            </label>
            <textarea
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none"
              id="keyFeatures"
              value={keyFeatures}
              onChange={e => setKeyFeatures(e.target.value)}
              required
              rows={3}
              placeholder="Comma separated or bulleted features"
            ></textarea>
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2" htmlFor="targetMarket">
              Target Market
            </label>
            <input
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none"
              id="targetMarket"
              type="text"
              value={targetMarket}
              onChange={e => setTargetMarket(e.target.value)}
              required
              placeholder="Describe your market/audience"
            />
          </div>
          <button
            type="submit"
            className={`w-full flex justify-center items-center px-6 py-3 text-lg font-bold text-white rounded ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"} transition focus:outline-none`}
            disabled={loading}
          >
            {loading && (
              <svg
                className="animate-spin mr-2 h-5 w-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            )}
            {loading ? "Generating..." : "Generate"}
          </button>
        </form>

        {(results["en"] || error) && (
          <div className="mt-8 w-full">
            <div className="flex mb-4 border-b">
              {tabs.map(tab => (
                <button
                  key={tab.value}
                  className={`px-4 py-2 text-sm font-semibold rounded-t focus:outline-none transition
                   ${lang === tab.value
                  ? "bg-white border-x border-t border-b-0 border-gray-200 text-blue-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"}
                  `}
                  onClick={() => setLang(tab.value)}
                  disabled={loadingLang === tab.value}
                  type="button"
                  aria-selected={lang === tab.value}
                >
                  {tab.label}
                  {loadingLang === tab.value && (
                    <svg className="animate-spin ml-2 h-4 w-4 text-gray-400 inline" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="w-full">
              {loadingLang ? (
                <div className="text-gray-500 text-center p-6">
                  <svg className="animate-spin inline mr-2 h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Generating...
                </div>
              ) : isDailyLimitError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-4 flex flex-col items-center">
                  <span>
                    You’ve reached your daily limit for free generations.
                    <span className="block mt-1">
                      To continue, please{" "}
                      <a
                        href={UPGRADE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-700 font-medium"
                      >
                        upgrade your plan
                      </a>
                      .
                    </span>
                  </span>
                  <button
                    className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition"
                    onClick={() => window.open(UPGRADE_URL, "_blank", "noopener,noreferrer")}
                    type="button"
                  >
                    Upgrade
                  </button>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-4">{error}</div>
              ) : (!parsed || !parsed.title) ? (
                <div className="text-gray-400 text-center p-6">No result yet.</div>
              ) : (
                <div>
                  <CardSection
                    title={parsed.labels.title}
                    canCopy
                    onCopy={() => handleCopy(parsed?.title || "", "title")}
                  >
                    <div className="text-xl font-bold">
                      {parsed.title}
                    </div>
                    {copyStatus.title && <span className="text-xs text-green-500 ml-2">{parsed.labels.copy}!</span>}
                  </CardSection>
                  <CardSection
                    title={parsed.labels.desc}
                    canCopy
                    onCopy={() => handleCopy(parsed?.descParagraphs?.join("\n\n") || "", "desc")}
                  >
                    {(parsed?.descParagraphs || []).map((p, i) => (
                      <p className="mb-2 last:mb-0 text-gray-700" key={i}>{p}</p>
                    ))}
                    {copyStatus.desc && <span className="text-xs text-green-500 ml-2">{parsed.labels.copy}!</span>}
                  </CardSection>
                  <CardSection
                    title={parsed.labels.bullets}
                    canCopy
                    onCopy={() => handleCopy((parsed?.bulletItems || []).join("\n"), "bullets")}
                  >
                    <ul className="list-disc pl-5 space-y-1">
                      {(parsed?.bulletItems || []).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                    {copyStatus.bullets && <span className="text-xs text-green-500 ml-2">{parsed.labels.copy}!</span>}
                  </CardSection>
                  <CardSection
                    title={parsed.labels.keywords}
                    canCopy
                    onCopy={() => handleCopy((parsed?.keywordList || []).join(", "), "keywords")}
                  >
                    <div className="flex flex-wrap gap-2">
                      {(parsed?.keywordList || []).map((k, i) => (
                        <span key={i} className="inline-block px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded text-xs">
                          {k}
                        </span>
                      ))}
                    </div>
                    {copyStatus.keywords && <span className="text-xs text-green-500 ml-2">{parsed.labels.copy}!</span>}
                  </CardSection>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// --------- MAIN PAGE: Auth logic + conditional UI ---------
export default function Home() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function checkUser() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (ignore) return;
        setUser(session?.user ?? null);
      } catch {
        if (!ignore) setUser(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void checkUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (ignore) return;
      setUser(session?.user ?? null);
    });

    return () => {
      ignore = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-blue-50">
        <div className="animate-pulse text-blue-500 font-bold text-xl">Loading...</div>
      </main>
    );
  }

  if (!user) {
    return <MarketingLanding />;
  }

  return <ListingGenerator user={user} onLogout={handleLogout} />;
}