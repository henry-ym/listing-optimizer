"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";

// Translation map for static auth UI
const LANG = {
  en: {
    login: "Login",
    signup: "Sign Up",
    loggingIn: "Logging in...",
    signingUp: "Signing up...",
    email: "Email",
    password: "Password",
    dontHave: "Don't have an account?",
    signUp: "Sign up",
    alreadyHave: "Already have an account?",
    logIn: "Log in",
    back: "Back to home",
    switch: "中文",
    title: "AI Listing Optimizer",
    or: "/",
  },
  zh: {
    login: "登录",
    signup: "注册",
    loggingIn: "登录中...",
    signingUp: "注册中...",
    email: "邮箱",
    password: "密码",
    dontHave: "没有账号？",
    signUp: "注册",
    alreadyHave: "已有账号？",
    logIn: "登录",
    back: "返回首页",
    switch: "EN",
    title: "AI商品描述优化器",
    or: "／",
  }
};

export default function AuthPage() {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "zh">("en");
  const t = LANG[lang];

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let response;
      if (mode === "login") {
        response = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      } else {
        response = await supabase.auth.signUp({
          email,
          password,
        });
      }

      if (response.error) {
        setError(response.error.message);
      } else {
        // If signup, Supabase may require email verification.
        if (
          mode === "signup" &&
          response.data.user &&
          !response.data.session
        ) {
          setError(
            lang === "zh"
              ? "注册成功！请查收邮箱中的确认邮件并点击链接完成注册后再登录。"
              : "Signup successful! Please check your email for a confirmation link before logging in."
          );
        } else {
          router.push("/dashboard");
        }
      }
    } catch (e: any) {
      setError(
        lang === "zh"
          ? "发生了意外错误。"
          : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="absolute top-4 right-4">
        <button
          className="px-4 py-1 rounded-md border border-blue-200 text-blue-700 font-semibold bg-white shadow-sm text-sm hover:bg-blue-50 transition"
          onClick={() => setLang((lang) => (lang === "en" ? "zh" : "en"))}
          aria-label="Language Toggle"
        >
          {lang === "en" ? "中文 / EN" : "中文 / EN"}
        </button>
      </div>
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md flex flex-col gap-6">
        <div>
          <h2 className="text-center text-3xl font-extrabold mb-2 text-blue-700">{t.title}</h2>
          <h1 className="text-xl font-bold mb-6 text-center text-gray-800">
            {mode === "login" ? t.login : t.signup}
          </h1>
        </div>
        <form onSubmit={handleAuth} className="flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t.email}</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={loading}
              autoComplete="email"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t.password}</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={loading}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
            />
          </label>
          {error && (
            <div className="text-red-600 text-sm mt-1 text-center">{error}</div>
          )}
          <button
            type="submit"
            className="bg-blue-600 text-white rounded-lg py-3 w-full font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            disabled={loading}
          >
            {loading
              ? mode === "login"
                ? t.loggingIn
                : t.signingUp
              : mode === "login"
              ? t.login
              : t.signup}
          </button>
        </form>
        <div className="text-center mt-2">
          <button
            type="button"
            className="text-blue-600 hover:underline font-medium text-sm"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
            }}
            disabled={loading}
          >
            {mode === "login"
              ? (
                  <span>
                    {t.dontHave}
                    {t.or}
                    {t.signUp}
                  </span>
                )
              : (
                  <span>
                    {t.alreadyHave}
                    {t.or}
                    {t.logIn}
                  </span>
                )
            }
          </button>
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-gray-500 hover:text-blue-600 underline font-medium text-sm"
          >
            &larr; {t.back}
          </Link>
        </div>
      </div>
    </div>
  );
}