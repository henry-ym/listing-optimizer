"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Generation = {
  id: string;
  created_at: string;
  product_name: string;
  output_data: string;
  lang: string;
};

const PREVIEW_LEN = 200;

function listingText(output: Generation["output_data"]): string {
  if (output == null) return "";
  if (typeof output === "string") return output;
  return JSON.stringify(output);
}

export default function HistoryPage() {
  const router = useRouter();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(
    null
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchGenerations = useCallback(async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("generations")
      .select("id,created_at,product_name,output_data,lang")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      setGenerations([]);
    } else {
      setGenerations((data as Generation[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let ignore = false;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (ignore) return;
        const sessionUser = data.session?.user;
        if (!sessionUser) {
          router.replace("/login");
          setLoading(false);
          return;
        }
        setUser(sessionUser);
        void fetchGenerations(sessionUser.id);
      })
      .catch(() => {
        if (!ignore) {
          router.replace("/login");
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [router, fetchGenerations]);

  async function handleCopy(full: string, id: string) {
    try {
      await navigator.clipboard.writeText(full);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* ignore */
    }
  }

  function handleLogout() {
    void supabase.auth.signOut();
    router.push("/");
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <span className="text-blue-600 font-bold text-lg shrink-0">
            AI Listing Optimizer
          </span>
          <div className="flex flex-1 justify-center gap-6 text-sm font-medium">
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-blue-700 transition-colors"
            >
              Generator
            </Link>
            <span className="text-blue-700 font-semibold border-b-2 border-blue-600 pb-0.5">
              History
            </span>
          </div>
          <div className="flex items-center gap-4 shrink-0 text-sm text-gray-400">
            …
          </div>
        </nav>
        <div className="flex min-h-[50vh] items-center justify-center text-gray-600">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <span className="text-blue-600 font-bold text-lg shrink-0">
          AI Listing Optimizer
        </span>
        <div className="flex flex-1 justify-center gap-6 text-sm font-medium min-w-0">
          <Link
            href="/dashboard"
            className="text-gray-700 hover:text-blue-700 transition-colors"
          >
            Generator
          </Link>
          <Link
            href="/history"
            className="text-blue-700 font-semibold border-b-2 border-blue-600 pb-0.5"
          >
            History
          </Link>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-sm text-gray-600 truncate max-w-[200px]">
            {user?.email}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
          >
            Log out
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-blue-800 mb-6">
          Generation History
        </h1>

        {generations.length === 0 ? (
          <div className="text-gray-500 text-center py-12 bg-white rounded-lg border border-gray-200">
            No generations found.
          </div>
        ) : (
          <ul className="space-y-4">
            {generations.map((g) => {
              const full = listingText(g.output_data);
              const preview =
                full.length > PREVIEW_LEN
                  ? `${full.slice(0, PREVIEW_LEN)}…`
                  : full;
              const isOpen = expandedId === g.id;

              return (
                <li key={g.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleExpand(g.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleExpand(g.id);
                      }
                    }}
                    className="w-full text-left p-5 bg-white rounded-lg shadow border border-gray-200 hover:border-blue-300 hover:shadow-md transition cursor-pointer"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="font-semibold text-lg text-gray-800 pr-2">
                        {g.product_name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-0.5 font-medium">
                          {g.lang.toUpperCase()}
                        </span>
                        <span className="text-gray-400 text-xs whitespace-nowrap">
                          {new Date(g.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {!isOpen && (
                      <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                        {preview || "—"}
                      </p>
                    )}
                    {isOpen && (
                      <div
                        className="mt-4 pt-4 border-t border-gray-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono bg-gray-50 rounded-md p-4 max-h-[min(70vh,480px)] overflow-y-auto border border-gray-100">
                          {full || "—"}
                        </pre>
                        <button
                          type="button"
                          className="mt-3 text-sm bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleCopy(full, g.id);
                          }}
                        >
                          {copiedId === g.id ? "Copied!" : "Copy full listing"}
                        </button>
                        <p className="mt-2 text-xs text-gray-400">
                          Click the card again to collapse
                        </p>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
