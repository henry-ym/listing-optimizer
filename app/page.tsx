"use client";
import { useState, useEffect } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./lib/supabase";

/**
 * Helper to extract and format AI results into the required sections.
 * Expects aiResult as string (Claude output).
 */
function parseListing(aiResult: string, lang: string) {
  // Try to extract and parse based on section headers.
  // For now, naive approach by matching typical section keywords
  // and splitting; can be improved with better parsing.

  // Default to raw if structure unknown.
  let title = "", desc = "", bullets = "", keywords = "";

  // Fallbacks for non-English - just label via translation
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

  // Different language parsing can be applied here if result structure changes.

  // Use regex, works best for Claude's typical formatted output
  // Eg:
  // Title: ...
  // Description: ...
  // Bullet Points: ...
  // Keywords: ...

  // Supports multiline/singleline cases
  const titleMatch = aiResult.match(/Title:\s*([\s\S]+?)\n(?:Description:|$)/i);
  const descMatch = aiResult.match(/Description:\s*([\s\S]+?)\n(?:Bullet Points:|Keywords:|$)/i);
  const bulletsMatch = aiResult.match(/Bullet Points:\s*([\s\S]+?)\n(?:Keywords:|$)/i);
  const keywordsMatch = aiResult.match(/Keywords:\s*([\s\S]+)$/i);

  title = titleMatch ? titleMatch[1].trim() : "";
  desc = descMatch ? descMatch[1].trim() : "";
  bullets = bulletsMatch ? bulletsMatch[1].trim() : "";
  keywords = keywordsMatch ? keywordsMatch[1].trim() : "";

  // For description, split into 3 paragraphs if possible
  let descParagraphs: string[] = [];
  if (desc) {
    descParagraphs = desc.split(/\n{2,}/g).map(s => s.trim()).filter(Boolean);
    if (descParagraphs.length < 3) {
      // Try splitting by "." or fallback
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

  // For bullet points, split by lines/bullet chars, first 5 only
  let bulletItems: string[] = [];
  if (bullets) {
    bulletItems = bullets.split(/\n|•|- /).map(s => s.trim()).filter(s => s && !/^(Bullet Points:?)/i.test(s));
    bulletItems = bulletItems.slice(0, 5);
  }

  // For keywords, split by comma or new line, max 10
  let keywordList: string[] = [];
  if (keywords) {
    keywordList = keywords.split(/,|\n/).map(s => s.trim()).filter(s => s);
    keywordList = keywordList.slice(0, 10);
  }

  // If translated, all will be in desired language (assume Claude returns it correctly).
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

/**
 * Custom translation version using Claude API for each tab.
 * On tab change, issue new request (with 'lang' option in the body) if not already cached.
 */
export default function Home() {
  const [productName, setProductName] = useState("");
  const [keyFeatures, setKeyFeatures] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [results, setResults] = useState<{ [lang: string]: string | null }>({});
  const [loading, setLoading] = useState(false);
  const [loadingLang, setLoadingLang] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Supabase Auth State ---
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // On mount, check the user session (client-side)
  useEffect(() => {
    let ignore = false;
    // Do a one-shot fetch (for session, get user)
    async function checkUser() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (ignore) return;
      if (!!error || !session || !session.user) {
        router.replace("/login");
      } else {
        setUser(session.user);
      }
    }
    checkUser();

    // Also listen to Supabase auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        setUser(null);
        router.replace("/login");
      } else if (session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      ignore = true;
      listener.subscription.unsubscribe();
    };
  }, [router]);
  
  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); // Will be redirected via auth change above
  };
  // ---

  const { lang, setLang, tabs } = useTabs();

  // --------- Save Generation To Supabase Helper -----------
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
      const { error } = await supabase.from("generations").insert([
        {
          user_id,
          product_name,
          input_data,
          output_data,
          lang,
        }
      ]);
      // Optionally handle error/success, but silent for now
    } catch (err) {
      // Optionally handle error (just ignore for now)
    }
  };
  // --------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResults({});
    setError(null);
    setLoading(true);
    setLoadingLang("en");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, keyFeatures, targetMarket, lang: "en" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unknown error");
      }
      setResults({ en: data.listing });

      // Save to Supabase generations table
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

  // When the user changes language tabs, fetch translation if not already present.
  React.useEffect(() => {
    async function fetchTranslation(nextLang: string) {
      // Don't re-translate English since it's initial.
      if (nextLang === "en" || results[nextLang] !== undefined || !results["en"]) return;
      setLoadingLang(nextLang);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

        // Save translation generation to Supabase
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

  // Copy to clipboard
  const [copyStatus, setCopyStatus] = useState<{ [part: string]: boolean }>({});
  function handleCopy(text: string, part: string) {
    navigator.clipboard.writeText(text);
    setCopyStatus(s => ({ ...s, [part]: true }));
    setTimeout(() => setCopyStatus(s => ({ ...s, [part]: false })), 1500);
  }

  // Card display logic
  let parsed: ReturnType<typeof parseListing> | null = null;
  if (results[lang]) {
    parsed = parseListing(results[lang] || "", lang);
  }

  // Optionally, show a loader or nothing while loading user info
  if (!user) {
    // Optionally a loader but keep redirect logic simple
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      {/* Header Bar Showing Email + Logout */}
      <div className="fixed top-0 left-0 w-full z-40 bg-blue-600 text-white px-6 py-3 flex items-center justify-between shadow">
        <span className="font-semibold text-base truncate">Logged in as {user.email || "User"}</span>
        <button
          className="ml-3 px-4 py-1 text-sm font-medium rounded bg-white text-blue-700 hover:bg-blue-100 border transition"
          onClick={handleLogout}
        >
          Log out
        </button>
      </div>
      {/* Main Card */}
      <div className="bg-white px-10 py-16 rounded-3xl shadow-xl flex flex-col items-center w-full max-w-xl mt-16">

        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 text-center">
          AI Listing Optimizer
        </h1>
        <p className="text-lg text-gray-600 mb-8 text-center">
          Generate optimized product listings in seconds
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 bg-gray-50 px-8 py-8 rounded-2xl shadow border">
          {/* ...INPUT FIELDS as before... */}
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

        {/* Language Tabs */}
        {(results["en"] || error) && (
          <div className="mt-8 w-full">
            {/* Tabs */}
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
            {/* Result cards */}
            <div className="w-full">
              {loadingLang ? (
                <div className="text-gray-500 text-center p-6">
                  <svg className="animate-spin inline mr-2 h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Generating...
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