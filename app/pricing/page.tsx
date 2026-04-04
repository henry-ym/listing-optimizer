"use client";
import React, { useState } from "react";
import Link from "next/link";

const LANG = {
  en: {
    pricing: "Pricing",
    free: "Free",
    pro: "Pro",
    month: "per month",
    current: "Current Plan",
    upgrade: "Upgrade to Pro",
    back: "Back to home",
    toggle: "中文",
    freeFeatures: [
      "5 generations per day",
      "3 languages",
      "Basic history",
      "Standard AI model"
    ],
    proFeatures: [
      "Unlimited generations",
      "All 8 languages",
      "Full generation history",
      "Best AI model",
      "Priority support"
    ]
  },
  zh: {
    pricing: "价格",
    free: "免费",
    pro: "专业版",
    month: "每月",
    current: "当前套餐",
    upgrade: "升级到专业版",
    back: "返回首页",
    toggle: "EN",
    freeFeatures: [
      "每天5次生成",
      "3种语言",
      "基础历史记录",
      "标准AI模型"
    ],
    proFeatures: [
      "不限次数生成",
      "支持全部8种语言",
      "完整生成历史",
      "最佳AI模型",
      "优先支持"
    ]
  }
};

export default function PricingPage() {
  const [lang, setLang] = useState<"en" | "zh">("en");
  const t = LANG[lang];

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: "32px 16px", fontFamily: "system-ui, sans-serif", position: "relative" }}>
      {/* Top bar with language toggle and Back to home */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Link
          href="/"
          style={{
            fontSize: 15,
            color: "#1b72ea",
            textDecoration: "underline",
            fontWeight: 500
          }}
        >
          {t.back}
        </Link>
        <button
          onClick={() => setLang(lang === "en" ? "zh" : "en")}
          style={{
            background: "none",
            border: "none",
            color: "#1b72ea",
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
            padding: 0
          }}
          aria-label="Toggle language"
        >
          {t.toggle}
        </button>
      </div>
      <h1 style={{ fontSize: 36, fontWeight: 700, textAlign: "center", marginBottom: 24 }}>
        {t.pricing}
      </h1>
      <div
        style={{
          display: "flex",
          gap: 32,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "stretch"
        }}
      >
        {/* Free Plan */}
        <div
          style={{
            flex: 1,
            border: "1px solid #eaeaea",
            borderRadius: 10,
            padding: 32,
            boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)"
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>{t.free}</h2>
          <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>$0</div>
          <div style={{ color: "#555", marginBottom: 24 }}>{t.month}</div>
          <ul style={{ paddingLeft: 20, marginBottom: 28 }}>
            {t.freeFeatures.map((feature, i) => (
              <li key={feature + i}>{feature}</li>
            ))}
          </ul>
          <button
            disabled
            style={{
              width: "100%",
              padding: "12px 0",
              border: "none",
              borderRadius: 6,
              backgroundColor: "#f3f3f3",
              color: "#888",
              fontWeight: 600,
              cursor: "not-allowed"
            }}
          >
            {t.current}
          </button>
        </div>

        {/* Pro Plan */}
        <div
          style={{
            flex: 1,
            border: "2px solid #1b72ea",
            borderRadius: 10,
            padding: 32,
            boxShadow: "0 4px 16px 0 rgba(16, 86, 210, 0.07)"
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: "#1b72ea" }}>{t.pro}</h2>
          <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>$19</div>
          <div style={{ color: "#555", marginBottom: 24 }}>{t.month}</div>
          <ul style={{ paddingLeft: 20, marginBottom: 28 }}>
            {t.proFeatures.map((feature, i) => (
              <li key={feature + i}>{feature}</li>
            ))}
          </ul>
          <a
            href="https://www.creem.io/test/payment/prod_4y6VNxRW0tLyqwpYUH5Cip"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              width: "100%",
              padding: "12px 0",
              textAlign: "center",
              borderRadius: 6,
              backgroundColor: "#1b72ea",
              color: "white",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: 16,
              letterSpacing: 0.2
            }}
          >
            {t.upgrade}
          </a>
        </div>
      </div>
    </div>
  );
}
