"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

// Chinese & English UI strings
const UI = {
  en: {
    title: "AI Listing Generator",
    navTitle: "AI Listing Optimizer",
    productName: "Product Name",
    productNamePh: "e.g. Wireless Bluetooth Earbuds",
    keyFeatures: "Key Features",
    keyFeaturesPh: "e.g. Noise cancellation, 30hr battery, waterproof",
    targetMarket: "Target Market",
    targetMarketPh: "e.g. Young professionals in US",
    generate: "Generate",
    generating: "Generating...",
    generator: "Generator",
    history: "History",
    logout: "Log out",
    language: "中文",
    usage: (used: number, max: number) => `${used}/${max} free generations today`,
    fillAll: "Please fill in all fields",
    error: "Request failed",
    allCopy: "Copy All",
    titleCard: "Title",
    descCard: "Description",
    bulletCard: "Bullet Points",
    keywordCard: "Keywords",
    copy: "Copy",
    copied: "Copied!",
    loading: "Loading...",
    langToggle: "中文/EN",
  },
  zh: {
    title: "AI商品描述生成器",
    navTitle: "AI商品优化器",
    productName: "产品名称",
    productNamePh: "如：无线蓝牙耳机",
    keyFeatures: "核心卖点",
    keyFeaturesPh: "如：降噪，30小时续航，防水",
    targetMarket: "目标市场",
    targetMarketPh: "如：美国年轻白领",
    generate: "生成",
    generating: "生成中...",
    generator: "生成器",
    history: "历史记录",
    logout: "退出登录",
    language: "EN",
    usage: (used: number, max: number) => `今日免费可用：${used}/${max}次`,
    fillAll: "请填写完整信息",
    error: "请求失败",
    allCopy: "复制全部",
    titleCard: "标题",
    descCard: "描述",
    bulletCard: "要点",
    keywordCard: "关键词",
    copy: "复制",
    copied: "已复制!",
    loading: "加载中...",
    langToggle: "中文/EN",
  },
};

// Generation limit settings
const GEN_LIMIT = 5;

