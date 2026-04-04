"use client";
import React, { useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// --------- TEXT RESOURCES FOR LOCALIZATION ---------
const zh = {
  nav: {
    generator: "生成器",
    history: "历史记录",
    logout: "退出登录",
    langToggle: "EN",
    account: "用户",
    login: "登录",
    marketingLangToggle: "EN",
  },
  logo: "AI Listing Optimizer",
  heading: "AI Listing Optimizer",
  subtitle: "秒速生成优化后的商品描述",
  form: {
    productName: "产品名称",
    productNamePh: "输入您的产品名称",
    keyFeatures: "核心卖点",
    keyFeaturesPh: "逗号分隔或分行输入卖点",
    targetMarket: "目标市场",
    targetMarketPh: "说明您的市场/受众",
    generate: "生成",
    generating: "生成中…",
  },
  loading: "加载中…",
  noResult: "暂无结果",
  cta: {
    startFree: "免费开始",
    viewPricing: "查看价格",
    getStarted: "立即使用"
  },
  marketHero: {
    main: "30秒内生成AI驱动的商品描述",
    sub: "为亚马逊、Shopify、Etsy等平台生成多语言优化商品描述。\n帮您节省大量文案时间。",
  },
  features: [
    { title: "AI优化文案", desc: "自动撰写高转化商品描述" },
    { title: "多语言支持 (8种)", desc: "英语、中文、西班牙语、法语、德语、日语、韩语、阿拉伯语" },
    { title: "平台专属", desc: "适用于Amazon、Shopify、Etsy与eBay" },
    { title: "SEO关键词", desc: "自动生成高排名关键字" },
    { title: "一键复制", desc: "任意内容一键复制" },
    { title: "历史记录", desc: "保存访问所有过往生成" },
  ],
  howItWorks: "使用方法",
  hiwSteps: [
    { title: "填写产品信息", content: "输入产品名称、卖点和目标市场" },
    { title: "AI生成描述", content: "AI自动优化标题、描述和关键词" },
    { title: "复制并发布", content: "复制您的描述，发布到任意电商平台" }
  ],
  ctaBanner: {
    ready: "准备优化您的商品描述？",
    free: "即刻免费体验，无需信用卡。",
    getStarted: "立即开始"
  },
  pricing: {
    title: "价格",
    free: "免费",
    freeDesc: [
      "每天<span className='text-blue-500 font-bold'>5次</span>生成机会",
      "支持<span className='text-blue-500 font-bold'>3</span>种语言",
      "最新<span className='text-blue-500 font-bold'>3</span>条历史记录",
      "基础AI模型"
    ],
    freeBtn: "免费开始",
    pro: "专业版",
    proPrice: "$19",
    perMonth: "/月",
    proDesc: [
      "<span className='text-blue-700 font-bold'>无限</span>生成",
      "<span className='text-blue-700 font-bold'>全部8种</span>语言",
      "完整历史记录",
      "更强AI&文案",
      "优先客服"
    ],
    proBtn: "升级"
  },
  footer: `© ${new Date().getFullYear()} Creem AI, Inc. 保留所有权利。`,
  dailyLimit: "您已达到今日免费生成上限。",
  upgradeMsg: "如需继续，请升级您的套餐。",
  upgradeBtn: "升级",
  error: "生成商品描述失败。",
  copy: "复制",
  copied: "已复制！",
  loadingResult: "生成中…",
  noResultYet: "暂无结果",
  tab: { en: "English", zh: "中文", es: "西班牙语" }
};

const en = {
  nav: {
    generator: "Generator",
    history: "History",
    logout: "Log out",
    langToggle: "中文",
    account: "User",
    login: "Login",
    marketingLangToggle: "中文",
  },
  logo: "AI Listing Optimizer",
  heading: "AI Listing Optimizer",
  subtitle: "Generate optimized product listings in seconds",
  form: {
    productName: "Product Name",
    productNamePh: "Your product name",
    keyFeatures: "Key Features",
    keyFeaturesPh: "Comma separated or bulleted features",
    targetMarket: "Target Market",
    targetMarketPh: "Describe your market/audience",
    generate: "Generate",
    generating: "Generating...",
  },
  loading: "Loading...",
  noResult: "No result yet.",
  cta: {
    startFree: "Start Free",
    viewPricing: "View Pricing",
    getStarted: "Get Started"
  },
  marketHero: {
    main: "AI-Powered Product Listings in 30 Seconds",
    sub: "Generate optimized, multi-language product listings for Amazon, Shopify, Etsy and more.\nSave hours of copywriting.",
  },
  features: [
    { title: "AI-Optimized Copy", desc: "Writes converting product descriptions" },
    { title: "8 Languages", desc: "English, Chinese, Spanish, French, German, Japanese, Korean, Arabic" },
    { title: "Platform-Specific", desc: "Optimized for Amazon, Shopify, Etsy, eBay" },
    { title: "SEO Keywords", desc: "Auto-generates high-ranking keywords" },
    { title: "One-Click Copy", desc: "Copy any section instantly" },
    { title: "Generation History", desc: "Save and access all past listings" }
  ],
  howItWorks: "How It Works",
  hiwSteps: [
    { title: "Enter Product Info", content: "Input your product name, features, and target market" },
    { title: "AI Generates Listing", content: "Our AI creates optimized titles, descriptions, and keywords" },
    { title: "Copy & Publish", content: "Copy your listing and publish to any platform" }
  ],
  ctaBanner: {
    ready: "Ready to optimize your listings?",
    free: "Start free today - no credit card required.",
    getStarted: "Get Started"
  },
  pricing: {
    title: "Pricing",
    free: "Free",
    freeDesc: [
      "<span className='text-blue-500 font-bold'>5</span> generations per day",
      "<span className='text-blue-500 font-bold'>3</span> supported languages",
      "History of last <span className='text-blue-500 font-bold'>3</span> listings",
      "Basic AI model"
    ],
    freeBtn: "Start Free",
    pro: "Pro",
    proPrice: "$19",
    perMonth: "/mo",
    proDesc: [
      "<span className='text-blue-700 font-bold'>Unlimited</span> generations",
      "<span className='text-blue-700 font-bold'>All 8</span> languages",
      "Full generation history",
      "Best AI & copywriting",
      "Priority support"
    ],
    proBtn: "Upgrade"
  },
  footer: `© ${new Date().getFullYear()} Creem AI, Inc. All rights reserved.`,
  dailyLimit: "You’ve reached your daily limit for free generations.",
  upgradeMsg: "To continue, please upgrade your plan.",
  upgradeBtn: "Upgrade",
  error: "Failed to generate product listing.",
  copy: "Copy",
  copied: "Copied!",
  loadingResult: "Generating...",
  noResultYet: "No result yet.",
  tab: { en: "English", zh: "中文", es: "Español" }
};

const UPGRADE_URL = "https://www.creem.io/test/payment/prod_4y6VNxRW0tLyqwpYUH5Cip";

/** `lang` URL param: `zh` → Chinese UI; missing, `en`, or other → English. */
function langFromSearchParams(searchParams: { get: (name: string) => string | null }): "en" | "zh" {
  const v = searchParams.get("lang");
  if (v === "zh") return "zh";
  return "en";
}

/** Icons align with `en.features` / `zh.features` order (language-neutral). */
const MARKETING_FEATURE_ICONS: React.ReactNode[] = [
  (
    <svg className="h-10 w-10 mb-3 text-blue-500" fill="none" viewBox="0 0 24 24">
      <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 11L12 16 17 11M12 4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  (
    <svg className="h-10 w-10 mb-3 text-blue-500" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M2 12h20M12 2a10 10 0 010 20" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  (
    <svg className="h-10 w-10 mb-3 text-blue-500" fill="none" viewBox="0 0 24 24">
      <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M8 8h8M8 12h4" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  (
    <svg className="h-10 w-10 mb-3 text-blue-500" fill="none" viewBox="0 0 24 24">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  (
    <svg className="h-10 w-10 mb-3 text-blue-500" fill="none" viewBox="0 0 24 24">
      <path d="M8 17l4 4 4-4M12 13v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="3" width="16" height="5" rx="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  (
    <svg className="h-10 w-10 mb-3 text-blue-500" fill="none" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="14" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M16 3v4M8 3v4" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
];

// --------- Marketing Landing Page ---------
function MarketingLanding({
  lang,
  handleSwitchLang,
}: {
  lang: "en" | "zh";
  handleSwitchLang: () => void;
}) {
  const t = lang === "zh" ? zh : en;

  return (
    <>
      {/* Simple Fixed Top Nav with Login & Lang */}
      <nav
        className="fixed top-0 left-0 w-full z-50 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-8"
        style={{ minHeight: 56 }}
      >
        <div>
          <Link
            href="/"
            className="text-xl sm:text-2xl font-extrabold text-blue-600 tracking-tight select-none py-4 block"
            style={{ lineHeight: "normal" }}
          >
            {t.logo}
          </Link>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <button
            type="button"
            className="px-4 py-2 min-h-[44px] min-w-[3rem] cursor-pointer rounded-lg border border-blue-300 bg-white text-blue-700 shadow-sm hover:bg-blue-50 hover:border-blue-500 active:bg-blue-100 transition font-semibold text-base select-none"
            aria-label={lang === "en" ? "Switch to Chinese" : "Switch to English"}
            aria-pressed={lang === "zh"}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSwitchLang();
            }}
          >
            {lang === "en" ? "中文" : "EN"}
          </button>
          <Link
            href="/login"
            className="py-2 px-4 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
          >
            {t.nav.login}
          </Link>
        </div>
      </nav>

      <main className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-100 text-gray-900 pt-16 sm:pt-[72px]">
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
              {t.marketHero.main}
            </h1>
            <p className="text-xl sm:text-2xl mb-12 font-medium text-blue-100" style={{ whiteSpace: "pre-line" }}>
              {t.marketHero.sub}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10">
              <a
                href="/login"
                className="bg-white text-blue-700 font-bold rounded-full px-12 py-5 shadow-lg hover:bg-blue-50 transition text-2xl"
              >
                {t.cta.startFree}
              </a>
              <a
                href="/pricing"
                className="border border-white text-white font-bold rounded-full px-12 py-5 hover:bg-blue-700 hover:text-white transition text-2xl"
              >
                {t.cta.viewPricing}
              </a>
            </div>
          </div>
        </section>
        {/* Feature Cards */}
        <section className="max-w-5xl mx-auto -mt-16 md:-mt-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-4">
            {t.features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md border border-blue-100 p-6 flex flex-col items-center text-center transition hover:shadow-xl">
                {MARKETING_FEATURE_ICONS[i]}
                <div className="font-bold text-lg mb-1">{f.title}</div>
                <div className="text-gray-600">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>
        {/* How It Works */}
        <section className="max-w-4xl mx-auto px-4 py-12 my-16 bg-white rounded-3xl shadow-md flex flex-col">
          <h2 className="font-extrabold text-2xl sm:text-3xl text-center mb-10 text-blue-700">
            {t.howItWorks}
          </h2>
          <div className="flex flex-col sm:flex-row justify-between items-stretch gap-8">
            {t.hiwSteps.map((step, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center bg-white rounded-xl shadow-sm px-6 py-8">
                <div className="bg-blue-100 rounded-full h-16 w-16 flex items-center justify-center mb-4 border-4 border-blue-300 shadow-inner">
                  <span className="text-3xl font-black text-blue-800">{idx + 1}</span>
                </div>
                <div className="font-semibold text-lg mb-2">{step.title}</div>
                <div className="text-gray-600 text-center text-base" style={{ whiteSpace: "pre-line" }}>{step.content}</div>
              </div>
            ))}
          </div>
        </section>
        {/* CTA Banner */}
        <section className="w-full bg-gradient-to-br from-blue-600 to-blue-700 text-white py-12 px-4 my-12">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">
              {t.ctaBanner.ready}
            </h2>
            <p className="text-lg mb-8 text-blue-100 font-medium">{t.ctaBanner.free}</p>
            <a
              href="/login"
              className="bg-white text-blue-700 font-bold rounded-full px-10 py-4 shadow-lg hover:bg-blue-100 transition text-xl"
            >
              {t.ctaBanner.getStarted}
            </a>
          </div>
        </section>
        {/* Pricing Section */}
        <section className="max-w-4xl mx-auto px-4 mb-20">
          <h2 className="font-extrabold text-2xl sm:text-3xl text-center mb-10 text-blue-700">
            {t.pricing.title}
          </h2>
          <div className="flex flex-col md:flex-row justify-center gap-8">
            {/* Free */}
            <div className="flex-1 bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-8 flex flex-col items-center text-center">
              <div className="text-blue-600 font-extrabold text-xl mb-2">{t.pricing.free}</div>
              <div className="text-4xl font-extrabold mb-2">
                $0 <span className="text-xl font-medium text-gray-500">{lang === "zh" ? "/月" : "/mo"}</span>
              </div>
              <ul className="mt-4 mb-8 flex-1 text-left text-base text-gray-700 w-full space-y-2">
                {t.pricing.freeDesc.map((desc, idx) => (
                  <li key={idx} dangerouslySetInnerHTML={{ __html: desc }} />
                ))}
              </ul>
              <a href="/login" className="w-full block bg-blue-600 text-white font-bold rounded-full px-6 py-3 mt-auto hover:bg-blue-700 transition">{t.pricing.freeBtn}</a>
            </div>
            {/* Pro */}
            <div className="flex-1 bg-blue-50 rounded-2xl shadow-xl border-2 border-blue-500 p-8 flex flex-col items-center text-center scale-105">
              <div className="text-blue-700 font-extrabold text-xl mb-2">{t.pricing.pro}</div>
              <div className="text-4xl font-extrabold mb-2">
                {t.pricing.proPrice} <span className="text-xl font-medium text-gray-600">{lang === "zh" ? "/月" : t.pricing.perMonth}</span>
              </div>
              <ul className="mt-4 mb-8 flex-1 text-left text-base text-gray-700 w-full space-y-2">
                {t.pricing.proDesc.map((desc, idx) => (
                  <li key={idx} dangerouslySetInnerHTML={{ __html: desc }} />
                ))}
              </ul>
              <a
                href={UPGRADE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block bg-blue-700 text-white font-bold rounded-full px-6 py-3 mt-auto hover:bg-blue-800 transition shadow-lg"
              >{t.pricing.proBtn}</a>
            </div>
          </div>
        </section>
        {/* Footer */}
        <footer className="bg-blue-600 text-white text-center py-6 px-4 mt-auto">
          <div className="font-medium">
            {t.footer}
          </div>
        </footer>
      </main>
    </>
  );
}

// --------- MAIN PAGE: No Auth, No Loading, Only Landing ---------
function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = langFromSearchParams(searchParams);

  const handleSwitchLang = useCallback(() => {
    const next = lang === "en" ? "zh" : "en";
    router.push(`/?lang=${next}`);
  }, [router, lang]);

  return <MarketingLanding lang={lang} handleSwitchLang={handleSwitchLang} />;
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 via-white to-blue-100 text-gray-600">
          Loading...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}