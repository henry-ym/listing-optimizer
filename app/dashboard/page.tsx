"use client";
import { useState, useEffect } from "react";
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
    resultHeading: "Generated listing",
    parseFallbackNote: "(Full text — sections could not be parsed)",
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
    resultHeading: "生成结果",
    parseFallbackNote: "（无法解析区块，显示全文）",
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

/** Remove ** markdown from display */
function stripMarkdownBold(s: string): string {
  return s.replace(/\*\*/g, "");
}

function sectionCardTitle(
  sectionName: string,
  ui: (typeof UI)["en"]
): string {
  const n = sectionName.trim().toLowerCase();
  if (n === "title") return ui.titleCard;
  if (n === "description") return ui.descCard;
  if (n === "bullet points") return ui.bulletCard;
  if (n === "keywords") return ui.keywordCard;
  return stripMarkdownBold(sectionName);
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

  // Read UI lang from localStorage on mount (default "en" if missing)
  useEffect(() => {
    const stored = localStorage.getItem("ui-lang");
    setUiLang(stored === "zh" ? "zh" : "en");
  }, []);

  // Save UI lang on every toggle
  const toggleUiLang = () => {
    const nextLang = uiLang === "en" ? "zh" : "en";
    setUiLang(nextLang);
    localStorage.setItem("ui-lang", nextLang);
  };

  // Auth: keep user in sync across navigation; redirect on sign-out
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          setUser(null);
          router.push("/login");
          setLoading(false);
          return;
        }
        if (event === "SIGNED_IN") {
          if (session?.user) setUser(session.user);
          setLoading(false);
          return;
        }
        if (event === "INITIAL_SESSION") {
          if (session?.user) setUser(session.user);
          else router.push("/login");
          setLoading(false);
          return;
        }
        if (session?.user) setUser(session.user);
      }
    );
    return () => subscription.unsubscribe();
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
      let token = "";
      try {
        const session = await supabase.auth.getSession();
        token = session.data.session?.access_token ?? "";
      } catch {
        /* proceed without token */
      }
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + (token || ""),
        },
        body: JSON.stringify({ productName, keyFeatures, targetMarket, lang: activeLang }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data.listing || UI[uiLang].error);
        const listing = data.listing;
        if (listing && user?.id) {
          supabase
            .from("generations")
            .insert({
              user_id: user.id,
              product_name: productName,
              input_data: { keyFeatures, targetMarket },
              output_data: listing,
              lang: activeLang,
            })
            .then(
              () => {},
              () => {}
            );
        }
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

  function parseResult(text: string) {
    const sections: { title: string; content: string }[] = [];
    const markers = ["Title:", "Description:", "Bullet Points:", "Keywords:"];
    const labels = ["Title", "Description", "Bullet Points", "Keywords"];
    for (let i = 0; i < markers.length; i++) {
      const start = text.indexOf(markers[i]);
      if (start === -1) continue;
      const contentStart = start + markers[i].length;
      const nextStarts = markers
        .slice(i + 1)
        .map(m => text.indexOf(m))
        .filter(idx => idx > -1);
      const end = nextStarts.length > 0 ? Math.min(...nextStarts) : text.length;
      sections.push({
        title: labels[i],
        content: text.slice(contentStart, end).trim(),
      });
    }
    return sections;
  }

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center"><p>{UI[uiLang].loading}</p></div>
    );
  if (!user) return null;

  const parsedSections = result ? parseResult(result) : [];

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
          {/* Upgrade to Pro Button */}
          <button
            type="button"
            className="text-xs font-semibold px-4 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow transition border border-amber-600"
            style={{ marginLeft: 8, marginRight: 8 }}
            onClick={() => window.open("https://www.creem.io/test/payment/prod_4y6VNxRW0tLyqwpYUH5Cip", "_blank")}
          >
            Upgrade to Pro
          </button>
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
              {/* Copy All + parsed section cards or raw fallback */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="font-semibold text-blue-900 text-lg">
                    {UI[uiLang].resultHeading}
                  </h3>
                  <button
                    type="button"
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium shrink-0"
                    onClick={() => handleCopy(result, "all")}
                  >
                    {copied.all ? UI[uiLang].copied : UI[uiLang].allCopy}
                  </button>
                </div>
                {parsedSections.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {parsedSections.map((sec, i) => {
                      const displayContent = stripMarkdownBold(sec.content);
                      return (
                        <div
                          key={`${sec.title}-${i}`}
                          className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-5 flex flex-col gap-3"
                        >
                          <div className="flex items-center justify-between gap-3 flex-wrap border-b border-gray-200 pb-2">
                            <h4 className="font-semibold text-blue-800 text-base">
                              {sectionCardTitle(sec.title, UI[uiLang])}
                            </h4>
                            <button
                              type="button"
                              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition font-medium shrink-0"
                              onClick={() => handleCopy(displayContent, `sec-${i}`)}
                            >
                              {copied[`sec-${i}`]
                                ? UI[uiLang].copied
                                : UI[uiLang].copy}
                            </button>
                          </div>
                          <div className="whitespace-pre-wrap text-base text-gray-800 leading-relaxed font-mono max-h-[min(50vh,400px)] overflow-y-auto">
                            {displayContent}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
                    <p className="text-sm text-gray-500 border-b border-gray-200 pb-2">
                      {UI[uiLang].parseFallbackNote}
                    </p>
                    <div className="whitespace-pre-wrap text-base text-gray-800 leading-relaxed font-mono max-h-[min(70vh,560px)] overflow-y-auto">
                      {stripMarkdownBold(result)}
                    </div>
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