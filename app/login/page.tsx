"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function AuthPage() {
  const router = useRouter();
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
            "Signup successful! Please check your email for a confirmation link before logging in."
          );
        } else {
          router.push("/");
        }
      }
    } catch (e: any) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {mode === "login" ? "Login" : "Sign Up"}
        </h1>
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={loading}
              autoComplete="email"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
            className="bg-blue-600 text-white rounded py-2 font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            disabled={loading}
          >
            {loading
              ? mode === "login"
                ? "Logging in..."
                : "Signing up..."
              : mode === "login"
              ? "Login"
              : "Sign Up"}
          </button>
        </form>
        <div className="text-center mt-6">
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
              ? "Don't have an account? Sign up"
              : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}