function parseListing(listing: string) {
  // Robustly split the AI result into sections
  const result: { title?: string; description?: string; bullets?: string[]; keywords?: string[] } = {};
  if (!listing) return result;

  // [\s\S] for multiline (no /s dotAll — ES2017 target)
  const titleMatch = listing.match(/Title\s*:\s*([\s\S]+?)\n(?:Description:|$)/i);
  const descMatch = listing.match(
    /Description\s*:\s*([\s\S]+?)\n(?:Bullet Points:|Keywords:|$)/i
  );
  const bulletsMatch = listing.match(
    /Bullet Points\s*:\s*([\s\S]+?)\n(?:Keywords:|$)/i
  );
  const keywordsMatch = listing.match(/Keywords\s*:\s*([\s\S]+)$/i);

  result.title = titleMatch ? titleMatch[1].trim() : "";
  result.description = descMatch ? descMatch[1].trim() : "";
  if (bulletsMatch) {
    // Try to split by lines starting with • or dash
    result.bullets = bulletsMatch[1]
      .split(/\n/)
      .map(l => l.replace(/^•\s*/, "").replace(/^- /, "").trim())
      .filter(Boolean);
  }
  if (keywordsMatch) {
    result.keywords = keywordsMatch[1].split(/,|\n/).map(s => s.trim()).filter(Boolean);
  }
  return result;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [productName, setProductName] = useState("");
  const [keyFeatures, setKeyFeatures] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [activeLang, setActiveLang] = useState("en");
  const [uiLang, setUiLang] = useState<"en" | "zh">("en");
  const [usage, setUsage] = useState(0);
  const [copied, setCopied] = useState<{ [k: string]: boolean }>({});

  const router = useRouter();

  // Read UI lang from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const l = localStorage.getItem("ui-lang");
      setUiLang(l === "zh" ? "zh" : "en"); // default EN
    }
  }, []);

  // Save UI lang
  const toggleUiLang = () => {
    const nextLang = uiLang === "en" ? "zh" : "en";
    setUiLang(nextLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("ui-lang", nextLang);
    }
  };

  // Auth check
  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data }) => {
        if (data.session?.user) {
          setUser(data.session.user);
        } else {
          router.push("/login");
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        router.push("/login");
      });
  }, [router]);

  // Fetch usage counter
  useEffect(() => {
    // Should fetch count for today from backend in prod. Here a placeholder:
    async function fetchCount() {
      if (!user) return;
      // Placeholder: count stored in localStorage by user ID for today.
      const date = new Date().toISOString().slice(0, 10);
      const key = `usage-${user.id}-${date}`;
      const cnt = Number(localStorage.getItem(key)) || 0;
      setUsage(cnt);
    }
    fetchCount();
  }, [user, result]);

  // Increment usage on successful generation
  useEffect(() => {
    if (!result || !user) return;
    const date = new Date().toISOString().slice(0, 10);
    const key = `usage-${user.id}-${date}`;
    let cnt = Number(localStorage.getItem(key)) || 0;
    if (cnt < GEN_LIMIT) {
      cnt += 1;
      localStorage.setItem(key, String(cnt));
      setUsage(cnt);
    }
  }, [result, user]);

  // Must run before any conditional return (Rules of Hooks)
  const parsedResult = useMemo(() => parseListing(result), [result]);

  const langs = [
    { code: "en", label: "English" },
    { code: "zh", label: "中文" },
    { code: "es", label: "Español" },
    { code: "fr", label: "Français" },
    { code: "de", label: "Deutsch" },
    { code: "ja", label: "日本語" },
    { code: "ko", label: "한국어" },
    { code: "ar", label: "العربية" },
  ];

  const navLinkClass = "px-3 py-1 text-sm font-medium rounded transition-colors";
  const navActive =
    "text-blue-700 font-semibold border-b-2 border-blue-600 pb-0.5 bg-blue-50";
  const navInactive = "text-gray-700 hover:text-blue-700";

  // Handle Generate
  async function handleGenerate() {
    if (!productName || !keyFeatures || !targetMarket) {
      setError(UI[uiLang].fillAll);
      return;
    }
    if (usage >= GEN_LIMIT) {
      setError(UI[uiLang].usage(usage, GEN_LIMIT));
      return;
    }
    setGenerating(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, keyFeatures, targetMarket, lang: activeLang }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data.listing || UI[uiLang].error);
      }
    } catch (err: any) {
      setError(UI[uiLang].error + ": " + (err.message || "Unknown error"));
    } finally {
      setGenerating(false);
    }
  }

  // Clipboard helpers
  function handleCopy(text: string, key?: string) {
    navigator.clipboard.writeText(text);
    if (key) {
      setCopied(c => ({ ...c, [key]: true }));
      setTimeout(() => setCopied(c => ({ ...c, [key]: false })), 1200);
    }
  }

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center"><p>{UI[uiLang].loading}</p></div>
    );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <a
          href="/"
          className="text-blue-600 font-bold text-lg tracking-tight"
        >
          {UI[uiLang].navTitle}
        </a>
        <div className="flex-1 flex justify-center gap-6">
          <a
            href="/dashboard"
            className={`${navLinkClass} ${navActive}`}
          >
            {UI[uiLang].generator}
          </a>
          <a
            href="/history"
            className={`${navLinkClass} ${navInactive}`}
          >
            {UI[uiLang].history}
          </a>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            className="text-xs px-3 py-1 border rounded-full border-blue-200 bg-blue-50 hover:bg-blue-100 transition"
            onClick={toggleUiLang}
            aria-label="Switch UI language"
          >
            {UI[uiLang].langToggle}
          </button>
          <span className="text-sm text-gray-500 truncate max-w-[180px]">{user.email}</span>
          <button
            onClick={() => {
              supabase.auth.signOut();
              router.push("/");
            }}
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
          >
            {UI[uiLang].logout}
          </button>
        </div>
      </nav>

      {/* Usage counter */}
      <div className="flex justify-center bg-transparent text-sm text-gray-500 mt-2 mb-4">
        <div className="px-3 py-1 rounded bg-gray-100 border border-gray-200">
          {UI[uiLang].usage(usage, GEN_LIMIT)}
        </div>
      </div>
      {/* Main card section */}
      <main className="flex-grow flex flex-col items-center px-4">
        <div className="w-full max-w-2xl mx-auto mt-6 p-8 bg-white rounded-2xl shadow-lg border flex flex-col gap-6">
          {/* Title */}
          <h1 className="text-2xl font-bold mb-2 text-blue-900 text-center">
            {UI[uiLang].title}
          </h1>
          {/* FORM */}
          <form
            className="flex flex-col gap-5"
            onSubmit={e => {
              e.preventDefault();
              if (!generating) handleGenerate();
            }}
            autoComplete="off"
          >
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">{UI[uiLang].productName}</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none placeholder-gray-400 transition"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder={UI[uiLang].productNamePh}
                disabled={generating}
                autoFocus
                maxLength={80}
              />
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">{UI[uiLang].keyFeatures}</label>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none placeholder-gray-400 transition"
                rows={3}
                value={keyFeatures}
                onChange={e => setKeyFeatures(e.target.value)}
                placeholder={UI[uiLang].keyFeaturesPh}
                disabled={generating}
                maxLength={200}
              />
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">{UI[uiLang].targetMarket}</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none placeholder-gray-400 transition"
                value={targetMarket}
                onChange={e => setTargetMarket(e.target.value)}
                placeholder={UI[uiLang].targetMarketPh}
                disabled={generating}
                maxLength={80}
              />
            </div>
            <button
              type="submit"
              disabled={generating || usage >= GEN_LIMIT}
              className={`w-full text-lg font-semibold py-3 rounded-lg transition ${
                generating || usage >= GEN_LIMIT
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {generating ? UI[uiLang].generating : UI[uiLang].generate}
            </button>
          </form>
          {/* ERROR */}
          {!!error && (
            <div className="mt-0 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm text-center">
              {error}
            </div>
          )}
          {/* LANGUAGE TABS, Results only */}
          {!!result && (
            <div>
              {/* Language selection tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {langs.map(l => (
                  <button
                    key={l.code}
                    onClick={() => setActiveLang(l.code)}
                    className={`min-w-[90px] px-4 py-2 rounded-full text-sm border transition font-medium ${
                      activeLang === l.code
                        ? "bg-blue-600 text-white shadow"
                        : "bg-white text-blue-600 border-blue-300 hover:bg-blue-50"
                    }`}
                    style={{
                      borderWidth: activeLang === l.code ? 2 : 1,
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              {/* Parsed Result */}
              <div className="flex flex-col gap-5">
                {/* Title card */}
                {(parsedResult.title || "").length > 0 && (
                  <div className="bg-gray-50 rounded-lg border shadow-sm p-4 flex flex-col gap-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-blue-800">{UI[uiLang].titleCard}</h3>
                      <button
                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                        onClick={() => handleCopy(parsedResult.title!, "title")}
                      >
                        {copied.title ? UI[uiLang].copied : UI[uiLang].copy}
                      </button>
                    </div>
                    <div className="whitespace-pre-wrap text-base text-gray-800">
                      {parsedResult.title}
                    </div>
                  </div>
                )}
                {/* Description card */}
                {(parsedResult.description || "").length > 0 && (
                  <div className="bg-gray-50 rounded-lg border shadow-sm p-4 flex flex-col gap-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-blue-800">{UI[uiLang].descCard}</h3>
                      <button
                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                        onClick={() => handleCopy(parsedResult.description!, "desc")}
                      >
                        {copied.desc ? UI[uiLang].copied : UI[uiLang].copy}
                      </button>
                    </div>
                    <div className="whitespace-pre-wrap text-base text-gray-800">
                      {parsedResult.description}
                    </div>
                  </div>
                )}
                {/* Bullet points card */}
                {(parsedResult.bullets && parsedResult.bullets.length > 0) && (
                  <div className="bg-gray-50 rounded-lg border shadow-sm p-4 flex flex-col gap-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-blue-800">{UI[uiLang].bulletCard}</h3>
                      <button
                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                        onClick={() => handleCopy(parsedResult.bullets!.join("\n"), "bullets")}
                      >
                        {copied.bullets ? UI[uiLang].copied : UI[uiLang].copy}
                      </button>
                    </div>
                    <ul className="list-disc list-inside text-base text-gray-800 ml-2">
                      {parsedResult.bullets!.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Keywords card */}
                {(parsedResult.keywords && parsedResult.keywords.length > 0) && (
                  <div className="bg-gray-50 rounded-lg border shadow-sm p-4 flex flex-col gap-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-blue-800">{UI[uiLang].keywordCard}</h3>
                      <button
                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                        onClick={() => handleCopy(parsedResult.keywords!.join(", "), "keywords")}
                      >
                        {copied.keywords ? UI[uiLang].copied : UI[uiLang].copy}
                      </button>
                    </div>
                    <div className="text-base text-gray-800 whitespace-pre-wrap break-words">
                      {parsedResult.keywords!.join(", ")}
                    </div>
                  </div>
                )}
                {/* Fallback: copy all raw */}
                {!parsedResult.title && !parsedResult.description &&
                  !(parsedResult.bullets && parsedResult.bullets.length > 0) &&
                  !(parsedResult.keywords && parsedResult.keywords.length > 0) && (
                    <div className="bg-gray-50 rounded-lg border shadow-sm p-4 flex flex-col gap-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-blue-800">{UI[uiLang].allCopy}</h3>
                        <button
                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                          onClick={() => handleCopy(result, "all")}
                        >
                          {copied.all ? UI[uiLang].copied : UI[uiLang].copy}
                        </button>
                      </div>
                      <div className="whitespace-pre-wrap text-base text-gray-800">{result}</div>
                    </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}